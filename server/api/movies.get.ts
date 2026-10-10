import {
  normalizeQueryValue,
  rowToMovie,
  type SqlValue,
  toFtsQuery,
  toOptionalInt,
  toPositiveInt,
  useMoviesDb,
} from '../utils/movies-db';


export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const db = useMoviesDb();

  const q = normalizeQueryValue(query.q);
  const type = normalizeQueryValue(query.type);
  const genre = normalizeQueryValue(query.genre);
  const country = normalizeQueryValue(query.country);
  const year = toOptionalInt(query.year);
  const yearFrom = toOptionalInt(query.yearFrom);
  const yearTo = toOptionalInt(query.yearTo);
  const page = toPositiveInt(query.page, 1, 10000);
  const limit = toPositiveInt(query.limit, 36, 60);
  const offset = (page - 1) * limit;
  const fts = toFtsQuery(q);

  const where: string[] = [];
  const args: SqlValue[] = [];
  const from = fts ?
    'movies_fts f JOIN movies m ON m.id = f.rowid' :
    'movies m';

  if (fts) {
    where.push('movies_fts MATCH ?');
    args.push(fts);
  }

  if (type) {
    where.push('m.type = ?');
    args.push(type);
  }

  if (genre) {
    where.push('EXISTS (SELECT 1 FROM movie_genres mg WHERE mg.movie_id = m.id AND mg.genre = ?)');
    args.push(genre);
  }

  if (country) {
    where.push('EXISTS (SELECT 1 FROM movie_countries mc WHERE mc.movie_id = m.id AND mc.country = ?)');
    args.push(country);
  }

  if (year !== undefined) {
    where.push('m.year = ?');
    args.push(year);
  }

  if (yearFrom !== undefined) {
    where.push('m.year >= ?');
    args.push(yearFrom);
  }

  if (yearTo !== undefined) {
    where.push('m.year <= ?');
    args.push(yearTo);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = fts ?
    'ORDER BY rank, m.year DESC, m.id DESC' :
    'ORDER BY m.activate_time DESC, m.id DESC';

  const items = db.prepare(`
        SELECT
          m.id, m.name, m.origin_name, m.year, m.type, m.age, m.quality,
          m.poster, m.iframe_url, m.kinopoisk_id, m.imdb_id, m.genre_text, m.country_text
        FROM ${from}
        ${whereSql}
        ${orderSql}
        LIMIT ? OFFSET ?
      `).all(...args, limit, offset) as Record<string, unknown>[];
  const totalRow = db.prepare(`SELECT count(*) AS total FROM ${from} ${whereSql}`).get(...args) as {
    total?: number
  } | undefined;

  const total = Number(totalRow?.total ?? 0);

  return {
    items: items.map(row => rowToMovie(row)),
    page,
    limit,
    total,
    hasMore: offset + items.length < total,
  };
});
