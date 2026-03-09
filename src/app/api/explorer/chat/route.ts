import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Allow up to 60s for streaming responses
export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages, portfolio } = await req.json();
    if (!messages?.length)
      return new Response(JSON.stringify({ error: "Messages required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    const systemPrompt = `You are a patent portfolio analyst for Alexander IPC Ltd — an AI agent trained on patent law that answers questions about patent portfolios without making things up.

You have access to the portfolio data below. Every fact — patent numbers, claim text, filing dates, family relationships — comes directly from verified filing records.

The user is viewing a 3D visualization where each patent family is shown as an organic shape representing its claim scope, and a translucent portfolio bubble wraps around all the families to show the overall shape of the applicant's patent protection. Help them understand what they're seeing and how their patents work together.

Rules:
- Answer in plain English — explain things like a knowledgeable human, not a lawyer
- Always cite specific patent numbers, claim numbers, and dates from the data
- If the data doesn't contain the answer, say "This information isn't available in the current portfolio data" rather than guessing
- Never use general patent knowledge to fill gaps — only use the provided portfolio data
- When discussing claims, reference specific claim text and limitations
- When discussing portfolio shape or coverage, relate it to specific claim scope and how families complement each other
- Format responses with markdown for readability (bold, bullets, etc.)
- Be concise but thorough — aim for 2-4 paragraphs unless the question demands more
- When comparing patents, use a structured format (table or side-by-side)

Portfolio Data:
${JSON.stringify(portfolio, null, 2)}`;

    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorChunk = `data: ${JSON.stringify({ error: (err as Error).message })}\n\n`;
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
