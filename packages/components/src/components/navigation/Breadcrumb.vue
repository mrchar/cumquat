<script setup lang="ts">
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

withDefaults(
  defineProps<{
    items: BreadcrumbItem[];
  }>(),
  { items: () => [] },
);
</script>

<template>
  <nav class="cumquat-breadcrumb flex flex-wrap items-center gap-1.5 text-sm" aria-label="面包屑">
    <template v-for="(item, index) in items" :key="index">
      <span v-if="index > 0" class="cumquat-breadcrumb__separator text-cumquat-text-muted">/</span>
      <a
        v-if="item.href && index < items.length - 1"
        :href="item.href"
        class="cumquat-breadcrumb__link text-cumquat-text-muted transition-colors hover:text-cumquat-accent"
      >
        {{ item.label }}
      </a>
      <span
        v-else
        class="cumquat-breadcrumb__current font-medium"
        :class="index === items.length - 1 ? 'text-cumquat-text' : 'text-cumquat-text-muted'"
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>
