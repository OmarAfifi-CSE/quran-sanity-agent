import type { Corpus } from "./corpus";
import { isReviewed } from "./corpus";
import translationAttribution from '../../data/translation-attribution.json';
import type {
  Ayah,
  GroundingSourceCitation,
  InterpretiveClaim,
  ResearchAnswer,
  Surah,
} from "./types";

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 0x6f0))
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\uFEFF]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}:\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
/** Candidate anchors for a compound topic, never a generated doctrinal conclusion. */
export function thematicVerseKeys(question: string): string[] {
  const q=normalize(question);
  const reliance=/توكل|التوكل|reliance|trust in (?:allah|god)|tawakkul/.test(q);
  const action=/اسباب|precaution|taking (?:action|means)|practical (?:action|means)/.test(q);
  return reliance&&action?["12:67","3:159"]:[];
}
function requestedAuthors(question: string) {
  const q = normalize(question);
  return [
    { pattern: /ابن كثير|ibn kathir|ibn katheer/, name: "ibn kathir" },
    { pattern: /الطبري|tabari/, name: "tabari" },
    { pattern: /القرطبي|qurtubi/, name: "qurtubi" },
    { pattern: /السعدي|sa di|saadi|sadi/, name: "sa di" },
    { pattern: /البغوي|baghawi/, name: "baghawi" },
    { pattern: /الرازي|razi/, name: "razi" },
    { pattern: /الزمخشري|zamakhshari/, name: "zamakhshari" },
  ].filter((author) => author.pattern.test(q));
}
export function matchesRequestedAuthor(question: string, author: string) {
  const requested = requestedAuthors(question);
  return (
    !requested.length ||
    requested.some((item) => normalize(author).includes(item.name))
  );
}
const stop = new Set(
  normalize(
    "what is are the a an of in about and to me tell show explain compare interpretation interpretations classical opinions tafsir surah chapter verse ayah quran please does do how many who ما هي هو عن من في علي هل اي اشرح تفسير سوره ايه القران الكريم عدد كم عايز اعرف معني معاني قارن",
  ).split(" "),
);
function contains(haystack: string, needle: string) {
  return ` ${haystack} `.includes(` ${needle} `);
}
function names(s: Surah): string[] {
  const english = s.nameEnglish.split("(")[0].trim();
  return [
    ...new Set(
      [
        s.nameArabic,
        english,
        english.replace(/^(al|an|at|as|ash|ad|az)\s*-/i, ""),
        s.number === 1 ? "fatiha" : "",
        s.number === 18 ? "kahf" : "",
        s.number === 112 ? "ikhlas" : "",
      ]
        .filter(Boolean)
        .map(normalize),
    ),
  ];
}
export interface Selection {
  surahs: Surah[];
  ayahs: Ayah[];
  claims: InterpretiveClaim[];
  intent:
    | "reference"
    | "metadata"
    | "interpretation"
    | "search"
    | "clarify"
    | "greeting";
  note?: string;
}

export function selectEvidence(
  corpus: Corpus,
  question: string,
  surahNumber?: number,
): Selection {
  const q = normalize(question);
  const blank: Selection = {
    surahs: [],
    ayahs: [],
    claims: [],
    intent: "search",
  };
  if (
    /^(hi|hello|hey|مرحبا|اهلا|السلام عليكم|who are you|من انت|مين انت)[ !؟?]*$/.test(
      q,
    )
  )
    return { ...blank, intent: "greeting" };
  const reference = q.match(/(?:^|\s)(\d{1,3})\s*:\s*(\d{1,3})(?=\s|$)/);
  // Never silently answer only the first item of a multi-reference request.
  if (
    (q.match(/\d+\s*:\s*\d+/g)?.length || 0) > 1 ||
    /[0-9٠-٩۰-۹]\s*[-–—]\s*[0-9٠-٩۰-۹]/.test(question)
  )
    return { ...blank, intent: "clarify", note: "single_reference" };
  const numbered = q.match(
    /(?:surah|chapter|سوره)\s*(?:number|رقم)?\s*(\d{1,3})\b/,
  );
  let surahs = corpus.surahs.filter((s) =>
    names(s).some((n) => contains(q, n)),
  );
  if (surahNumber || numbered)
    surahs = corpus.surahs.filter(
      (s) => s.number === (surahNumber || Number(numbered![1])),
    );
  const verseNumber =
    q.match(/(?:ayah|verse|ايه)\s*(?:number|رقم)?\s*(\d{1,3})\b/) ||
    (!numbered && surahs.length === 1 ? q.match(/\s(\d{1,3})$/) : null);
  let ref = reference
    ? { s: Number(reference[1]), a: Number(reference[2]) }
    : verseNumber && surahs.length === 1
      ? { s: surahs[0].number, a: Number(verseNumber[1]) }
      : null;
  if (!ref && /ayat al kursi|ayah al kursi|ايه الكرسي|اية الكرسي/.test(q))
    ref = { s: 2, a: 255 };
  if (ref) {
    const s = corpus.surahs.find((s) => s.number === ref!.s);
    if (!s || ref.a < 1 || ref.a > s.totalAyahs)
      return { ...blank, intent: "clarify", note: "invalid_reference" };
    const ayahs = corpus.ayahs.filter(
      (a) => a.surah.number === ref!.s && a.ayahNumber === ref!.a,
    );
    return {
      surahs: [],
      ayahs,
      claims: corpus.claims.filter((c) =>
        ayahs.some((a) => a._id === c.ayah._id),
      ),
      intent:
        /explain|meaning|tafsir|interpret|compare|differ|consensus|تفسير|معني|اشرح|قارن|خلاف|اجماع/.test(
          q,
        )
          ? "interpretation"
          : "reference",
    };
  }
  // Revelation order and written order are different questions.
  if (
    /(first|last|اول|اخر)/.test(q) &&
    /(reveal|revelation|نزل|نزول|انزل)/.test(q)
  )
    return { ...blank, intent: "clarify", note: "revelation_order" };
  if (
    /(first|last|longest|shortest|اول|اخر|اطول|اقصر)/.test(q) &&
    /(surah|chapter|سوره|سور|verse|ayah|ايه)/.test(q)
  ) {
    if (/(verse|ayah|ايه)/.test(q) && !/(surah|chapter|سوره)/.test(q))
      return { ...blank, intent: "clarify", note: "specify_reference" };
    if (/(first|اول)/.test(q))
      surahs = corpus.surahs.filter((s) => s.number === 1);
    else if (/(last|اخر)/.test(q))
      surahs = corpus.surahs.filter((s) => s.number === 114);
    else if (/(longest|اطول)/.test(q))
      surahs = [...corpus.surahs]
        .sort((a, b) => b.totalAyahs - a.totalAyahs)
        .slice(0, 1);
    else return { ...blank, intent: "clarify", note: "shortest_measure" };
    return { ...blank, surahs, intent: "metadata" };
  }
  const interpretive =
    /explain|meaning|tafsir|interpret|compare|differ|consensus|تفسير|معني|اشرح|خلاف|قارن|اجماع/.test(
      q,
    );
  const metadata =
    /how many verses (?:are |are there )?in|number of verses in|verses in|makki|madani|meccan|medinan|عدد ايات|مكيه|مدنيه/.test(
      q,
    );
  if (metadata && surahs.length)
    return { ...blank, surahs, intent: "metadata" };
  let queryTerms = q
    .split(" ")
    .filter((t) => t.length > 1 && !stop.has(t) && !/^\d+$/.test(t));
  const surahTerms = new Set(
    surahs.flatMap((s) => names(s).flatMap((n) => n.split(" "))),
  );
  queryTerms = queryTerms.filter((t) => !surahTerms.has(t));
  if (/basmalah|bismillah|بسمله/.test(q) && !surahs.length)
    surahs = corpus.surahs.filter((s) => s.number === 1);
  const scopedAyahs = corpus.ayahs.filter(
    (a) => !surahs.length || surahs.some((s) => s.number === a.surah.number),
  );
  const searchTerms = queryTerms.filter(
    (t) => !["basmalah", "bismillah", "بسمله"].includes(t),
  );
  const ranked = scopedAyahs
    .map((a) => {
      const text = normalize(
        `${a.textUthmani} ${a.textEnglishTranslation} ${(a.keywords || []).join(" ")}`,
      );
      const score = searchTerms.reduce(
        (n, t) => n + (contains(text, t) ? 1 : 0),
        0,
      );
      return { a, score };
    })
    .filter((x) =>
      searchTerms.length
        ? x.score >= Math.max(1, Math.ceil(searchTerms.length * 0.6))
        : surahs.length > 0,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.a);
  const claims = corpus.claims.filter((c) => {
    if (surahs.length && !surahs.some((s) => s.number === c.ayah.surah.number))
      return false;
    const text = normalize(
      `${c.targetSegmentArabic} ${c.targetSegmentEnglish} ${c.source.author}`,
    );
    return (
      (surahs.length > 0 && !searchTerms.length) ||
      queryTerms.some((t) => contains(text, t)) ||
      ranked.some((a) => a._id === c.ayah._id)
    );
  });
  if (surahs.length && !queryTerms.length && !interpretive)
    return { ...blank, surahs, intent: "metadata" };
  return {
    surahs: [],
    ayahs: ranked,
    claims,
    intent: interpretive ? "interpretation" : "search",
  };
}

export function buildAnswer(
  corpus: Corpus,
  question: string,
  surahNumber?: number,
): ResearchAnswer {
  const ar = /[\u0600-\u06ff]/.test(question);
  const q = normalize(question);
  const countQuestion = /(how many|number of|كم|عدد)/.test(q);
  const catalogQuestion =
    /^(?:how many|what is the number of|number of) (?:verses|ayahs|chapters|surahs) (?:are there |are |there )?in (?:the )?quran$/.test(
      q,
    ) || /^(?:كم عدد|عدد) (?:ايات|سور) (?:القران|القران الكريم)$/.test(q);
  if (
    catalogQuestion &&
    !corpus.surahs.some((s) => names(s).some((n) => contains(q, n)))
  ) {
    const text = ar
      ? `المكتبة الحالية تحتوي على **${corpus.surahs.length} سورة** و**${corpus.ayahs.length.toLocaleString("en-US")} آية** وفق ترقيم هذه النسخة. هذا إحصاء للسجلات المحمّلة. [Sanity: catalog-summary]`
      : `The current library contains **${corpus.surahs.length} chapters** and **${corpus.ayahs.length.toLocaleString("en-US")} verses**, using this dataset’s numbering. These totals are computed from the loaded records. [Sanity: catalog-summary]`;
    return {
      text,
      status: "answered",
      origin: corpus.origin,
      retrieval: "catalog_counts",
      pendingReview: 0,
      found: true,
      totalClaims: 0,
      divergenceGroups: [],
      citations: [
        {
          documentId: "catalog-summary",
          documentType: "queryResult",
          title: "Library totals (computed)",
          origin: corpus.origin,
          rawJsonSnippet: {
            _type: "queryResult",
            description: "Computed counts, not a stored document",
            surahs: corpus.surahs.length,
            ayahs: corpus.ayahs.length,
            fetchedAt: corpus.fetchedAt,
            sourceChapterIds: corpus.surahs.map((s) => s._id),
          },
        },
      ],
    };
  }
  const pick = selectEvidence(corpus, question, surahNumber);
  if (requestedAuthors(question).length && pick.intent === "reference")
    pick.intent = "interpretation";
  pick.claims = pick.claims.filter((claim) =>
    matchesRequestedAuthor(question, claim.source.author),
  );
  // Topic/word counts need a defined counting method, not catalog totals.
  const chapterVerseCount =
    /how many verses (?:are |are there )?in|number of verses in|عدد ايات/.test(
      q,
    );
  if (
    countQuestion &&
    !catalogQuestion &&
    !(chapterVerseCount && pick.intent === "metadata")
  ) {
    pick.intent = "clarify";
    pick.note = "count_method";
  }
  const reviewed = pick.claims.filter(isReviewed);
  const citations: GroundingSourceCitation[] = [];
  const cite = (doc: Surah | Ayah | InterpretiveClaim, title: string) => {
    if (!citations.some((c) => c.documentId === doc._id))
      citations.push({
        documentId: doc._id,
        documentType: doc._type,
        title,
        origin: corpus.origin,
        rawJsonSnippet: doc._type==='ayah'?{...doc,translationAttribution}:doc as unknown as Record<string, unknown>,
        sourceUrl: "sourceUrl" in doc ? doc.sourceUrl : undefined,
      });
    return `[Sanity: ${doc._id}]`;
  };
  const result: ResearchAnswer = {
    text: "",
    status: "not_found",
    citations,
    divergenceGroups: [],
    origin: corpus.origin,
    retrieval: pick.intent,
    pendingReview:
      pick.intent === "interpretation"
        ? pick.claims.length - reviewed.length
        : 0,
    found: false,
    totalClaims: pick.intent === "interpretation" ? reviewed.length : 0,
  };
  if (pick.intent === "greeting")
    return {
      ...result,
      status: "answered",
      text: ar
        ? "أهلًا بك. أساعدك في البحث في القرآن وقراءة الآيات ومراجعة مصادر التفسير. جرّب: «البقرة ٢٥٥» بصيغة «٢:٢٥٥»، أو «كم عدد آيات سورة الكهف؟»."
        : "Welcome. Explore Quran verses, chapter facts, and the sources behind interpretations. Try “2:255” or “How many verses are in Al-Kahf?”",
    };
  if (pick.intent === "clarify") {
    const notes: Record<string, [string, string]> = {
      single_reference: [
        "Please ask about one verse reference at a time, such as 2:255. Ranges and multiple references are not yet supported.",
        "من فضلك اسأل عن مرجع آية واحد في كل مرة، مثل ٢:٢٥٥. نطاقات الآيات والمراجع المتعددة غير مدعومة بعد.",
      ],
      count_method: [
        "I cannot establish an exact topic or word count from these search results. Please specify the exact word and counting method; matching passages are not an exhaustive count.",
        "لا أستطيع إثبات عدد دقيق لموضوع أو كلمة من نتائج البحث هذه. حدد الكلمة وطريقة العد؛ فالآيات المطابقة ليست إحصاءً شاملًا.",
      ],
      invalid_reference: [
        "That verse reference is outside the chapter’s verse range. Use a reference such as 2:255.",
        "مرجع الآية خارج نطاق آيات السورة. اكتب مرجعًا مثل ٢:٢٥٥.",
      ],
      revelation_order: [
        "Do you mean written order or order of revelation? The indexed chapter numbers describe written order; they do not establish which revelation came first or last.",
        "هل تقصد ترتيب المصحف أم ترتيب النزول؟ أرقام السور في البيانات تصف ترتيب المصحف، ولا تثبت أول ما نزل أو آخره.",
      ],
      shortest_measure: [
        "Do you mean shortest by verse count or by words? Several chapters have three verses; verse count alone does not establish the shortest by words.",
        "هل تقصد الأقل في عدد الآيات أم الكلمات؟ هناك عدة سور من ثلاث آيات، وعدد الآيات وحده لا يحدد الأقصر في الكلمات.",
      ],
      specify_reference: [
        "Please specify a chapter and verse, for example 2:255.",
        "من فضلك حدد السورة ورقم الآية، مثل ٢:٢٥٥.",
      ],
    };
    return {
      ...result,
      status: "clarify",
      text: notes[pick.note!][ar ? 1 : 0],
    };
  }
  const sections: string[] = [];
  for (const s of pick.surahs)
    sections.push(
      ar
        ? `**سورة ${s.nameArabic}** — رقم ${s.number} في ترتيب المصحف، وعدد آياتها **${s.totalAyahs}**. تصنيف النزول في الفهرس: ${s.revelationType === "makki" ? "مكية" : "مدنية"}. ${cite(s, s.nameEnglish)}`
        : `**${s.nameEnglish}** is chapter **${s.number}** in written order, with **${s.totalAyahs} verses**. The catalog classifies it as ${s.revelationType === "makki" ? "Meccan" : "Medinan"}. ${cite(s, s.nameEnglish)}`,
    );
  if (pick.intent === "interpretation" && reviewed.length)
    pick.ayahs = pick.ayahs.filter((a) =>
      reviewed.some((c) => c.ayah._id === a._id),
    );
  if (pick.ayahs.length) {
    if (pick.intent !== "reference" && !reviewed.length)
      sections.push(
        ar
          ? "آيات مطابقة للبحث؛ ورودها هنا لا يُعد تفسيرًا كاملًا للسؤال:"
          : "Matching passages. These excerpts are search results, not a complete interpretation of the question:",
      );
    for (const a of pick.ayahs)
      sections.push(
        `**${a.surah.nameArabic} · ${a.surah.number}:${a.ayahNumber}** ${cite(a, `${a.surah.nameEnglish} ${a.surah.number}:${a.ayahNumber}`)}\n\n${a.textUthmani}${ar ? "" : `\n\n${a.textEnglishTranslation}`}`,
      );
  }
  if (pick.ayahs.length && !ar)
    sections.push(
      "_English rendering: Saheeh International · Quran.com resource 20. Text identity checked against all 6,236 preserved passages; translation conveys meaning._",
    );
  if (reviewed.length && pick.intent === "interpretation") {
    for (const c of reviewed)
      sections.push(
        `**${c.source.author}**\n\n${ar ? c.opinionArabic : c.opinionEnglish} ${cite(c, `${c.source.author} · ${c.sourceLocator}`)}\n\n${c.sourceLocator}`,
      );
    const keys = [
      ...new Set(
        reviewed
          .filter((c) => c.comparisonKey)
          .map((c) => `${c.ayah._id}|${c.comparisonKey}`),
      ),
    ];
    result.divergenceGroups = keys.flatMap((key) => {
      const claims = reviewed.filter(
        (c) => `${c.ayah._id}|${c.comparisonKey}` === key,
      );
      return claims.length > 1
        ? [
            {
              targetPhrase: claims[0].targetSegmentArabic || key!,
              divergenceType: claims.some(
                (c) => c.divergenceType === "contradictory",
              )
                ? ("contradictory" as const)
                : ("complementary" as const),
              claims,
            },
          ]
        : [];
    });
  }
  if (
    pick.intent === "interpretation" &&
    reviewed.some((c) => c.reviewStatus === "source_checked")
  )
    sections.push(
      ar
        ? "هذه خلاصات قورنت آليًا بالنصوص المرتبطة؛ وليست مراجعة من مختص، ولا تثبت الإجماع أو صحة الأسانيد."
        : "These summaries were checked against the linked texts by an automated reviewer, not a specialist. They do not establish consensus or authenticate narrations.",
    );
  if (pick.intent === "interpretation" && !reviewed.length)
    sections.unshift(
      ar
        ? "لا تتوفر لديّ مادة تفسيرية مراجَعة تكفي للإجابة عن هذا السؤال. أستطيع عرض النصوص ذات الصلة، لكن لن أنسب رأيًا إلى مفسّر من غير توثيق ومراجعة."
        : "I do not have reviewed commentary sufficient to answer this interpretation question. I can show related passages, but cannot attribute a position to a scholar without source verification.",
    );
  if (!sections.length)
    sections.push(
      ar
        ? "لم أجد دليلًا مطابقًا يكفي للإجابة. جرّب اسم السورة مع رقم الآية (مثل ٢:٢٥٥)، أو كلمات من النص. عدم العثور على نتيجة لا يعني عدم وجودها في القرآن."
        : "I could not find enough matching evidence. Try a chapter and verse (such as 2:255), or words from the passage. No match does not mean the Quran does not discuss the topic.",
    );
  result.text = sections.join("\n\n");
  result.found = citations.length > 0;
  result.status =
    pick.intent === "interpretation"
      ? reviewed.length && reviewed.every((c) => c.reviewStatus === "reviewed")
        ? "answered"
        : "limited"
      : citations.length
        ? pick.intent === "search"
          ? "limited"
          : "answered"
        : "not_found";
  return result;
}
