<script setup lang="ts">
import { ref } from 'vue';

export interface FloatAction {
  key: string;
  label: string;
}

withDefaults(
  defineProps<{
    actions?: FloatAction[];
  }>(),
  { actions: () => [] },
);

const open = ref(false);

const emit = defineEmits<{
  select: [key: string];
}>();

function select(key: string) {
  emit('select', key);
  open.value = false;
}
</script>

<template>
  <div class="cumquat-float-button">
    <Transition name="cumquat-fade">
      <div v-if="open && actions.length > 0" class="cumquat-float-button__actions">
        <button
          v-for="action in actions"
          :key="action.key"
          type="button"
          class="cumquat-float-button__action"
          @click="select(action.key)"
        >
          {{ action.label }}
        </button>
      </div>
    </Transition>

    <button
      type="button"
      :aria-expanded="open"
      aria-label="展开操作"
      class="cumquat-float-button__trigger"
      @click="open = !open"
    >
      <svg
        class="cumquat-float-button__icon"
        :class="open ? 'cumquat-float-button__icon--expanded' : ''"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
