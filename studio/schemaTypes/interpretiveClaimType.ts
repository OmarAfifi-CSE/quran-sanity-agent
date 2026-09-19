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
          { title: 'Consensus (Ijma)', value: 'consensus' },
          { title: 'Complementary Diversity', value: 'complementary' },
          { title: 'Contradictory Divergence', value: 'contradictory' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.warning('Divergence classification recommended'),
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
      placeholder: 'Ø¨ÙØ³Ù’Ù…Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù Ø§Ù„Ø±ÙŽÙ‘Ø­Ù’Ù…ÙŽÙ°Ù†Ù Ø§Ù„Ø±ÙŽÙ‘Ø­ÙÙŠÙ…Ù',
      validation: (rule) =>
        rule.warning('Arabic focal phrase recommended for scripture cross-linking'),
    }),
    defineField({
      name: 'opinionEnglish',
      title: 'Scholarly Synthesis (English)',
      description: 'Concise, rigorous English synthesis of the scholarâ€™s deductive conclusion for AI reasoning',
      type: 'text',
      rows: 4,
      validation: (rule) =>
        rule.warning('English explanation of the scholarly position is recommended'),
    }),
    defineField({
      name: 'opinionArabic',
      title: 'Primary Source Citation (Classical Arabic)',
      description: 'Verbatim excerpt from the scholarâ€™s manuscript serving as untampered evidentiary ground truth',
      type: 'text',
      rows: 4,
      validation: (rule) =>
        rule.warning('Original Arabic quote serves as untampered primary evidence for the agent'),
    }),
    defineField({
      name: 'evidenceEnglish',
      title: 'Evidentiary Basis & Dalil',
      description: 'The primary textual, transmission, or linguistic proof relied upon by the scholar',
      type: 'text',
      rows: 3,
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
      const verseLocation = ayahNumber ? ` â€¢ v. ${ayahNumber}` : '';
      const surahLabel = surahNameEnglish ? ` (${surahNameEnglish})` : '';

      return {
        title: `${badge} ${targetSegmentEnglish || 'Untitled Claim'}`,
        subtitle: `${scholar || 'Unknown Scholar'}${surahLabel}${verseLocation}`,
      };
    },
  },
});
