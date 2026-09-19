import { UsersIcon } from '@sanity/icons/Users';
import { defineField, defineType } from 'sanity';

export const tafsirSourceType = defineType({
  name: 'tafsirSource',
  title: 'Tafsir Source & Scholar',
  type: 'document',
  icon: UsersIcon as any,
  fields: [
    defineField({
      name: 'bookTitleEnglish',
      title: 'Work Title (English / Transliteration)',
      description: 'Standard scholarly title of the classical exegesis work',
      type: 'string',
      placeholder: 'e.g. Tafsir al-Qur\'an al-Azim (Tafsir Ibn Kathir)',
      validation: (rule) => rule.warning('Work title in English is recommended'),
    }),
    defineField({
      name: 'author',
      title: 'Author / Scholar',
      description: 'Classical exegete and authority name',
      type: 'string',
      placeholder: 'e.g. Ibn Kathir (ابن كثير)',
      validation: (rule) => rule.warning('Author name is recommended'),
    }),
    defineField({
      name: 'bookTitleArabic',
      title: 'Original Arabic Title',
      description: 'Classical title as recorded in Arabic manuscripts',
      type: 'string',
      placeholder: 'تفسير القرآن العظيم',
      validation: (rule) =>
        rule.warning('Original Arabic title is recommended for scholarly citations'),
    }),
    defineField({
      name: 'methodology',
      title: 'Hermeneutical Methodology',
      description: 'The primary interpretive paradigm adhered to by the scholar',
      type: 'string',
      initialValue: 'athari',
      options: {
        list: [
          { title: 'Traditional / Hadith-based (Athari)', value: 'athari' },
          { title: 'Jurisprudential / Legal (Fiqhi)', value: 'juridical' },
          { title: 'Linguistic / Rhetorical (Nahwi & Bayani)', value: 'linguistic' },
          { title: 'Analytical / Rational (Dirayah)', value: 'rational' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required().error('Scholar methodology is required'),
    }),
    defineField({
      name: 'deathYearAH',
      title: 'Demise Year (AH / Islamic Calendar)',
      description: 'Year of demise in the Hijri calendar (used for chronological ordering)',
      type: 'number',
      placeholder: 'e.g. 774',
      validation: (rule) =>
        rule.warning('Hijri demise year helps organize scholars chronologically'),
    }),
  ],
  orderings: [
    {
      title: 'Chronological (Demise Year AH)',
      name: 'deathYearAsc',
      by: [{ field: 'deathYearAH', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      bookTitleEnglish: 'bookTitleEnglish',
      bookTitleArabic: 'bookTitleArabic',
      author: 'author',
      deathYearAH: 'deathYearAH',
      methodology: 'methodology',
    },
    prepare({ bookTitleEnglish, bookTitleArabic, author, deathYearAH, methodology }) {
      const yearLabel = deathYearAH ? `d. ${deathYearAH} AH` : 'Era unknown';
      const methodMap: Record<string, string> = {
        athari: 'Athari',
        juridical: 'Fiqhi',
        linguistic: 'Linguistic',
        rational: 'Dirayah',
      };
      const methodLabel = methodology && methodMap[methodology] ? ` • [${methodMap[methodology]}]` : '';
      const arabicLabel = bookTitleArabic ? ` (${bookTitleArabic})` : '';
      return {
        title: `${bookTitleEnglish || 'Untitled Source'}${arabicLabel}`,
        subtitle: `${author || 'Unknown Scholar'} • ${yearLabel}${methodLabel}`,
      };
    },
  },
});
