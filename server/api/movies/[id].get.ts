import { rowToMovie, useMoviesDb } from '../../utils/movies-db';


export default defineEventHandler(async (event) => {
  const id = Number.parseInt(getRouterParam(event, 'id') ?? '', 10);

  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid movie id' });
  }

  const db = useMoviesDb();
  const row = db.prepare('SELECT * FROM movies WHERE id = ? LIMIT 1').get(id) as Record<string, unknown> | undefined;

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Movie not found' });
  }

  const genres = db.prepare('SELECT genre FROM movie_genres WHERE movie_id = ? ORDER BY genre').all(id) as { genre: string }[];
  const countries = db.prepare('SELECT country FROM movie_countries WHERE movie_id = ? ORDER BY country').all(id) as { country: string }[];

  return {
    ...rowToMovie(row),
    genres: genres.map(item => item.genre),
    countries: countries.map(item => item.country),
  };
});
