import { NextRequest, NextResponse } from "next/server";
import { getCorpus, isReviewed } from "@/lib/corpus";
import { buildAnswer, matchesRequestedAuthor } from "@/lib/research";
import { discoverContextEvidence } from "@/lib/context-mcp";
import { retrieveLibrary, resolveContextLibraryCitations } from "@/lib/library";
import { selectEvidence, thematicVerseKeys } from "@/lib/research";
import { createHash } from 'node:crypto';
import { RequestGuard } from '@/lib/request-guard';
import { generateResearchNotes } from '@/lib/research-notes';

const limits=globalThis as typeof globalThis & {quranRequestGuard?:RequestGuard};
const positive=(name:string,fallback:number)=>{const value=Number(process.env[name]);return Number.isInteger(value)&&value>0&&value<=10000?value:fallback;};
const guard=limits.quranRequestGuard??=new RequestGuard({perMinute:positive('QURAN_REQUESTS_PER_MINUTE',12),concurrent:positive('QURAN_MAX_CONCURRENT',4),hourly:positive('QURAN_REQUESTS_PER_HOUR',120)});

export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(req: NextRequest) {
  const origin=req.headers.get('origin');
  // Next's internal URL can use localhost while the browser uses 127.0.0.1.
  // Host is the browser's destination; reverse proxies should set PUBLIC_ORIGIN.
  const destination=new URL(req.nextUrl.origin);
  destination.host=req.headers.get('host')||destination.host;
  if(req.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==(process.env.QURAN_PUBLIC_ORIGIN||destination.origin)))
    return NextResponse.json({error:'Open the research workspace to send a question.'},{status:403});
  const started = Date.now();
  const requestSignal = AbortSignal.any([
    req.signal,
    AbortSignal.timeout(45000),
  ]);
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 16000)
      return NextResponse.json(
        { error: "Request is too large." },
        { status: 413 },
      );
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "Send a valid JSON request." },
      { status: 400 },
    );
  }
  if (!body || typeof body !== "object")
    return NextResponse.json(
      { error: "A question is required." },
      { status: 400 },
    );
  const { question, messages, surahNumber } = body as Record<string, unknown>;
  const latest = Array.isArray(messages) ? messages.at(-1) : undefined;
  const text =
    typeof question === "string"
      ? question
      : latest?.role === "user"
        ? latest.content
        : undefined;
  if (typeof text !== "string" || !text.trim() || text.length > 2000)
    return NextResponse.json(
      { error: "Question must contain 1–2,000 characters." },
      { status: 400 },
    );
  if (
    surahNumber !== undefined &&
    (typeof surahNumber !== "number" ||
      !Number.isInteger(surahNumber) ||
      surahNumber < 1 ||
      surahNumber > 114)
  )
    return NextResponse.json(
      { error: "Chapter must be a number from 1 to 114." },
      { status: 400 },
    );
  const address=process.env.QURAN_TRUST_PROXY==='true'?req.headers.get('x-forwarded-for')?.split(',')[0].trim():'anonymous';
  const ticket=guard.acquire(createHash('sha256').update(address||'anonymous').digest('hex'));
  if(!ticket.ok)return NextResponse.json({error:'Research is busy. Please wait a moment and try again.',retryAfter:ticket.retryAfter},{status:429,headers:{'Retry-After':String(ticket.retryAfter),'Cache-Control':'no-store'}});
  try {
    const corpus = await getCorpus();
    const answer = buildAnswer(
      corpus,
      text.trim(),
      surahNumber as number | undefined,
    );
    const initialMissingText=answer.status==='not_found'?answer.text:null;
    answer.contextStatus = "not_configured";
    // These read-only retrieval paths are independent; share the request deadline.
    const contextPending =
      answer.status === "limited" || answer.status === "not_found"
        ? discoverContextEvidence(text.trim(), corpus, requestSignal).catch(
            (error) => {
              answer.contextFailure=error?.name==='TimeoutError'||error?.name==='AbortError'?'timeout':/selection|JSON/.test(String(error?.message))?'invalid_selection':'dependency';
              return null;
            },
          )
        : null;
    if (answer.status === "limited" || answer.status === "not_found") {
      try {
        const explicit = /[0-9٠-٩۰-۹]/.test(text);
        const selection = selectEvidence(
          corpus,
          text,
          surahNumber as number | undefined,
        );
        const keys = explicit
          ? selection.ayahs.map((a) => `${a.surah.number}:${a.ayahNumber}`)
          : [];
        const library = await retrieveLibrary(
          text,
          keys,
          requestSignal,
          explicit
            ? []
            : [...new Set([...thematicVerseKeys(text),...selection.ayahs.map((a) => `${a.surah.number}:${a.ayahNumber}`)])],
        );
        answer.libraryStatus = "connected";
        answer.libraryPlanner = library.planner;
        if (library.citations.length) {
          const ar = /[\u0600-\u06ff]/.test(text);
          answer.text += ar
            ? "\n\n**مقاطع من مكتبة البحث**\n\nهذه نتائج استرجاع من النسخة المستوردة وليست إجابة تفسيرية مكتملة أو مراجعة من متخصص. المراجع تشير إلى موضع النص في قاعدة المصدر؛ صلتها بالسؤال تحتاج قراءة السياق."
            : "\n\n**Research library passages**\n\nRetrieved from the imported source copy, not a complete interpretation or specialist review. References identify the source record; relevance requires reading the context. Arabic excerpts are preserved without generated translation.";
          for (const citation of library.citations) {
            const verse = corpus.ayahs.find(
              (a) =>
                `${a.surah.number}:${a.ayahNumber}` ===
                citation.rawJsonSnippet.verseKey,
            );
            if (!verse) continue;
            citation.rawJsonSnippet.ayahDocumentId = verse._id;
            citation.rawJsonSnippet.textUthmani = verse.textUthmani;
            const passage = String(
              citation.rawJsonSnippet.relevantExcerpt ||
                citation.rawJsonSnippet.primaryExcerpt,
            );
            answer.text += `\n\n**${citation.title}** [Sanity: ${citation.documentId}]\n\n${passage.slice(0, 1400)}${passage.length > 1400 ? (ar ? "… (النص الكامل في المصدر)" : "… (full text in source)") : ""}`;
            answer.citations.push(citation);
          }
          answer.found = true;
          answer.status = "limited";
        }
      } catch {
        answer.libraryStatus = "unavailable";
      }
    }
    if (answer.status === "not_found" || answer.status === "limited") {
      try {
        const context = await contextPending;
        if (!context) throw new Error("Context retrieval unavailable");
        answer.contextStatus = context.status;
        answer.contextTools = context.tools;
        if('strategy' in context)answer.contextStrategy=context.strategy;
        const contextPassages = await resolveContextLibraryCitations(
          context.ids,
          text,
        );
        for (const citation of contextPassages) {
          if (
            answer.citations.some((c) => c.documentId === citation.documentId)
          )
            continue;
          const verse = corpus.ayahs.find(
            (a) =>
              `${a.surah.number}:${a.ayahNumber}` ===
              citation.rawJsonSnippet.verseKey,
          );
          if (!verse) continue;
          citation.rawJsonSnippet.ayahDocumentId = verse._id;
          citation.rawJsonSnippet.textUthmani = verse.textUthmani;
          citation.rawJsonSnippet.retrievedVia =
            context.tools.includes("groq_query")
              ? "Sanity Context GROQ"
              : "Sanity Context Knowledge Base";
          const passage = String(citation.rawJsonSnippet.primaryExcerpt);
          const ar = /[\u0600-\u06ff]/.test(text);
          answer.text += `\n\n**${citation.title} · Sanity Context** [Sanity: ${citation.documentId}]\n\n${passage.slice(0, 1400)}${passage.length > 1400 ? (ar ? "… (النص الكامل في المصدر)" : "… (full text in source)") : ""}`;
          answer.citations.push(citation);
          answer.found = true;
          answer.status = "limited";
        }
        // Additional results remain explicitly labeled excerpts, never an asserted synthesis.
        const docs = [
          ...corpus.ayahs,
          ...corpus.claims.filter(isReviewed),
        ].filter(
          (d) =>
            context.ids.includes(d._id) &&
            (d._type !== "interpretiveClaim" ||
              matchesRequestedAuthor(text, d.source.author)) &&
            !answer.citations.some((c) => c.documentId === d._id),
        );
        if (docs.length) {
          const ar = /[\u0600-\u06ff]/.test(text);
          answer.text += ar
            ? "\n\nنصوص إضافية استرجعها Sanity Context؛ راجع مدى صلتها بالسؤال:"
            : "\n\nAdditional passages retrieved through Sanity Context; inspect their relevance to the question:";
          for (const doc of docs) {
            const content =
              doc._type === "ayah"
                ? doc.textUthmani
                : ar
                  ? doc.opinionArabic
                  : doc.opinionEnglish;
            answer.text += `\n\n${content} [Sanity: ${doc._id}]`;
            const title =
              doc._type === "ayah"
                ? `${doc.surah.nameEnglish || doc.surah.nameArabic || "Verse"} ${doc.surah.number}:${doc.ayahNumber}`
                : `${doc.source.author} · ${doc.targetSegmentEnglish}`;
            answer.citations.push({
              documentId: doc._id,
              documentType: doc._type,
              title,
              origin: corpus.origin,
              rawJsonSnippet: doc as unknown as Record<string, unknown>,
              sourceUrl:
                doc._type === "interpretiveClaim" ? doc.sourceUrl : undefined,
            });
          }
          answer.found = true;
          answer.status = "limited";
        }
      } catch {
        answer.contextStatus = "unavailable";
      }
    }
    if(initialMissingText&&answer.found&&answer.citations.length){
      const prelude=/[\u0600-\u06ff]/.test(text)
        ?'استُرجعت مقاطع من المصادر مرتبطة بالسؤال. اقرأ النصوص وسياقها؛ هذه ليست مراجعة تفسيرية من متخصص.'
        :'Source passages were retrieved for this question. Read their text and context; these are not a specialist-reviewed interpretation.';
      answer.text=prelude+answer.text.slice(initialMissingText.length);
    }
    answer.notesStatus='not_needed';
    if(answer.status==='limited'&&answer.citations.length){
      const notes=await generateResearchNotes(text.trim(),answer.citations,requestSignal);
      answer.notesStatus=notes?'available':'unavailable';
      if(notes)answer.researchNotes=notes;
    }
    return NextResponse.json(
      { ...answer, elapsedMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "The configured Sanity dataset is unavailable. Please retry; no local records were substituted.",
      },
      { status: 503 },
    );
  } finally {
    ticket.release();
  }
}
