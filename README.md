# dataref-kemdikbud

An unofficial scraper API for [referensi.data.kemdikbud.go.id](https://referensi.data.kemdikbud.go.id), built with Node.js and Express. This project extracts and serves structured educational institution data from the Indonesian Ministry of Education website.

## Features

- 🎓 Access to **education reference data** from PAUD, DIKDAS, DIKMEN, DIKTI, etc.
- 🌍 Full scraping support across **Province → City/Regency → District → Institutions** levels
- 🧠 Dynamic content extraction with normalized output (camelCase keys, number conversion)
- ⚡ JSON file caching with configurable TTL (persistent across restarts)
- 📦 Export to CSV via query param `?export=csv`
- 🏢 Fetch full **institution detail** (contacts, documents, location, etc)

## API Usage

All endpoints return JSON by default. For CSV, append `?export=csv` to list routes.

### Get Main Categories

```http
GET /
```

### Get Provinces for a Menu

```http
GET /pendidikan/:menu
# Example: /pendidikan/paud
```

### Get Subregions (Province → City/Regency → District → Institutions)

```http
GET /pendidikan/:menu/:areaId/:levelId
# Example: /pendidikan/paud/010000/1
# Example: /pendidikan/paud/010100/2
# Example: /pendidikan/paud/010101/3
```

### Get Institution Detail by NPSN

```http
GET /pendidikan/npsn/:npsn
# Example: /pendidikan/npsn/00000000
```

## CSV Export Notes

- Only list-based endpoints support CSV (`/`, `/pendidikan/:menu`, `/pendidikan/:menu/:areaId/:levelId`)
- Use `?export=csv` query parameter to get CSV
- CSV fields are always quoted and escaped for Excel/Sheets compatibility
- Detail endpoints like `/npsn` do **not** support CSV export

## Quick Start

```bash
git clone https://github.com/daffaalam/dataref-kemdikbud.git
cd dataref-kemdikbud
npm install
npm run dev  # for development with auto-reload
```

## Tested Environments

- Node.js v22.x (LTS)
- npm v10+

## Configuration

Via `.env` or `config.js`:

| Key             | Description                       | Default                                  |
| --------------- | --------------------------------- | ---------------------------------------- |
| `PORT`          | Port to run server                | `3000`                                   |
| `BASE_URL`      | Base scrape target                | `https://referensi.data.kemdikbud.go.id` |
| `CACHE_ENABLED` | Enable/disable file caching       | `true` if `NODE_ENV=production`          |
| `CACHE_TTL`     | Milliseconds before cache expires | `86400000` (24 hours)                    |
| `CACHE_DIR`     | Cache directory path              | `./.cache`                               |

## Folder Structure

```
.
├── routes/            # Express route definitions
├── utils/             # Scraper logic: cheerio, axios, parsing
├── cache/             # JSON file caching system
├── middleware/        # Injects apiBase dynamically
├── index.js           # Server entry point
```

## Notes

- This project is not affiliated with Kemdikbud.
- Use responsibly; scraping may be rate-limited by the source.
- Contributions and issues are welcome!

## License

MIT License — &copy; daffaalam  
This project is unofficial and for educational purposes only.
