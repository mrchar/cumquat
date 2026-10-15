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
    class="cumquat-divider flex items-center text-sm text-cumquat-text-muted"
    :class="orientation === 'vertical' ? 'mx-1 h-4 self-stretch' : 'my-4 w-full'"
    role="separator"
    :aria-orientation="orientation"
  >
    <template v-if="orientation === 'horizontal'">
      <span
        v-if="!label || !$slots.default"
        class="cumquat-divider__line flex-1"
        :class="dashed ? 'border-t border-dashed border-cumquat-border' : 'h-px bg-cumquat-border'"
      />
      <template v-else>
        <span
          class="cumquat-divider__line flex-1"
          :class="
            dashed ? 'border-t border-dashed border-cumquat-border' : 'h-px bg-cumquat-border'
          "
        />
        <span class="cumquat-divider__label px-3"
          ><slot>{{ label }}</slot></span
        >
        <span
          class="cumquat-divider__line flex-1"
          :class="
            dashed ? 'border-t border-dashed border-cumquat-border' : 'h-px bg-cumquat-border'
          "
        />
      </template>
    </template>
    <span
      v-else
      class="cumquat-divider__line flex-1"
      :class="dashed ? 'border-l border-dashed border-cumquat-border' : 'w-px bg-cumquat-border'"
    />
  </div>
</template>
