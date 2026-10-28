<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useActionValue, useFormField } from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    /** 星星总数 */
    count?: number;
    disabled?: boolean;
    /** 只读态（不可交互） */
    readonly?: boolean;
    /** 是否允许半星 */
    allowHalf?: boolean;
    /** 是否允许清除（再次点击同值取消） */
    allowClear?: boolean;
    /** 评分动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用评分 */
    action?: ActionLike;
  }>(),
  {
    modelValue: undefined,
    count: 5,
    disabled: false,
    readonly: false,
    allowHalf: false,
    allowClear: true,
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
  hoverChange: [value: number];
  /** 评分动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 评分动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

const field = useFormField<number>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: 0,
  disabled: () => props.disabled || props.readonly || actionPending.value,
});

/** 最近一次提交值 */
const baseValue = ref(props.modelValue ?? 0);
watch(
  () => props.modelValue,
  (next) => {
    if (next !== undefined) baseValue.value = next;
  },
);

/** 悬停预览值；0 表示未悬停（支持 .5） */
const hoverValue = ref(0);

const displayValue = computed(() => hoverValue.value || baseValue.value);
const locked = computed(() => props.disabled || props.readonly || actionPending.value);

/** 星格状态：full / half / empty */
function starState(star: number): 'full' | 'half' | 'empty' {
  const value = displayValue.value;
  if (value >= star) return 'full';
  if (props.allowHalf && value >= star - 0.5) return 'half';
  return 'empty';
}

/** 应用评分值（含回退时的恢复路径） */
function applyValue(value: number) {
  baseValue.value = value;
  emit('update:modelValue', value);
  emit('change', value);
  field.handleChange(value);
}

function commit(value: number) {
  const previous = baseValue.value;
  applyValue(value);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(value),
    revert: () => applyValue(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

function pick(star: number, half = false) {
  if (locked.value) return;
  const next = half ? star - 0.5 : star;
  if (props.allowClear && next === baseValue.value) commit(0);
  else commit(next);
}

function preview(star: number, half = false) {
  if (locked.value) return;
  hoverValue.value = half ? star - 0.5 : star;
  emit('hoverChange', hoverValue.value);
}

function onKeydown(event: KeyboardEvent) {
  if (locked.value) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
    event.preventDefault();
    commit(Math.min(props.count, baseValue.value + (event.shiftKey && props.allowHalf ? 0.5 : 1)));
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
    event.preventDefault();
    commit(Math.max(0, baseValue.value - (event.shiftKey && props.allowHalf ? 0.5 : 1)));
  }
}
</script>

<template>
  <div
    class="cumquat-rate"
    role="radiogroup"
    tabindex="0"
    :aria-readonly="readonly"
    @mouseleave="hoverValue = 0"
    @keydown="onKeydown"
  >
    <button
      v-for="star in count"
      :key="star"
      type="button"
      role="radio"
      :aria-checked="baseValue >= star"
      :aria-label="`${star} 星`"
      :disabled="disabled || actionPending"
      class="cumquat-rate__star"
      :class="[
        locked ? 'cumquat-rate__star--disabled' : '',
        starState(star) !== 'empty' ? 'cumquat-rate__star--active' : '',
        starState(star) === 'half' ? 'cumquat-rate__star--half' : '',
      ]"
      @mouseenter="preview(star, false)"
      @mousemove="
        allowHalf
          ? preview(star, $event.offsetX <= ($event.currentTarget as HTMLElement).offsetWidth / 2)
          : undefined
      "
      @click="
        pick(
          star,
          allowHalf && $event.offsetX <= ($event.currentTarget as HTMLElement).offsetWidth / 2,
        )
      "
    >
      <!-- 半星底层（灰） -->
      <svg
        v-if="starState(star) === 'half'"
        class="cumquat-rate__icon cumquat-rate__icon--bg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      >
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1z" />
      </svg>
      <svg
        class="cumquat-rate__icon"
        :class="starState(star) === 'half' ? 'cumquat-rate__icon--half' : ''"
        viewBox="0 0 24 24"
        :fill="starState(star) !== 'empty' ? 'currentColor' : 'none'"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      >
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1z" />
      </svg>
    </button>
    <span v-if="baseValue > 0" class="cumquat-rate__value">{{ baseValue }}</span>
  </div>
</template>
