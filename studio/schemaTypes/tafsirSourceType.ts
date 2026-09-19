import { defineField, defineType } from 'sanity';

export const tafsirSourceType = defineType({
  name: 'tafsirSource',
  title: 'ðŸ“š Tafsir Source',
  type: 'document',
  fields: [
    defineField({
      name: 'bookTitleEnglish',
      title: 'Work Title (English)',
      type: 'string',
      validation: (rule) => rule.warning('Work title is recommended'),
    }),
    defineField({
      name: 'author',
      title: 'Author / Scholar',
      type: 'string',
      validation: (rule) => rule.warning('Author name is recommended'),
    }),
    defineField({
      name: 'bookTitleArabic',
      title: 'Ø£Ù…Ù‡Ø§Øª Ø§Ù„ØªÙØ³ÙŠØ± (Arabic Title)',
      type: 'string',
      validation: (rule) => rule.warning('Arabic title is recommended'),
    }),
    defineField({
      name: 'methodology',
      title: 'Methodology Type',
      type: 'string',
      options: {
        list: [
          { title: 'Athari (Traditional)', value: 'athari' },
          { title: 'Fiqhi (Legal)', value: 'juridical' },
          { title: 'Linguistic', value: 'linguistic' },
          { title: 'Rational', value: 'rational' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'deathYearAH',
      title: 'Demise Year (AH)',
      type: 'number',
    }),
  ],
  preview: {
    select: {
      bookTitleEnglish: 'bookTitleEnglish',
      author: 'author',
      deathYearAH: 'deathYearAH',
    },
    prepare({ bookTitleEnglish, author, deathYearAH }) {
      return {
        title: bookTitleEnglish || 'Untitled Source',
        subtitle: `${author || 'Unknown'} (d. ${deathYearAH ?? '?'} AH)`,
      };
    },
  },
});
