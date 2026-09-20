import { getInterpretiveClaims, searchSurahs, searchAyahs } from './sanity';
import { InterpretiveClaim, DivergenceGroup, GroundingSourceCitation } from './types';

export interface SanityMcpQueryResult {
  found: boolean;
  totalClaims: number;
  totalSurahs: number;
  totalAyahs: number;
  divergenceGroups: DivergenceGroup[];
  citations: GroundingSourceCitation[];
  formattedContext: string;
}

/**
 * MCP Tool Bridge: query_sanity_context
 * Queries structured knowledge lake in Sanity and returns dereferenced claims,
 * Surahs, and Ayahs, grouping contradictory and complementary scholarly opinions.
 */
export async function querySanityContext(params: {
  query: string;
  surahNumber?: number;
}): Promise<SanityMcpQueryResult> {
  const [claims, matchedSurahs, matchedAyahs] = await Promise.all([
    getInterpretiveClaims({
      surahNumber: params.surahNumber,
      keyword: params.query,
    }),
    searchSurahs(params.query),
    searchAyahs(params.query, params.surahNumber),
  ]);

  const hasContent = claims.length > 0 || matchedSurahs.length > 0 || matchedAyahs.length > 0;

  // Group claims by target phrase to surface consensus vs divergence
  const groupsMap = new Map<string, InterpretiveClaim[]>();
  for (const claim of claims) {
    const key = `${claim.ayah?.surah?.nameEnglish || 'Surah'} [${claim.ayah?.ayahNumber || '?'}] - ${claim.targetSegmentEnglish || claim.targetSegmentArabic}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(claim);
  }

  const divergenceGroups: DivergenceGroup[] = [];
  for (const [targetPhrase, groupClaims] of groupsMap.entries()) {
    let overallType = groupClaims[0].divergenceType;
    if (groupClaims.some((c) => c.divergenceType === 'contradictory')) {
      overallType = 'contradictory';
    } else if (groupClaims.some((c) => c.divergenceType === 'complementary')) {
      overallType = 'complementary';
    }

    divergenceGroups.push({
      targetPhrase,
      divergenceType: overallType,
      claims: groupClaims,
    });
  }

  // Build grounding citations across Claims, Surahs, and Ayahs
  const citations: GroundingSourceCitation[] = [];

  // 1. Claims citations
  for (const c of claims) {
    citations.push({
      documentId: c._id,
      documentType: c._type,
      title: `${c.source?.author} on ${c.targetSegmentEnglish || c.targetSegmentArabic}`,
      scholar: c.source?.author,
      divergenceType: c.divergenceType,
      rawJsonSnippet: {
        _id: c._id,
        _type: c._type,
        divergenceType: c.divergenceType,
        targetSegmentArabic: c.targetSegmentArabic,
        targetSegmentEnglish: c.targetSegmentEnglish,
        opinionEnglish: c.opinionEnglish,
        opinionArabic: c.opinionArabic,
        evidenceEnglish: c.evidenceEnglish,
        scholar: c.source?.author,
        book: c.source?.bookTitleEnglish,
        methodology: c.source?.methodology,
      },
    });
  }

  // 2. Surahs citations
  for (const s of matchedSurahs) {
    citations.push({
      documentId: s._id || `surah-${s.number}`,
      documentType: 'surah',
      title: `Surah ${s.nameArabic} (${s.nameEnglish}) - #${s.number}`,
      scholar: 'Sanity Canonical Codex',
      divergenceType: 'consensus',
      rawJsonSnippet: s as unknown as Record<string, unknown>,
    });
  }

  // 3. Ayahs citations
  for (const a of matchedAyahs) {
    citations.push({
      documentId: a._id,
      documentType: 'ayah',
      title: `Ayah ${a.surah?.nameArabic || 'Surah'} [${a.ayahNumber}]`,
      scholar: 'Uthmani Text',
      divergenceType: 'consensus',
      rawJsonSnippet: a as unknown as Record<string, unknown>,
    });
  }

  // Build rich formatted text context for the LLM
  let formattedContext = `### Grounded Sanity Knowledge Base Records:\n\n`;

  if (matchedSurahs.length > 0) {
    formattedContext += `#### Indexed Surahs in Sanity Cloud (${matchedSurahs.length} matched):\n`;
    for (const s of matchedSurahs) {
      formattedContext += `- [Doc ID: ${s._id || `surah-${s.number}`}] Surah #${s.number}: ${s.nameArabic} (${s.nameEnglish}) | Revelation: ${s.revelationType.toUpperCase()} | Total Ayahs: ${s.totalAyahs}\n`;
    }
    formattedContext += '\n';
  }

  if (matchedAyahs.length > 0) {
    formattedContext += `#### Indexed Ayahs in Sanity Cloud (${matchedAyahs.length} matched):\n`;
    for (const a of matchedAyahs) {
      formattedContext += `- [Doc ID: ${a._id}] Ayah ${a.surah?.nameArabic || 'Surah'} [${a.ayahNumber}]: "${a.textUthmani}" - "${a.textEnglishTranslation}"\n`;
    }
    formattedContext += '\n';
  }

  if (claims.length > 0) {
    formattedContext += `#### Classical Interpretive Claims (${claims.length} claims):\n`;
    for (const group of divergenceGroups) {
      formattedContext += `##### Focus: ${group.targetPhrase} (Status: ${group.divergenceType.toUpperCase()})\n`;
      for (const claim of group.claims) {
        formattedContext += `- [Doc ID: ${claim._id}] Scholar: ${claim.source?.author} (${claim.source?.bookTitleEnglish || claim.source?.bookTitleArabic}, ${claim.source?.methodology})\n`;
        formattedContext += `  Opinion: ${claim.opinionArabic || claim.opinionEnglish}\n`;
        formattedContext += `  Evidence: ${claim.evidenceEnglish}\n\n`;
      }
    }
  }

  if (!hasContent) {
    formattedContext += 'Sanity Knowledge Lake contains 114 Surahs and 6,236 Ayahs. No specific record matched the query keywords directly.';
  }

  return {
    found: hasContent,
    totalClaims: claims.length,
    totalSurahs: matchedSurahs.length,
    totalAyahs: matchedAyahs.length,
    divergenceGroups,
    citations,
    formattedContext,
  };
}
