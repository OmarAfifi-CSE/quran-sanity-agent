import fs from "node:fs/promises";
import path from "node:path";
const root = "data/staging/quran-api";
await fs.mkdir(root, { recursive: true });
async function json(url, file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) {
        if (r.status === 404) return { error: "not_found", http: 404 };
        throw new Error(`HTTP ${r.status}`);
      }
      const body = await r.json();
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(body));
      return body;
    } catch (e) {
      if (attempt === 3) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}
const base = "https://api.quran.com/api/v4";
const catalog = await json(
  `${base}/resources/tafsirs`,
  `${root}/tafsir-catalog.json`,
);
if (!Array.isArray(catalog.tafsirs)) throw new Error("Invalid catalog");
const translations = await json(
  `${base}/resources/translations`,
  `${root}/translation-catalog.json`,
);
const corpus = JSON.parse(
  await fs.readFile("web/src/sanity/corpus.json", "utf8"),
);
const valid = new Set(
  corpus.ayahs.map((a) => a._id.replace(/^ayah-/, "").replace("-", ":")),
);
const reports = [];
for (const resource of catalog.tafsirs) {
  const report = {
    id: resource.id,
    name: resource.name,
    language: resource.language_name,
    pages: 0,
    chapters: 0,
    nonempty: 0,
    empty: 0,
    duplicateKeys: [],
    invalidKeys: [],
    errors: [],
    missing: [],
  };
  const seen = new Set();
  let cursor = 1;
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (cursor <= 114) {
        const chapter = cursor++;
        try {
          let page = 1;
          const pages = new Set();
          while (page) {
            if (pages.has(page)) throw new Error("Pagination loop");
            pages.add(page);
            const body = await json(
              `${base}/tafsirs/${resource.id}/by_chapter/${chapter}?per_page=50&page=${page}`,
              `${root}/tafsir-${resource.id}/${chapter}.${page}.json`,
            );
            if (!Array.isArray(body.tafsirs))
              throw new Error(
                `Invalid response: ${body.error || "missing tafsirs"}`,
              );
            for (const row of body.tafsirs) {
              if (
                row.resource_id !== resource.id ||
                !valid.has(row.verse_key) ||
                Number(row.verse_key.split(":")[0]) !== chapter
              ) {
                report.invalidKeys.push(row.verse_key);
                continue;
              }
              if (seen.has(row.verse_key)) {
                report.duplicateKeys.push(row.verse_key);
                continue;
              }
              if (typeof row.text !== "string" || !row.text.trim()) {
                report.empty++;
                continue;
              }
              seen.add(row.verse_key);
              report.nonempty++;
            }
            report.pages++;
            page = body.pagination?.next_page || null;
          }
          report.chapters++;
        } catch (e) {
          report.errors.push({ chapter, message: e.message });
        }
      }
    }),
  );
  report.missing = [...valid].filter((k) => !seen.has(k));
  reports.push(report);
  const checkpoint = {
    at: new Date().toISOString(),
    catalogResources: catalog.tafsirs.length,
    completedResources: reports.length,
    resources: reports,
    source: base,
    translationResources: translations.translations?.length,
    status: "downloaded_source_snapshots_not_yet_published",
  };
  await fs.writeFile(
    "docs/audit/quran-api-download.json",
    JSON.stringify(checkpoint, null, 2),
  );
  console.log(JSON.stringify({ ...report, missing: report.missing.length }));
}
const unavailable = [];
for (const id of [812, 171]) {
  const body = await json(
    `${base}/tafsirs/${id}/by_chapter/1?per_page=50`,
    `${root}/legacy-${id}.json`,
  );
  unavailable.push({
    id,
    available: Array.isArray(body.tafsirs),
    http: body.http || 200,
  });
}
await fs.writeFile(
  "docs/audit/tabattal-legacy-resources.json",
  JSON.stringify(unavailable, null, 2),
);
if (
  reports.some(
    (r) => r.errors.length || r.invalidKeys.length || r.duplicateKeys.length,
  )
)
  process.exitCode = 1;
