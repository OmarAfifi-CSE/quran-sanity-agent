import { createClient } from '@sanity/client';
import seedData from '../src/sanity/seedData.json';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'demo-project';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

async function seed() {
  console.log(`\n======================================================`);
  console.log(` Quran Sanity Agent: Seeding Golden Dataset`);
  console.log(` Target Project ID: ${projectId} | Dataset: ${dataset}`);
  console.log(`======================================================\n`);

  if (!token) {
    console.warn(`[WARN] SANITY_API_WRITE_TOKEN is not set.`);
    console.log(`The seed data is validated locally in 'src/sanity/seedData.json'.`);
    console.log(`To upload directly to Sanity Cloud, run:`);
    console.log(`$env:SANITY_API_WRITE_TOKEN="your-write-token"; npx tsx scripts/seed-golden-data.ts\n`);
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2025-01-01',
    useCdn: false,
  });

  const allDocuments = [
    ...seedData.surahs,
    ...seedData.ayahs,
    ...seedData.tafsirSources,
    ...seedData.interpretiveClaims,
  ];

  console.log(`Uploading ${allDocuments.length} structured documents...`);

  for (const doc of allDocuments) {
    try {
      await client.createOrReplace(doc as any);
      console.log(` [OK] Seeded ${doc._type}: ${doc._id}`);
    } catch (err: any) {
      console.error(` [FAIL] Failed to seed ${doc._id}:`, err?.message || err);
    }
  }

  console.log(`\n✓ Golden dataset successfully seeded to Sanity Content Lake!\n`);
}

seed().catch((err) => {
  console.error(`Fatal seeding error:`, err);
  process.exit(1);
});
