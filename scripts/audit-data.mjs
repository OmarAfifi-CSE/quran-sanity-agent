import fs from "node:fs/promises";
import crypto from "node:crypto";
try {
  process.loadEnvFile("web/.env.local");
} catch {
  /* optional */
}
const local = (await fs.readFile("quran_full_dataset.ndjson", "utf8"))
  .trim()
  .split(/\r?\n/)
  .map(JSON.parse);
const seed = JSON.parse(
  await fs.readFile("web/src/sanity/corpus.json", "utf8"),
);
function audit(docs) {
  const ids = new Set(docs.map((d) => d._id));
  const surahs = docs.filter((d) => d._type === "surah");
  const ayahs = docs.filter((d) => d._type === "ayah");
  const claims = docs.filter((d) => d._type === "interpretiveClaim");
  const hasUsableProvenance = (claim) =>
    ["reviewed", "source_checked"].includes(claim.reviewStatus) &&
    [
      "sourceUrl",
      "sourceLocator",
      "primaryExcerpt",
      "reviewedBy",
      "reviewedAt",
      "opinionEnglish",
      "opinionArabic",
    ].every((key) => typeof claim[key] === "string" && claim[key].trim()) &&
    /^https:\/\//.test(claim.sourceUrl) &&
    !Number.isNaN(Date.parse(claim.reviewedAt));
  const brokenReferences = docs.flatMap((d) =>
    ["ayah", "surah", "source"]
      .filter((k) => d[k]?._ref && !ids.has(d[k]._ref))
      .map((k) => ({ id: d._id, field: k, target: d[k]._ref })),
  );
  const sequenceIssues = surahs.flatMap((s) => {
    const verses = ayahs.filter((a) => a.surah?._ref === s._id);
    const numbers = new Set(verses.map((a) => a.ayahNumber));
    return verses.length !== s.totalAyahs ||
      numbers.size !== s.totalAyahs ||
      Array.from({ length: s.totalAyahs }, (_, i) => i + 1).some(
        (n) => !numbers.has(n),
      )
      ? [{ surah: s.number, expected: s.totalAyahs, actual: verses.length }]
      : [];
  });
  return {
    counts: Object.fromEntries(
      [...new Set(docs.map((d) => d._type))].map((t) => [
        t,
        docs.filter((d) => d._type === t).length,
      ]),
    ),
    duplicateIds: docs.length - ids.size,
    brokenReferences,
    sequenceIssues,
    emptyArabic: ayahs.filter((a) => !a.textUthmani?.trim()).map((a) => a._id),
    sourceCheckedClaims: claims.filter(
      (c) => c.reviewStatus === "source_checked" && hasUsableProvenance(c),
    ).length,
    specialistReviewedClaims: claims.filter(
      (c) => c.reviewStatus === "reviewed" && hasUsableProvenance(c),
    ).length,
    claimsWithoutProvenance: claims
      .filter((c) => !hasUsableProvenance(c))
      .map((c) => c._id),
  };
}
const report = {
  generatedAt: new Date().toISOString(),
  local: audit(local),
  localRuntime: audit([
    ...(seed.surahs || []),
    ...(seed.ayahs || []),
    ...(seed.tafsirSources || []),
    ...(seed.interpretiveClaims || []),
  ]),
  live: null,
};
const project = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
if (project) {
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
  const url = new URL(
    `https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`,
  );
  url.searchParams.set(
    "query",
    '*[!(_id in path("drafts.**")) && _type in ["surah", "ayah", "tafsirSource", "interpretiveClaim"]]',
  );
  url.searchParams.set("perspective", "published");
  const token = process.env.SANITY_API_READ_TOKEN;
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Sanity audit HTTP ${response.status}`);
  const { result } = await response.json();
  report.live = { ...audit(result), project, dataset };
  const localMap = new Map(local.map((d) => [d._id, d]));
  report.live.textDifferencesFromLocal = result
    .filter(
      (d) =>
        d._type === "ayah" &&
        localMap.get(d._id)?.textUthmani !== d.textUthmani,
    )
    .map((d) => d._id);
  report.live.textDigest = crypto
    .createHash("sha256")
    .update(
      result
        .filter((d) => d._type === "ayah")
        .sort((a, b) => a._id.localeCompare(b._id))
        .map((d) => `${d._id}:${d.textUthmani}`)
        .join("\n"),
    )
    .digest("hex");
  await fs.mkdir("docs/audit", { recursive: true });
  await fs.writeFile(
    "docs/audit/live-snapshot.json",
    JSON.stringify(result, null, 2),
  );
}
await fs.mkdir("docs/audit", { recursive: true });
await fs.writeFile(
  "docs/audit/data-audit.json",
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify(
    {
      generatedAt: report.generatedAt,
      local: report.local.counts,
      live: report.live?.counts,
      sourceChecked: report.live?.sourceCheckedClaims,
      claimsWithoutProvenance: report.live?.claimsWithoutProvenance.length,
    },
    null,
    2,
  ),
);
