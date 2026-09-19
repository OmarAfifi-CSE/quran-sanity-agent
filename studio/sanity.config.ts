import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schema } from './schemaTypes';
import { deskStructure } from './deskStructure';
import { StudioLogo } from './StudioLogo';
import './customStudio.css';

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
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
  schema: {
    types: schema.types,
  },
});
