import { SplitVerticalIcon } from '@sanity/icons/SplitVertical';
import { defineField, defineType } from 'sanity';

export const interpretiveClaimType = defineType({
  name: 'interpretiveClaim',
  title: 'Interpretive Claim (Divergence / Consensus)',
  type: 'document',
  icon: SplitVerticalIcon as any,
  fields: [
    defineField({
      name: 'ayah',
      title: 'Referenced Verse',
      description: 'The specific Quranic verse under exegetical analysis',
      type: 'reference',
      to: [{ type: 'ayah' }],
      validation: (rule) => rule.warning('Select the referenced Ayah'),
    }),
    defineField({
      name: 'source',
      title: 'Exegetical Source & Scholar',
      description: 'The classical exegete and authoritative text attributing this claim',
      type: 'reference',
      to: [{ type: 'tafsirSource' }],
      validation: (rule) => rule.warning('Select the scholar / source'),
    }),
    defineField({
      name: 'divergenceType',
      title: 'Divergence Classification',
      description: 'The epistemological relationship between this position and other classical schools',
      type: 'string',
      initialValue: 'consensus',
      options: {
        list: [
          { title: 'Consensus (Ijma / Unanimous Agreement)', value: 'consensus' },
          { title: 'Complementary Diversity (Ikhtilaf Tanawwu)', value: 'complementary' },
          { title: 'Contradictory Divergence (Ikhtilaf Tadadd)', value: 'contradictory' },
        ],
        layout: 'radio',
      },
      validation: (rule) =>
        rule.required().error('Divergence classification is required — every claim must be classified'),
    }),
    defineField({
      name: 'targetSegmentEnglish',
      title: 'Focal Topic / Phrase (English)',
      description: 'The core theological clause or phrase being interpreted',
      type: 'string',
      placeholder: 'e.g. The Basmalah in Al-Fatiha',
      validation: (rule) =>
        rule.warning('Focal topic in English is recommended for UI matrix indexing'),
    }),
    defineField({
      name: 'targetSegmentArabic',
      title: 'Focal Phrase (Arabic Scripture)',
      description: 'The exact Arabic clause or word from the Mus-haf',
      type: 'string',
      placeholder: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
      validation: (rule) =>
        rule.warning('Arabic focal phrase recommended for scripture cross-linking'),
    }),
    defineField({
      name: 'opinionEnglish',
      title: 'Scholarly Synthesis (English)',
      description: 'Concise, rigorous English synthesis of the scholar’s deductive conclusion for AI reasoning',
      type: 'text',
      rows: 4,
      placeholder: 'e.g. Ibn Kathir argues that the Basmalah is an independent verse at the start of every chapter (except At-Tawbah), but is not part of Al-Fatiha itself according to the Medina/Basra tradition...',
      validation: (rule) =>
        rule.warning('English explanation of the scholarly position is recommended'),
    }),
    defineField({
      name: 'opinionArabic',
      title: 'Primary Source Citation (Classical Arabic)',
      description: 'Verbatim excerpt from the scholar’s manuscript serving as untampered evidentiary ground truth',
      type: 'text',
      rows: 4,
      placeholder: 'مثال: قال ابن كثير رحمه الله: وقد روى جماعة من أهل العلم أن البسملة آية مستقلة...',
      validation: (rule) =>
        rule.warning('Original Arabic quote serves as untampered primary evidence for the agent'),
    }),
    defineField({
      name: 'evidenceEnglish',
      title: 'Evidentiary Basis & Dalil',
      description: 'The primary textual, transmission, or linguistic proof relied upon by the scholar',
      type: 'text',
      rows: 3,
      placeholder: 'e.g. Hadith of Umm Salamah; transmission consensus among Kufan reciters; morphological syntax...',
      validation: (rule) =>
        rule.warning('Primary evidence gives the AI verifiable grounding to contrast against counter-evidence'),
    }),
  ],
  orderings: [
    {
      title: 'Divergence Type',
      name: 'divergenceTypeAsc',
      by: [{ field: 'divergenceType', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      targetSegmentEnglish: 'targetSegmentEnglish',
      scholar: 'source.author',
      divergenceType: 'divergenceType',
      ayahNumber: 'ayah.ayahNumber',
      surahNameEnglish: 'ayah.surah.nameEnglish',
    },
    prepare({ targetSegmentEnglish, scholar, divergenceType, ayahNumber, surahNameEnglish }) {
      const typeLabelMap: Record<string, string> = {
        contradictory: '[Contradictory]',
        complementary: '[Complementary]',
        consensus: '[Consensus]',
      };
      const badge = (divergenceType && typeLabelMap[divergenceType]) || '[Unclassified]';
      const verseLocation = ayahNumber ? ` • v. ${ayahNumber}` : '';
      const surahLabel = surahNameEnglish ? ` (${surahNameEnglish})` : '';

      return {
        title: `${badge} ${targetSegmentEnglish || 'Untitled Claim'}`,
        subtitle: `${scholar || 'Unknown Scholar'}${surahLabel}${verseLocation}`,
      };
    },
  },
});
