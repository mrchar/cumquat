<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useFormField } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: number | null;
    min?: number;
    max?: number;
    step?: number;
    /** 小数位数；缺省时按 step 推导 */
    precision?: number;
    disabled?: boolean;
    placeholder?: string;
  }>(),
  {
    modelValue: undefined,
    min: -Number.MAX_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    step: 1,
    precision: undefined,
    disabled: false,
    placeholder: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  change: [value: number | null];
}>();

const field = useFormField<number | null>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  disabled: () => props.disabled,
});

/** 输入框中的原始文本（允许中间态：空串、负号） */
const text = ref<string>(field.value.value === null ? '' : String(field.value.value));

/** step 的小数位数，用于精度修正 */
const stepPrecision = computed(() => {
  const decimal = String(props.step).split('.')[1];
  return decimal ? decimal.length : 0;
});
const activePrecision = computed(() => props.precision ?? stepPrecision.value);

function roundByPrecision(value: number): number {
  const factor = 10 ** activePrecision.value;
  return Math.round(value * factor) / factor;
}

function clamp(value: number): number {
  const rounded = roundByPrecision(value);
  if (rounded < props.min) return props.min;
  if (rounded > props.max) return props.max;
  return rounded;
}

/** 步进基准：受控 prop 不回写时仍以最近一次提交值连续步进 */
const baseValue = ref<number | null>(props.modelValue !== undefined ? props.modelValue : null);
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) baseValue.value = next;
  },
);

const numericValue = computed(() => (baseValue.value === null ? null : clamp(baseValue.value)));
const canDecrease = computed(
  () => !props.disabled && (numericValue.value ?? 0) - props.step >= props.min,
);
const canIncrease = computed(
  () => !props.disabled && (numericValue.value ?? 0) + props.step <= props.max,
);

function commit(value: number | null) {
  const next = value === null ? null : clamp(value);
  baseValue.value = next;
  // 受控值不回写时连续步进（5→6→5）不能被去重逻辑吞掉，直接派发
  emit('update:modelValue', next);
  emit('change', next);
  field.handleChange(next);
}

function decrease() {
  if (!canDecrease.value) return;
  commit((numericValue.value ?? 0) - props.step);
  text.value = baseValue.value === null ? '' : String(baseValue.value);
}

function increase() {
  if (!canIncrease.value) return;
  commit((numericValue.value ?? 0) + props.step);
  text.value = baseValue.value === null ? '' : String(baseValue.value);
}

/** 键入阶段仅做合法性过滤，不立即钳制 */
function onInput(event: Event) {
  const target = event.target as HTMLInputElement;
  const raw = target.value;
  const valid = /^-?\d*\.?\d*$/.test(raw);
  if (!valid) {
    target.value = text.value;
    return;
  }
  text.value = raw;
}

/** 失焦/回车时提交并做钳制与精度修正，空串归为 null */
function settle() {
  if (text.value.trim() === '' || text.value === '-' || text.value === '.') {
    text.value = baseValue.value === null ? '' : String(baseValue.value);
    if (baseValue.value !== null) commit(null);
    return;
  }
  const parsed = Number(text.value);
  if (Number.isNaN(parsed)) {
    text.value = baseValue.value === null ? '' : String(baseValue.value);
    return;
  }
  commit(parsed);
  text.value = baseValue.value === null ? '' : String(baseValue.value);
}

/* ---------- 长按连续步进 ---------- */
let holdTimer: ReturnType<typeof setTimeout> | null = null;
let repeatTimer: ReturnType<typeof setInterval> | null = null;

function clearHold() {
  if (holdTimer !== null) clearTimeout(holdTimer);
  if (repeatTimer !== null) clearInterval(repeatTimer);
  holdTimer = null;
  repeatTimer = null;
}

function startHold(direction: 1 | -1) {
  if (props.disabled) return;
  clearHold();
  holdTimer = setTimeout(() => {
    repeatTimer = setInterval(() => {
      if (direction === 1) increase();
      else decrease();
    }, 80);
  }, 400);
}

onBeforeUnmount(clearHold);
</script>

<template>
  <div class="cumquat-input-number" :class="disabled ? 'cumquat-input-number--disabled' : ''">
    <button
      type="button"
      aria-label="减少"
      class="cumquat-input-number__decrease"
      :disabled="!canDecrease"
      @click="decrease"
      @pointerdown="startHold(-1)"
      @pointerup="clearHold"
      @pointerleave="clearHold"
    >
      <svg
        class="cumquat-input-number__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M5 12h14" />
      </svg>
    </button>
    <input
      v-model="text"
      type="text"
      inputmode="decimal"
      class="cumquat-input-number__input"
      :disabled="disabled"
      :placeholder="placeholder"
      @input="onInput"
      @change="settle"
      @keydown.enter="settle"
      @blur="settle"
    />
    <button
      type="button"
      aria-label="增加"
      class="cumquat-input-number__increase"
      :disabled="!canIncrease"
      @click="increase"
      @pointerdown="startHold(1)"
      @pointerup="clearHold"
      @pointerleave="clearHold"
    >
      <svg
        class="cumquat-input-number__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
