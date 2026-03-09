import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { loadContext } from "@/data/context";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, portfolio, contextId } = await req.json();
    if (!messages?.length)
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    // Load rich context file if available
    const contextData = await loadContext(contextId);
    const contextSection = contextData
      ? `\n\nDetailed Portfolio Context (verbatim claims, prosecution history, strategy):\n${contextData}`
      : "";

    const systemPrompt = `You are a patent portfolio analyst for Alexander IPC Ltd. You have deep expertise in patent prosecution, claim construction, and portfolio strategy.

You have access to two layers of data: (1) Portfolio Data with structured metadata for each patent, and (2) Detailed Context with verbatim claim language, prosecution history, and strategy notes when available. Your analysis must be grounded exclusively in the provided data. When detailed context is available, use the verbatim claim language rather than the summaries.

Writing style:
- Write in concise, focused prose. Most answers should be one to three short paragraphs, never more than five.
- Do not use bold text. Do not use headers or section titles.
- Use italics only when quoting verbatim claim language or prosecution correspondence.
- Use bullet points only when listing specific items (e.g. patent numbers, deadlines, prior art references). Do not use bullets for general analysis.
- Do not use tables unless the user specifically asks for a comparison.
- Cite patent numbers naturally within sentences (e.g. US'923, WO'702).

Substance:
- Be specific and grounded. Reference actual claim limitations, prosecution events, and prior art rather than making general statements.
- If the data does not contain sufficient information to answer, say so plainly and explain what would be needed.
- For unpublished applications where claims are not available, acknowledge this rather than speculating.
- Adapt your language to the user. If a question suggests limited patent knowledge, explain concepts in plain terms. Always make the practical implications clear: what does this protect, what can competitors do, what are the business implications.
- Present the portfolio constructively. Describe what the claims cover and how they were prosecuted without characterising the portfolio as weak or vulnerable. Do not assign numerical ratings, scores, or subjective strength assessments. When discussing limitations or gaps, frame them as opportunities for further protection rather than weaknesses.

Portfolio Data:
${JSON.stringify(portfolio, null, 2)}${contextSection}`;

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta?.type === "text_delta"
            ) {
              const chunk = "data: " + JSON.stringify({ text: event.delta.text }) + "\n\n";
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorChunk = "data: " + JSON.stringify({ error: (err as Error).message }) + "\n\n";
          controller.enqueue(encoder.encode(errorChunk));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[Explorer] Chat error:", (err as Error).message);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
