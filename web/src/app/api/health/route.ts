import { getCorpus, isReviewed } from "@/lib/corpus";
import { libraryCoverage } from "@/lib/library";
export async function GET() {
  try {
    const corpus = await getCorpus();
    const library = await libraryCoverage().catch(() => null);
    return Response.json(
      {
        status: library ? "ok" : "degraded",
        library,
        origin: corpus.origin,
        surahs: corpus.surahs.length,
        ayahs: corpus.ayahs.length,
        claims: corpus.claims.length,
        usableClaims: corpus.claims.filter(isReviewed).length,
        sourceCheckedClaims: corpus.claims.filter(
          (claim) =>
            claim.reviewStatus === "source_checked" && isReviewed(claim),
        ).length,
        specialistReviewedClaims: corpus.claims.filter(
          (claim) => claim.reviewStatus === "reviewed" && isReviewed(claim),
        ).length,
        fetchedAt: corpus.fetchedAt,
        contextConfigured: Boolean(
          process.env.SANITY_CONTEXT_MCP_URL &&
          process.env.SANITY_ORGANIZATION_TOKEN &&
          (process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
            process.env.GEMINI_API_KEY),
        ),
        projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || null,
      },
      { status:library?200:503,headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
