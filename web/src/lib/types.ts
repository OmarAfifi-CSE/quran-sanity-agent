export interface Surah {
  _id: string;
  _type: 'surah';
  number: number;
  nameArabic: string;
  nameEnglish: string;
  revelationType: 'makki' | 'madani';
  totalAyahs: number;
}

export interface Ayah {
  _id: string;
  _type: 'ayah';
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
  _type: 'tafsirSource';
  bookTitleEnglish: string;
  bookTitleArabic: string;
  author: string;
  methodology: 'athari' | 'juridical' | 'linguistic' | 'rational';
  deathYearAH: number;
}

export type DivergenceType = 'consensus' | 'complementary' | 'contradictory';

export interface InterpretiveClaim {
  _id: string;
  _type: 'interpretiveClaim';
  ayah: Ayah;
  source: TafsirSource;
  targetSegmentArabic: string;
  targetSegmentEnglish: string;
  opinionEnglish: string;
  opinionArabic: string;
  divergenceType: DivergenceType;
  evidenceEnglish: string;
}

export interface GroundingSourceCitation {
  documentId: string;
  documentType: string;
  title: string;
  scholar?: string;
  divergenceType?: DivergenceType;
  rawJsonSnippet: Record<string, unknown>;
}

export interface DivergenceGroup {
  targetPhrase: string;
  divergenceType: DivergenceType;
  claims: InterpretiveClaim[];
}
