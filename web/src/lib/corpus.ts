import { createClient } from "next-sanity";
import localData from "../sanity/corpus.json";
import type { Ayah, InterpretiveClaim, Surah, TafsirSource } from "./types";

type Ref = { _ref: string };
export interface RawCorpus {
  surahs: Surah[];
  ayahs: (Omit<Ayah, "surah"> & { surah: Ref })[];
  tafsirSources: TafsirSource[];
  interpretiveClaims: (Omit<InterpretiveClaim, "ayah" | "source"> & {
    ayah: Ref;
    source: Ref;
  })[];
}
export interface Corpus {
  surahs: Surah[];
  ayahs: Ayah[];
  claims: InterpretiveClaim[];
  origin: "sanity" | "local";
  fetchedAt: string;
}

export function assertRawCorpusIntegrity(raw: RawCorpus): void {
  if (
    !raw ||
    !Array.isArray(raw.surahs) ||
    !Array.isArray(raw.ayahs) ||
    !Array.isArray(raw.tafsirSources) ||
    !Array.isArray(raw.interpretiveClaims)
  )
    throw new Error("Configured Quran corpus has an invalid shape");

  const allDocuments = [
    ...raw.surahs,
    ...raw.ayahs,
    ...raw.tafsirSources,
    ...raw.interpretiveClaims,
  ];
  if (
    new Set(allDocuments.map((document) => document._id)).size !==
    allDocuments.length
  )
    throw new Error("Configured Quran corpus contains duplicate document IDs");

  const surahsById = new Map(raw.surahs.map((surah) => [surah._id, surah]));
  const surahsByNumber = new Map(
    raw.surahs.map((surah) => [surah.number, surah]),
  );
  if (
    raw.surahs.length !== 114 ||
    surahsByNumber.size !== 114 ||
    [...Array(114)].some((_, index) => !surahsByNumber.has(index + 1))
  )
    throw new Error("Configured Quran corpus must contain all 114 chapters");

  const ayahIds = new Set(raw.ayahs.map((ayah) => ayah._id));
  if (raw.ayahs.length !== 6236 || ayahIds.size !== 6236)
    throw new Error("Configured Quran corpus must contain all 6,236 verses");

  const ayahsBySurah = new Map<string, number[]>();
  for (const ayah of raw.ayahs) {
    const surahRef = ayah.surah?._ref;
    const surah = surahRef ? surahsById.get(surahRef) : undefined;
    if (!surah)
      throw new Error(`Verse ${ayah._id} has no valid chapter reference`);
    const numbers = ayahsBySurah.get(surah._id) || [];
    numbers.push(ayah.ayahNumber);
    ayahsBySurah.set(surah._id, numbers);
  }
  for (const surah of raw.surahs) {
    const numbers = ayahsBySurah.get(surah._id) || [];
    if (
      numbers.length !== surah.totalAyahs ||
      new Set(numbers).size !== surah.totalAyahs ||
      [...Array(surah.totalAyahs)].some(
        (_, index) => !numbers.includes(index + 1),
      )
    )
      throw new Error(`Chapter ${surah.number} has an invalid verse sequence`);
  }

  const sourceIds = new Set(raw.tafsirSources.map((source) => source._id));
  for (const claim of raw.interpretiveClaims) {
    if (!ayahIds.has(claim.ayah?._ref) || !sourceIds.has(claim.source?._ref))
      throw new Error(`Interpretive claim ${claim._id} has a broken reference`);
  }
}

export function hydrateCorpus(
  raw: RawCorpus,
  origin: Corpus["origin"],
): Corpus {
  assertRawCorpusIntegrity(raw);
  const surahs = new Map(raw.surahs.map((s) => [s._id, s]));
  const sources = new Map(raw.tafsirSources.map((s) => [s._id, s]));
  const ayahs = raw.ayahs.map((a) => ({
    ...a,
    surah: surahs.get(a.surah._ref) || a.surah,
  }));
  const ayahMap = new Map(ayahs.map((a) => [a._id, a]));
  const claims = raw.interpretiveClaims.flatMap((c) => {
    const ayah = ayahMap.get(c.ayah._ref);
    const source = sources.get(c.source._ref);
    return ayah && source ? [{ ...c, ayah, source }] : [];
  });
  return {
    surahs: raw.surahs,
    ayahs,
    claims,
    origin,
    fetchedAt: new Date().toISOString(),
  };
}
export const localCorpus = () => hydrateCorpus(localData as RawCorpus, "local");
let cached: { value: Corpus; until: number } | undefined;
let pending: Promise<Corpus> | undefined;

export async function getCorpus(): Promise<Corpus> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId || process.env.QURAN_DATA_MODE === "local")
    return localCorpus();
  if (cached && cached.until > Date.now()) return cached.value;
  if (pending) return pending;
  pending = (async () => {
    const client = createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2025-01-01",
      useCdn: false,
      perspective: "published",
      token: process.env.SANITY_API_READ_TOKEN,
      timeout: 15000,
      maxRetries: 1,
    });
    const raw = await client.fetch<RawCorpus>(`{
      "surahs": *[_type == "surah"] | order(number asc),
      "ayahs": *[_type == "ayah"] | order(surah->number asc, ayahNumber asc),
      "tafsirSources": *[_type == "tafsirSource"],
      "interpretiveClaims": *[_type == "interpretiveClaim"]
    }`);
    if (!raw.surahs.length || !raw.ayahs.length)
      throw new Error("Configured dataset has no Quran corpus");
    const value = hydrateCorpus(raw, "sanity");
    cached = { value, until: Date.now() + 60000 };
    return value;
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}

export function isReviewed(claim: InterpretiveClaim): boolean {
  return (
    ["reviewed", "source_checked"].includes(claim.reviewStatus || "") &&
    Boolean(
      claim.primaryExcerpt?.trim() &&
      claim.opinionArabic?.trim() &&
      claim.opinionEnglish?.trim() &&
      claim.reviewedBy?.trim() &&
      claim.reviewedAt &&
      !Number.isNaN(Date.parse(claim.reviewedAt)) &&
      claim.sourceLocator?.trim() &&
      /^https:\/\//.test(claim.sourceUrl || ""),
    )
  );
}
