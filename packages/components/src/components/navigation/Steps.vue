<script setup lang="ts">
import { computed, ref } from 'vue';

export type StepStatus = 'done' | 'active' | 'error' | 'waiting';

export interface StepItem {
  key: string;
  title: string;
  description?: string;
  /** 单步状态覆盖（如标记某一步 error） */
  status?: Exclude<StepStatus, 'waiting'>;
  disabled?: boolean;
}

const props = withDefaults(
  defineProps<{
    steps: StepItem[];
    /** 当前步骤索引（从 0 开始） */
    current?: number;
    /** 是否允许点击已到达的步骤跳转 */
    changeable?: boolean;
  }>(),
  { steps: () => [], current: 0, changeable: true },
);

const emit = defineEmits<{
  'update:current': [index: number];
  change: [index: number];
}>();

/** 非受控回退值；传入 current 时以 prop 为准 */
const innerCurrent = ref(0);
const currentIndex = computed(() => props.current);
const activeIndex = computed(() => currentIndex.value ?? innerCurrent.value);

function stateOf(index: number, step: StepItem): StepStatus {
  if (step.status) return step.status;
  if (index < activeIndex.value) return 'done';
  if (index === activeIndex.value) return 'active';
  return 'waiting';
}

function goTo(index: number, step: StepItem) {
  if (!props.changeable || step.disabled) return;
  if (index === activeIndex.value) return;
  innerCurrent.value = index;
  emit('update:current', index);
  emit('change', index);
}

function next() {
  const target = Math.min(activeIndex.value + 1, props.steps.length - 1);
  goTo(target, props.steps[target] ?? { key: '', title: '' });
}

function prev() {
  const target = Math.max(activeIndex.value - 1, 0);
  goTo(target, props.steps[target] ?? { key: '', title: '' });
}

defineExpose({ next, prev, goTo });
</script>

<template>
  <ol class="cumquat-steps">
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="cumquat-steps__step"
      :class="`cumquat-steps__step--${stateOf(index, step)}`"
    >
      <!-- 连接线 -->
      <span
        v-if="index > 0"
        class="cumquat-steps__line"
        :class="stateOf(index, step) === 'waiting' ? 'cumquat-steps__line--waiting' : ''"
      />
      <span
        class="cumquat-steps__dot"
        :class="[
          `cumquat-steps__dot--${stateOf(index, step)}`,
          changeable && !step.disabled ? 'cumquat-steps__dot--clickable' : '',
        ]"
        @click="goTo(index, step)"
      >
        <svg
          v-if="stateOf(index, step) === 'done'"
          class="cumquat-steps__dot-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
        <svg
          v-else-if="stateOf(index, step) === 'error'"
          class="cumquat-steps__dot-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
        >
          <path d="M12 8v5M12 16.5v.5" />
        </svg>
        <template v-else>{{ index + 1 }}</template>
      </span>
      <div class="cumquat-steps__text">
        <span
          class="cumquat-steps__title"
          :class="[
            stateOf(index, step) === 'waiting' ? 'cumquat-steps__title--waiting' : '',
            changeable && !step.disabled ? 'cumquat-steps__title--clickable' : '',
          ]"
          @click="goTo(index, step)"
        >
          {{ step.title }}
        </span>
        <span v-if="step.description" class="cumquat-steps__description">
          {{ step.description }}
        </span>
      </div>
    </li>
  </ol>
</template>
