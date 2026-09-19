import { defineField, defineType } from 'sanity';

export const surahType = defineType({
  name: 'surah',
  title: 'ðŸ“– Surah (Chapter)',
  type: 'document',
  fields: [
    defineField({
      name: 'number',
      title: 'Surah Number',
      description: 'Position in the Mus-haf (1 to 114)',
      type: 'number',
      validation: (rule) => rule.min(1).max(114).integer(),
    }),
    defineField({
      name: 'nameEnglish',
      title: 'English Title',
      type: 'string',
      validation: (rule) => rule.warning('English title recommended'),
    }),
    defineField({
      name: 'nameArabic',
      title: 'Arabic Name',
      type: 'string',
      validation: (rule) => rule.warning('Arabic name recommended'),
    }),
    defineField({
      name: 'revelationType',
      title: 'Revelation Place',
      type: 'string',
      options: {
        list: [
          { title: 'Meccan', value: 'makki' },
          { title: 'Medinan', value: 'madani' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.warning('Select revelation place'),
    }),
    defineField({
      name: 'totalAyahs',
      title: 'Total Verses',
      type: 'number',
      validation: (rule) => rule.min(1).integer(),
    }),
  ],
  preview: {
    select: {
      number: 'number',
      nameArabic: 'nameArabic',
      nameEnglish: 'nameEnglish',
    },
    prepare({ number, nameArabic, nameEnglish }) {
      return {
        title: `${number ?? '?'}. ${nameEnglish ?? 'Untitled Surah'}`,
        subtitle: nameArabic ?? '',
      };
    },
  },
});
