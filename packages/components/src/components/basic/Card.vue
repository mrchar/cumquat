<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    /** 是否带描边 */
    bordered?: boolean;
    /** 是否带悬浮阴影 */
    hoverable?: boolean;
  }>(),
  { title: '', bordered: true, hoverable: false },
);
</script>

<template>
  <section
    class="cumquat-card overflow-hidden rounded-cumquat bg-cumquat-surface transition-shadow"
    :class="[
      bordered ? 'border border-cumquat-border' : '',
      hoverable ? 'hover:shadow-cumquat-overlay' : '',
    ]"
  >
    <header
      v-if="title || $slots.header"
      class="cumquat-card__header border-b border-cumquat-border px-5 py-4"
    >
      <slot name="header">
        <h3 class="text-base font-semibold text-cumquat-text">{{ title }}</h3>
      </slot>
    </header>
    <div class="cumquat-card__body px-5 py-4 text-sm text-cumquat-text">
      <slot />
    </div>
    <footer
      v-if="$slots.footer"
      class="cumquat-card__footer border-t border-cumquat-border bg-cumquat-surface-2 px-5 py-3 text-sm text-cumquat-text-muted"
    >
      <slot name="footer" />
    </footer>
  </section>
</template>
