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
  <div class="cumquat-skeleton flex animate-pulse gap-3" aria-hidden="true">
    <div
      v-if="avatar"
      class="cumquat-skeleton__avatar size-10 shrink-0 rounded-full bg-cumquat-surface-3"
    />
    <div class="cumquat-skeleton__lines flex flex-1 flex-col gap-2.5">
      <div
        v-for="i in rows"
        :key="i"
        class="cumquat-skeleton__line h-3.5 rounded bg-cumquat-surface-3"
        :class="i === rows ? 'w-2/3' : 'w-full'"
      />
    </div>
  </div>
</template>
