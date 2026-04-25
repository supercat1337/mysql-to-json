# mysql-to-json

A modern GUI tool to explore MySQL databases – view table schemas and detailed index statistics in JSON format.

## Overview

`mysql-to-json` connects to a MySQL database and provides a clean web interface to:

- List all databases on the server
- Browse table structures (columns, data types, keys, etc.)
- Generate JSON output of table schemas
- **New:** Fetch and display detailed index statistics (index name, columns, uniqueness, cardinality, etc.)

The tool now uses a modern **vanilla CSS** design (no Bootstrap) with a responsive card layout and two independent output panels – one for column schemas and one for index information.

## Installation

Install globally via npm:

```bash
npm install -g @supercat1337/mysql-to-json
```

## Usage

Start the tool with the following command:

```bash
mysql-to-json [--port PORT] [--db_port PORT] [--db_host HOST] [--user USER] [--password PASS] [--help]
```

### Options

| Option       | Description        | Default     |
| ------------ | ------------------ | ----------- |
| `--port`     | Web interface port | `3000`      |
| `--db_port`  | MySQL server port  | `3306`      |
| `--db_host`  | MySQL host         | `localhost` |
| `--user`     | MySQL user         | `root`      |
| `--password` | MySQL password     | `""`        |
| `--help`     | Show help message  | –           |

### Example

Connect to a remote MySQL instance and start the tool on port `4000`:

```bash
mysql-to-json --db_host my-db.example.com --db_port 3307 --user admin --password secret --port 4000
```

Then open `http://localhost:4000` in your browser.

## Features

### 1. Database & Table Explorer

- Click on a database to load its tables.
- Select tables using checkboxes.
- Buttons to **Check all** / **Uncheck all** tables.

### 2. Schema Output

For the selected tables, you can generate:

- **Raw JSON** – full `INFORMATION_SCHEMA.COLUMNS` data.
- **JS Objects** – JavaScript object literals with column metadata.
- **JS Class** – ES6 class definitions (e.g., `UsersItem`) with typed properties.

### 3. Index Statistics (New)

- Click **“Fetch Index Stats for checked tables”** to retrieve detailed index information from `INFORMATION_SCHEMA.STATISTICS`.
- Output includes:
    - Index name
    - Column name within the index
    - Uniqueness (non‑unique flag)
    - Index type (BTREE, HASH, etc.)
    - Cardinality (estimate of unique values)
    - Sub‑part length, nullability, collation ordering.

## Development

### Build from source

```bash
git clone https://github.com/supercat1337/mysql-to-json.git
cd mysql-to-json
npm install
npm run build   # bundles frontend JS
```

### Project structure (after cleanup)

```
├── app/                 # Backend (Express server, MySQL connection)
├── bin/                 # CLI entry point
├── dist/public/         # Static assets (HTML, bundled JS, CSS)
├── src/frontend/        # Frontend modules (API calls, UI helpers, schema converters)
├── .prettierrc          # Code formatter config
└── package.json
```

## License

MIT

```

```
