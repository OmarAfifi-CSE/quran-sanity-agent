import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import readline from "node:readline";
process.loadEnvFile("web/.env.local");
const project = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token =
  process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_TOKEN;
const file = "data/staging/quran-api-import.ndjson";
const manifest = JSON.parse(
  await fs.readFile("docs/audit/quran-api-import-manifest.json", "utf8"),
);
if (!process.argv.includes("--apply")) {
  console.log({
    project,
    dataset,
    documents: manifest.documents,
    entries: manifest.entries,
    bytes: manifest.fileBytes,
    operation: "createIfNotExists",
  });
  process.exit(0);
}
if (!project || !token) throw new Error("Missing project/write token");
const url = new URL(
  `https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`,
);
url.searchParams.set(
  "query",
  '*[_type in ["libraryChunk","sourceEdition"]]{_id,sourceAssetSha256,directAnchors}',
);
const existingResponse = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});
if (!existingResponse.ok) throw new Error("Preflight read failed");
const { result } = await existingResponse.json();
const existing = new Map(result.map((d) => [d._id, d]));
let batch = [],
  bytes = 0,
  created = 0,
  skipped = 0;
const transactions = [];
async function flush() {
  if (!batch.length) return;
  const response = await fetch(
    `https://${project}.api.sanity.io/v2025-01-01/data/mutate/${dataset}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mutations: batch.map((d) => ({ createIfNotExists: d })),
      }),
    },
  );
  if (!response.ok)
    throw new Error(
      `Mutation HTTP ${response.status}; completed batches preserved, safe to resume`,
    );
  const body = await response.json();
  created += batch.length;
  transactions.push(body.transactionId);
  batch = [];
  bytes = 0;
  await fs.writeFile(
    "docs/audit/quran-api-import-progress.json",
    JSON.stringify(
      {
        at: new Date().toISOString(),
        created,
        skipped,
        expectedDocuments: manifest.documents,
        transactions,
      },
      null,
      2,
    ),
  );
  if (created % 50 < 6)
    console.log({ created, skipped, total: manifest.documents });
}
for await (const line of readline.createInterface({
  input: createReadStream(file),
  crlfDelay: Infinity,
})) {
  if (!line.trim()) continue;
  const d = JSON.parse(line);
  if (!(
    (d._type === "sourceEdition" && d._id.startsWith("edition-quran-com-")) ||
    (d._type === "libraryChunk" && d._id.startsWith("library-quran-api-"))
  ))
    throw new Error("Unexpected document type/ID");
  const old = existing.get(d._id);
  if (old) {
    if (
      d._type === "libraryChunk"
        ? old.sourceAssetSha256 !== d.sourceAssetSha256
        : old.directAnchors !== d.directAnchors
    )
      throw new Error(
        `Existing changed record needs revision-aware migration: ${d._id}`,
      );
    skipped++;
    continue;
  }
  const cost = Buffer.byteLength(line);
  if (bytes + cost > 2800000) await flush();
  batch.push(d);
  bytes += cost;
}
await flush();
console.log({ created, skipped, expected: manifest.documents });
