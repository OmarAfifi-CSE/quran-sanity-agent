import fs from "node:fs/promises";
import crypto from "node:crypto";
const reference = await fs.readFile("data/reference/tanzil-uthmani.txt", "utf8");
const official = new Map(
  reference
    .split(/\r?\n/)
    .filter((l) => /^\d+\|/.test(l))
    .map((l) => {
      const [s, a, text] = l.split("|");
      return [
        `ayah-${s}-${a}`,
        s !== "1" && s !== "9" && a === "1"
          ? text.split(" ").slice(4).join(" ")
          : text,
      ];
    }),
);
if (official.size !== 6236) throw new Error("Incomplete reference");
const local = (await fs.readFile("quran_full_dataset.ndjson", "utf8"))
  .trim()
  .split(/\r?\n/)
  .map(JSON.parse);
const live = process.argv.includes("--live")
  ? JSON.parse(await fs.readFile("docs/audit/live-snapshot.json", "utf8"))
  : null;
const compare = (docs) => ({
  verses: docs.filter((d) => d._type === "ayah").length,
  mismatches: docs
    .filter((d) => d._type === "ayah" && official.get(d._id) !== d.textUthmani)
    .map((d) => d._id),
});
const report = {
  checkedAt: new Date().toISOString(),
  reference: "Tanzil Uthmani 1.1",
  referenceSha256: crypto.createHash("sha256").update(reference).digest("hex"),
  comparison:
    "Exact character match after segmentation of unnumbered chapter-opening Basmalah in reference. No normalization applied to verses.",
  local: compare(local),
  live: live ? compare(live) : null,
};
await fs.mkdir("docs/audit", { recursive: true });
await fs.writeFile(
  "docs/audit/text-verification-final.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
if (
  report.local.mismatches.length ||
  (report.live && (report.live.mismatches.length || report.live.verses !== 6236)) ||
  report.local.verses !== 6236
)
  process.exitCode = 1;
