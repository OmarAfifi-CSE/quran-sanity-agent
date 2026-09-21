import fs from "node:fs/promises";
import crypto from "node:crypto";
try {
  process.loadEnvFile("web/.env.local");
} catch {}
const reference = await fs.readFile("data/reference/tanzil-uthmani.txt", "utf8");
const official = new Map(
  reference
    .split(/\r?\n/)
    .filter((l) => /^\d+\|/.test(l))
    .map((l) => {
      const [s, a, text] = l.split("|");
      const prefix =
        Number(s) !== 1 && Number(s) !== 9 && a === "1"
          ? text.split(" ").slice(0, 4).join(" ") + " "
          : "";
      return [
        `ayah-${s}-${a}`,
        { text: prefix ? text.slice(prefix.length) : text, prefix },
      ];
    }),
);
if (official.size !== 6236) throw new Error("Incomplete reference");
const docs = (await fs.readFile("quran_full_dataset.ndjson", "utf8"))
  .trim()
  .split(/\r?\n/)
  .map(JSON.parse);
const differences = docs
  .filter(
    (d) => d._type === "ayah" && d.textUthmani !== official.get(d._id)?.text,
  )
  .map((d) => ({
    id: d._id,
    before: d.textUthmani,
    after: official.get(d._id).text,
  }));
if (!differences.length) { console.log("Arabic text already matches; existing repair artifacts preserved."); process.exit(0); }
const plan = {
  createdAt: new Date().toISOString(),
  source: "https://tanzil.net/download/",
  referenceSha256: crypto.createHash("sha256").update(reference).digest("hex"),
  changes: differences,
};
if (!process.argv.includes("--apply")) {
  await fs.writeFile(
    "docs/audit/text-repair-plan.json",
    JSON.stringify(plan, null, 2),
  );
  console.log({ mode: "dry-run", changes: differences.map((d) => d.id) });
  process.exit(0);
}
const saved = JSON.parse(
  await fs.readFile("docs/audit/text-repair-plan.json", "utf8"),
);
if (
  saved.referenceSha256 !== plan.referenceSha256 ||
  JSON.stringify(saved.changes) !== JSON.stringify(plan.changes)
)
  throw new Error("Repair plan changed; regenerate and review");
const snapshot = JSON.parse(
  await fs.readFile("docs/audit/live-snapshot.json", "utf8"),
);
const mutations = differences.map((d) => {
  const live = snapshot.find((s) => s._id === d.id);
  if (live?.textUthmani !== d.before || !live?._rev)
    throw new Error("Snapshot mismatch: " + d.id);
  return {
    patch: {
      id: d.id,
      ifRevisionID: live._rev,
      set: {
        textUthmani: d.after,
        textEdition: "Tanzil Uthmani 1.1 (sequential tanweens, tatweel)",
        textSourceUrl: "https://tanzil.net/download/",
      },
    },
  };
});
if (!process.env.SANITY_API_WRITE_TOKEN) throw new Error("Write token missing");
const result = await fetch(
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
if (!result.ok) throw new Error("Atomic repair failed: HTTP " + result.status);
const receipt = await result.json();
for (const d of docs) {
  if (d._type === "ayah") {
    d.textUthmani = official.get(d._id).text;
  }
}
await fs.writeFile(
  "quran_full_dataset.ndjson",
  docs.map((d) => JSON.stringify(d)).join("\n") + "\n",
);
const license = reference.slice(reference.indexOf("#  Tanzil Quran Text"));
const corpus = {
  surahs: docs.filter((d) => d._type === "surah"),
  ayahs: docs.filter((d) => d._type === "ayah"),
  tafsirSources: docs.filter((d) => d._type === "tafsirSource"),
  interpretiveClaims: docs.filter((d) => d._type === "interpretiveClaim"),
  textLicense: license,
};
await fs.writeFile("web/src/sanity/corpus.json", JSON.stringify(corpus));
await fs.writeFile(
  "docs/audit/text-repair-receipt.json",
  JSON.stringify(
    {
      appliedAt: new Date().toISOString(),
      transactionId: receipt.transactionId,
      documentIds: differences.map((d) => d.id),
      referenceSha256: plan.referenceSha256,
    },
    null,
    2,
  ),
);
// DATA_LICENSE.md is maintained separately to preserve current source attribution.
console.log({
  applied: differences.length,
  transactionId: receipt.transactionId,
});
