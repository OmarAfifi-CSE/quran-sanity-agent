import { BookIcon } from '@sanity/icons/Book';
import { defineField, defineType } from 'sanity';

export const surahType = defineType({
  name: 'surah',
  title: 'Surah (Chapter)',
  type: 'document',
  icon: BookIcon as any,
  fields: [
    defineField({
      name: 'number',
      title: 'Surah Number',
      description: 'Canonical position in the Mus-haf (1 to 114)',
      type: 'number',
      placeholder: 'e.g. 1',
      validation: (rule) =>
        rule.min(1).max(114).integer().warning('Enter a valid Surah number (1-114)'),
    }),
    defineField({
      name: 'nameEnglish',
      title: 'English Title & Transliteration',
      description: 'Standard English name with meaning (e.g. Al-Fatiha (The Opening))',
      type: 'string',
      placeholder: 'e.g. Al-Fatiha (The Opening)',
      validation: (rule) =>
        rule.warning('English title is recommended for judge evaluation'),
    }),
    defineField({
      name: 'nameArabic',
      title: 'Arabic Name (Calligraphy)',
      description: 'Authentic title in Arabic as written in the Mus-haf',
      type: 'string',
      placeholder: 'Ø§Ù„ÙØ§ØªØ­Ø©',
      validation: (rule) =>
        rule.warning('Arabic name is recommended for authentic Mus-haf display'),
    }),
    defineField({
      name: 'revelationType',
      title: 'Revelation Period',
      description: 'Historical chronology relative to the Prophetâ€™s migration (Hijrah)',
      type: 'string',
      initialValue: 'makki',
      options: {
        list: [
          { title: 'Meccan (Makki)', value: 'makki' },
          { title: 'Medinan (Madani)', value: 'madani' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.warning('Select revelation period'),
    }),
    defineField({
      name: 'totalAyahs',
      title: 'Total Verses',
      description: 'Canonical verse count for this chapter',
      type: 'number',
      placeholder: 'e.g. 7',
      validation: (rule) => rule.min(1).integer(),
    }),
  ],
  orderings: [
    {
      title: 'Surah Number (1 âž” 114)',
      name: 'numberAsc',
      by: [{ field: 'number', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      number: 'number',
      nameArabic: 'nameArabic',
      nameEnglish: 'nameEnglish',
      revelationType: 'revelationType',
      totalAyahs: 'totalAyahs',
    },
    prepare({ number, nameArabic, nameEnglish, revelationType, totalAyahs }) {
      const typeLabel = revelationType === 'madani' ? 'Medinan' : 'Meccan';
      const versesCount = totalAyahs ? ` â€¢ ${totalAyahs} verses` : '';
      return {
        title: `${number ?? '?'}. ${nameEnglish ?? 'Untitled Surah'}`,
        subtitle: `${nameArabic ?? ''} [${typeLabel}${versesCount}]`,
      };
    },
  },
});
