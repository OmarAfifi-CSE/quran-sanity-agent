# Quran Evidence Workspace

A bilingual Quran research application with exact verse text, attributed commentary excerpts and evidence-linked reading notes. Sanity Studio manages the content; Sanity Context provides retrieval when configured. The interface keeps original source passages available alongside generated notes.

## Run locally

Requires Node.js 22 and npm. Install each application using its own lockfile:

```sh
npm ci --prefix web --workspaces=false
npm ci --prefix studio --workspaces=false
```

Copy [web/.env.example](web/.env.example) to `web/.env.local` and set `QURAN_DATA_MODE=local` for a reproducible demo. The bundled corpus supports local retrieval without credentials. AI reading notes require a Gemini key; live Sanity retrieval requires your project configuration and server credentials. Keep all tokens server-side.

```sh
npm run dev
npm run dev:studio
```

The web application opens at http://localhost:3000. Studio opens at http://localhost:3333 and is currently configured for the original Sanity project; change its configuration when using your own project.

## Verify

```sh
npm test
npm run lint
npm run type-check
npm run type-check --prefix studio
npm run build
npm run build:studio
npm run audit:data
node scripts/verify-reference.mjs
```

The test suite checks all 6,236 runtime verses against the preserved Tanzil reference, schema consistency, citation handling and retrieval behavior. CI runs the application checks with local data. Maintenance scripts run from the repository root and write local audit receipts; scripts that access or edit Sanity require separate credentials.

## Repository map

- `web/`: Next.js application, local corpus, commentary library and tests.
- `studio/`: Sanity content schemas, editorial interface and Context projections.
- `data/reference/`: verbatim reference text required by integrity checks.
- `scripts/`: content audits, retrieval evaluations and maintenance utilities.
- `quran_full_dataset.ndjson`: source dataset for import and validation.

Local handoffs, historical records and audit receipts are kept in `docs/`, which is intentionally ignored by Git. Runtime fixtures and configuration remain versioned outside that directory.

## Content and release limits

See [DATA_LICENSE.md](DATA_LICENSE.md) for text attribution and source permissions. Exact-text checks do not establish scholarly approval or redistribution rights for imported translations and commentary. Some editions have known coverage gaps; full Al-Razi and Al-Zamakhshari editions are not included. The application must disclose missing evidence rather than invent references.

A public release still requires source permissions, specialist review, a working contact mailbox and deployment-wide abuse controls. Contact address: sanity@omar-afifi.com; mailbox operation must be verified before public launch.
