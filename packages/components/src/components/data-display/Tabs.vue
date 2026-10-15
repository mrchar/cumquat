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
  <div class="cumquat-tabs flex flex-col gap-4">
    <div
      role="tablist"
      class="cumquat-tabs__nav flex items-center gap-1 border-b border-cumquat-border"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :aria-selected="tab.key === active"
        :disabled="tab.disabled"
        class="cumquat-tabs__tab relative -mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        :class="
          tab.key === active
            ? 'border-cumquat-accent text-cumquat-accent'
            : 'border-transparent text-cumquat-text-muted hover:text-cumquat-text'
        "
        @click="active = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-if="$slots.default"
      role="tabpanel"
      class="cumquat-tabs__panel text-sm text-cumquat-text"
    >
      <slot />
    </div>
  </div>
</template>
