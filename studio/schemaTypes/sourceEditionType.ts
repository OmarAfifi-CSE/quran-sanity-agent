import { defineType, defineField } from "sanity";
export const sourceEditionType = defineType({
  name: "sourceEdition",
  title: "Research source editions",
  type: "document",
  fields: [
    defineField({ name: "resourceId", type: "number", readOnly: true }),
    ...["title", "author", "language", "slug", "reviewStatus"].map((name) =>
      defineField({ name, type: "string", readOnly: true }),
    ),
    defineField({ name: "sourceUrl", type: "url", readOnly: true }),
    defineField({ name: "directAnchors", type: "number", readOnly: true }),
    defineField({ name: "chunks", type: "number", readOnly: true }),
    defineField({ name: "coverageNote", type: "text", readOnly: true }),
    defineField({
      name: "missingDirectAnchors",
      type: "array",
      of: [{ type: "string" }],
      readOnly: true,
    }),
  ],
  preview: { select: { title: "title", subtitle: "language" } },
});
