<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 分割线方向 */
    orientation?: 'horizontal' | 'vertical';
    /** 分割线文案 */
    label?: string;
    dashed?: boolean;
  }>(),
  { orientation: 'horizontal', label: '', dashed: false },
);
</script>

<template>
  <div
    class="cumquat-divider"
    :class="[`cumquat-divider--${orientation}`, dashed ? 'cumquat-divider--dashed' : '']"
    role="separator"
    :aria-orientation="orientation"
  >
    <template v-if="orientation === 'horizontal'">
      <span v-if="!label || !$slots.default" class="cumquat-divider__line" />
      <template v-else>
        <span class="cumquat-divider__line" />
        <span class="cumquat-divider__label"
          ><slot>{{ label }}</slot></span
        >
        <span class="cumquat-divider__line" />
      </template>
    </template>
    <span v-else class="cumquat-divider__line" />
  </div>
</template>
