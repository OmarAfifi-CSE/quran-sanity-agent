import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';
import { deskStructure } from './deskStructure';

export default defineConfig({
  name: 'default',
  title: 'Quran Knowledge Studio',
  projectId: 'qkca243t',
  dataset: 'production',
  plugins: [
    structureTool({
      title: 'Knowledge Lake',
      structure: deskStructure,
    }),
  ],
  schema: {
    types: schema.types,
  },
});
