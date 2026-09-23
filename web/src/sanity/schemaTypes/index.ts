import { type SchemaTypeDefinition } from "sanity";
import { surahType } from "./surahType";
import { ayahType } from "./ayahType";
import { tafsirSourceType } from "./tafsirSourceType";
import { interpretiveClaimType } from "./interpretiveClaimType";
import { libraryChunkType } from "./libraryChunkType";
import { sourceEditionType } from "./sourceEditionType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    surahType,
    ayahType,
    tafsirSourceType,
    interpretiveClaimType,
    libraryChunkType,
    sourceEditionType,
  ],
};
