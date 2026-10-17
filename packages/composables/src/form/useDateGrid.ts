import { computed, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { addDays, addMonths, addYears, isSameDay, isSameMonth, startOfWeek } from './date-utils';

export type DatePanelType = 'date' | 'month' | 'year';

export interface DateCell {
  date: Date;
  /** 是否属于当前面板月份（外部填充格为 false） */
  inMonth: boolean;
  isToday: boolean;
  disabled: boolean;
  isWeekend: boolean;
}

export interface LabeledCell {
  /** 该格代表的日期锚点（月格为该月 1 号，年格为该年 1 月 1 号） */
  date: Date;
  label: string;
  disabled: boolean;
  /** 年面板下该十年段的实际范围 */
  inPanel: boolean;
}

export interface UseDateGridOptions {
  /** 面板视角日期（内部默认今天，多面板时可外部注入） */
  viewDate?: Ref<Date>;
  type?: DatePanelType;
  /** 每周第一天：0=周日，1=周一，默认 1 */
  firstDayOfWeek?: 0 | 1;
  disabledDate?: (date: Date) => boolean;
  /** 选中态标记（单选） */
  isSelected?: (date: Date) => boolean;
  /** 范围区间内标记（含悬停预览） */
  isInRange?: (date: Date) => boolean;
  isRangeStart?: (date: Date) => boolean;
  isRangeEnd?: (date: Date) => boolean;
}

export interface MarkedDateCell extends DateCell {
  selected: boolean;
  inRange: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
}

export interface UseDateGridReturn {
  viewDate: Ref<Date>;
  panelType: Ref<DatePanelType>;
  setPanelType: (type: DatePanelType) => void;
  /** 星期表头索引序列（0~6，按 firstDayOfWeek 轮转） */
  weekdayOrder: ComputedRef<number[]>;
  /** 日期面板：6 行 × 7 列 */
  weeks: ComputedRef<MarkedDateCell[][]>;
  /** 月份面板：12 个月 */
  months: ComputedRef<LabeledCell[]>;
  /** 年份面板：10 年段（12 格，含上/下一年段填充） */
  years: ComputedRef<LabeledCell[]>;
  panelLabel: ComputedRef<string>;
  prevView: () => void;
  nextView: () => void;
  goToDate: (date: Date) => void;
}

const MONTH_LABELS = [
  '1月',
  '2月',
  '3月',
  '4月',
  '5月',
  '6月',
  '7月',
  '8月',
  '9月',
  '10月',
  '11月',
  '12月',
];

/**
 * 日历网格纯计算：月首偏移、当月天数、外部填充、周末/禁用/选中/范围标记。
 * 同一模型驱动 DatePicker 与 Calendar；多面板由组件内创建多个实例实现。
 */
export function useDateGrid(options: UseDateGridOptions = {}): UseDateGridReturn {
  const {
    viewDate: injected,
    type = 'date',
    firstDayOfWeek = 1,
    disabledDate = () => false,
    isSelected = () => false,
    isInRange = () => false,
    isRangeStart = () => false,
    isRangeEnd = () => false,
  } = options;

  const viewDate = injected ?? ref(new Date());
  const panelType = ref<DatePanelType>(type);
  const today = new Date();

  const weekdayOrder = computed(() => {
    const order: number[] = [];
    for (let i = 0; i < 7; i += 1) {
      order.push((firstDayOfWeek + i) % 7);
    }
    return order;
  });

  const weeks = computed<MarkedDateCell[][]>(() => {
    const first = startOfWeek(
      new Date(viewDate.value.getFullYear(), viewDate.value.getMonth(), 1),
      firstDayOfWeek,
    );
    const rows: MarkedDateCell[][] = [];
    for (let row = 0; row < 6; row += 1) {
      const week: MarkedDateCell[] = [];
      for (let col = 0; col < 7; col += 1) {
        const date = addDays(first, row * 7 + col);
        const base: DateCell = {
          date,
          inMonth: isSameMonth(date, viewDate.value),
          isToday: isSameDay(date, today),
          disabled: disabledDate(date),
          isWeekend: date.getDay() === 0 || date.getDay() === 6,
        };
        week.push({
          ...base,
          selected: isSelected(date),
          inRange: isInRange(date),
          rangeStart: isRangeStart(date),
          rangeEnd: isRangeEnd(date),
        });
      }
      rows.push(week);
    }
    return rows;
  });

  const months = computed<LabeledCell[]>(() =>
    MONTH_LABELS.map((label, index) => {
      const date = new Date(viewDate.value.getFullYear(), index, 1);
      return {
        date,
        label,
        disabled: disabledDate(date),
        inPanel: true,
      };
    }),
  );

  // 十年段：例如 2020~2029，渲染 12 格（含上一段末位与下一段首位）
  const decadeStartYear = computed(() => Math.floor(viewDate.value.getFullYear() / 10) * 10);

  const years = computed<LabeledCell[]>(() => {
    const start = decadeStartYear.value - 1;
    return Array.from({ length: 12 }, (_, index) => {
      const year = start + index;
      const date = new Date(year, 0, 1);
      return {
        date,
        label: String(year),
        disabled: disabledDate(date),
        inPanel: year >= decadeStartYear.value && year < decadeStartYear.value + 10,
      };
    });
  });

  const panelLabel = computed(() => {
    const year = viewDate.value.getFullYear();
    if (panelType.value === 'date') {
      return `${year}年 ${MONTH_LABELS[viewDate.value.getMonth()]}`;
    }
    if (panelType.value === 'month') return `${year}年`;
    return `${decadeStartYear.value} - ${decadeStartYear.value + 9}`;
  });

  const prevView = () => {
    if (panelType.value === 'date') {
      viewDate.value = addMonths(viewDate.value, -1);
    } else if (panelType.value === 'month') {
      viewDate.value = addYears(viewDate.value, -1);
    } else {
      viewDate.value = addYears(viewDate.value, -10);
    }
  };

  const nextView = () => {
    if (panelType.value === 'date') {
      viewDate.value = addMonths(viewDate.value, 1);
    } else if (panelType.value === 'month') {
      viewDate.value = addYears(viewDate.value, 1);
    } else {
      viewDate.value = addYears(viewDate.value, 10);
    }
  };

  const goToDate = (date: Date) => {
    viewDate.value = new Date(date);
  };

  const setPanelType = (next: DatePanelType) => {
    panelType.value = next;
  };

  return {
    viewDate,
    panelType,
    setPanelType,
    weekdayOrder,
    weeks,
    months,
    years,
    panelLabel,
    prevView,
    nextView,
    goToDate,
  };
}
