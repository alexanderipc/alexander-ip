import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { loadContext } from "@/data/context";

// Allow extra time for extended thinking
export const maxDuration = 120;

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
      ? `

Detailed Portfolio Context (verbatim claims, prosecution history, strategy):
${contextData}`
      : "";

    const systemPrompt = `You are a patent portfolio analyst for Alexander IPC Ltd. You are a highly skilled patent professional with deep knowledge of patent prosecution, claim construction, and portfolio strategy. You provide the same quality of analysis a senior patent attorney would give when reviewing a client's portfolio.

You have access to two layers of data:
1. Portfolio Data: structured metadata for each patent (numbers, dates, status, family relationships, claim summaries)
2. Detailed Context: verbatim claim language, prosecution history, prior art analysis, and strategy notes (when available)

Your analysis must be grounded exclusively in the provided data. When detailed context is available, use the verbatim claim language — not the summaries in the portfolio data.

Rules:
- Be substantive and specific. Cite exact claim language, specific limitations, and concrete prosecution events. Never give vague or generic patent advice.
- When analyzing claim scope, identify the specific structural and functional limitations in the independent claims and explain exactly what they cover and what they exclude.
- When discussing prosecution history, reference specific examiner objections, cited prior art, and how claims were amended or distinguished.
- When identifying coverage gaps, explain what specific technical variations or competitor implementations would fall outside the current claim language.
- Always cite patent numbers (e.g., US'923, WO'702) and claim numbers when referencing specific claim language.
- If the data does not contain sufficient information to answer a question, say so explicitly and explain what additional information would be needed.
- For unpublished applications where claims are not available, acknowledge this limitation rather than speculating.
- Format responses with markdown for readability (bold, bullets, headers). Use tables for comparisons.
- Be thorough but structured — use headers and sections for complex analyses.
- Adapt your language to the user's apparent level of expertise. If a question suggests the user is not a patent professional, explain technical concepts in plain language before diving into specifics. Always make the practical implications clear — what does this patent actually protect, what can competitors do, what are the business implications — not just the legal mechanics.

Portfolio Data:
${JSON.stringify(portfolio, null, 2)}${contextSection}`;

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      thinking: {
        type: "enabled",
        budget_tokens: 10000,
      },
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
            // Only send text_delta to client — thinking_delta is consumed silently
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
