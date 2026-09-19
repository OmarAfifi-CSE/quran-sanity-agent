import { defineField, defineType } from 'sanity';

export const interpretiveClaimType = defineType({
  name: 'interpretiveClaim',
  title: 'âš–ï¸ Interpretive Claim',
  type: 'document',
  fields: [
    defineField({
      name: 'ayah',
      title: 'Referenced Verse',
      type: 'reference',
      to: [{ type: 'ayah' }],
      validation: (rule) => rule.warning('Select referenced Ayah'),
    }),
    defineField({
      name: 'source',
      title: 'Exegetical Source',
      type: 'reference',
      to: [{ type: 'tafsirSource' }],
      validation: (rule) => rule.warning('Select scholar/source'),
    }),
    defineField({
      name: 'divergenceType',
      title: 'Divergence Type',
      type: 'string',
      options: {
        list: [
          { title: 'ðŸ”´ Contradictory Divergence', value: 'contradictory' },
          { title: 'ðŸŸ¡ Complementary Divergence', value: 'complementary' },
          { title: 'ðŸŸ¢ Consensus (Ijma)', value: 'consensus' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.warning('Select a divergence classification'),
    }),
    defineField({
      name: 'targetSegmentEnglish',
      title: 'Focal Topic (English)',
      type: 'string',
    }),
    defineField({
      name: 'targetSegmentArabic',
      title: 'Focal Segment (Arabic)',
      type: 'string',
    }),
    defineField({
      name: 'opinionEnglish',
      title: 'Scholarly Opinion (English)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'opinionArabic',
      title: 'Primary Arabic Quote',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'evidenceEnglish',
      title: 'Evidentiary Basis',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: {
    select: {
      targetSegmentEnglish: 'targetSegmentEnglish',
      divergenceType: 'divergenceType',
      author: 'source.author',
    },
    prepare({ targetSegmentEnglish, divergenceType, author }) {
      const emojiMap: Record<string, string> = {
        contradictory: 'ðŸ”´',
        complementary: 'ðŸŸ¡',
        consensus: 'ðŸŸ¢',
      };
      const emoji = (divergenceType && emojiMap[divergenceType]) || 'âšª';
      return {
        title: `${emoji} ${targetSegmentEnglish || 'Untitled Claim'}`,
        subtitle: author || 'Unknown scholar',
      };
    },
  },
});
