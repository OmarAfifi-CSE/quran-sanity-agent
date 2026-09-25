// Read-only count of the live documents selected by studio/context/source-filter.groq.
import { writeFile } from 'node:fs/promises';
process.loadEnvFile('web/.env.local');

const project = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;
if (!project || !/^[a-z0-9]+$/i.test(project) || !/^[a-z0-9_-]+$/i.test(dataset)) {
  throw new Error('Missing or invalid Sanity project/dataset');
}

const selection = `_type in ["surah", "sourceEdition", "tafsirSource"] ||
  (_type == "libraryChunk" && verification == "imported_exact_anchor") ||
  (_type == "interpretiveClaim" && reviewStatus in ["source_checked", "reviewed"] && defined(primaryExcerpt) && defined(sourceUrl) && defined(reviewedBy))`;
const query = `{
  "selected": count(*[${selection}]),
  "surahs": count(*[_type == "surah"]),
  "ayahs": count(*[_type == "ayah"]),
  "libraryChunks": count(*[_type == "libraryChunk" && verification == "imported_exact_anchor"]),
  "sourceEditions": count(*[_type == "sourceEdition"]),
  "tafsirSources": count(*[_type == "tafsirSource"]),
  "checkedClaims": count(*[_type == "interpretiveClaim" && reviewStatus in ["source_checked", "reviewed"] && defined(primaryExcerpt) && defined(sourceUrl) && defined(reviewedBy)])
}`;
const response = await fetch(`https://${project}.api.sanity.io/v2025-01-01/data/query/${dataset}`, {
  method: 'POST',
  headers: {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})},
  body: JSON.stringify({query}),
  signal: AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error(`Sanity count query HTTP ${response.status}`);
const {result} = await response.json();
if (result.selected !== result.surahs + result.libraryChunks + result.sourceEditions + result.tafsirSources + result.checkedClaims) {
  throw new Error('Selected document count does not match component counts');
}
const report = {at: new Date().toISOString(), ...result};
await writeFile('docs/audit/context-source-counts.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
