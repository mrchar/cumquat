<script setup lang="ts">
export interface StepItem {
  key: string;
  title: string;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    steps: StepItem[];
    /** 当前步骤索引（从 0 开始） */
    current?: number;
  }>(),
  { steps: () => [], current: 0 },
);

function stateOf(index: number): 'done' | 'active' | 'waiting' {
  if (index < props.current) return 'done';
  if (index === props.current) return 'active';
  return 'waiting';
}
</script>

<template>
  <ol class="cumquat-steps">
    <li v-for="(step, index) in steps" :key="step.key" class="cumquat-steps__step">
      <!-- 连接线 -->
      <span
        v-if="index > 0"
        class="cumquat-steps__line"
        :class="stateOf(index) === 'waiting' ? 'cumquat-steps__line--waiting' : ''"
      />
      <span class="cumquat-steps__dot" :class="`cumquat-steps__dot--${stateOf(index)}`">
        <svg
          v-if="stateOf(index) === 'done'"
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
        <template v-else>{{ index + 1 }}</template>
      </span>
      <div class="cumquat-steps__text">
        <span
          class="cumquat-steps__title"
          :class="stateOf(index) === 'waiting' ? 'cumquat-steps__title--waiting' : ''"
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
