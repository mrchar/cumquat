<script setup lang="ts">
import { computed } from 'vue';
import { useMediaQuery } from '@cumquat/composables';

type Cols = 1 | 2 | 3 | 4;
type Gap = 'none' | 'sm' | 'md' | 'lg';
type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

const props = withDefaults(
  defineProps<{
    /** 默认列数（1-4），可被断点列数覆盖 */
    cols?: Cols;
    /** ≥640px 列数 */
    sm?: Cols;
    /** ≥768px 列数 */
    md?: Cols;
    /** ≥1024px 列数 */
    lg?: Cols;
    /** ≥1280px 列数 */
    xl?: Cols;
    gap?: Gap;
    /** 内容居中（最大宽度约束） */
    centered?: boolean;
  }>(),
  {
    cols: 2,
    sm: undefined,
    md: undefined,
    lg: undefined,
    xl: undefined,
    gap: 'md',
    centered: false,
  },
);

const BREAKPOINT_QUERY: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
};

const matchSm = useMediaQuery(BREAKPOINT_QUERY.sm);
const matchMd = useMediaQuery(BREAKPOINT_QUERY.md);
const matchLg = useMediaQuery(BREAKPOINT_QUERY.lg);
const matchXl = useMediaQuery(BREAKPOINT_QUERY.xl);

/** 按断点取当前命中的最大列数配置 */
const activeCols = computed<Cols>(() => {
  if (props.xl !== undefined && matchXl.value) return props.xl;
  if (props.lg !== undefined && matchLg.value) return props.lg;
  if (props.md !== undefined && matchMd.value) return props.md;
  if (props.sm !== undefined && matchSm.value) return props.sm;
  return props.cols;
});

const activeBreakpoint = computed<Breakpoint | 'xs'>(() => {
  if (matchXl.value) return 'xl';
  if (matchLg.value) return 'lg';
  if (matchMd.value) return 'md';
  if (matchSm.value) return 'sm';
  return 'xs';
});
</script>

<template>
  <div
    class="cumquat-grid"
    :class="[
      `cumquat-grid--cols-${activeCols}`,
      `cumquat-grid--gap-${gap}`,
      `cumquat-grid--bp-${activeBreakpoint}`,
      centered ? 'cumquat-grid--centered' : '',
    ]"
  >
    <slot />
  </div>
</template>
