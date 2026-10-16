<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }>(),
  { min: 0, max: 100, step: 1, disabled: false },
);

const model = defineModel<number>({ default: 0 });

const track = ref<HTMLElement | null>(null);

const percent = computed(() => ((model.value - props.min) / (props.max - props.min)) * 100);

function setFromEvent(event: MouseEvent) {
  if (props.disabled || !track.value) return;
  const rect = track.value.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  const raw = props.min + ratio * (props.max - props.min);
  model.value = Math.round(raw / props.step) * props.step;
}
</script>

<template>
  <div
    class="cumquat-slider"
    :class="disabled ? 'cumquat-slider--disabled' : ''"
    @mousedown="setFromEvent"
  >
    <div ref="track" class="cumquat-slider__track">
      <div class="cumquat-slider__fill" :style="{ width: `${percent}%` }" />
      <span
        class="cumquat-slider__thumb"
        :style="{ left: `${percent}%` }"
        role="slider"
        :aria-valuenow="model"
        :aria-valuemin="min"
        :aria-valuemax="max"
      />
    </div>
    <span class="cumquat-slider__value">{{ model }}</span>
  </div>
</template>
