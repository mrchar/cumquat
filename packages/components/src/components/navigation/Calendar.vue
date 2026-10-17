<script setup lang="ts">
import { computed, watch } from 'vue';
import { useDateGrid, useDateModel } from '@cumquat/composables';
import type { DatePanelType } from '@cumquat/composables';

export interface CalendarEvent {
  /** yyyy-MM-dd */
  date: string;
  label?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | Date | null;
    /** 范围选择值 */
    rangeValue?: [string | Date | null, string | Date | null] | null;
    /** 范围选择 */
    range?: boolean;
    /** 每周第一天：0=周日，1=周一 */
    firstDayOfWeek?: 0 | 1;
    disabledDate?: (date: Date) => boolean;
    minDate?: string | Date;
    maxDate?: string | Date;
    /** 日程/事项标记（按 yyyy-MM-dd 匹配） */
    events?: CalendarEvent[];
  }>(),
  {
    modelValue: undefined,
    rangeValue: undefined,
    range: false,
    firstDayOfWeek: 1,
    disabledDate: undefined,
    minDate: undefined,
    maxDate: undefined,
    events: () => [],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'update:rangeValue': [value: [string | null, string | null] | null];
  change: [value: string | [string | null, string | null] | null];
  'panel-change': [label: string];
}>();

const model = useDateModel({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  rangeModelValue: props.rangeValue !== undefined ? () => props.rangeValue : undefined,
  range: props.range,
  minDate: props.minDate,
  maxDate: props.maxDate,
  disabledDate: props.disabledDate,
  onChange: (value) => {
    if (Array.isArray(value)) {
      emit('update:rangeValue', value as [string | null, string | null]);
      emit('change', value as [string | null, string | null]);
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const grid = useDateGrid({
  viewDate: model.viewDate,
  type: 'date',
  firstDayOfWeek: props.firstDayOfWeek,
  disabledDate: (date) => model.isDisabled(date),
  isSelected: (date) => model.isSelected(date),
  isInRange: (date) => model.isInRange(date),
  isRangeStart: (date) => model.isRangeStart(date),
  isRangeEnd: (date) => model.isRangeEnd(date),
});

watch(grid.panelLabel, (label) => emit('panel-change', label));

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

const eventMap = computed(() => {
  const map = new Map<string, CalendarEvent[]>();
  for (const eventItem of props.events) {
    const list = map.get(eventItem.date) ?? [];
    list.push(eventItem);
    map.set(eventItem.date, list);
  }
  return map;
});

function eventKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function eventsOf(date: Date) {
  return eventMap.value.get(eventKey(date)) ?? [];
}

function onCellClick(date: Date, disabled: boolean) {
  if (disabled) return;
  model.selectDate(date);
}

function switchPanel(type: DatePanelType) {
  grid.setPanelType(type);
}

/** 月/年面板点击：进入下一层级 */
function onLabeledCell(date: Date, disabled: boolean) {
  if (disabled) return;
  if (grid.panelType.value === 'month') {
    model.goToDate(date);
    grid.setPanelType('date');
  } else {
    model.goToDate(new Date(date.getFullYear(), 0, 1));
    grid.setPanelType('month');
  }
}
</script>

<template>
  <div class="cumquat-calendar">
    <header class="cumquat-calendar__header">
      <button
        type="button"
        aria-label="上一个"
        class="cumquat-calendar__nav"
        @click="grid.prevView()"
      >
        <svg
          class="cumquat-calendar__nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        type="button"
        class="cumquat-calendar__month"
        @click="switchPanel(grid.panelType.value === 'date' ? 'month' : 'date')"
      >
        {{ grid.panelLabel.value }}
      </button>
      <button
        type="button"
        aria-label="下一个"
        class="cumquat-calendar__nav"
        @click="grid.nextView()"
      >
        <svg
          class="cumquat-calendar__nav-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    </header>

    <!-- 日期面板 -->
    <div v-if="grid.panelType.value === 'date'" class="cumquat-calendar__grid">
      <span
        v-for="weekday in grid.weekdayOrder.value"
        :key="weekday"
        class="cumquat-calendar__weekday"
        >{{ weekdayLabels[weekday] }}</span
      >
      <template v-for="(week, rowIndex) in grid.weeks.value" :key="rowIndex">
        <button
          v-for="(cell, colIndex) in week"
          :key="`${rowIndex}-${colIndex}`"
          type="button"
          :disabled="cell.disabled"
          class="cumquat-calendar__day"
          :class="[
            cell.inMonth ? '' : 'cumquat-calendar__day--empty',
            cell.isToday ? 'cumquat-calendar__day--today' : '',
            cell.selected ? 'cumquat-calendar__day--selected' : '',
            cell.inRange ? 'cumquat-calendar__day--in-range' : '',
            cell.rangeStart ? 'cumquat-calendar__day--range-start' : '',
            cell.rangeEnd ? 'cumquat-calendar__day--range-end' : '',
          ]"
          @click="onCellClick(cell.date, cell.disabled)"
          @mouseenter="model.setHoverDate(cell.date)"
          @mouseleave="model.setHoverDate(null)"
        >
          {{ cell.date.getDate() }}
          <span v-if="eventsOf(cell.date).length > 0" class="cumquat-calendar__dot" />
        </button>
      </template>
    </div>

    <!-- 月份面板 -->
    <div v-else-if="grid.panelType.value === 'month'" class="cumquat-calendar__panel-grid">
      <button
        v-for="cell in grid.months.value"
        :key="cell.label"
        type="button"
        class="cumquat-calendar__panel-cell"
        :disabled="cell.disabled"
        @click="onLabeledCell(cell.date, cell.disabled)"
      >
        {{ cell.label }}
      </button>
    </div>

    <!-- 年份面板 -->
    <div v-else class="cumquat-calendar__panel-grid cumquat-calendar__panel-grid--years">
      <button
        v-for="cell in grid.years.value"
        :key="cell.label"
        type="button"
        class="cumquat-calendar__panel-cell"
        :class="cell.inPanel ? '' : 'cumquat-calendar__panel-cell--muted'"
        :disabled="cell.disabled"
        @click="onLabeledCell(cell.date, cell.disabled)"
      >
        {{ cell.label }}
      </button>
    </div>
  </div>
</template>
