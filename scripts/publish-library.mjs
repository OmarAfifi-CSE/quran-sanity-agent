import fs from "node:fs/promises";
process.loadEnvFile("web/.env.local");
const docs = JSON.parse(await fs.readFile("web/data/library.json", "utf8"));
if (
  docs.some(
    (d) => d._type !== "libraryChunk" || !d._id.startsWith("library-tabattal-"),
  )
)
  throw new Error("Unexpected import document");
const project = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
if (!process.argv.includes("--apply")) {
  console.log({
    mode: "dry-run",
    project,
    dataset,
    documents: docs.length,
    entries: docs.reduce((n, d) => n + d.entries.length, 0),
    operation: "createIfNotExists",
  });
  process.exit(0);
}
if (!project || !token) throw new Error("Missing project/write credential");
const transactions = [];
for (let i = 0; i < docs.length; i += 10) {
  const response = await fetch(
    `https://${project}.api.sanity.io/v2025-01-01/data/mutate/${dataset}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mutations: docs.slice(i, i + 10).map((d) => ({ createIfNotExists: d })),
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      `Import stopped at ${i}: HTTP ${response.status}; rerun is idempotent`,
    );
  const result = await response.json();
  transactions.push(result.transactionId);
  console.log(`Imported ${Math.min(i + 10, docs.length)}/${docs.length}`);
}
const query =
  '*[_type == "libraryChunk"]{_id,"entries":count(entries),sourceAssetSha256}';
const url = new URL(
  `https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`,
);
url.searchParams.set("query", query);
url.searchParams.set("perspective", "published");
const read = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!read.ok) throw new Error("Post-import verification failed");
const { result } = await read.json();
for (const d of docs) {
  const actual = result.find((r) => r._id === d._id);
  if (
    !actual ||
    actual.entries !== d.entries.length ||
    actual.sourceAssetSha256 !== d.sourceAssetSha256
  )
    throw new Error(`Verification mismatch: ${d._id}`);
}
await fs.writeFile(
  "docs/audit/library-import-receipt.json",
  JSON.stringify(
    {
      at: new Date().toISOString(),
      project,
      dataset,
      documents: docs.length,
      entries: docs.reduce((n, d) => n + d.entries.length, 0),
      transactions,
      verified: true,
    },
    null,
    2,
  ),
);
