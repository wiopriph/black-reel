<script setup lang="ts">
type MovieDetails = {
  id: number
  name: string | null
  origin_name: string | null
  year: number | null
  type: string | null
  age: number | null
  quality: string | null
  poster: string | null
  iframe_url: string | null
  trailer: string | null
  imdb: number | null
  imdb_id: string | null
  kinopoisk: number | null
  kinopoisk_id: string | null
  genre_text: string | null
  country_text: string | null
  seasons_count: number
  episodes_count: number
  genres: string[]
  countries: string[]
};

const route = useRoute();
const id = computed(() => String(route.params.id));

const { data: movie, error } = await useFetch<MovieDetails>(() => `/api/movies/${id.value}`);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Movie not found',
  });
}

const typeLabels: Record<string, string> = {
  'film': 'Фильм',
  'series': 'Сериал',
  'cartoon': 'Мультфильм',
  'cartoon-series': 'Мультсериал',
  'anime-series': 'Аниме-сериал',
  'anime-film': 'Аниме',
  'tv-show': 'ТВ-шоу',
};

const title = computed(() => movie.value?.name || movie.value?.origin_name || 'Фильм');
const movieType = computed(() => {
  const type = movie.value?.type;

  return type ? typeLabels[type] ?? type : '';
});

const subtitle = computed(() => [
  movie.value?.origin_name,
  movie.value?.year,
].filter(Boolean).join(' · '));

const aboutLine = computed(() => [
  movie.value?.year,
  movie.value?.country_text,
  movie.value?.genre_text,
].filter(Boolean).join(' · '));

const kinopoiskUrl = computed(() => movie.value?.kinopoisk_id ?
  `https://www.kinopoisk.ru/film/${movie.value.kinopoisk_id}/` :
  undefined);

const imdbUrl = computed(() => movie.value?.imdb_id ?
  `https://www.imdb.com/title/tt${movie.value.imdb_id}/` :
  undefined);

const stats = computed(() => [
  movie.value?.quality && { label: 'Качество', value: movie.value.quality },
  movieType.value && { label: 'Тип', value: movieType.value },
  movie.value?.age && { label: 'Возраст', value: `${movie.value.age}+` },
  movie.value?.seasons_count && { label: 'Сезоны', value: movie.value.seasons_count },
  movie.value?.episodes_count && { label: 'Эпизоды', value: movie.value.episodes_count },
].filter(Boolean) as { label: string, value: string | number }[]);

useSeoMeta({
  title,
  description: subtitle,
});
</script>

<template>
  <UContainer
    v-if="movie"
    class="max-w-[1280px] py-6 sm:py-8"
  >
    <div class="space-y-5">
      <div class="flex items-center justify-between gap-4">
        <UButton
          to="/"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="-ms-3"
        >
          К каталогу
        </UButton>
      </div>

      <header class="space-y-1">
        <h1 class="max-w-4xl text-2xl font-semibold leading-tight tracking-normal text-highlighted sm:text-4xl">
          {{ title }}
        </h1>

        <p
          v-if="subtitle"
          class="text-sm text-muted sm:text-base"
        >
          {{ subtitle }}
        </p>
      </header>

      <section>
        <div
          v-if="movie.iframe_url"
          class="overflow-hidden rounded-md border border-white/15 bg-black shadow-2xl shadow-black/70"
        >
          <iframe
            :src="movie.iframe_url"
            :title="title"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowfullscreen
            class="aspect-video w-full"
          />
        </div>

        <UAlert
          v-else
          icon="i-lucide-eye-off"
          color="neutral"
          variant="subtle"
          title="Плеер не найден"
          description="У этой записи нет iframe_url."
        />
      </section>

      <section class="border-t border-white/10 pt-6">
        <div class="grid gap-6 lg:grid-cols-[116px_minmax(0,1fr)_150px] lg:items-start">
          <div class="hidden overflow-hidden rounded-md border border-white/10 bg-zinc-950 sm:block">
            <img
              v-if="movie.poster"
              :src="movie.poster"
              :alt="title"
              class="aspect-[2/3] w-full object-cover"
            >

            <div
              v-else
              class="grid aspect-[2/3] place-items-center text-muted"
            >
              <UIcon
                name="i-lucide-image-off"
                class="size-8"
              />
            </div>
          </div>

          <div class="min-w-0 space-y-5">
            <div class="space-y-2">
              <h2 class="text-2xl font-semibold tracking-normal text-highlighted">
                О фильме
              </h2>

              <p
                v-if="aboutLine"
                class="text-base text-muted"
                v-text="aboutLine"
              />
            </div>

            <dl
              v-if="stats.length"
              class="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 xl:grid-cols-3"
            >
              <div
                v-for="item in stats"
                :key="item.label"
                class="min-w-0"
              >
                <dt class="text-muted">
                  {{ item.label }}
                </dt>

                <dd class="mt-1 truncate font-medium text-highlighted">
                  {{ item.value }}
                </dd>
              </div>
            </dl>
          </div>

          <aside class="border-white/10 lg:border-l lg:pl-6">
            <div class="grid gap-5 text-sm">
              <div v-if="movie.kinopoisk">
                <UButton
                  v-if="kinopoiskUrl"
                  :to="kinopoiskUrl"
                  target="_blank"
                  color="neutral"
                  variant="link"
                  trailingIcon="i-lucide-arrow-up-right"
                  class="px-0"
                >
                  Кинопоиск
                </UButton>

                <p
                  v-else
                  class="text-highlighted"
                >
                  Кинопоиск
                </p>

                <p class="mt-1 text-muted">
                  {{ movie.kinopoisk }}
                </p>
              </div>

              <div v-if="movie.imdb">
                <UButton
                  v-if="imdbUrl"
                  :to="imdbUrl"
                  target="_blank"
                  color="neutral"
                  variant="link"
                  trailingIcon="i-lucide-arrow-up-right"
                  class="px-0"
                >
                  IMDb
                </UButton>

                <p
                  v-else
                  class="text-highlighted"
                >
                  IMDb
                </p>

                <p class="mt-1 text-muted">
                  {{ movie.imdb }}
                </p>
              </div>

              <UButton
                v-if="movie.iframe_url"
                :to="movie.iframe_url"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-lucide-external-link"
                size="sm"
                class="mt-1 justify-start px-0 text-muted hover:text-highlighted"
              >
                Плеер
              </UButton>
            </div>
          </aside>
        </div>
      </section>
    </div>
  </UContainer>
</template>
