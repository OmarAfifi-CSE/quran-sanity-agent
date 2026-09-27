import fs from "node:fs/promises";
process.loadEnvFile("web/.env.local");
const planArg=process.argv.indexOf('--plan');
const planFile=planArg>=0?process.argv[planArg+1]:'docs/audit/commentary-repair-plan.json';
if(!['docs/audit/commentary-repair-plan.json','docs/audit/remaining-claims-repair-plan.json'].includes(planFile))throw new Error('Unknown repair plan');
const receiptFile=planFile.replace('-plan.json','-receipt.json');
const plan = JSON.parse(await fs.readFile(planFile, "utf8"));
const snapshot = JSON.parse(
  await fs.readFile("docs/audit/live-snapshot.json", "utf8"),
);
if (!process.argv.includes("--apply")) {
  console.log({ mode: "dry-run", documents: plan.updates.map((u) => u.id) });
  process.exit(0);
}
const before = plan.updates.map((u) => snapshot.find((d) => d._id === u.id));
if (before.some((d) => !d?._rev)) throw new Error("Missing snapshot revisions");
const mutations = plan.updates.map((u, i) => ({
  patch: { id: u.id, ifRevisionID: before[i]._rev, set: u.set },
}));
const response = await fetch(
  `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2025-01-01/data/mutate/${process.env.NEXT_PUBLIC_SANITY_DATASET || "production"}`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SANITY_API_WRITE_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ mutations }),
    signal: AbortSignal.timeout(30000),
  },
);
if (!response.ok)
  throw new Error("Atomic commentary repair failed: " + response.status);
const receipt = await response.json();
await fs.writeFile(
  receiptFile,
  JSON.stringify(
    {
      appliedAt: new Date().toISOString(),
      transactionId: receipt.transactionId,
      before,
      updates: plan.updates,
    },
    null,
    2,
  ),
);
const updated = new Map(
  plan.updates.map((u, i) => [u.id, { ...before[i], ...u.set }]),
);
const corpus = JSON.parse(
  await fs.readFile("web/src/sanity/corpus.json", "utf8"),
);
corpus.tafsirSources=snapshot.filter(d=>d._type==='tafsirSource').map(record=>Object.fromEntries(Object.entries(record).filter(([k])=>!['_rev','_createdAt','_updatedAt'].includes(k))));
for (const [id, record] of updated) {
  const clean = Object.fromEntries(
    Object.entries(record).filter(
      ([k]) => !["_rev", "_createdAt", "_updatedAt"].includes(k),
    ),
  );
  const index = corpus.interpretiveClaims.findIndex((c) => c._id === id);
  if (index >= 0) corpus.interpretiveClaims[index] = clean;
  else corpus.interpretiveClaims.push(clean);
}
await fs.writeFile("web/src/sanity/corpus.json", JSON.stringify(corpus));
const source = (await fs.readFile("quran_full_dataset.ndjson", "utf8"))
  .trim()
  .split(/\r?\n/);
const ids = new Set(source.map((l) => JSON.parse(l)._id));
const lines = source.map((l) => {
  const id = JSON.parse(l)._id;
  return updated.has(id)
    ? JSON.stringify(corpus.interpretiveClaims.find((c) => c._id === id))
    : l;
});
for (const c of corpus.interpretiveClaims)
  if (!ids.has(c._id)) lines.push(JSON.stringify(c));
for(const source of corpus.tafsirSources)if(!ids.has(source._id))lines.push(JSON.stringify(source));
await fs.writeFile("quran_full_dataset.ndjson", lines.join("\n") + "\n");
console.log({
  applied: plan.updates.length,
  transactionId: receipt.transactionId,
});
