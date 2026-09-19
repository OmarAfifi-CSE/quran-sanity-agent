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
 * Executes a structured query over the Sanity Content Lake, falling back seamlessly
 * to the verified local seed dataset when external credentials are not set.
 */
export async function getInterpretiveClaims(options?: {
  surahNumber?: number;
  keyword?: string;
}): Promise<InterpretiveClaim[]> {
  if (isLiveConfigured) {
    try {
      const claims = await sanityClient.fetch<InterpretiveClaim[]>(CLAIMS_QUERY, {
        surahNumber: options?.surahNumber ?? null,
      });
      if (claims && claims.length > 0) {
        return claims;
      }
    } catch (err) {
      console.warn('[Sanity Query Warning] Falling back to local verified dataset:', err);
    }
  }

  // Local Grounded Dataset Engine (Simulating Sanity GROQ with full dereferencing)
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

  let claims = seedData.interpretiveClaims.map((c) => ({
    ...c,
    ayah: ayahsMap.get(c.ayah._ref) as unknown as Ayah,
    source: sourcesMap.get(c.source._ref) as unknown as TafsirSource,
  })) as unknown as InterpretiveClaim[];

  if (options?.surahNumber) {
    claims = claims.filter((c) => c.ayah?.surah?.number === options.surahNumber);
  }

  if (options?.keyword) {
    const q = options.keyword.toLowerCase();
    claims = claims.filter(
      (c) =>
        c.targetSegmentEnglish.toLowerCase().includes(q) ||
        c.opinionEnglish.toLowerCase().includes(q) ||
        c.evidenceEnglish.toLowerCase().includes(q) ||
        c.targetSegmentArabic.includes(q) ||
        c.opinionArabic.includes(q)
    );
  }

  return claims;
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
