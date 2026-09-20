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

    if (apiKey) {
      try {
        const google = createGoogleGenerativeAI({ apiKey });
        const languageInstruction = isArabic
          ? 'Respond exclusively in eloquent Arabic (العربية الفصحى الأنيقة). Maintain strict orthography (place Tanween Fath on the consonant preceding the Alef, e.g. تمامًا، كاملًا، فوريًا).'
          : 'Respond in clear scholarly English.';

        const { text } = await generateText({
          model: google('gemini-3.5-flash-lite'),
          system: `${ZERO_HALLUCINATION_SYSTEM_PROMPT}\n\n${languageInstruction}`,
          prompt: `
User Question: "${lastMessage}"

Sanity Knowledge Lake Records:
${mcpResult.formattedContext}

Directives:
1. If the user asks a greeting, identity, or meta question (e.g. "مين انت", "من أنت", "مين اللي بيرد", "hello", "who are you"):
   - Cordially introduce yourself as the **Quran Sanity Agent** powered by **Google Gemini** for intelligent reasoning and grounded in the **Sanity Knowledge Lake** (114 Surahs, 6,236 Ayahs, and Classical Exegesis Corpus).
2. If the user asks ANY question about the Holy Quran (e.g. Surah order, first/last surah, longest/shortest surah, Makki/Madani revelation, verse counts, ayah meanings, themes, or classical tafsir):
   - You MUST answer the question authoritatively, accurately, and comprehensively in the requested language (Arabic or English).
   - Draw directly from the provided Sanity Context documents (Surahs, Ayahs, and Tafsir Claims) and explicitly tag referenced items with \`[Sanity: <document_id>]\` (e.g. \`[Sanity: surah-1]\`, \`[Sanity: ayah-1-1]\`, \`[Sanity: <claim_id>]\`).
   - For interpretive divergences, present the classical stances side by side (Ikhtilaf Tadadd vs Ikhtilaf Tanawwu') with primary evidence from Ibn Kathir, Al-Qurtubi, Al-Razi, Al-Tabari, Al-Zamakhshari, or Al-Sa'di.
3. Strict Authenticity:
   - Only if a user asks for baseless modern speculation, fake hadiths, or external pseudo-scientific theories completely alien to Quranic and classical exegesis tradition, clarify that such matters are unindexed in the verified classical corpus.
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
        const isMeta = /مين|انت|أنت|من أنت|من انت|ازيك|مرحبا|مرحباً|أهلا|اهلا|who are you|hello|hi|what do you do|answering|replying/i.test(lastMessage);
        if (isMeta) {
          responseText = isArabic
            ? `أهلًا بك ومرحبًا! معك **«وكيل التفسير الموثق» (Quran Sanity Agent)**؛ وهو نظام ذكاء استدلالي متخصص في التفسير القرآني المقارن والتحقيق العلمي، يستند مباشرة إلى بحيرة بيانات **Sanity Knowledge Lake** لربط أقوال المفسرين المعتمدة (ابن كثير، الطبري، القرطبي، الرازي، الزمخشري، السعدي) بأدلتها الأصلية بلا أي اختلاق أو هلوسة.\n\nيمكنك سؤالي عن أي مسألة تفسيرية (مثل: الخلاف في البسملة، أو دلالة العصر، أو صفات آية الكرسي) وسأعرض لك مقارنة علمية دقيقة وموثقة.`
            : `Hello and welcome! I am the **Quran Sanity Agent**, a research-grade exegesis intelligence directly grounded in the **Sanity Knowledge Lake** to surface verified classical scholarly interpretations with zero hallucination.\n\nYou can ask about classical divergences (such as the Basmalah in Al-Fatiha, the semantic scope of Al-Asr, or Divine Attributes in Ayah al-Kursi) to explore side-by-side scholarly evidence.`;
        } else {
          responseText = isArabic
            ? 'لم أجد سجلات تفسيرية موثقة ومطابقة لهذا السؤال في بحيرة سينتي المعرفية؛ والتزامًا بنزاهة التفسير ومنع الهلوسة، أقتصر حصريًا على النصوص الموثقة في قاعدة البيانات.'
            : 'I could not locate verified interpretive records for this specific inquiry within our indexed Sanity Knowledge Base. To preserve scriptural integrity and eliminate hallucination, I only report claims directly grounded in our structured content lake.';
        }
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
