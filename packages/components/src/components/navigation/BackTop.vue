<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否可见 */
    visible?: boolean;
  }>(),
  { visible: true },
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <Transition name="cumquat-fade">
    <button
      v-if="visible"
      type="button"
      aria-label="回到顶部"
      class="cumquat-back-top"
      @click="emit('click')"
    >
      <svg
        class="cumquat-back-top__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M12 19V5m-7 7 7-7 7 7" />
      </svg>
    </button>
  </Transition>
</template>
