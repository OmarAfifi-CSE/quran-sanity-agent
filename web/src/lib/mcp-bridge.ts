import { getInterpretiveClaims, getAllSurahs } from './sanity';
import { InterpretiveClaim, DivergenceGroup, GroundingSourceCitation } from './types';

export interface SanityMcpQueryResult {
  found: boolean;
  totalClaims: number;
  divergenceGroups: DivergenceGroup[];
  citations: GroundingSourceCitation[];
  formattedContext: string;
}

/**
 * MCP Tool Bridge: query_sanity_context
 * Queries structured knowledge lake in Sanity and returns dereferenced claims,
 * grouping contradictory and complementary scholarly opinions.
 */
export async function querySanityContext(params: {
  query: string;
  surahNumber?: number;
}): Promise<SanityMcpQueryResult> {
  const claims = await getInterpretiveClaims({
    surahNumber: params.surahNumber,
    keyword: params.query,
  });

  if (!claims || claims.length === 0) {
    return {
      found: false,
      totalClaims: 0,
      divergenceGroups: [],
      citations: [],
      formattedContext: 'No matching verified documents found in Sanity Knowledge Base.',
    };
  }

  // Group by target phrase to surface consensus vs divergence
  const groupsMap = new Map<string, InterpretiveClaim[]>();
  for (const claim of claims) {
    const key = `${claim.ayah?.surah?.nameEnglish || 'Surah'} [${claim.ayah?.ayahNumber || '?'}] - ${claim.targetSegmentEnglish}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(claim);
  }

  const divergenceGroups: DivergenceGroup[] = [];
  for (const [targetPhrase, groupClaims] of groupsMap.entries()) {
    // Determine overall divergence type of the group
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

  // Build grounding citations with document IDs
  const citations: GroundingSourceCitation[] = claims.map((c) => ({
    documentId: c._id,
    documentType: c._type,
    title: `${c.source?.author} on ${c.targetSegmentEnglish}`,
    scholar: c.source?.author,
    divergenceType: c.divergenceType,
    rawJsonSnippet: {
      _id: c._id,
      _type: c._type,
      divergenceType: c.divergenceType,
      targetSegmentArabic: c.targetSegmentArabic,
      targetSegmentEnglish: c.targetSegmentEnglish,
      opinionEnglish: c.opinionEnglish,
      evidenceEnglish: c.evidenceEnglish,
      scholar: c.source?.author,
      book: c.source?.bookTitleEnglish,
      methodology: c.source?.methodology,
    },
  }));

  // Build formatted text context for the LLM
  let formattedContext = `### Grounded Sanity Knowledge Base Records (${claims.length} claims):\n\n`;
  for (const group of divergenceGroups) {
    formattedContext += `#### Focus: ${group.targetPhrase}\n`;
    formattedContext += `Status: ${group.divergenceType.toUpperCase()}\n`;
    for (const claim of group.claims) {
      formattedContext += `- [Doc ID: ${claim._id}] Scholar: ${claim.source?.author} (${claim.source?.bookTitleEnglish}, ${claim.source?.methodology})\n`;
      formattedContext += `  Opinion: ${claim.opinionEnglish}\n`;
      formattedContext += `  Evidence: ${claim.evidenceEnglish}\n`;
      formattedContext += `  Classical Arabic: "${claim.opinionArabic}"\n\n`;
    }
  }

  return {
    found: true,
    totalClaims: claims.length,
    divergenceGroups,
    citations,
    formattedContext,
  };
}
