<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useIntervalFn } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    title?: string;
    /** 数值（字符串原样展示）；倒计时模式下为到期时间戳或 Date */
    value: string | number | Date;
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
  }>(),
  {
    title: '',
    prefix: '',
    suffix: '',
    precision: undefined,
    groupSeparator: '',
    animation: false,
    duration: 1000,
    countdown: false,
  },
);

const emit = defineEmits<{
  finish: [];
}>();

const targetTime = computed(() => {
  if (props.value instanceof Date) return props.value.getTime();
  if (typeof props.value === 'number') return props.value;
  return Number(new Date(props.value));
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

const numericValue = computed(() =>
  props.value instanceof Date ? props.value.getTime() : Number(props.value),
);

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
  if (typeof props.value === 'string' && Number.isNaN(Number(props.value))) return props.value;
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
      <span class="cumquat-statistic__number">
        <slot>{{ countdown ? countdownText : displayNumber }}</slot>
      </span>
      <span v-if="suffix" class="cumquat-statistic__suffix">{{ suffix }}</span>
    </p>
  </div>
</template>
