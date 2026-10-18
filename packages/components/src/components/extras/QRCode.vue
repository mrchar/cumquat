<script setup lang="ts">
import { computed } from 'vue';
import { subscribeErrorText, useSubscribe } from '@cumquat/composables';
import type { SubscribeHandler } from '@cumquat/composables';

type ErrorLevel = 'L' | 'M' | 'Q' | 'H';

const props = withDefaults(
  defineProps<{
    value?: string;
    /** 格子规模（奇数，保证定位角对齐） */
    size?: number;
    /** 容错等级（演示矩阵中影响数据区填充密度） */
    level?: ErrorLevel;
    /** 前景色 */
    color?: string;
    /** 背景色 */
    background?: string;
    /** 订阅二维码内容：挂载时调用，resolve 出的字符串用于渲染，优先级高于 value */
    subscribe?: SubscribeHandler<string>;
    /** 订阅失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    value: '',
    size: 21,
    level: 'M',
    color: '#171717',
    background: 'transparent',
    subscribe: undefined,
    errorText: undefined,
  },
);

const {
  state: subState,
  loading: subLoading,
  error: subError,
} = useSubscribe<string>(() => props.subscribe);

const effectiveValue = computed<string>(() => {
  if (subState.value.status === 'success' && subState.value.data != null) {
    return subState.value.data as string;
  }
  return props.value ?? '';
});
const errorText = computed(() =>
  subError.value != null ? subscribeErrorText(subError.value, props.errorText) : null,
);

/** 容错等级 → 数据区填充密度 */
const LEVEL_DENSITY: Record<ErrorLevel, number> = {
  L: 0.34,
  M: 0.45,
  Q: 0.55,
  H: 0.66,
};

/** 字符串确定性哈希（FNV-1a 32 位） */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash || 1;
}

/**
 * 文本 → 点阵矩阵（组件内纯函数）。
 * 注意：演示用确定性图案，非真实 QR 编码；保留三定位角、定时线与
 * 按容错等级变化的数据区密度，视觉与结构对齐真实二维码。
 */
function buildMatrix(value: string, size: number, level: ErrorLevel): boolean[] {
  if (size % 2 === 0) throw new Error('QRCode size must be odd');
  const total = size * size;
  const matrix = new Array<boolean>(total).fill(false);

  let seed = hashString(value);
  const density = LEVEL_DENSITY[level];
  for (let i = 0; i < total; i += 1) {
    seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
    matrix[i] = seed % 1000 < density * 1000;
  }

  /** 7×7 定位角：外框 + 3×3 实心核 */
  const stampFinder = (row0: number, col0: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        // 定位角之间留 1 格分隔
        matrix[(row0 + r) * size + (col0 + c)] = edge || core;
      }
    }
  };

  // 定位角覆盖数据区
  stampFinder(0, 0);
  stampFinder(0, size - 7);
  stampFinder(size - 7, 0);

  // 定时线（第 6 行 / 列，跳过定位角区域）
  for (let i = 8; i < size - 8; i += 1) {
    const dot = i % 2 === 0;
    matrix[6 * size + i] = dot;
    matrix[i * size + 6] = dot;
  }

  return matrix;
}

const matrix = computed(() => buildMatrix(effectiveValue.value, props.size, props.level));
const darkCount = computed(() => matrix.value.filter(Boolean).length);
</script>

<template>
  <div
    class="cumquat-qrcode"
    :style="{
      gridTemplateColumns: `repeat(${size}, 1fr)`,
      width: '12rem',
      height: '12rem',
      backgroundColor: background,
    }"
    role="img"
    :aria-label="`二维码：${effectiveValue}`"
    :data-dark-count="darkCount"
  >
    <span
      v-for="(filled, index) in matrix"
      :key="index"
      class="cumquat-qrcode__cell"
      :class="filled ? 'cumquat-qrcode__cell--dark' : 'cumquat-qrcode__cell--light'"
      :style="filled ? { backgroundColor: color } : undefined"
    />

    <p v-if="errorText" class="cumquat-qrcode__error cq-state--error" role="alert">
      {{ errorText }}
    </p>
  </div>
</template>
