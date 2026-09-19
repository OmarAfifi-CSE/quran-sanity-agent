import type { ComponentType } from 'react';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { defineField, defineType } from 'sanity';

export const ayahType = defineType({
  name: 'ayah',
  title: 'Ayah (Verse)',
  type: 'document',
  icon: DocumentTextIcon as unknown as ComponentType,
  fields: [
    defineField({
      name: 'surah',
      title: 'Parent Surah',
      description: 'The chapter to which this verse belongs',
      type: 'reference',
      to: [{ type: 'surah' }],
      validation: (rule) => rule.warning('Select the parent Surah for this verse'),
    }),
    defineField({
      name: 'ayahNumber',
      title: 'Verse Number',
      description: 'Sequential position within the chapter (1, 2, 3...)',
      type: 'number',
      initialValue: 1,
      placeholder: 'e.g. 1',
      validation: (rule) =>
        rule.min(1).integer().warning('Verse number should be a positive integer'),
    }),
    defineField({
      name: 'textUthmani',
      title: 'Arabic Scripture (Uthmani Script)',
      description: 'Authentic Quranic text with full vocalization and diacritical marks',
      type: 'text',
      rows: 3,
      placeholder: 'Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…ÙŽÙ°Ù†Ù Ø§Ù„Ø±ÙŽÙ‘Ø­ÙÙŠÙ…Ù',
      validation: (rule) =>
        rule.warning('Arabic scripture text is essential for Quranic grounding'),
    }),
    defineField({
      name: 'textEnglishTranslation',
      title: 'English Translation',
      description: 'Clear, authoritative translation (e.g. The Clear Quran / Sahih International)',
      type: 'text',
      rows: 3,
      placeholder: 'e.g. In the name of Allah, the Entirely Merciful, the Especially Merciful.',
      validation: (rule) =>
        rule.warning('English translation enables international evaluation'),
    }),
    defineField({
      name: 'keywords',
      title: 'Thematic Keywords',
      description: 'Theological concepts and indexed terms found in this verse',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    }),
  ],
  orderings: [
    {
      title: 'Verse Number (1 âž” End)',
      name: 'ayahNumberAsc',
      by: [{ field: 'ayahNumber', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      ayahNumber: 'ayahNumber',
      surahNameEnglish: 'surah.nameEnglish',
      surahNameArabic: 'surah.nameArabic',
      surahNumber: 'surah.number',
      textUthmani: 'textUthmani',
      textEnglishTranslation: 'textEnglishTranslation',
    },
    prepare({ ayahNumber, surahNameEnglish, surahNameArabic, surahNumber, textUthmani, textEnglishTranslation }) {
      const surahLabel = surahNameEnglish || (surahNumber ? `Surah ${surahNumber}` : 'Surah');
      const arabicLabel = surahNameArabic ? ` (${surahNameArabic})` : '';
      return {
        title: `${surahLabel}${arabicLabel} [Verse ${ayahNumber ?? '?'}]`,
        subtitle: textUthmani || textEnglishTranslation || 'Empty verse text',
      };
    },
  },
});
