# Backend LMS API

Node/Express API for the LMS.

## Prerequisites

- Node.js (LTS recommended)
- npm (comes with Node.js)

## Setup

Install dependencies:

```bash
npm install
```

## Run (development)

```bash
npm run dev
```

## Environment Variables

If required, create a `.env` file in this folder and add the necessary values.

### Elasticsearch (Course Search)

Optional variables for Elasticsearch-based search:

- `ELASTICSEARCH_ENABLED` (`true` or `false`)
- `ELASTICSEARCH_NODE` (for example: `http://localhost:9200`)
- `ELASTICSEARCH_USERNAME`, `ELASTICSEARCH_PASSWORD` (optional)
- `ELASTICSEARCH_API_KEY` (optional alternative to username/password)
- `ELASTICSEARCH_INDEX_COURSES` (default: `lms_courses`)

If Elasticsearch is disabled or unreachable, search endpoints automatically fall back to MongoDB.

### Reindex Existing Courses

```bash
npm run reindex:course-search
```
