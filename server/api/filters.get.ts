import { useMoviesDb } from '../utils/movies-db';


type FilterOption = { value: string, count: number };
type YearRange = { min: number | null, max: number | null };

export default defineEventHandler(async (event) => {
  const db = useMoviesDb(event);

  const [[types, genres, countries], years] = await Promise.all([
    db.batch<FilterOption>([
      db.prepare('SELECT type AS value, count(*) AS count FROM movies WHERE type IS NOT NULL GROUP BY type ORDER BY count DESC, type'),
      db.prepare('SELECT genre AS value, count(*) AS count FROM movie_genres GROUP BY genre ORDER BY count DESC, genre LIMIT 80'),
      db.prepare('SELECT country AS value, count(*) AS count FROM movie_countries GROUP BY country ORDER BY count DESC, country LIMIT 80'),
    ]),
    db.prepare('SELECT min(year) AS min, max(year) AS max FROM movies WHERE year IS NOT NULL').first<YearRange>(),
  ]);

  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=3600');

  return {
    types: types!.results,
    genres: genres!.results,
    countries: countries!.results,
    years: {
      min: years?.min,
      max: years?.max,
    },
  };
});
