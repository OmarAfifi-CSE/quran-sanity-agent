import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";
import { localCorpus } from "../src/lib/corpus";

test("every runtime verse exactly matches the preserved official text", () => {
  const text = readFileSync(
    resolve("../data/reference/tanzil-uthmani.txt"),
    "utf8",
  );
  const reference = new Map(
    text
      .split(/\r?\n/)
      .filter((l) => /^\d+\|/.test(l))
      .map((l) => {
        const [s, a, t] = l.split("|");
        return [
          `ayah-${s}-${a}`,
          s !== "1" && s !== "9" && a === "1"
            ? t.split(" ").slice(4).join(" ")
            : t,
        ];
      }),
  );
  assert.equal(reference.size, 6236);
  for (const a of localCorpus().ayahs)
    assert.equal(a.textUthmani, reference.get(a._id), a._id);
});
test("schema copies cannot drift between Studio and web", () => {
  for (const name of [
    "surahType",
    "ayahType",
    "tafsirSourceType",
    "interpretiveClaimType",
    "libraryChunkType",
    "sourceEditionType",
  ])
    assert.equal(
      readFileSync(resolve(`src/sanity/schemaTypes/${name}.ts`), "utf8"),
      readFileSync(resolve(`../studio/schemaTypes/${name}.ts`), "utf8"),
      name,
    );
});
