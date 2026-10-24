import { rowToMovie, useMoviesDb } from '../../utils/movies-db';


export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') ?? '', 10);

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid movie id' });
  }

  const db = useMoviesDb(event);
  const row = await db.prepare('SELECT * FROM movies WHERE id = ? LIMIT 1').bind(id)
    .first<Record<string, unknown>>();

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Movie not found' });
  }

  const [genres, countries] = await db.batch<{ genre?: string, country?: string }>([
    db.prepare('SELECT genre FROM movie_genres WHERE movie_id = ? ORDER BY genre').bind(id),
    db.prepare('SELECT country FROM movie_countries WHERE movie_id = ? ORDER BY country').bind(id),
  ]);

  return {
    ...rowToMovie(row),
    genres: genres!.results.map(item => item.genre),
    countries: countries!.results.map(item => item.country),
  };
});
