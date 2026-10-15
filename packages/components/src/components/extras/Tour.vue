<script setup lang="ts">
import { computed, ref } from 'vue';

export interface TourStep {
  key: string;
  title: string;
  content: string;
}

const props = withDefaults(
  defineProps<{
    steps: TourStep[];
    open?: boolean;
  }>(),
  { steps: () => [], open: false },
);

const visible = defineModel<boolean>('open', { default: false });

const current = ref(0);

const step = computed(() => props.steps[current.value]);

function next() {
  if (current.value < props.steps.length - 1) {
    current.value++;
  } else {
    visible.value = false;
    current.value = 0;
  }
}

function prev() {
  if (current.value > 0) current.value--;
}
</script>

<template>
  <Teleport to="body">
    <Transition name="cumquat-fade">
      <div v-if="visible" class="cumquat-tour fixed inset-0 z-50">
        <div class="cumquat-tour__mask absolute inset-0 bg-black/50" />
        <div
          role="dialog"
          aria-modal="true"
          class="cumquat-tour__card absolute top-1/3 left-1/2 w-72 -translate-x-1/2 rounded-cumquat border border-cumquat-border bg-cumquat-surface p-4 shadow-cumquat-overlay"
        >
          <p v-if="step" class="cumquat-tour__step-count mb-1 text-xs text-cumquat-text-muted">
            {{ current + 1 }} / {{ steps.length }}
          </p>
          <h4 class="cumquat-tour__title text-sm font-semibold text-cumquat-text">
            {{ step?.title }}
          </h4>
          <p class="cumquat-tour__content mt-1 text-sm text-cumquat-text-muted">
            {{ step?.content }}
          </p>
          <div class="cumquat-tour__actions mt-3 flex items-center justify-between">
            <button
              v-if="current > 0"
              type="button"
              class="cumquat-tour__prev cursor-pointer rounded-cumquat border border-cumquat-border px-3 py-1 text-xs text-cumquat-text transition-colors hover:bg-cumquat-surface-2"
              @click="prev"
            >
              上一步
            </button>
            <span v-else />
            <button
              type="button"
              class="cumquat-tour__next cursor-pointer rounded-cumquat bg-cumquat-accent px-3 py-1 text-xs text-cumquat-text-inverse transition-colors hover:bg-cumquat-accent-hover"
              @click="next"
            >
              {{ current < steps.length - 1 ? '下一步' : '完成' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
