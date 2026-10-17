import { computed, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useControllableModel } from '../core/useControllableModel';
import { addMonths, compareDay, formatDate, isSameDay, parseDate } from './date-utils';

export type DateGranularity = 'day' | 'month' | 'year';

export interface DateShortcut {
  label: string;
  value: Date | [Date, Date];
}

export interface UseDateModelOptions {
  /** 单选值（字符串 / Date），与 range 二选一 */
  modelValue?: string | Date | null;
  defaultValue?: string | Date | null;
  /** 范围值：[起, 止]，字符串可为 null 占位 */
  rangeModelValue?: [string | Date | null, string | Date | null] | null;
  defaultRangeValue?: [string | Date | null, string | Date | null] | null;
  onChange?: (value: string | Date | null | [string | null, string | null] | null) => void;
  range?: boolean;
  /** 选择粒度：day=完整日期，month=年月，year=年 */
  granularity?: DateGranularity;
  format?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  disabledDate?: (date: Date) => boolean;
  shortcuts?: DateShortcut[];
}

export interface UseDateModelReturn {
  /** 单选模型（字符串） */
  model: Ref<string | Date | null>;
  /** 范围模型（字符串对） */
  rangeModel: Ref<[string | null, string | null] | null>;
  selectedDate: ComputedRef<Date | null>;
  rangeDates: ComputedRef<[Date | null, Date | null]>;
  viewDate: Ref<Date>;
  /** 范围选择中已选起点、等待终点时的悬停日期 */
  hoverDate: Ref<Date | null>;
  /** 输入框回显文本（范围为 '起 ~ 止'） */
  displayText: ComputedRef<string>;
  isSelected: (date: Date) => boolean;
  isDisabled: (date: Date) => boolean;
  isInRange: (date: Date) => boolean;
  isRangeStart: (date: Date) => boolean;
  isRangeEnd: (date: Date) => boolean;
  /** 选择日期：范围模式内部处理起止两段式提交 */
  selectDate: (date: Date) => void;
  setHoverDate: (date: Date | null) => void;
  selectShortcut: (shortcut: DateShortcut) => void;
  clear: () => void;
  prevMonth: () => void;
  nextMonth: () => void;
  goToDate: (date: Date) => void;
  format: (date: Date | null) => string;
}

/**
 * 日期值模型：解析/格式化、粒度（日/月/年）、范围两段式选择、
 * 最小/最大与禁用限制、快捷选项。不负责网格计算（见 useDateGrid）。
 *
 * @internal 消费组件：DatePicker、Calendar
 */
export function useDateModel(options: UseDateModelOptions = {}): UseDateModelReturn {
  const {
    modelValue,
    defaultValue,
    rangeModelValue,
    defaultRangeValue,
    onChange,
    range = false,
    granularity = 'day',
    format: formatPattern = 'yyyy-MM-dd',
    minDate,
    maxDate,
    disabledDate,
  } = options;

  const pattern =
    granularity === 'year' ? 'yyyy' : granularity === 'month' ? 'yyyy-MM' : formatPattern;

  const min = computed(() => parseDate(minDate ?? null));
  const max = computed(() => parseDate(maxDate ?? null));

  const format = (date: Date | null): string => formatDate(date, pattern);

  const toStored = (value: string | Date | null | undefined): string | null => {
    const date = parseDate(value ?? null);
    return date ? format(date) : null;
  };

  const singleModel = useControllableModel<string | Date | null>({
    modelValue,
    defaultValue,
    fallback: null,
  });
  const model = singleModel.value as Ref<string | Date | null>;

  const rangeState = useControllableModel<[string | Date | null, string | Date | null] | null>({
    modelValue: rangeModelValue,
    defaultValue: defaultRangeValue,
    fallback: null,
  });
  const rawRangeModel = rangeState.value as Ref<
    [string | Date | null, string | Date | null] | null
  >;

  const rangeModel = computed<[string | null, string | null] | null>({
    get: () => {
      const current = rawRangeModel.value;
      if (!current) return null;
      return [toStored(current[0]), toStored(current[1])];
    },
    set: (next) => {
      rawRangeModel.value = next;
      onChange?.(next);
    },
  });

  const selectedDate = computed(() => parseDate(model.value ?? null));

  const rangeDates = computed<[Date | null, Date | null]>(() => {
    const current = rangeModel.value;
    if (!current) return [null, null];
    return [parseDate(current[0]), parseDate(current[1])];
  });

  const viewDate = ref(selectedDate.value ?? rangeDates.value[0] ?? new Date());

  // 范围选择的中间态：起点已定、终点未定
  const pickingStart = ref(true);
  const hoverDate = ref<Date | null>(null);

  const syncView = (date: Date) => {
    viewDate.value = new Date(date);
  };

  const isDisabled = (date: Date): boolean => {
    if (min.value && compareDay(date, min.value) < 0) return true;
    if (max.value && compareDay(date, max.value) > 0) return true;
    return disabledDate?.(date) === true;
  };

  const isSelected = (date: Date) => {
    if (range) {
      const [start, end] = rangeDates.value;
      return isSameDay(date, start) || isSameDay(date, end);
    }
    return isSameDay(date, selectedDate.value);
  };

  const isRangeStart = (date: Date) => isSameDay(date, rangeDates.value[0]);
  const isRangeEnd = (date: Date) => isSameDay(date, rangeDates.value[1]);

  const isInRange = (date: Date) => {
    if (!range) return false;
    const [start, end] = rangeDates.value;
    if (start && end) {
      return compareDay(date, start) >= 0 && compareDay(date, end) <= 0;
    }
    // 选择中：起点已定、终点未定时，预览起点到悬停位置的区间
    if (start && hoverDate.value && !pickingStart.value) {
      const [lo, hi] =
        compareDay(start, hoverDate.value) <= 0
          ? [start, hoverDate.value]
          : [hoverDate.value, start];
      return compareDay(date, lo) >= 0 && compareDay(date, hi) <= 0;
    }
    return false;
  };

  const emitSingle = (date: Date | null) => {
    const stored = toStored(date);
    model.value = stored;
    onChange?.(stored);
  };

  const selectDate = (date: Date) => {
    if (isDisabled(date)) return;
    syncView(date);
    if (!range) {
      emitSingle(date);
      return;
    }
    if (pickingStart.value || !rangeModel.value?.[0]) {
      rangeModel.value = [toStored(date), null];
      pickingStart.value = false;
      hoverDate.value = null;
      return;
    }
    const start = rangeDates.value[0];
    if (start && compareDay(date, start) < 0) {
      rangeModel.value = [toStored(date), toStored(start)];
    } else {
      rangeModel.value = [toStored(start), toStored(date)];
    }
    pickingStart.value = true;
    hoverDate.value = null;
  };

  const setHoverDate = (date: Date | null) => {
    hoverDate.value = date;
  };

  const selectShortcut = (shortcut: DateShortcut) => {
    if (Array.isArray(shortcut.value)) {
      const [start, end] = shortcut.value;
      rangeModel.value = [toStored(start), toStored(end)];
      pickingStart.value = true;
      syncView(start);
    } else {
      emitSingle(shortcut.value);
      syncView(shortcut.value);
    }
  };

  const clear = () => {
    if (range) {
      rangeModel.value = null;
      pickingStart.value = true;
    } else {
      emitSingle(null);
    }
    hoverDate.value = null;
  };

  const prevMonth = () => {
    viewDate.value = addMonths(viewDate.value, -1);
  };
  const nextMonth = () => {
    viewDate.value = addMonths(viewDate.value, 1);
  };
  const goToDate = (date: Date) => syncView(date);

  const displayText = computed(() => {
    if (range) {
      const [start, end] = rangeDates.value;
      const left = format(start);
      const right = format(end);
      if (!left && !right) return '';
      return `${left} ~ ${right}`;
    }
    return format(selectedDate.value);
  });

  return {
    model,
    rangeModel,
    selectedDate,
    rangeDates,
    viewDate,
    hoverDate,
    displayText,
    isSelected,
    isDisabled,
    isInRange,
    isRangeStart,
    isRangeEnd,
    selectDate,
    setHoverDate,
    selectShortcut,
    clear,
    prevMonth,
    nextMonth,
    goToDate,
    format,
  };
}
