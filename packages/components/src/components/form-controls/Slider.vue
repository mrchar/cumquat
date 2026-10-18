<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useActionValue, useDraggable, useFormField } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

type SliderValue = number | [number, number];

export interface SliderMark {
  value: number;
  label?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: SliderValue;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    /** 区间选择：modelValue 为 [低值, 高值] */
    range?: boolean;
    /** 刻度（数值或 { value, label }） */
    marks?: Array<number | SliderMark>;
    /** 是否显示当前值文字 */
    showValue?: boolean;
    /** 滑动动作：最终值变更时执行（拖动过程仅预览，松手后提交），动作失败自动回退旧值 */
    action?: ActionLike;
  }>(),
  {
    modelValue: undefined,
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    range: false,
    marks: () => [],
    showValue: true,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: SliderValue];
  change: [value: SliderValue];
  /** 滑动动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 滑动动作：最终值提交，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

const field = useFormField<SliderValue>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: props.range ? [props.min, props.max] : props.min,
  disabled: () => props.disabled || actionPending.value,
});

/** 最近一次提交值（受控 prop 不回写时拖拽仍连续） */
const baseValue = ref<SliderValue>(
  props.modelValue ?? (props.range ? [props.min, props.max] : props.min),
);
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) baseValue.value = next;
  },
);

const span = computed(() => props.max - props.min);

const normalizedMarks = computed<SliderMark[]>(() =>
  props.marks.map((mark) => (typeof mark === 'number' ? { value: mark } : mark)),
);

const low = computed(() => (props.range ? (baseValue.value as [number, number])[0] : props.min));
const high = computed(() =>
  props.range ? (baseValue.value as [number, number])[1] : (baseValue.value as number),
);

function toPercent(value: number) {
  if (span.value === 0) return 0;
  return ((value - props.min) / span.value) * 100;
}

function quantize(value: number) {
  const stepped = Math.round(value / props.step) * props.step;
  return Math.min(props.max, Math.max(props.min, stepped));
}

function ratioToValue(ratio: number) {
  return quantize(props.min + ratio * span.value);
}

/** 当前拖拽的指针（区间模式 0=低 1=高） */
const activeThumb = ref<0 | 1>(0);

const trackRef = ref<HTMLElement | null>(null);

/** 应用滑块值（含回退时的恢复路径） */
function applyValue(next: SliderValue) {
  baseValue.value = next;
  emit('update:modelValue', next);
  emit('change', next);
  field.handleChange(next);
}

function commit(next: SliderValue) {
  const previous = baseValue.value;
  applyValue(next);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(next),
    revert: () => applyValue(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

/** 拖动中的即时应用：有 action 时仅内部预览（不逐帧提交），结束时统一 commit */
function applyRatio(ratio: number) {
  const next = ratioToValue(ratio);
  if (!props.range) {
    if (props.action) {
      baseValue.value = next;
      return;
    }
    commit(next);
    return;
  }
  const [lo, hi] = baseValue.value as [number, number];
  if (activeThumb.value === 0) {
    const merged = [Math.min(next, hi), hi] as SliderValue;
    if (props.action) baseValue.value = merged;
    else commit(merged);
  } else {
    const merged = [lo, Math.max(next, lo)] as SliderValue;
    if (props.action) baseValue.value = merged;
    else commit(merged);
  }
}

useDraggable(trackRef, {
  axis: 'x',
  disabled: () => props.disabled || actionPending.value,
  onStart: (position) => {
    const next = ratioToValue(position.ratioX);
    if (props.range) {
      const [lo, hi] = baseValue.value as [number, number];
      // 离哪个指针近就拖哪个；等距时按下半区归低指针
      activeThumb.value = Math.abs(next - lo) <= Math.abs(hi - next) ? 0 : 1;
    }
    applyRatio(position.ratioX);
  },
  onMove: (position) => applyRatio(position.ratioX),
  // 有 action 时拖动过程只预览，松手统一提交一次
  onEnd: () => {
    if (props.action) commit(baseValue.value);
  },
});

/* ---------- 键盘步进 ---------- */
function nudge(thumb: 0 | 1, delta: number) {
  if (props.disabled || actionPending.value) return;
  if (!props.range) {
    commit(quantize((baseValue.value as number) + delta));
    return;
  }
  const [lo, hi] = baseValue.value as [number, number];
  if (thumb === 0) commit([Math.min(quantize(lo + delta), hi), hi]);
  else commit([lo, Math.max(quantize(hi + delta), lo)]);
}

function onThumbKeydown(thumb: 0 | 1, event: KeyboardEvent) {
  switch (event.key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      event.preventDefault();
      nudge(thumb, -props.step);
      break;
    case 'ArrowRight':
    case 'ArrowUp':
      event.preventDefault();
      nudge(thumb, props.step);
      break;
    case 'Home':
      event.preventDefault();
      nudge(thumb, props.min - (props.range ? ((baseValue.value as number[])[thumb] ?? 0) : 0));
      break;
    case 'End':
      event.preventDefault();
      nudge(thumb, props.max - (props.range ? ((baseValue.value as number[])[thumb] ?? 0) : 0));
      break;
    default:
      break;
  }
}

const valueText = computed(() =>
  props.range ? `${low.value} - ${high.value}` : String(high.value),
);
</script>

<template>
  <div
    class="cumquat-slider"
    :class="[disabled ? 'cumquat-slider--disabled' : '', range ? 'cumquat-slider--range' : '']"
  >
    <div ref="trackRef" class="cumquat-slider__track">
      <div
        class="cumquat-slider__fill"
        :style="{ left: `${toPercent(low)}%`, width: `${toPercent(high) - toPercent(low)}%` }"
      />
      <span
        v-if="range"
        class="cumquat-slider__thumb"
        :style="{ left: `${toPercent(low)}%` }"
        role="slider"
        tabindex="0"
        :aria-valuenow="low"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-disabled="disabled"
        @keydown="onThumbKeydown(0, $event)"
      />
      <span
        class="cumquat-slider__thumb"
        :class="range ? 'cumquat-slider__thumb--high' : ''"
        :style="{ left: `${toPercent(high)}%` }"
        role="slider"
        tabindex="0"
        :aria-valuenow="high"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-disabled="disabled"
        @keydown="onThumbKeydown(1, $event)"
      />
      <span
        v-for="mark in normalizedMarks"
        :key="mark.value"
        class="cumquat-slider__tick"
        :style="{ left: `${toPercent(mark.value)}%` }"
      />
    </div>
    <span v-if="marks.length > 0" class="cumquat-slider__marks">
      <span
        v-for="mark in normalizedMarks"
        :key="`label-${mark.value}`"
        class="cumquat-slider__mark"
        :style="{ left: `${toPercent(mark.value)}%` }"
        >{{ mark.label ?? mark.value }}</span
      >
    </span>
    <span v-if="showValue" class="cumquat-slider__value">{{ valueText }}</span>
  </div>
</template>
