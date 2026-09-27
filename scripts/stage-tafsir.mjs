// Read-only acquisition: never publishes or marks imported prose as reviewed.
import fs from "node:fs/promises";
import crypto from "node:crypto";
const hash = (text) => crypto.createHash("sha256").update(text).digest("hex");
const root = "data/staging/tafsir";
await fs.mkdir(root, { recursive: true });
const corpus = JSON.parse(
  await fs.readFile("web/src/sanity/corpus.json", "utf8"),
);
const response = await fetch(
  "https://api.github.com/repos/spa5k/tafsir_api/commits/main",
);
if (!response.ok)
  throw new Error(`Cannot pin upstream revision: ${response.status}`);
const { sha } = await response.json();
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Invalid upstream revision");
const base = `https://raw.githubusercontent.com/spa5k/tafsir_api/${sha}`;
const licenseResponse = await fetch(`${base}/LICENSE`);
if (!licenseResponse.ok) throw new Error("Missing upstream license");
await fs.writeFile(
  `${root}/UPSTREAM_LICENSE.txt`,
  await licenseResponse.text(),
);
const editions = ["ar-tafsir-ibn-kathir"];
const reports = [];
for (const edition of editions) {
  const groups = new Map();
  const missing = [],
    errors = [],
    seen = new Set();
  let next = 1;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next <= 114) {
        const chapter = next++;
        const url = `${base}/tafsir/${edition}/${chapter}.json`;
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const rows = await r.json();
          if (!Array.isArray(rows)) throw new Error("Expected verse array");
          const count = corpus.surahs.find(
            (s) => s.number === chapter,
          ).totalAyahs;
          for (const row of rows) {
            if (
              row.surah !== chapter ||
              !Number.isInteger(row.ayah) ||
              row.ayah < 1 ||
              row.ayah > count ||
              typeof row.text !== "string"
            )
              throw new Error("Invalid verse mapping");
            const ref = `${chapter}:${row.ayah}`;
            if (seen.has(ref)) throw new Error(`Duplicate reference ${ref}`);
            seen.add(ref);
            if (!row.text.trim()) {
              missing.push(ref);
              continue;
            }
            const digest = hash(row.text);
            const group = groups.get(digest) || {
              _id: `tafsir-${edition}-${digest.slice(0, 32)}`,
              _type: "tafsirPassage",
              edition,
              textArabic: row.text,
              contentSha256: digest,
              ayahReferences: [],
              sourceUrls: [],
              upstreamCommit: sha,
              reviewStatus: "unreviewed",
              rightsStatus: "edition_verification_pending",
            };
            group.ayahReferences.push({
              _type: "reference",
              _ref: `ayah-${chapter}-${row.ayah}`,
            });
            if (!group.sourceUrls.includes(url)) group.sourceUrls.push(url);
            groups.set(digest, group);
          }
        } catch (e) {
          errors.push({ chapter, error: e.message });
        }
      }
    }),
  );
  for (const s of corpus.surahs)
    for (let a = 1; a <= s.totalAyahs; a++)
      if (!seen.has(`${s.number}:${a}`)) missing.push(`${s.number}:${a}`);
  const docs = [...groups.values()].sort((a, b) => a._id.localeCompare(b._id));
  for (const d of docs) {
    d.ayahReferences.sort((a, b) => a._ref.localeCompare(b._ref));
    d.sourceUrls.sort();
  }
  await fs.writeFile(
    `${root}/${edition}.ndjson`,
    docs.map((d) => JSON.stringify(d)).join("\n") + "\n",
  );
  reports.push({
    edition,
    mappedReferences: seen.size,
    nonemptyReferences: docs.reduce((n, d) => n + d.ayahReferences.length, 0),
    uniquePassages: docs.length,
    missing,
    errors,
    publishable: false,
  });
}
const report = {
  generatedAt: new Date().toISOString(),
  upstream: "https://github.com/spa5k/tafsir_api",
  commit: sha,
  status: "staged_only_not_served",
  reason:
    "Repository MIT license is preserved; underlying edition provenance and redistribution rights still require verification. Imports are not scholarly reviewed.",
  editions: reports,
};
await fs.writeFile(
  "docs/audit/tafsir-staging.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
if (reports.some((r) => r.errors.length || r.missing.length))
  process.exitCode = 1;
