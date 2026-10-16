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
  <nav class="cumquat-breadcrumb" aria-label="面包屑">
    <template v-for="(item, index) in items" :key="index">
      <span v-if="index > 0" class="cumquat-breadcrumb__separator">/</span>
      <a
        v-if="item.href && index < items.length - 1"
        :href="item.href"
        class="cumquat-breadcrumb__link"
      >
        {{ item.label }}
      </a>
      <span
        v-else
        class="cumquat-breadcrumb__current"
        :class="
          index === items.length - 1
            ? 'cumquat-breadcrumb__current--last'
            : 'cumquat-breadcrumb__current--muted'
        "
        :aria-current="index === items.length - 1 ? 'page' : undefined"
      >
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>
