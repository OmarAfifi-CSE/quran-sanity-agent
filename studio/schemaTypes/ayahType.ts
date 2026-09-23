import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { defineField, defineType, type DocumentDefinition } from "sanity";

export const ayahType = defineType({
  name: "ayah",
  title: "Ayah (Verse)",
  type: "document",
  icon: DocumentTextIcon as unknown as DocumentDefinition["icon"],
  fields: [
    defineField({
      name: "textEdition",
      title: "Arabic text edition and version",
      type: "string",
    }),
    defineField({
      name: "textSourceUrl",
      title: "Arabic source URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "translationEdition",
      title: "Translator, edition and license",
      description:
        "Record the translator, edition, and redistribution permission before publication",
      type: "string",
    }),
    defineField({
      name: "translationSourceUrl",
      title: "Translation source URL",
      type: "url",
      validation: (rule) => rule.uri({ scheme: ["https"] }),
    }),
    defineField({
      name: "surah",
      title: "Parent Surah",
      description: "The chapter to which this verse belongs",
      type: "reference",
      to: [{ type: "surah" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "ayahNumber",
      title: "Verse Number",
      description: "Sequential position within the chapter (1, 2, 3...)",
      type: "number",
      initialValue: 1,
      placeholder: "e.g. 1",
      validation: (rule) => rule.required().min(1).max(286).integer(),
    }),
    defineField({
      name: "textUthmani",
      title: "Arabic Scripture (Uthmani Script)",
      description:
        "Authentic Quranic text with full vocalization and diacritical marks",
      type: "text",
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "textEnglishTranslation",
      title: "English Translation",
      description:
        "English rendering of meaning; do not name an edition until its attribution and license are verified",
      type: "text",
      rows: 3,
      placeholder:
        "Enter the translated meaning and keep its edition attribution in Translator, edition and license.",
      validation: (rule) =>
        rule.warning("English translation enables international evaluation"),
    }),
    defineField({
      name: "keywords",
      title: "Thematic Keywords",
      description: "Theological concepts and indexed terms found in this verse",
      type: "array",
      of: [{ type: "string" }],
      options: {
        layout: "tags",
      },
    }),
  ],
  orderings: [
    {
      title: "Verse Number (ascending)",
      name: "ayahNumberAsc",
      by: [{ field: "ayahNumber", direction: "asc" }],
    },
  ],
  preview: {
    select: {
      ayahNumber: "ayahNumber",
      surahNameEnglish: "surah.nameEnglish",
      surahNameArabic: "surah.nameArabic",
      surahNumber: "surah.number",
      textUthmani: "textUthmani",
      textEnglishTranslation: "textEnglishTranslation",
    },
    prepare({
      ayahNumber,
      surahNameEnglish,
      surahNameArabic,
      surahNumber,
      textUthmani,
      textEnglishTranslation,
    }) {
      const surahLabel =
        surahNameEnglish || (surahNumber ? `Surah ${surahNumber}` : "Surah");
      const arabicLabel = surahNameArabic ? ` (${surahNameArabic})` : "";
      return {
        title: `${surahLabel}${arabicLabel} [Verse ${ayahNumber ?? "?"}]`,
        subtitle: textUthmani || textEnglishTranslation || "Empty verse text",
      };
    },
  },
});
