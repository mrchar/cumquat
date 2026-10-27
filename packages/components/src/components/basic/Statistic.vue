<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useFetchResource, useIntervalFn, useSubscribe } from '@cumquat/composables';
import type { Fetch, SubscribeHandler } from '@cumquat/composables';
import CqButton from './Button.vue';

/** 统计值：数字 / 可解析数字的字符串 / 时间（倒计时） */
export type StatisticValue = string | number | Date;

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 数值（字符串原样展示）；倒计时模式下为到期时间戳或 Date；fetch 模式下可省略 */
    value?: StatisticValue;
    prefix?: string;
    suffix?: string;
    /** 小数位数 */
    precision?: number;
    /** 千分位分隔符，空串关闭（默认关闭） */
    groupSeparator?: string;
    /** 数值滚动动画（数字类型） */
    animation?: boolean;
    /** 动画时长（ms） */
    duration?: number;
    /** 倒计时模式：value 为到期时刻 */
    countdown?: boolean;
    /**
     * 统一远程请求：挂载即拉取聚合值（数字或 { value } 单值），
     * value prop 与 fetch 同时存在时 fetch 优先，三者同时存在时 subscribe 优先
     */
    fetch?: Fetch<StatisticValue>;
    /**
     * 订阅数据：挂载时调用，resolve 出的数据用于渲染。
     * 优先级：subscribe > fetch > value
     */
    subscribe?: SubscribeHandler<StatisticValue>;
  }>(),
  {
    title: '',
    value: undefined,
    prefix: '',
    suffix: '',
    precision: undefined,
    groupSeparator: '',
    animation: false,
    duration: 1000,
    countdown: false,
    fetch: undefined,
    subscribe: undefined,
  },
);

const emit = defineEmits<{
  finish: [];
}>();

/* ---------------- fetch：挂载即拉聚合单值 ---------------- */
const { enabled: fetchEnabled, state: fetchState } = useFetchResource<StatisticValue | undefined>(
  () => props.fetch,
  { getQuery: () => ({}) },
);

/* ---------------- subscribe：订阅型数据 ---------------- */
const { state: subState } = useSubscribe<StatisticValue>(() => props.subscribe);

const remoteLoading = computed(
  () => fetchState.value?.status === 'pending' || subState.value.status === 'pending',
);
const remoteError = computed(() => {
  if (subState.value.status === 'error') return subState.value.error;
  return fetchState.value?.status === 'error' ? fetchState.value.error : undefined;
});

/** 当前生效值：subscribe 优先，其次 fetch，最后 value prop */
const effectiveValue = computed<StatisticValue | undefined>(() => {
  if (props.subscribe && subState.value.status === 'success') return subState.value.data;
  return fetchEnabled.value ? fetchState.value?.data : props.value;
});

const targetTime = computed(() => {
  const value = effectiveValue.value;
  if (value === undefined) return Number.NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return Number(new Date(value));
});

/* ---------- 倒计时 ---------- */
const remainMs = ref(0);
const finished = ref(false);

const countdownParts = computed(() => {
  const total = Math.max(0, remainMs.value);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);
  return {
    days,
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
});

const { resume } = useIntervalFn(
  () => {
    if (!props.countdown) return;
    remainMs.value = targetTime.value - Date.now();
    if (remainMs.value <= 0 && !finished.value) {
      finished.value = true;
      emit('finish');
    }
  },
  250,
  { immediate: false },
);

watch(
  () => props.countdown,
  (enabled) => {
    if (!enabled) return;
    finished.value = false;
    remainMs.value = targetTime.value - Date.now();
    resume(250);
  },
  { immediate: true },
);

/* ---------- 数值滚动 ---------- */
const animatedNumber = ref(0);
let rafId = 0;

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function runTween(from: number, to: number) {
  if (typeof requestAnimationFrame !== 'function') {
    animatedNumber.value = to;
    return;
  }
  cancelAnimationFrame(rafId);
  const start = performance.now();
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / props.duration);
    animatedNumber.value = from + (to - from) * easeOutCubic(t);
    if (t < 1) rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

onBeforeUnmount(() => typeof cancelAnimationFrame === 'function' && cancelAnimationFrame(rafId));

const numericValue = computed(() => {
  const value = effectiveValue.value;
  if (value === undefined) return Number.NaN;
  return value instanceof Date ? value.getTime() : Number(value);
});

watch(
  numericValue,
  (to) => {
    if (!props.animation || props.countdown || Number.isNaN(to)) return;
    runTween(animatedNumber.value || 0, to);
  },
  { immediate: true },
);

function formatNumber(value: number) {
  const precision = props.precision ?? String(value).split('.')[1]?.length ?? 0;
  const fixed = value.toFixed(Math.min(precision, 20));
  if (!props.groupSeparator) return fixed;
  const [int, dec] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, props.groupSeparator);
  return dec ? `${grouped}.${dec}` : grouped;
}

const displayNumber = computed(() => {
  const value = effectiveValue.value;
  if (value === undefined) return '';
  if (typeof value === 'string' && Number.isNaN(Number(value))) return value;
  const base = props.animation && !props.countdown ? animatedNumber.value : numericValue.value;
  return formatNumber(base);
});

const countdownText = computed(() => {
  const p = countdownParts.value;
  return p.days > 0
    ? `${p.days} 天 ${p.hours}:${p.minutes}:${p.seconds}`
    : `${p.hours}:${p.minutes}:${p.seconds}`;
});
</script>

<template>
  <div class="cumquat-statistic" :class="countdown ? 'cumquat-statistic--countdown' : ''">
    <span v-if="title" class="cumquat-statistic__title">{{ title }}</span>
    <p class="cumquat-statistic__value">
      <span v-if="prefix" class="cumquat-statistic__prefix">{{ prefix }}</span>
      <span
        v-if="fetchEnabled && remoteLoading && effectiveValue === undefined"
        class="cumquat-statistic__state cq-state--pending"
        >加载中…</span
      >
      <span
        v-else-if="fetchEnabled && remoteError && effectiveValue === undefined"
        class="cumquat-statistic__state cq-state--error"
      >
        加载失败
        <CqButton size="sm" type="ghost" class="cumquat-statistic__retry" @click="fetchState?.retry?.()">
          重试
        </CqButton>
      </span>
      <span v-else class="cumquat-statistic__number">
        <slot>{{ countdown ? countdownText : displayNumber }}</slot>
      </span>
      <span v-if="suffix" class="cumquat-statistic__suffix">{{ suffix }}</span>
    </p>
  </div>
</template>
