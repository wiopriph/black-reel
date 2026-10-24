-- Schema for a new, empty D1 database. The catalogue is read-only.
CREATE TABLE movie_collections(
  movie_id INT,
  collection_id TEXT,
  collection TEXT
);

CREATE TABLE movie_countries(
  movie_id INT,
  country_id TEXT,
  country TEXT
);

CREATE TABLE movie_genres(
  movie_id INT,
  genre_id TEXT,
  genre TEXT
);

CREATE TABLE movies (
              id INTEGER PRIMARY KEY,
              name TEXT,
              origin_name TEXT,
              year INTEGER,
              type TEXT,
              age INTEGER,
              quality TEXT,
              poster TEXT,
              iframe_url TEXT,
              trailer TEXT,
              imdb REAL,
              imdb_id TEXT,
              kinopoisk REAL,
              kinopoisk_id TEXT,
              world_art REAL,
              world_art_id TEXT,
              activate_time TEXT,
              serial_status TEXT,
              genre_text TEXT,
              country_text TEXT,
              collection_text TEXT,
              seasons_count INTEGER NOT NULL DEFAULT 0,
              episodes_count INTEGER NOT NULL DEFAULT 0
            );

CREATE VIRTUAL TABLE movies_fts USING fts5(
              name,
              origin_name,
              genre_text,
              country_text,
              content='movies',
              content_rowid='id',
              tokenize='unicode61'
            );

CREATE INDEX idx_movie_collections_collection ON movie_collections(collection);

CREATE UNIQUE INDEX idx_movie_collections_pk ON movie_collections(movie_id, collection_id);

CREATE INDEX idx_movie_countries_country ON movie_countries(country);

CREATE UNIQUE INDEX idx_movie_countries_pk ON movie_countries(movie_id, country_id);

CREATE INDEX idx_movie_genres_genre ON movie_genres(genre);

CREATE UNIQUE INDEX idx_movie_genres_pk ON movie_genres(movie_id, genre_id);

CREATE INDEX idx_movies_imdb_id ON movies(imdb_id);

CREATE INDEX idx_movies_kinopoisk_id ON movies(kinopoisk_id);

CREATE INDEX idx_movies_quality ON movies(quality);

CREATE INDEX idx_movies_type ON movies(type);

CREATE INDEX idx_movies_type_year ON movies(type, year);

CREATE INDEX idx_movies_year ON movies(year);

CREATE INDEX idx_movies_activate_time ON movies(activate_time DESC, id DESC);
CREATE INDEX idx_movies_type_activate_time ON movies(type, activate_time DESC, id DESC);
