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
    class="cumquat-card"
    :class="[bordered ? 'cumquat-card--bordered' : '', hoverable ? 'cumquat-card--hoverable' : '']"
  >
    <header v-if="title || $slots.header" class="cumquat-card__header">
      <slot name="header">
        <h3 class="cumquat-card__title">{{ title }}</h3>
      </slot>
    </header>
    <div class="cumquat-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="cumquat-card__footer">
      <slot name="footer" />
    </footer>
  </section>
</template>
