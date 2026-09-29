export interface Surah {
  _id: string;
  _type: "surah";
  number: number;
  nameArabic: string;
  nameEnglish: string;
  revelationType: "makki" | "madani";
  totalAyahs: number;
}

export interface Ayah {
  _id: string;
  _type: "ayah";
  surah: {
    _ref?: string;
    number?: number;
    nameEnglish?: string;
    nameArabic?: string;
  };
  ayahNumber: number;
  textUthmani: string;
  textEnglishTranslation: string;
  keywords?: string[];
}

export interface TafsirSource {
  _id: string;
  _type: "tafsirSource";
  bookTitleEnglish: string;
  bookTitleArabic: string;
  author: string;
  methodology: "athari" | "juridical" | "linguistic" | "rational";
  deathYearAH: number;
}

export type DivergenceType = "consensus" | "complementary" | "contradictory";

export interface InterpretiveClaim {
  _id: string;
  _type: "interpretiveClaim";
  ayah: Ayah;
  source: TafsirSource;
  targetSegmentArabic: string;
  targetSegmentEnglish: string;
  opinionEnglish: string;
  opinionArabic: string;
  divergenceType: DivergenceType;
  evidenceEnglish: string;
  reviewStatus?:
    "unreviewed" | "in_review" | "source_checked" | "reviewed" | "rejected";
  sourceUrl?: string;
  sourceLocator?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comparisonKey?: string;
  primaryExcerpt?: string;
}

export interface GroundingSourceCitation {
  documentId: string;
  documentType: string;
  title: string;
  scholar?: string;
  divergenceType?: DivergenceType;
  rawJsonSnippet: Record<string, unknown>;
  origin?: "sanity" | "local";
  sourceUrl?: string;
}

export interface ResearchAnswer {
  text: string;
  status: "answered" | "limited" | "not_found" | "clarify";
  citations: GroundingSourceCitation[];
  divergenceGroups: DivergenceGroup[];
  origin: "sanity" | "local";
  retrieval: string;
  pendingReview: number;
  found: boolean;
  totalClaims: number;
  elapsedMs?: number;
  contextStatus?: "not_configured" | "connected" | "unavailable" | "empty";
  contextTools?: string[];
  libraryStatus?: "connected" | "unavailable";
  libraryPlanner?: "keyword" | "ai_query_expansion";
  researchNotes?: import('./research-notes').ResearchNotes;
  notesStatus?: "available" | "unavailable" | "not_needed";
  contextStrategy?: "exact_anchor" | "semantic";
  contextFailure?: "timeout" | "invalid_selection" | "dependency";
}

export interface DivergenceGroup {
  targetPhrase: string;
  divergenceType: DivergenceType;
  claims: InterpretiveClaim[];
}
