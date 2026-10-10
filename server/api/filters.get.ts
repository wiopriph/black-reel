import { useMoviesDb } from '../utils/movies-db';


export default defineEventHandler(async () => {
  const db = useMoviesDb();

  const types = db.prepare('SELECT type AS value, count(*) AS count FROM movies WHERE type IS NOT NULL GROUP BY type ORDER BY count DESC, type').all();
  const genres = db.prepare('SELECT genre AS value, count(*) AS count FROM movie_genres GROUP BY genre ORDER BY count DESC, genre LIMIT 80').all();
  const countries = db.prepare('SELECT country AS value, count(*) AS count FROM movie_countries GROUP BY country ORDER BY count DESC, country LIMIT 80').all();
  const years = db.prepare('SELECT min(year) AS min, max(year) AS max FROM movies WHERE year IS NOT NULL').get() as { min?: number, max?: number } | undefined;

  return {
    types,
    genres,
    countries,
    years: {
      min: years?.min,
      max: years?.max,
    },
  };
});
