<script setup lang="ts">
const colorMode = useColorMode();

colorMode.preference = 'dark';

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: 'ru',
  },
});

const title = 'Black Reel';
const description = 'You didn’t see it here.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
});
</script>

<template>
  <UApp>
    <UHeader class="border-b border-white/10 bg-black/90 backdrop-blur">
      <template #left>
        <NuxtLink
          to="/"
          class="flex items-center gap-2 rounded-md p-1 -ms-1 focus-visible:outline-3 outline-primary/25"
        >
          <AppLogo class="size-8 shrink-0" />

          <div class="leading-tight">
            <span class="block font-semibold tracking-normal">Black Reel</span>
          </div>
        </NuxtLink>
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>
  </UApp>
</template>
