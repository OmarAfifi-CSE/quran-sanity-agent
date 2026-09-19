import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';

export default defineConfig({
  name: 'default',
  title: 'Quran Knowledge Studio',
  projectId: 'qkca243t',
  dataset: 'production',
  plugins: [
    structureTool(),
  ],
  schema: {
    types: schema.types,
  },
});
