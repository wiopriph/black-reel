<script setup lang="ts">
import type { LocationQueryValue } from 'vue-router';


type FilterOption = {
  value: string
  count: number
};

type Movie = {
  id: number
  name: string | null
  origin_name: string | null
  year: number | null
  type: string | null
  quality: string | null
  poster: string | null
  genre_text: string | null
  country_text: string | null
};

type FilterKey = 'q' | 'type' | 'genre' | 'country' | 'year';
type ChipKey = Exclude<FilterKey, 'q'>;

type Filters = Record<FilterKey, string> & {
  page: number
};

const route = useRoute();
const router = useRouter();

const pageSize = 24;

const typeLabels: Record<string, string> = {
  'film': 'Фильм',
  'series': 'Сериал',
  'cartoon': 'Мультфильм',
  'cartoon-series': 'Мультсериал',
  'anime-series': 'Аниме-сериал',
  'anime-film': 'Аниме',
  'tv-show': 'ТВ-шоу',
};

const filterSelectUi = {
  base: 'h-12 justify-between px-4 text-base font-normal',
  trailingIcon: 'size-5',
};

function queryString(value: LocationQueryValue | LocationQueryValue[] | undefined) {
  const first = Array.isArray(value) ? value[0] : value;

  return String(first ?? '');
}

function queryPage(value: LocationQueryValue | LocationQueryValue[] | undefined) {
  const parsed = Number.parseInt(queryString(value), 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const filters = computed<Filters>(() => ({
  q: queryString(route.query.q),
  type: queryString(route.query.type),
  genre: queryString(route.query.genre),
  country: queryString(route.query.country),
  year: queryString(route.query.year),
  page: queryPage(route.query.page),
}));

const search = ref(filters.value.q);

watch(() => filters.value.q, (q) => {
  search.value = q;
});

watch(search, (q) => {
  if (q !== filters.value.q) {
    setFilter('q', q);
  }
});

const { data: filterData } = await useFetch('/api/filters');

const queryParams = computed(() => ({
  q: filters.value.q || undefined,
  type: filters.value.type || undefined,
  genre: filters.value.genre || undefined,
  country: filters.value.country || undefined,
  year: filters.value.year || undefined,
  page: filters.value.page,
  limit: pageSize,
}));

const { data, status } = await useFetch('/api/movies', {
  query: queryParams,
  watch: [queryParams],
});

const typeOptions = computed(() => ((filterData.value?.types ?? []) as FilterOption[]).map(item => ({
  label: `${typeLabels[item.value] ?? item.value}`,
  value: item.value,
})));

const genreOptions = computed(() => ((filterData.value?.genres ?? []) as FilterOption[]).map(item => ({
  label: `${item.value}`,
  value: item.value,
})));

const countryOptions = computed(() => ((filterData.value?.countries ?? []) as FilterOption[]).map(item => ({
  label: `${item.value}`,
  value: item.value,
})));

const yearOptions = computed(() => {
  const max = Number(filterData.value?.years?.max ?? new Date().getFullYear());
  const min = Number(filterData.value?.years?.min ?? 1895);

  return Array.from({ length: max - min + 1 }, (_, index) => {
    const year = String(max - index);

    return { label: year, value: year };
  });
});

const movies = computed<Movie[]>(() => (data.value?.items ?? []) as Movie[]);
const total = computed(() => Number(data.value?.total ?? 0));
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const isLoading = computed(() => status.value === 'pending');

const activeFilters = computed(() => [
  filters.value.type && { key: 'type', label: typeLabels[filters.value.type] ?? filters.value.type },
  filters.value.genre && { key: 'genre', label: filters.value.genre },
  filters.value.country && { key: 'country', label: filters.value.country },
  filters.value.year && { key: 'year', label: filters.value.year },
].filter(Boolean) as { key: ChipKey, label: string }[]);

function navigate(next: Filters) {
  router.replace({
    query: {
      q: next.q || undefined,
      type: next.type || undefined,
      genre: next.genre || undefined,
      country: next.country || undefined,
      year: next.year || undefined,
      page: next.page > 1 ? String(next.page) : undefined,
    },
  });
}

function setFilter(key: FilterKey, value: string) {
  navigate({ ...filters.value, [key]: value, page: 1 });
}

function resetFilters() {
  navigate({
    q: '',
    type: '',
    genre: '',
    country: '',
    year: '',
    page: 1,
  });
}

function clearFilter(name: ChipKey) {
  setFilter(name, '');
}

function setPage(page: number) {
  navigate({ ...filters.value, page });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function movieTitle(movie: Movie) {
  return movie.name || movie.origin_name || `#${movie.id}`;
}

function movieType(movie: Movie) {
  return movie.type ? typeLabels[movie.type] ?? movie.type : 'Фильм';
}

useSeoMeta({
  title: 'Black Reel',
  description: 'You didn’t see it here.',
});
</script>

<template>
  <UContainer class="max-w-[1280px] py-7 sm:py-9">
    <div class="space-y-12">
      <section class="space-y-6">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="поиск"
          size="xl"
          variant="outline"
          class="w-full"
          :ui="{ base: 'h-14 text-base sm:text-lg bg-black/40 border-white/40 focus-visible:ring-white/50' }"
        />

        <div class="flex flex-wrap items-center gap-4">
          <USelect
            v-if="!filters.type"
            :modelValue="filters.type"
            :items="typeOptions"
            placeholder="Тип"
            size="xl"
            variant="outline"
            :ui="filterSelectUi"
            class="w-36 sm:w-44"
            @update:model-value="setFilter('type', $event)"
          />

          <UButton
            v-else
            color="neutral"
            size="xl"
            variant="outline"
            trailingIcon="i-lucide-x"
            class="h-12 w-36 justify-between px-4 text-base font-normal sm:w-44"
            @click="clearFilter('type')"
          >
            {{ typeLabels[filters.type] ?? filters.type }}
          </UButton>

          <USelect
            v-if="!filters.genre"
            :modelValue="filters.genre"
            :items="genreOptions"
            placeholder="Жанр"
            size="xl"
            variant="outline"
            :ui="filterSelectUi"
            class="w-40 sm:w-52"
            @update:model-value="setFilter('genre', $event)"
          />

          <UButton
            v-else
            color="neutral"
            size="xl"
            variant="outline"
            trailingIcon="i-lucide-x"
            class="h-12 w-40 justify-between px-4 text-base font-normal sm:w-52"
            @click="clearFilter('genre')"
          >
            {{ filters.genre }}
          </UButton>

          <USelect
            v-if="!filters.country"
            :modelValue="filters.country"
            :items="countryOptions"
            placeholder="Страна"
            size="xl"
            variant="outline"
            :ui="filterSelectUi"
            class="w-40 sm:w-52"
            @update:model-value="setFilter('country', $event)"
          />

          <UButton
            v-else
            color="neutral"
            size="xl"
            variant="outline"
            trailingIcon="i-lucide-x"
            class="h-12 w-40 justify-between px-4 text-base font-normal sm:w-52"
            @click="clearFilter('country')"
          >
            {{ filters.country }}
          </UButton>

          <USelect
            v-if="!filters.year"
            :modelValue="filters.year"
            :items="yearOptions"
            placeholder="Год"
            size="xl"
            variant="outline"
            :ui="filterSelectUi"
            class="w-32 sm:w-36"
            @update:model-value="setFilter('year', $event)"
          />

          <UButton
            v-else
            color="neutral"
            size="xl"
            variant="outline"
            trailingIcon="i-lucide-x"
            class="h-12 w-32 justify-between px-4 text-base font-normal sm:w-36"
            @click="clearFilter('year')"
          >
            {{ filters.year }}
          </UButton>

          <UButton
            v-if="activeFilters.length"
            color="neutral"
            size="xl"
            variant="ghost"
            class="h-12"
            @click="resetFilters"
          >
            Сбросить
          </UButton>
        </div>
      </section>

      <section class="space-y-5">
        <div
          v-if="isLoading"
          class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        >
          <USkeleton
            v-for="item in pageSize"
            :key="item"
            class="aspect-[2/3] rounded-md"
          />
        </div>

        <div
          v-else-if="movies.length"
          class="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
        >
          <NuxtLink
            v-for="movie in movies"
            :key="movie.id"
            :to="`/movies/${movie.id}`"
            class="group block rounded-md focus-visible:outline-3 outline-primary/30"
          >
            <div class="overflow-hidden rounded-md border border-white/10 bg-zinc-950">
              <img
                v-if="movie.poster"
                :src="movie.poster"
                :alt="movieTitle(movie)"
                loading="lazy"
                class="aspect-[2/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              >

              <div
                v-else
                class="grid aspect-[2/3] place-items-center bg-zinc-950 text-muted"
              >
                <UIcon
                  name="i-lucide-image-off"
                  class="size-8"
                />
              </div>
            </div>

            <div class="mt-3 space-y-1">
              <h2 class="line-clamp-2 min-h-9 text-[13px] font-medium leading-[18px] text-highlighted sm:text-sm">
                {{ movieTitle(movie) }}
              </h2>

              <p class="text-xs text-muted sm:text-[13px]">
                {{ movie.year || '—' }}
                <span class="mx-1">·</span>
                {{ movieType(movie) }}
              </p>
            </div>
          </NuxtLink>
        </div>

        <UAlert
          v-else
          icon="i-lucide-search-x"
          color="neutral"
          variant="subtle"
          title="Пленка не найдена"
          description="Измени запрос или сбрось часть фильтров."
        />

        <div
          v-if="totalPages > 1"
          class="flex items-center justify-center gap-2 pt-2"
        >
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            :disabled="filters.page <= 1"
            @click="setPage(filters.page - 1)"
          />

          <span class="min-w-24 text-center text-sm text-muted">
            {{ filters.page }} / {{ totalPages }}
          </span>

          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            :disabled="filters.page >= totalPages"
            @click="setPage(filters.page + 1)"
          />
        </div>
      </section>
    </div>
  </UContainer>
</template>
