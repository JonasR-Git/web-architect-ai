# Reproducible sample workflow

This walkthrough demonstrates navigation and review in the local application. It uses built-in responses; it is not an AI quality evaluation.

## Setup

Use Node.js 22.12 or newer, then run:

```bash
npm ci
cp .env.example .env.local
npm run dev -- --hostname 127.0.0.1
```

Keep `USE_MOCK=true` and leave the provider key empty.

## Intake to blueprint

1. Open `http://localhost:3000` and confirm the **Sample mode** banner.
2. Enter `https://example.com` and select **Start Architecture Analysis**.
3. The SSE endpoint returns the predefined sample: Home, About and Contact. No live website inspection is claimed.
4. Review the structure, then select **Start AI Analysis**.
5. Built-in critique, migration and component results populate the blueprint. Their audit scores and findings are illustrative sample data.
6. Open the page-mapping tab to inspect the source/target relationships. The proposed structure may add or split targets, so its count need not match the source count.
7. Review or edit the mappings before continuing to page specifications and design drafts.

The UI is still partly bilingual. The project description and guide are English; this walkthrough names the initial English controls and identifies the mapping tab by purpose.

## Interactive project guide

Open `/demo/index.html` locally, or use the public project guide linked in the README.

1. Select the About source page.
2. Open **Review the blueprint** and change `/studio` to `/story`.
3. Open **Export a draft**. The JSON shows your new target path.
4. Download `sample-blueprint.json`; it contains `sampleData: true` and `status: "draft-for-review"`.
5. Try a conflicting target such as `/contact`. The guide marks the input invalid and disables export until it is corrected.

The guide makes no model calls and uses no customer data. Its purpose is to explain the workbench's decision flow before installation.
