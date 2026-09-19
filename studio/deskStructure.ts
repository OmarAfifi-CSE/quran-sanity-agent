import { BookIcon } from '@sanity/icons/Book';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { UsersIcon } from '@sanity/icons/Users';
import { SplitVerticalIcon } from '@sanity/icons/SplitVertical';
import { DocumentsIcon } from '@sanity/icons/Documents';
import { WarningOutlineIcon } from '@sanity/icons/WarningOutline';
import { SplitHorizontalIcon } from '@sanity/icons/SplitHorizontal';
import { CheckmarkCircleIcon } from '@sanity/icons/CheckmarkCircle';
import type { StructureResolver } from 'sanity/structure';

export const deskStructure: StructureResolver = (S) =>
  S.list()
    .id('root')
    .title('Quran Knowledge Studio')
    .items([
      S.documentTypeListItem('surah').title('Surahs').icon(BookIcon),
      S.documentTypeListItem('ayah').title('Verses (Ayahs)').icon(DocumentTextIcon),
      S.divider(),
      S.documentTypeListItem('tafsirSource').title('Tafsir Sources').icon(UsersIcon),
      S.divider(),
      S.listItem()
        .id('claimsSection')
        .title('Interpretive Claims')
        .icon(SplitVerticalIcon)
        .child(
          S.list()
            .id('claimsList')
            .title('Interpretive Claims')
            .items([
              S.listItem()
                .id('allClaimsItem')
                .title('All Claims')
                .icon(DocumentsIcon)
                .child(
                  S.documentTypeList('interpretiveClaim')
                    .title('All Claims')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                ),
              S.divider(),
              S.listItem()
                .id('contradictoryClaims')
                .title('Contradictory Claims')
                .icon(WarningOutlineIcon)
                .child(
                  S.documentList()
                    .id('contradictoryList')
                    .title('Contradictory Claims (اختلاف تضاد)')
                    .apiVersion('2024-01-01')
                    .filter('_type == "interpretiveClaim" && divergenceType == "contradictory"')
                ),
              S.listItem()
                .id('complementaryClaims')
                .title('Complementary Claims')
                .icon(SplitHorizontalIcon)
                .child(
                  S.documentList()
                    .id('complementaryList')
                    .title('Complementary Claims (اختلاف تنوع)')
                    .apiVersion('2024-01-01')
                    .filter('_type == "interpretiveClaim" && divergenceType == "complementary"')
                ),
              S.listItem()
                .id('consensusClaims')
                .title('Consensus Claims')
                .icon(CheckmarkCircleIcon)
                .child(
                  S.documentList()
                    .id('consensusList')
                    .title('Consensus Claims (إجماع)')
                    .apiVersion('2024-01-01')
                    .filter('_type == "interpretiveClaim" && divergenceType == "consensus"')
                ),
            ])
        ),
    ]);
