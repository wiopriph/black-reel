import type { D1Database } from '@cloudflare/workers-types';
import type { H3Event } from 'h3';


export type SqlValue = string | number | null;

export function useMoviesDb(event: H3Event): D1Database {
  const db = event.context.cloudflare?.env?.DB as D1Database | undefined;

  if (!db) {
    throw createError({
      statusCode: 503,
      statusMessage: 'D1 binding DB is not configured',
    });
  }

  return db;
}

export function toPositiveInt(value: unknown, fallback: number, max?: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  const next = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;

  return max ? Math.min(next, max) : next;
}

export function toOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number.parseInt(String(value), 10);

  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeQueryValue(value: unknown) {
  if (Array.isArray(value)) {
    return String(value[0] ?? '').trim();
  }

  return String(value ?? '').trim();
}

export function toFtsQuery(value: string) {
  const terms = value
    .toLocaleLowerCase('ru-RU')
    .match(/[\p{L}\p{N}]+/gu)
    ?.slice(0, 8);

  if (!terms?.length) {
    return '';
  }

  return terms.map(term => `${term}*`).join(' AND ');
}

export function rowToMovie(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: row.name,
    'origin_name': row['origin_name'],
    year: row.year,
    type: row.type,
    age: row.age,
    quality: row.quality,
    poster: row.poster,
    'iframe_url': row['iframe_url'],
    trailer: row.trailer,
    imdb: row.imdb,
    'imdb_id': row['imdb_id'],
    kinopoisk: row.kinopoisk,
    'kinopoisk_id': row['kinopoisk_id'],
    'world_art': row['world_art'],
    'world_art_id': row['world_art_id'],
    'activate_time': row['activate_time'],
    'serial_status': row['serial_status'],
    'genre_text': row['genre_text'],
    'country_text': row['country_text'],
    'seasons_count': row['seasons_count'],
    'episodes_count': row['episodes_count'],
  };
}
