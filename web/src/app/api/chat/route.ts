import { NextRequest, NextResponse } from 'next/server';
import { querySanityContext } from '@/lib/mcp-bridge';
import { ZERO_HALLUCINATION_SYSTEM_PROMPT } from '@/lib/agent-prompt';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, surahNumber } = body;

    const lastMessage =
      Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1].content
        : 'Compare classical interpretations of the Basmalah in Al-Fatiha';

    // 1. Query Sanity Context MCP Bridge
    const mcpResult = await querySanityContext({
      query: lastMessage,
      surahNumber: surahNumber ? Number(surahNumber) : undefined,
    });

    // 2. Synthesize with Gemini if API Key is available
    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY;

    let responseText = '';

    if (apiKey && mcpResult.found) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        const { text } = await generateText({
          model: google('gemini-1.5-flash'),
          system: ZERO_HALLUCINATION_SYSTEM_PROMPT,
          prompt: `
User Question: "${lastMessage}"

Sanity Context MCP Documents:
${mcpResult.formattedContext}

Synthesize a structured scholarly response adhering strictly to the directives. Ensure side-by-side comparison for divergences and [Sanity: <id>] citation tags.
`,
        });
        responseText = text;
      } catch (aiErr) {
        console.warn('[AI SDK Generation Warning] Falling back to deterministic synthesis:', aiErr);
      }
    }

    // 3. Fallback Deterministic Grounded Synthesis (Ensures 100% Zero-Crash & Instant response)
    if (!responseText) {
      if (!mcpResult.found) {
        responseText =
          "I could not locate verified interpretive records for this specific inquiry within our indexed Sanity Knowledge Base. To preserve scriptural integrity and eliminate hallucination, I only report claims directly grounded in our structured content lake.";
      } else {
        responseText = `### Verified Sanity Exegetical Synthesis\n\n`;
        for (const group of mcpResult.divergenceGroups) {
          responseText += `#### Analysis: ${group.targetPhrase}\n`;
          responseText += `**Classification:** \`${group.divergenceType.toUpperCase()}\` (${
            group.divergenceType === 'contradictory'
              ? 'Ikhtilaf Tadadd / Direct Variance'
              : group.divergenceType === 'complementary'
              ? "Ikhtilaf Tanawwu' / Complementary Perspectives"
              : 'Ijma / Scholarly Consensus'
          })\n\n`;

          for (const claim of group.claims) {
            responseText += `* **${claim.source?.author}** (*${claim.source?.bookTitleEnglish}*, ${claim.source?.methodology} methodology):\n`;
            responseText += `  "${claim.opinionEnglish}" [Sanity: \`${claim._id}\`]\n`;
            responseText += `  *Evidence:* ${claim.evidenceEnglish}\n\n`;
          }
        }
      }
    }

    return NextResponse.json({
      text: responseText,
      divergenceGroups: mcpResult.divergenceGroups,
      citations: mcpResult.citations,
      totalClaims: mcpResult.totalClaims,
      found: mcpResult.found,
    });
  } catch (err: any) {
    console.error('[API /api/chat Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
