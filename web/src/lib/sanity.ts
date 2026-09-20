import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '../sanity/env';
import { InterpretiveClaim, Surah, Ayah, TafsirSource } from './types';
import seedData from '../sanity/seedData.json';

const isLiveConfigured =
  Boolean(projectId) &&
  projectId !== 'demo-project' &&
  Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);

export const sanityClient = createClient({
  projectId: isLiveConfigured ? projectId : 'demo-project',
  dataset,
  apiVersion,
  useCdn: false,
});

/**
 * Standard GROQ query to retrieve interpretive claims dereferencing Ayah and TafsirSource
 */
export const CLAIMS_QUERY = `
  *[_type == "interpretiveClaim" && ($surahNumber == null || ayah->surah->number == $surahNumber)] {
    _id,
    _type,
    targetSegmentArabic,
    targetSegmentEnglish,
    opinionEnglish,
    opinionArabic,
    divergenceType,
    evidenceEnglish,
    ayah->{
      _id,
      _type,
      ayahNumber,
      textUthmani,
      textEnglishTranslation,
      surah->{
        number,
        nameEnglish,
        nameArabic
      }
    },
    source->{
      _id,
      _type,
      bookTitleEnglish,
      bookTitleArabic,
      author,
      methodology,
      deathYearAH
    }
  }
`;

/**
 * Helper to normalize Arabic & English text for tolerant matching
 */
export function normalizeSearchString(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // remove Arabic tashkeel
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEARCH_STOPWORDS = new Set([
  'ما', 'هو', 'هي', 'هل', 'في', 'من', 'عن', 'على', 'الي', 'الى', 'مع', 'هذا', 'هذه', 'ذلك',
  'بين', 'حول', 'ماذا', 'كيف', 'اين', 'كل', 'بعض', 'ان', 'كان', 'كانت', 'يكون', 'تفسير',
  'سورة', 'سوره', 'اية', 'آية', 'ايات', 'آيات',
  'خلاف', 'الخلاف', 'راي', 'اراء', 'قول', 'اقوال', 'مذهب', 'مذاهب',
  // Colloquial & conversational particles
  'مين', 'ده', 'دي', 'ديه', 'ايه', 'إيه', 'ليه', 'ازاي', 'فين', 'كده', 'اللي', 'اللى',
  'عشان', 'علشان', 'عليا', 'عليك', 'بيقول', 'بيرد', 'تاني', 'حاجة', 'عايز', 'اعرف',
  'what', 'is', 'the', 'of', 'in', 'and', 'to', 'a', 'for', 'on', 'with', 'about', 'between',
  'does', 'do', 'are', 'by', 'as', 'it', 'this', 'that', 'from', 'show', 'tell', 'me', 'tafsir',
  'surah', 'ayah', 'verse', 'verses', 'chapter',
  'opinion', 'opinions', 'view', 'views', 'compare', 'difference', 'divergence',
  'who', 'why', 'how', 'when', 'where', 'answering', 'replying', 'hello', 'hi',
]);

/**
 * Filter a list of claims against a freeform search query using weighted relevance scoring
 */
export function filterClaimsByQuery(
  claims: InterpretiveClaim[],
  query?: string,
  surahNumber?: number
): InterpretiveClaim[] {
  let filtered = claims;

  if (surahNumber) {
    filtered = filtered.filter((c) => c.ayah?.surah?.number === surahNumber);
  }

  if (!query || !query.trim()) {
    return filtered;
  }

  const normQuery = normalizeSearchString(query);
  const rawTerms = normQuery.split(' ').filter((t) => t.length > 1);
  const significantTerms = rawTerms.filter((t) => !SEARCH_STOPWORDS.has(t));
  const termsToUse = significantTerms.length > 0 ? significantTerms : rawTerms;

  if (termsToUse.length === 0) return filtered;

  // Score each claim based on field significance
  const scored = filtered.map((c) => {
    let score = 0;
    const surahText = normalizeSearchString(
      `${c.ayah?.surah?.nameArabic || ''} ${c.ayah?.surah?.nameEnglish || ''}`
    );
    const targetText = normalizeSearchString(
      `${c.targetSegmentArabic || ''} ${c.targetSegmentEnglish || ''}`
    );
    const sourceText = normalizeSearchString(
      `${c.source?.author || ''} ${c.source?.bookTitleArabic || ''} ${c.source?.bookTitleEnglish || ''}`
    );
    const opinionText = normalizeSearchString(
      `${c.opinionArabic || ''} ${c.opinionEnglish || ''}`
    );

    const matchesTerm = (field: string, term: string) => {
      if (!field) return false;
      if (term.length <= 3) {
        // Whole word or token boundary match for short words to avoid matching "ده" inside "الدهر"
        return new RegExp(`(^|\\s)${term}(\\s|$)`).test(field);
      }
      return field.includes(term);
    };

    for (const term of termsToUse) {
      if (matchesTerm(surahText, term)) score += 10;
      if (matchesTerm(targetText, term)) score += 10;
      if (matchesTerm(sourceText, term)) score += 5;
      if (matchesTerm(opinionText, term)) score += 2;
    }

    return { claim: c, score };
  });

  const matched = scored.filter((item) => item.score > 0);
  if (matched.length === 0) return [];

  // Sort descending by score and keep claims that have at least 50% of top score
  matched.sort((a, b) => b.score - a.score);
  const maxScore = matched[0].score;
  const threshold = Math.max(2, maxScore * 0.5);

  return matched.filter((item) => item.score >= threshold).map((item) => item.claim);
}

/**
 * Executes a structured query over the Sanity Content Lake, falling back seamlessly
 * to the verified local seed dataset when external credentials are not set.
 */
export async function getInterpretiveClaims(options?: {
  surahNumber?: number;
  keyword?: string;
}): Promise<InterpretiveClaim[]> {
  let claims: InterpretiveClaim[] = [];

  if (isLiveConfigured) {
    try {
      const liveClaims = await sanityClient.fetch<InterpretiveClaim[]>(CLAIMS_QUERY, {
        surahNumber: options?.surahNumber ?? null,
      });
      if (liveClaims && liveClaims.length > 0) {
        claims = liveClaims;
      }
    } catch (err) {
      console.warn('[Sanity Query Warning] Falling back to local verified dataset:', err);
    }
  }

  // Fallback to local verified dataset if live fetch returned empty or unconfigured
  if (claims.length === 0) {
    const surahsMap = new Map(seedData.surahs.map((s) => [s._id, s]));
    const ayahsMap = new Map(
      seedData.ayahs.map((a) => [
        a._id,
        {
          ...a,
          surah: surahsMap.get(a.surah._ref),
        },
      ])
    );
    const sourcesMap = new Map(seedData.tafsirSources.map((s) => [s._id, s]));

    claims = seedData.interpretiveClaims.map((c) => ({
      ...c,
      ayah: ayahsMap.get(c.ayah._ref) as unknown as Ayah,
      source: sourcesMap.get(c.source._ref) as unknown as TafsirSource,
    })) as unknown as InterpretiveClaim[];
  }

  // Apply intelligent normalization and filtering
  return filterClaimsByQuery(claims, options?.keyword, options?.surahNumber);
}

/**
 * Fetch all available Surahs from Sanity
 */
export async function getAllSurahs(): Promise<Surah[]> {
  if (isLiveConfigured) {
    try {
      const surahs = await sanityClient.fetch<Surah[]>(
        `*[_type == "surah"] | order(number asc)`
      );
      if (surahs && surahs.length > 0) return surahs;
    } catch (err) {
      console.warn('[Sanity Surah Fetch] Falling back to seed:', err);
    }
  }
  return seedData.surahs as unknown as Surah[];
}

/**
 * Search Surahs intelligently by number, name, ordinal, or metadata
 */
export async function searchSurahs(query?: string): Promise<Surah[]> {
  const allSurahs = await getAllSurahs();
  if (!query || !query.trim()) return allSurahs.slice(0, 5);

  const normQuery = normalizeSearchString(query);
  const matched: Surah[] = [];

  // Match ordinals
  if (/أول|اول|اولى|أولى|first|بداية/i.test(query)) {
    const s1 = allSurahs.find((s) => s.number === 1);
    if (s1 && !matched.some((m) => m.number === 1)) matched.push(s1);
  }
  if (/آخر|اخر|أخيرة|اخيره|last|نهاية/i.test(query)) {
    const s114 = allSurahs.find((s) => s.number === 114);
    if (s114 && !matched.some((m) => m.number === 114)) matched.push(s114);
  }
  if (/أطول|اطول|longest/i.test(query)) {
    const s2 = allSurahs.find((s) => s.number === 2);
    if (s2 && !matched.some((m) => m.number === 2)) matched.push(s2);
  }
  if (/أقصر|اقصر|shortest/i.test(query)) {
    const s108 = allSurahs.find((s) => s.number === 108);
    if (s108 && !matched.some((m) => m.number === 108)) matched.push(s108);
  }

  // Match specific number like "سورة 18" or "سورة رقم 2" or "surah 112"
  const numMatch = query.match(/(?:سورة|سوره|رقم|surah|chapter)?\s*(\d{1,3})/i);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 114) {
      const s = allSurahs.find((item) => item.number === num);
      if (s && !matched.some((m) => m.number === s.number)) matched.push(s);
    }
  }

  // Match by name
  for (const s of allSurahs) {
    const normNameAr = normalizeSearchString(s.nameArabic);
    const normNameEn = s.nameEnglish.toLowerCase();
    if (
      (normNameAr.length > 2 && normQuery.includes(normNameAr)) ||
      normQuery.includes(normNameEn)
    ) {
      if (!matched.some((m) => m.number === s.number)) {
        matched.push(s);
      }
    }
  }

  return matched;
}

/**
 * Search Ayahs in Sanity Cloud by text keyword or reference
 */
export async function searchAyahs(query?: string, surahNumber?: number): Promise<Ayah[]> {
  if (!query || !query.trim()) return [];
  const normQuery = normalizeSearchString(query);

  if (isLiveConfigured) {
    try {
      const liveAyahs = await sanityClient.fetch<Ayah[]>(
        `*[_type == "ayah" && ($surahNumber == null || surah->number == $surahNumber) && (textUthmani match $keyword || textEnglishTranslation match $keyword)][0...5] {
          _id,
          _type,
          ayahNumber,
          textUthmani,
          textEnglishTranslation,
          surah->{
            number,
            nameArabic,
            nameEnglish
          }
        }`,
        {
          surahNumber: surahNumber ?? null,
          keyword: `*${normQuery}*`,
        }
      );
      if (liveAyahs && liveAyahs.length > 0) return liveAyahs;
    } catch (err) {
      console.warn('[Sanity Ayah Search Error]:', err);
    }
  }

  // Fallback to local seed ayahs
  const surahsMap = new Map(seedData.surahs.map((s) => [s._id, s]));
  const matchedSeed = seedData.ayahs
    .filter((a) => {
      const matchSurah = !surahNumber || surahsMap.get(a.surah._ref)?.number === surahNumber;
      const text = `${a.textUthmani} ${a.textEnglishTranslation}`.toLowerCase();
      return matchSurah && text.includes(normQuery);
    })
    .map((a) => ({
      ...a,
      surah: surahsMap.get(a.surah._ref),
    })) as unknown as Ayah[];

  return matchedSeed;
}

