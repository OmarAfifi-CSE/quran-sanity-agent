import { defineType, defineField } from "sanity";
export const libraryChunkType = defineType({
  name: "libraryChunk",
  title: "Imported research library",
  type: "document",
  fields: [
    defineField({ name: "entryCount", type: "number", readOnly: true }),
    defineField({
      name: "sourceEdition",
      type: "reference",
      to: [{ type: "sourceEdition" }],
      readOnly: true,
    }),
    defineField({
      name: "searchText",
      type: "text",
      hidden: true,
      readOnly: true,
    }),
    ...[
      "edition",
      "titleArabic",
      "titleEnglish",
      "language",
      "kind",
      "sourceAsset",
      "sourceAssetSha256",
      "sourceLocator",
      "verification",
    ].map((name) => defineField({ name, type: "string", readOnly: true })),
    defineField({ name: "reviewNote", type: "text", readOnly: true }),
    defineField({
      name: "entries",
      type: "array",
      readOnly: true,
      of: [
        {
          type: "object",
          name: "libraryEntry",
          fields: [
            defineField({
              name: "ayah",
              type: "reference",
              to: [{ type: "ayah" }],
            }),
            defineField({ name: "sourceUrl", type: "url" }),
            defineField({ name: "upstreamRecordId", type: "string" }),
            defineField({ name: "searchText", type: "text", hidden: true }),
            ...["verseKey", "text", "originalHtml", "sha256"].map((name) =>
              defineField({
                name,
                type:
                  name === "text" || name === "originalHtml"
                    ? "text"
                    : "string",
              }),
            ),
            defineField({ name: "surahNumber", type: "number" }),
            defineField({ name: "ayahNumber", type: "number" }),
          ],
          preview: { select: { title: "verseKey", subtitle: "text" } },
        },
      ],
    }),
  ],
  preview: { select: { title: "titleEnglish", subtitle: "sourceLocator" } },
});
