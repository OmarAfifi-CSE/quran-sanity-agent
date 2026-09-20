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
  'what', 'is', 'the', 'of', 'in', 'and', 'to', 'a', 'for', 'on', 'with', 'about', 'between',
  'does', 'do', 'are', 'by', 'as', 'it', 'this', 'that', 'from', 'show', 'tell', 'me', 'tafsir',
  'surah', 'ayah', 'verse', 'verses', 'chapter',
  'opinion', 'opinions', 'view', 'views', 'compare', 'difference', 'divergence',
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

    for (const term of termsToUse) {
      if (surahText.includes(term)) score += 10;
      if (targetText.includes(term)) score += 10;
      if (sourceText.includes(term)) score += 5;
      if (opinionText.includes(term)) score += 2;
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
