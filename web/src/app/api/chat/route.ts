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

    // Detect if user's question is primarily Arabic
    const isArabic = Boolean(lastMessage.match(/[\u0600-\u06FF]/));

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
        const languageInstruction = isArabic
          ? 'Respond exclusively in eloquent academic Arabic (العربية الفصحى الأكاديمية). Maintain strict orthography (place Tanween Fath on the consonant preceding the Alef).'
          : 'Respond in clear scholarly English.';

        const { text } = await generateText({
          model: google('gemini-1.5-flash'),
          system: `${ZERO_HALLUCINATION_SYSTEM_PROMPT}\n\n${languageInstruction}`,
          prompt: `
User Question: "${lastMessage}"

Sanity Context MCP Documents:
${mcpResult.formattedContext}

Synthesize a structured scholarly response adhering strictly to the directives. Ensure side-by-side comparison for divergences and explicit [Sanity: <id>] citation tags.
`,
        });
        responseText = text;
      } catch (aiErr) {
        console.warn('[AI SDK Generation Warning] Falling back to deterministic synthesis:', aiErr);
      }
    }

    // 3. Fallback Deterministic Grounded Synthesis (Bilingual, 100% Zero-Crash & Instant)
    if (!responseText) {
      if (!mcpResult.found) {
        responseText = isArabic
          ? 'لم أجد سجلات تفسيرية موثقة ومطابقة لهذا السؤال في بحيرة سينتي المعرفية؛ والتزامًا بنزاهة التفسير ومنع الهلوسة، أقتصر حصريًا على النصوص الموثقة في قاعدة البيانات.'
          : 'I could not locate verified interpretive records for this specific inquiry within our indexed Sanity Knowledge Base. To preserve scriptural integrity and eliminate hallucination, I only report claims directly grounded in our structured content lake.';
      } else {
        if (isArabic) {
          responseText = `### استخلاص استدلالي موثق من بحيرة المعرفة القرآنية (Sanity Context)\n\n`;
          for (const group of mcpResult.divergenceGroups) {
            const typeArabic =
              group.divergenceType === 'contradictory'
                ? 'اختلاف تضاد (آراء فقهية / نصية متباينة)'
                : group.divergenceType === 'complementary'
                ? 'اختلاف تنوع (تكامل وتعدد وجوه دلالية)'
                : 'إجماع (اتفاق وتطابق أئمة التفسير)';

            responseText += `#### المسألة: ${group.targetPhrase}\n`;
            responseText += `**التصنيف الإبستمولوجي:** \`${group.divergenceType.toUpperCase()}\` (${typeArabic})\n\n`;

            for (const claim of group.claims) {
              const scholarName = claim.source?.author || 'أحد الأئمة';
              const bookTitle = claim.source?.bookTitleArabic || claim.source?.bookTitleEnglish || 'المصدر';
              const opinionText = claim.opinionArabic || claim.opinionEnglish;
              const evidenceText = claim.evidenceEnglish;

              responseText += `* **${scholarName}** (*${bookTitle}*، منهج ${claim.source?.methodology}):\n`;
              responseText += `  "${opinionText}" [Sanity: \`${claim._id}\`]\n`;
              responseText += `  *الدليل والاستدلال:* ${evidenceText}\n\n`;
            }
          }
        } else {
          responseText = `### Verified Sanity Exegetical Synthesis\n\n`;
          for (const group of mcpResult.divergenceGroups) {
            const typeEnglish =
              group.divergenceType === 'contradictory'
                ? 'Ikhtilaf Tadadd / Direct Variance'
                : group.divergenceType === 'complementary'
                ? "Ikhtilaf Tanawwu' / Complementary Perspectives"
                : 'Ijma / Scholarly Consensus';

            responseText += `#### Analysis: ${group.targetPhrase}\n`;
            responseText += `**Classification:** \`${group.divergenceType.toUpperCase()}\` (${typeEnglish})\n\n`;

            for (const claim of group.claims) {
              responseText += `* **${claim.source?.author}** (*${claim.source?.bookTitleEnglish}*, ${claim.source?.methodology} methodology):\n`;
              responseText += `  "${claim.opinionEnglish}" [Sanity: \`${claim._id}\`]\n`;
              responseText += `  *Evidence:* ${claim.evidenceEnglish}\n\n`;
            }
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
  } catch (err: unknown) {
    console.error('[API /api/chat Error]:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
