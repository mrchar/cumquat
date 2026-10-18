<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useActionValue,
  useDateGrid,
  useFloating,
  useFormField,
  useOpen,
} from '@cumquat/composables';
import type { ActionLike, DateShortcut } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 选中的日期（当月日序 1-31，演示态取值） */
    modelValue?: number | null;
    placeholder?: string;
    disabled?: boolean;
    /** 面板初始视角月份（默认静态演示月 2026-10） */
    viewMonth?: Date;
    /** 快捷选项 */
    shortcuts?: DateShortcut[];
    /** 选择动作：新值先乐观应用，动作失败自动回退旧值；执行期间禁用选择 */
    action?: ActionLike;
  }>(),
  {
    modelValue: undefined,
    placeholder: '选择日期',
    disabled: false,
    viewMonth: () => new Date(2026, 9, 1),
    shortcuts: () => [],
    action: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
  /** 选择动作失败（reject 或返回值导出错误）时触发，值已回退 */
  actionError: [error: unknown];
}>();

/* ---------------- action 选择动作：乐观应用，失败回退 ---------------- */
const { pending: actionPending, error: actionError, commit: commitAction } = useActionValue();

const field = useFormField<number | null>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: null,
  onChange: (value) => {
    if (value !== null) {
      emit('update:modelValue', value);
      emit('change', value);
    }
  },
  disabled: () => props.disabled || actionPending.value,
});

const { isOpen, toggle, close } = useOpen();

const viewDate = ref(props.viewMonth);
const grid = useDateGrid({
  viewDate,
  firstDayOfWeek: 0,
  isSelected: (date) =>
    field.value.value !== null &&
    date.getMonth() === viewDate.value.getMonth() &&
    date.getFullYear() === viewDate.value.getFullYear() &&
    date.getDate() === field.value.value,
});

const { referenceRef, floatingRef, floatingStyles } = useFloating({
  placement: 'bottom-start',
  gap: 6,
  open: isOpen,
});

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];
const cells = computed(() => grid.weeks.value.flat());

const displayText = computed(() => {
  if (field.value.value === null) return '';
  const month = String(viewDate.value.getMonth() + 1).padStart(2, '0');
  return `${viewDate.value.getFullYear()}-${month}-${String(field.value.value).padStart(2, '0')}`;
});

/** 统一变更入口：先乐观应用，配置 action 时异步确认，失败回退 */
function commitDate(next: number) {
  const previous = field.value.value;
  field.handleChange(next);
  if (!props.action) return;
  void commitAction({
    execute: () => props.action?.(next),
    revert: () => field.handleChange(previous),
  }).then((ok) => {
    if (!ok && actionError.value != null) emit('actionError', actionError.value);
  });
}

function pickCell(cell: (typeof cells.value)[number]) {
  if (!cell.inMonth || cell.disabled || actionPending.value) return;
  commitDate(cell.date.getDate());
  close();
}

function applyShortcut(shortcut: DateShortcut) {
  if (actionPending.value) return;
  const value = Array.isArray(shortcut.value) ? shortcut.value[0] : shortcut.value;
  viewDate.value = new Date(value);
  commitDate(value.getDate());
  close();
}
</script>

<template>
  <div class="cumquat-date-picker">
    <button
      ref="referenceRef"
      type="button"
      class="cumquat-date-picker__trigger"
      :class="isOpen ? 'cumquat-date-picker__trigger--open' : ''"
      :disabled="disabled || actionPending"
      @click="toggle()"
    >
      <span
        :class="
          field.value.value !== null
            ? 'cumquat-date-picker__value--selected'
            : 'cumquat-date-picker__value--placeholder'
        "
      >
        {{ displayText || placeholder }}
      </span>
      <svg
        class="cumquat-date-picker__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </button>

    <Transition name="cumquat-fade">
      <div
        v-if="isOpen"
        ref="floatingRef"
        class="cumquat-date-picker__panel"
        :style="floatingStyles"
      >
        <div class="cumquat-date-picker__header">
          <button
            type="button"
            aria-label="上个月"
            class="cumquat-date-picker__nav-btn"
            @click="grid.prevView()"
          >
            ‹
          </button>
          <p class="cumquat-date-picker__month">{{ grid.panelLabel.value }}</p>
          <button
            type="button"
            aria-label="下个月"
            class="cumquat-date-picker__nav-btn"
            @click="grid.nextView()"
          >
            ›
          </button>
        </div>
        <div class="cumquat-date-picker__grid">
          <span v-for="(w, index) in weekdayLabels" :key="w" class="cumquat-date-picker__weekday">
            {{ weekdayLabels[grid.weekdayOrder.value[index]] }}
          </span>
          <button
            v-for="(cell, index) in cells"
            :key="index"
            type="button"
            :disabled="!cell.inMonth || cell.disabled"
            class="cumquat-date-picker__day"
            :class="[
              !cell.inMonth
                ? 'cumquat-date-picker__day--empty'
                : cell.selected
                  ? 'cumquat-date-picker__day--selected'
                  : 'cumquat-date-picker__day--default',
            ]"
            @click="pickCell(cell)"
          >
            {{ cell.inMonth ? cell.date.getDate() : '' }}
          </button>
        </div>
        <ul v-if="shortcuts.length" class="cumquat-date-picker__shortcuts">
          <li v-for="shortcut in shortcuts" :key="shortcut.label">
            <button
              type="button"
              class="cumquat-date-picker__shortcut"
              @click="applyShortcut(shortcut)"
            >
              {{ shortcut.label }}
            </button>
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>
