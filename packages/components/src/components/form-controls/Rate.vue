<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 星星总数 */
    count?: number;
    disabled?: boolean;
    /** 是否允许清除（再次点击取消） */
    allowClear?: boolean;
  }>(),
  { count: 5, disabled: false, allowClear: true },
);

const model = defineModel<number>({ default: 0 });

/** 悬停预览值；0 表示未悬停 */
const hoverValue = ref(0);

function displayValue() {
  return hoverValue.value > 0 ? hoverValue.value : model.value;
}

function pick(star: number) {
  if (props.allowClear && star === model.value) {
    model.value = 0;
  } else {
    model.value = star;
  }
}
</script>

<template>
  <div class="cumquat-rate" role="radiogroup" @mouseleave="hoverValue = 0">
    <button
      v-for="star in count"
      :key="star"
      type="button"
      role="radio"
      :aria-checked="star <= model"
      :disabled="disabled"
      class="cumquat-rate__star"
      :class="[
        disabled ? 'cumquat-rate__star--disabled' : '',
        star <= displayValue() ? 'cumquat-rate__star--active' : '',
      ]"
      @mouseenter="!disabled && (hoverValue = star)"
      @click="!disabled && pick(star)"
    >
      <svg
        class="cumquat-rate__icon"
        viewBox="0 0 24 24"
        :fill="star <= displayValue() ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      >
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1z" />
      </svg>
    </button>
    <span v-if="model > 0" class="cumquat-rate__value">{{ model }}</span>
  </div>
</template>
