<script setup lang="ts">
export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
}

withDefaults(
  defineProps<{
    tabs: TabItem[];
  }>(),
  { tabs: () => [] },
);

const active = defineModel<string>({ default: '' });
</script>

<template>
  <div class="cumquat-tabs">
    <div role="tablist" class="cumquat-tabs__nav">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="tab.key === active"
        :disabled="tab.disabled"
        class="cumquat-tabs__tab"
        :class="tab.key === active ? 'cumquat-tabs__tab--active' : ''"
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div v-if="$slots.default" role="tabpanel" class="cumquat-tabs__panel">
      <slot />
    </div>
  </div>
</template>
