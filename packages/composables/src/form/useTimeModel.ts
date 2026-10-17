import { computed, ref } from 'vue';
import type { ComputedRef, Ref } from 'vue';
import { useControllableModel } from '../core/useControllableModel';
import { formatTime, pad2, parseTime, timeToSeconds } from './date-utils';

export interface TimeColumnItem {
  value: number;
  label: string;
  disabled: boolean;
}

export interface UseTimeModelOptions {
  /** 'HH:mm:ss' 或 'HH:mm'，默认 'HH:mm:ss' */
  modelValue?: string | null;
  defaultValue?: string | null;
  onChange?: (value: string | null) => void;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  /** 是否使用秒列，默认 true */
  useSeconds?: boolean;
  /** 最早可选时间 'HH:mm[:ss]' */
  minTime?: string;
  /** 最晚可选时间 'HH:mm[:ss]' */
  maxTime?: string;
}

export interface UseTimeModelReturn {
  model: Ref<string | null>;
  hour: Ref<number | null>;
  minute: Ref<number | null>;
  second: Ref<number | null>;
  hourColumn: ComputedRef<TimeColumnItem[]>;
  minuteColumn: ComputedRef<TimeColumnItem[]>;
  secondColumn: ComputedRef<TimeColumnItem[]>;
  displayText: ComputedRef<string>;
  setHour: (value: number) => void;
  setMinute: (value: number) => void;
  setSecond: (value: number) => void;
  setUnit: (unit: 'hour' | 'minute' | 'second', value: number) => void;
  now: () => void;
  clear: () => void;
  confirm: () => string | null;
}

function buildStepValues(max: number, step: number): number[] {
  const values: number[] = [];
  for (let value = 0; value <= max; value += 1) {
    if (value % step === 0) values.push(value);
  }
  return values;
}

/**
 * 时间选择模型：时/分/秒三列数据与步进、范围限制、回写与回显。
 * 滚动列渲染与确认按钮编排由 TimePicker 组件承担。
 *
 * @internal 消费组件：TimePicker、DatePicker（日期时间模式）
 */
export function useTimeModel(options: UseTimeModelOptions = {}): UseTimeModelReturn {
  const {
    modelValue,
    defaultValue,
    onChange,
    hourStep = 1,
    minuteStep = 1,
    secondStep = 1,
    useSeconds = true,
    minTime,
    maxTime,
  } = options;

  const { value: model } = useControllableModel<string | null>({
    modelValue,
    defaultValue,
    fallback: null,
  });
  const typedModel = model as Ref<string | null>;

  const hour = ref<number | null>(parseTime(typedModel.value)?.hour ?? null);
  const minute = ref<number | null>(parseTime(typedModel.value)?.minute ?? null);
  const second = ref<number | null>(useSeconds ? (parseTime(typedModel.value)?.second ?? null) : 0);

  const minSeconds = computed(() => timeToSeconds(minTime ?? null));
  const maxSeconds = computed(() => timeToSeconds(maxTime ?? null));

  // 当前已选小时/分钟下，候选列项是否越过整体时间范围
  const isItemDisabled = (unit: 'hour' | 'minute' | 'second', value: number): boolean => {
    const h = hour.value ?? 0;
    const m = minute.value ?? 0;
    const s = second.value ?? 0;
    const candidate =
      unit === 'hour'
        ? value * 3600 + m * 60 + s
        : unit === 'minute'
          ? h * 3600 + value * 60 + s
          : h * 3600 + m * 60 + value;
    if (minSeconds.value !== null && candidate < minSeconds.value) return true;
    if (maxSeconds.value !== null && candidate > maxSeconds.value) return true;
    return false;
  };

  const hourColumn = computed<TimeColumnItem[]>(() =>
    buildStepValues(23, hourStep).map((value) => ({
      value,
      label: pad2(value),
      disabled: isItemDisabled('hour', value),
    })),
  );

  const minuteColumn = computed<TimeColumnItem[]>(() =>
    buildStepValues(59, minuteStep).map((value) => ({
      value,
      label: pad2(value),
      disabled: isItemDisabled('minute', value),
    })),
  );

  const secondColumn = computed<TimeColumnItem[]>(() =>
    buildStepValues(59, secondStep).map((value) => ({
      value,
      label: pad2(value),
      disabled: isItemDisabled('second', value),
    })),
  );

  const displayText = computed(() => {
    if (hour.value === null || minute.value === null) return '';
    return formatTime(hour.value, minute.value, second.value ?? 0, useSeconds);
  });

  const setHour = (value: number) => {
    hour.value = value;
  };
  const setMinute = (value: number) => {
    minute.value = value;
  };
  const setSecond = (value: number) => {
    second.value = value;
  };

  const setUnit = (unit: 'hour' | 'minute' | 'second', value: number) => {
    if (isItemDisabled(unit, value)) return;
    if (unit === 'hour') setHour(value);
    else if (unit === 'minute') setMinute(value);
    else setSecond(value);
  };

  const confirm = (): string | null => {
    if (hour.value === null || minute.value === null) {
      typedModel.value = null;
      return null;
    }
    const text = formatTime(hour.value, minute.value, second.value ?? 0, useSeconds);
    typedModel.value = text;
    onChange?.(text);
    return text;
  };

  const now = () => {
    const date = new Date();
    hour.value = date.getHours();
    minute.value = date.getMinutes();
    second.value = date.getSeconds();
    confirm();
  };

  const clear = () => {
    hour.value = null;
    minute.value = null;
    second.value = useSeconds ? null : 0;
    typedModel.value = null;
    onChange?.(null);
  };

  // 外部受控值变化时同步三列
  const syncFromModel = (value: string | null) => {
    const parsed = parseTime(value);
    hour.value = parsed?.hour ?? null;
    minute.value = parsed?.minute ?? null;
    second.value = parsed ? parsed.second : useSeconds ? null : 0;
  };
  if (modelValue !== undefined) syncFromModel(modelValue);

  return {
    model: typedModel,
    hour,
    minute,
    second,
    hourColumn,
    minuteColumn,
    secondColumn,
    displayText,
    setHour,
    setMinute,
    setSecond,
    setUnit,
    now,
    clear,
    confirm,
  };
}
