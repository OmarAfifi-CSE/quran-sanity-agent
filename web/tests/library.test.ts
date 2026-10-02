import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  indexLibrary,
  rankLibrary,
  validateSelections,
  requestedEditions,
  parseLibraryCitationId,
  contextPassageCitations,
  summarizeLibraryCoverage,
  type LibraryChunk,
} from "../src/lib/library";
import { localCorpus } from "../src/lib/corpus";
const chunks: LibraryChunk[] = JSON.parse(
  readFileSync(new URL("../data/library.json", import.meta.url), "utf8"),
);
const index = indexLibrary(chunks);

test('library coverage counts stored entries once per chunk, rather than attributing catalog-only scripture as extra library imports',()=>{
 const result=summarizeLibraryCoverage([{edition:'ibn-kathir',titleEnglish:'Ibn Kathir',language:'ar',entries:2},{edition:'ibn-kathir',titleEnglish:'Ibn Kathir',language:'ar',entries:3}]);
 assert.equal(result.entries,5);
 assert.equal(result.editions.length,1);
 assert.equal(result.editions[0].entries,5);
 assert.throws(()=>summarizeLibraryCoverage([{edition:'bad',titleEnglish:'Bad',language:'en',entries:NaN}]));
});

test("Context passage identifiers cannot select arbitrary documents or paths", () => {
  assert.deepEqual(parseLibraryCitationId("library-quran-api-14-0001.v1-1"), {
    documentId: "library-quran-api-14-0001",
    entryKey: "v1-1",
  });
  for (const id of [
    "ayah-2-255",
    "drafts.library-test.v1-1",
    "library-test.*",
    "library-test.v1-1.extra",
    "library-test.v1-1\n",
  ])
    assert.equal(parseLibraryCitationId(id), null);
});
test("author filters preserve requested source families", () => {
  assert.equal(rankLibrary(index, "Explain Al-Razi 1:1", [], ["1:1"]).length, 0);
  assert.equal(rankLibrary(index, "تفسير الزمخشري 2:255", [], ["2:255"]).length, 0);
  assert.deepEqual(requestedEditions("قارن الطبري والقرطبي"), [
    "quran-com-15",
    "quran-com-90",
  ]);
  assert.deepEqual(requestedEditions("Explain Ibn Kathir 2:255"), [
    "quran-com-14",
    "quran-com-169",
  ]);
  assert.equal(
    rankLibrary(index, "Explain Qurtubi 2:255", [], ["2:255"]).length,
    0,
  );
});
test("model selection must point to real passages and contain exact source text", () => {
  const passages = [
    "A sufficiently long exact source quotation for validation.",
  ];
  assert.deepEqual(
    validateSelections([{ index: 0, quote: passages[0] }], passages),
    [0],
  );
  assert.deepEqual(
    validateSelections(
      [
        { index: 4, quote: passages[0] },
        {
          index: 0,
          quote: "An invented quotation absent from the actual source.",
        },
      ],
      passages,
    ),
    [],
  );
});
test("supplied library has 21,398 source entries with valid Quran anchors and exact original hashes", () => {
  const refs = new Set(
    localCorpus().ayahs.map((a) => `${a.surah.number}:${a.ayahNumber}`),
  );
  assert.equal(index.length, 21398);
  for (const { entry } of index) {
    assert.ok(refs.has(entry.verseKey));
    assert.equal(
      createHash("sha256").update(entry.originalHtml).digest("hex"),
      entry.sha256,
    );
    assert.ok(!/<\/?(?:script|span|p|sup)\b/.test(entry.text));
  }
});
test("exact reference retrieves its own commentary and never a preceding verse", () => {
  const result = rankLibrary(index, "Explain 2:255", ["Explain"], ["2:255"]);
  assert.ok(result.some((r) => r.chunk.edition === "muyassar"));
  assert.ok(result.every((r) => r.entry.verseKey === "2:255"));
  const covered = new Set(
    index
      .filter((r) => r.chunk.edition === "muyassar")
      .map((r) => r.entry.verseKey),
  );
  const missing = localCorpus().ayahs.find(
    (a) => !covered.has(`${a.surah.number}:${a.ayahNumber}`),
  )!;
  const key = `${missing.surah.number}:${missing.ayahNumber}`;
  assert.ok(
    rankLibrary(index, `Explain ${key}`, [], [key]).every(
      (r) => r.chunk.edition !== "muyassar",
    ),
  );
});
test("translations are not misclassified as commentary evidence", () => {
  assert.ok(
    rankLibrary(index, "Explain mercy", ["رحمة"]).every(
      (r) => r.chunk.kind !== "translation",
    ),
  );
});
test("Context cannot promote a translation or unreadable language to commentary", () => {
  const translation = chunks.find(c => c.kind === "translation")!;
  const commentary = chunks.find(c => c.kind !== "translation" && c.language === "ar")!;
  const unreadable = { ...commentary, _id: "library-test-unreadable", language: "bn" };
  const ids = [
    `${translation._id}.${translation.entries[0]._key}`,
    `${unreadable._id}.${unreadable.entries[0]._key}`,
  ];
  assert.deepEqual(contextPassageCitations([translation, unreadable], ids), []);
});
test("Context resolves only the exact selected entry and requested author", () => {
  const commentary = chunks.find(c => c.kind !== "translation" && c.language === "ar")!;
  const id = `${commentary._id}.${commentary.entries[0]._key}`;
  const citations = contextPassageCitations([commentary], [id]);
  assert.equal(citations.length, 1);
  assert.equal(citations[0].documentId, id);
  assert.equal(citations[0].rawJsonSnippet.primaryExcerpt, commentary.entries[0].text);
  assert.deepEqual(contextPassageCitations([commentary], [id], "What did Qurtubi say?"), []);
});
test("empty query expansion cannot produce arbitrary passages", () => {
  assert.equal(rankLibrary(index, "Explain", ["explain"]).length, 0);
});
test("duplicate source anchors fail instead of silently overwriting evidence", () => {
  assert.throws(() => indexLibrary([chunks[0], chunks[0]]), /anchor/);
});
