import fs from "node:fs/promises";
const docs = (await fs.readFile("quran_full_dataset.ndjson", "utf8"))
  .trim()
  .split(/\r?\n/)
  .map(JSON.parse);
const response = await fetch(
  "https://api.alquran.cloud/v1/quran/quran-uthmani",
  { signal: AbortSignal.timeout(30000) },
);
if (!response.ok) throw new Error("reference fetch " + response.status);
const { data } = await response.json();
const map = new Map(
  docs.filter((d) => d._type === "ayah").map((d) => [d._id, d]),
);
const mismatches = data.surahs.flatMap((s) =>
  s.ayahs
    .filter(
      (a) =>
        map.get(`ayah-${s.number}-${a.numberInSurah}`)?.textUthmani !== a.text,
    )
    .map((a) => ({
      id: `ayah-${s.number}-${a.numberInSurah}`,
      local: map.get(`ayah-${s.number}-${a.numberInSurah}`)?.textUthmani,
      reference: a.text,
    })),
);
await fs.writeFile(
  "docs/audit/text-comparison.json",
  JSON.stringify(
    {
      source: "https://api.alquran.cloud/v1/quran/quran-uthmani",
      edition: data.edition,
      checkedAt: new Date().toISOString(),
      checkedVerses: data.surahs.reduce((n, s) => n + s.ayahs.length, 0),
      mismatchCount: mismatches.length,
      examples: mismatches.slice(0, 10),
    },
    null,
    2,
  ),
);
console.log({
  compared: 6236,
  mismatches: mismatches.length,
  examples: mismatches.slice(0, 2),
});
