<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useControllableModel, useRovingFocus } from '@cumquat/composables';

export interface TabItem {
  key: string;
  label: string;
  disabled?: boolean;
  closable?: boolean;
}

const props = withDefaults(
  defineProps<{
    tabs: TabItem[];
    modelValue?: string;
    /** 允许增减页签（触发 add/remove 事件，数据由外层维护） */
    editable?: boolean;
    addText?: string;
    /** 面板懒渲染：首次激活后才挂载内容，默认 true */
    lazy?: boolean;
  }>(),
  {
    tabs: () => [],
    modelValue: undefined,
    editable: false,
    addText: '+',
    lazy: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [key: string];
  change: [key: string];
  add: [];
  remove: [tab: TabItem];
}>();

const { value: active } = useControllableModel<string>({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  defaultValue: '',
  fallback: '',
  onChange: (key) => {
    emit('update:modelValue', key);
    emit('change', key);
  },
});

function activate(key: string) {
  active.value = key;
  visitedKeys.value.add(key);
}

/** 已访问过的页签（懒渲染依据） */
const visitedKeys = ref<Set<string>>(new Set(active.value ? [active.value] : []));

const enabledIndex = (index: number) => !!props.tabs[index] && !props.tabs[index].disabled;

const nav = useRovingFocus({
  count: () => props.tabs.length,
  isItemDisabled: (index) => !enabledIndex(index),
  orientation: 'horizontal',
  autofocus: false,
});

watch(
  () => props.tabs,
  (tabs) => {
    const current = tabs[nav.activeIndex.value];
    if (!current || current.disabled) {
      const first = tabs.find((tab) => !tab.disabled);
      if (first) nav.setActiveIndex(tabs.indexOf(first));
    }
  },
);

function onClickTab(tab: TabItem, index: number) {
  if (tab.disabled) return;
  nav.setActiveIndex(index);
  activate(tab.key);
}

function onNavKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    const tab = props.tabs[nav.activeIndex.value];
    if (tab && !tab.disabled) activate(tab.key);
    return;
  }
  nav.onKeydown(event);
}

function onAdd() {
  emit('add');
}

function onRemove(event: MouseEvent, tab: TabItem) {
  event.stopPropagation();
  emit('remove', tab);
}

const panelMounted = computed(() => !props.lazy || visitedKeys.value.size > 0 || !!active.value);
</script>

<template>
  <div class="cumquat-tabs">
    <div role="tablist" class="cumquat-tabs__nav" @keydown="onNavKeydown">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key"
        type="button"
        role="tab"
        :data-roving-index="index"
        :aria-selected="tab.key === active"
        :tabindex="nav.getTabIndex(index)"
        :disabled="tab.disabled"
        class="cumquat-tabs__tab"
        :class="tab.key === active ? 'cumquat-tabs__tab--active' : ''"
        @focus="nav.onItemFocus(index)"
        @click="onClickTab(tab, index)"
      >
        {{ tab.label }}
        <i
          v-if="editable && tab.closable !== false"
          role="button"
          aria-label="关闭页签"
          class="cumquat-tabs__close"
          @click="onRemove($event, tab)"
        />
      </button>
      <button
        v-if="editable"
        type="button"
        aria-label="新增页签"
        class="cumquat-tabs__add"
        @click="onAdd"
      >
        {{ addText }}
      </button>
    </div>
    <div v-if="$slots.default && panelMounted" role="tabpanel" class="cumquat-tabs__panel">
      <slot :active="active" />
    </div>
  </div>
</template>
