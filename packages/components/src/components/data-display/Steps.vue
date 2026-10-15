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
  <ol class="cumquat-steps flex w-full items-start">
    <li
      v-for="(step, index) in steps"
      :key="step.key"
      class="cumquat-steps__step relative flex flex-1 flex-col items-center"
      :class="index < steps.length - 1 ? '' : ''"
    >
      <!-- 连接线 -->
      <span
        v-if="index > 0"
        class="cumquat-steps__line absolute top-4 right-1/2 h-0.5 w-full"
        :class="stateOf(index) === 'waiting' ? 'bg-cumquat-border' : 'bg-cumquat-accent'"
      />
      <span
        class="cumquat-steps__dot relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors"
        :class="
          stateOf(index) === 'done'
            ? 'border-cumquat-accent bg-cumquat-accent text-cumquat-text-inverse'
            : stateOf(index) === 'active'
              ? 'border-cumquat-accent bg-cumquat-surface text-cumquat-accent'
              : 'border-cumquat-border bg-cumquat-surface text-cumquat-text-muted'
        "
      >
        <svg
          v-if="stateOf(index) === 'done'"
          class="size-4"
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
      <div class="cumquat-steps__text mt-2 flex flex-col items-center gap-0.5 text-center">
        <span
          class="cumquat-steps__title text-sm font-medium"
          :class="stateOf(index) === 'waiting' ? 'text-cumquat-text-muted' : 'text-cumquat-text'"
        >
          {{ step.title }}
        </span>
        <span
          v-if="step.description"
          class="cumquat-steps__description text-xs text-cumquat-text-muted"
        >
          {{ step.description }}
        </span>
      </div>
    </li>
  </ol>
</template>
