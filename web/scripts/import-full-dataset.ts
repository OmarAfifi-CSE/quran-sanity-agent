import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'qkca243t';
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;

async function importFullDataset() {
  console.log(`\n===============================================================`);
  console.log(` 🏛️ QURAN KNOWLEDGE LAKE: High-Performance Full Dataset Importer`);
  console.log(` Target Project: ${projectId} | Dataset: ${dataset}`);
  console.log(`===============================================================\n`);

  const ndjsonPath = path.resolve(__dirname, '../../quran_full_dataset.ndjson');

  if (!fs.existsSync(ndjsonPath)) {
    console.error(`[ERROR] File not found: ${ndjsonPath}`);
    process.exit(1);
  }

  if (!token) {
    console.warn(`⚠️ [AUTHENTICATION REQUIRED FOR CLOUD IMPORT]`);
    console.log(`To upload all 6,358 documents (114 Surahs + 6,236 Ayahs) to Sanity Cloud:`);
    console.log(`\nOption 1 (Using Token with this script):`);
    console.log(`  $env:SANITY_API_WRITE_TOKEN="your-sanity-write-token"`);
    console.log(`  npx tsx scripts/import-full-dataset.ts\n`);
    console.log(`Option 2 (Using Native Sanity CLI):`);
    console.log(`  npx sanity datasets import quran_full_dataset.ndjson production --replace --token your-sanity-token\n`);
    console.log(`Get a token in 30 seconds at: https://www.sanity.io/manage/project/${projectId}/api#tokens\n`);
    return;
  }

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2025-01-01',
    useCdn: false,
  });

  const fileStream = fs.createReadStream(ndjsonPath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const BATCH_SIZE = 100;
  let batch: any[] = [];
  let totalProcessed = 0;
  const startTime = Date.now();

  console.log(`Reading and streaming 6,358 documents in batches of ${BATCH_SIZE}...\n`);

  for await (const line of rl) {
    if (!line || !line.trim()) continue;
    try {
      const doc = JSON.parse(line);
      batch.push(doc);

      if (batch.length >= BATCH_SIZE) {
        await commitBatch(client, batch, totalProcessed + batch.length);
        totalProcessed += batch.length;
        batch = [];
      }
    } catch (err: any) {
      console.error(`[Parse Error] Line could not be parsed:`, err.message);
    }
  }

  if (batch.length > 0) {
    await commitBatch(client, batch, totalProcessed + batch.length);
    totalProcessed += batch.length;
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🎉 [COMPLETE] Successfully uploaded ${totalProcessed} documents in ${durationSec}s!`);
  console.log(`Your Sanity Studio Knowledge Lake now hosts the entire Quranic Revelation and Scholarly Exegesis!\n`);
}

async function commitBatch(client: any, batch: any[], currentCount: number) {
  const tx = client.transaction();
  for (const doc of batch) {
    tx.createOrReplace(doc);
  }
  await tx.commit();
  const progressPct = ((currentCount / 6358) * 100).toFixed(1);
  process.stdout.write(` [PROGRESS] ${currentCount} / 6358 documents uploaded (${progressPct}%)\r`);
}

importFullDataset().catch((err) => {
  console.error(`\n[FATAL IMPORT ERROR]:`, err);
  process.exit(1);
});
