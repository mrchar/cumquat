<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    value: string;
    /** 格子规模 */
    size?: number;
  }>(),
  { size: 21 },
);

/** 基于字符串的确定性伪随机图案（演示态，非真实编码） */
const cells = computed<boolean[]>(() => {
  const seed = props.value.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const total = props.size * props.size;
  const list: boolean[] = [];
  let x = seed || 1;
  for (let i = 0; i < total; i++) {
    x = (x * 1103515245 + 12345) % 2147483648;
    list.push(x % 100 < 45);
  }
  // 三个定位角
  const mark = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const idx = (row + r) * props.size + (col + c);
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        list[idx] = edge || core;
      }
    }
  };
  mark(0, 0);
  mark(0, props.size - 7);
  mark(props.size - 7, 0);
  return list;
});
</script>

<template>
  <div
    class="cumquat-qrcode grid bg-cumquat-surface p-2"
    :style="{ gridTemplateColumns: `repeat(${size}, 1fr)`, width: '12rem', height: '12rem' }"
    role="img"
    :aria-label="`二维码：${value}`"
  >
    <span
      v-for="(filled, index) in cells"
      :key="index"
      class="cumquat-qrcode__cell aspect-square"
      :class="filled ? 'bg-cumquat-text' : 'bg-transparent'"
    />
  </div>
</template>
