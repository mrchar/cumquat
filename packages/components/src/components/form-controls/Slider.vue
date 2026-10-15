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
    class="cumquat-slider flex w-full items-center"
    :class="disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
    @mousedown="setFromEvent"
  >
    <div
      ref="track"
      class="cumquat-slider__track relative h-1.5 w-full rounded-full bg-cumquat-surface-3"
    >
      <div
        class="cumquat-slider__fill absolute inset-y-0 left-0 rounded-full bg-cumquat-accent"
        :style="{ width: `${percent}%` }"
      />
      <span
        class="cumquat-slider__thumb absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cumquat-accent bg-cumquat-surface shadow transition-transform"
        :class="disabled ? '' : 'hover:scale-110'"
        :style="{ left: `${percent}%` }"
        role="slider"
        :aria-valuenow="model"
        :aria-valuemin="min"
        :aria-valuemax="max"
      />
    </div>
    <span class="cumquat-slider__value ml-3 w-8 text-right text-xs text-cumquat-text-muted">{{
      model
    }}</span>
  </div>
</template>
