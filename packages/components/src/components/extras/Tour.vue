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
      <div v-if="visible" class="cumquat-tour">
        <div class="cumquat-tour__mask" />
        <div role="dialog" aria-modal="true" class="cumquat-tour__card">
          <p v-if="step" class="cumquat-tour__step-count">{{ current + 1 }} / {{ steps.length }}</p>
          <h4 class="cumquat-tour__title">
            {{ step?.title }}
          </h4>
          <p class="cumquat-tour__content">
            {{ step?.content }}
          </p>
          <div class="cumquat-tour__actions">
            <button v-if="current > 0" type="button" class="cumquat-tour__prev" @click="prev">
              上一步
            </button>
            <span v-else />
            <button type="button" class="cumquat-tour__next" @click="next">
              {{ current < steps.length - 1 ? '下一步' : '完成' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
