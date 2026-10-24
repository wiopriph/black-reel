import { once } from 'node:events';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rename, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';


const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, process.argv[2] ?? 'data/movies.sqlite');
const output = resolve(root, process.argv[3] ?? '.data/d1-import.sql');

if (source === output) {
  throw new Error('The export must not overwrite the source SQLite database.');
}

// D1 accepts at most 100 KB per SQL statement. Leave room for SQL syntax.
const maxStatementBytes = 80_000;
const database = new DatabaseSync(source, { readOnly: true });
const tables = ['movies', 'movie_genres', 'movie_countries', 'movie_collections'];
const temporary = `${output}.tmp`;
await mkdir(dirname(output), { recursive: true });
const stream = createWriteStream(temporary, { encoding: 'utf8' });
// Handle errors even when the stream is not waiting for drain.
let streamError;
stream.on('error', (error) => { streamError = error; });

async function write(sql) {
  if (streamError) {
    throw streamError;
  }
  if (!stream.write(sql)) {
    await once(stream, 'drain');
  }
}

function identifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function literal(value) {
  if (value === null) {
    return 'NULL';
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }
  if (ArrayBuffer.isView(value)) {
    return `X'${Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex')}'`;
  }
  const text = String(value);
  if (text.includes('\0')) {
    return `CAST(X'${Buffer.from(text).toString('hex')}' AS TEXT)`;
  }
  return `'${text.replaceAll("'", "''")}'`;
}

async function exportRows(table, columns, rows) {
  const prefix = `INSERT INTO ${identifier(table)} (${columns.map(identifier).join(',')}) VALUES\n`;
  let values = [];
  let bytes = Buffer.byteLength(prefix) + 2;
  let count = 0;

  for (const row of rows) {
    const value = `(${columns.map(column => literal(row[column])).join(',')})`;
    const size = Buffer.byteLength(value) + 2;
    if (Buffer.byteLength(prefix) + size + 2 > maxStatementBytes) {
      throw new Error(`A row in ${table} exceeds the D1 SQL statement size limit.`);
    }
    if (values.length && bytes + size > maxStatementBytes) {
      await write(`${prefix}${values.join(',\n')};\n`);
      values = [];
      bytes = Buffer.byteLength(prefix) + 2;
    }
    values.push(value);
    bytes += size;
    count++;
  }
  if (values.length) {
    await write(`${prefix}${values.join(',\n')};\n`);
  }
  console.log(`${table}: ${count} rows`);
}

try {
  await write(await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  await write('\n');

  for (const table of tables) {
    const columns = database.prepare(`PRAGMA table_info(${identifier(table)})`).all().map(column => column.name);
    if (!columns.length) {
      throw new Error(`Source table ${table} was not found.`);
    }
    await exportRows(table, columns, database.prepare(`SELECT * FROM ${identifier(table)}`).iterate());
  }

  // Populate FTS5 through its public table, never copy SQLite shadow tables.
  // Bounded INSERTs avoid rebuilding the entire search index in one D1 query.
  const columns = ['rowid', 'name', 'origin_name', 'genre_text', 'country_text'];
  await exportRows('movies_fts', columns, database.prepare(
    'SELECT id AS rowid, name, origin_name, genre_text, country_text FROM movies ORDER BY id',
  ).iterate());

  const finished = once(stream, 'finish');
  stream.end();
  await finished;
  await rename(temporary, output);
  console.log(`D1 import written to ${output}`);
}
catch (error) {
  stream.destroy();
  await rm(temporary, { force: true });
  throw error;
}
finally {
  database.close();
}
