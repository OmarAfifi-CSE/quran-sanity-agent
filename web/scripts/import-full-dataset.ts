import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SanityDocument } from "@sanity/client";

async function main() {
  const file = path.resolve(
    process.cwd(),
    process.cwd().endsWith("web")
      ? "../quran_full_dataset.ndjson"
      : "quran_full_dataset.ndjson",
  );
  const docs = (await fs.readFile(file, "utf8"))
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as SanityDocument);
  if (new Set(docs.map((d) => d._id)).size !== docs.length)
    throw new Error("Duplicate document IDs");
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.SANITY_IMPORT_DATASET;
  const apply = process.argv.includes("--apply");
  console.log({
    mode: apply ? "create missing documents" : "dry-run",
    projectId: projectId || "not configured",
    dataset: dataset || "must be explicitly configured",
    documents: docs.length,
  });
  if (!apply) return;
  const token = process.env.SANITY_API_WRITE_TOKEN;
  if (!projectId || !dataset || !token)
    throw new Error(
      "Set project ID, SANITY_IMPORT_DATASET and a write token. Existing records are never replaced.",
    );
  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: "2025-01-01",
    useCdn: false,
  });
  for (let start = 0; start < docs.length; start += 100) {
    const transaction = client.transaction();
    for (const doc of docs.slice(start, start + 100)) {
      transaction.createIfNotExists(
        doc._type === "interpretiveClaim"
          ? { ...doc, reviewStatus: "unreviewed" }
          : doc,
      );
    }
    await transaction.commit();
    console.log(
      `Processed ${Math.min(start + 100, docs.length)} / ${docs.length}`,
    );
  }
}
main().catch(() => {
  console.error(
    "Import failed. Check configuration and dataset access; no existing records were replaced.",
  );
  process.exitCode = 1;
});
