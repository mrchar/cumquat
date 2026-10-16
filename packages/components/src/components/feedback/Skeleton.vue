<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否显示头像骨架 */
    avatar?: boolean;
    /** 文本行数 */
    rows?: number;
  }>(),
  { avatar: false, rows: 3 },
);
</script>

<template>
  <div class="cumquat-skeleton" aria-hidden="true">
    <div v-if="avatar" class="cumquat-skeleton__avatar" />
    <div class="cumquat-skeleton__lines">
      <div
        v-for="i in rows"
        :key="i"
        class="cumquat-skeleton__line"
        :class="i === rows ? 'cumquat-skeleton__line--last' : 'cumquat-skeleton__line--full'"
      />
    </div>
  </div>
</template>
