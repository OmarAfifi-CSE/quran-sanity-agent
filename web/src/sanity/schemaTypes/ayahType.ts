import { defineField, defineType } from 'sanity';

export const ayahType = defineType({
  name: 'ayah',
  title: 'ðŸ“œ Ayah (Verse)',
  type: 'document',
  groups: [
    { name: 'arabic', title: 'Arabic Scripture', default: true },
    { name: 'translation', title: 'English Translation' },
    { name: 'meta', title: 'Verse Metadata' },
  ],
  fields: [
    defineField({
      name: 'surah',
      title: 'Parent Surah',
      type: 'reference',
      to: [{ type: 'surah' }],
      group: 'meta',
      validation: (rule) => rule.warning('Select the parent Surah'),
    }),
    defineField({
      name: 'ayahNumber',
      title: 'Verse Number',
      type: 'number',
      group: 'meta',
      initialValue: 1,
      validation: (rule) => rule.min(1).integer(),
    }),
    defineField({
      name: 'textUthmani',
      title: 'Arabic Scripture',
      type: 'text',
      rows: 3,
      group: 'arabic',
      validation: (rule) => rule.warning('Arabic text is essential for grounding'),
    }),
    defineField({
      name: 'textEnglishTranslation',
      title: 'English Translation',
      type: 'text',
      rows: 3,
      group: 'translation',
      validation: (rule) => rule.warning('English translation is recommended'),
    }),
    defineField({
      name: 'keywords',
      title: 'Thematic Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'meta',
      options: { layout: 'tags' },
    }),
  ],
  preview: {
    select: {
      ayahNumber: 'ayahNumber',
      surahNameEnglish: 'surah.nameEnglish',
      textUthmani: 'textUthmani',
    },
    prepare({ ayahNumber, surahNameEnglish, textUthmani }) {
      return {
        title: `${surahNameEnglish ?? 'Surah'} [Verse ${ayahNumber ?? '?'}]`,
        subtitle: textUthmani || 'No text',
      };
    },
  },
});
