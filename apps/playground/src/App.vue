<script setup lang="ts">
import { ref, watch } from 'vue';
import Basic from './demos/basic.vue';
import FormControls from './demos/form-controls.vue';
import Overlay from './demos/overlay.vue';
import DataDisplay from './demos/data-display.vue';
import Feedback from './demos/feedback.vue';
import Navigation from './demos/navigation.vue';
import Extras from './demos/extras.vue';

type ThemeKey = 'light' | 'dark' | 'high-contrast' | 'glass';

const themes: { key: ThemeKey; label: string }[] = [
  { key: 'light', label: '亮色' },
  { key: 'dark', label: '暗色' },
  { key: 'high-contrast', label: '高对比' },
  { key: 'glass', label: '玻璃' },
];

const theme = ref<ThemeKey>('light');

watch(
  theme,
  (value) => {
    const root = document.documentElement;
    root.classList.remove(
      'cq-theme-light',
      'cq-theme-dark',
      'cq-theme-high-contrast',
      'cq-theme-glass',
      'dark',
    );
    root.classList.add(`cq-theme-${value}`);
  },
  { immediate: true },
);

const groups = [
  {
    key: 'basic',
    label: '基础 Basic',
    items: [
      { id: 'button', label: 'Button' },
      { id: 'icon', label: 'Icon' },
      { id: 'input', label: 'Input' },
      { id: 'card', label: 'Card' },
      { id: 'divider', label: 'Divider' },
      { id: 'avatar', label: 'Avatar' },
      { id: 'badge', label: 'Badge' },
      { id: 'statistic', label: 'Statistic' },
      { id: 'typography', label: 'Typography' },
      { id: 'tag', label: 'Tag' },
      { id: 'empty', label: 'Empty' },
    ],
  },
  {
    key: 'form-controls',
    label: '表单控件 Form',
    items: [
      { id: 'select', label: 'Select' },
      { id: 'checkbox', label: 'Checkbox' },
      { id: 'radio', label: 'Radio' },
      { id: 'switch', label: 'Switch' },
      { id: 'input-number', label: 'InputNumber' },
      { id: 'rate', label: 'Rate' },
      { id: 'segmented', label: 'Segmented' },
      { id: 'auto-complete', label: 'AutoComplete' },
      { id: 'mention', label: 'Mention' },
      { id: 'form', label: 'Form' },
      { id: 'tree-select', label: 'TreeSelect' },
      { id: 'slider', label: 'Slider' },
    ],
  },
  {
    key: 'overlay',
    label: '浮层 Overlay',
    items: [
      { id: 'dialog', label: 'Dialog' },
      { id: 'drawer', label: 'Drawer' },
      { id: 'dropdown', label: 'Dropdown' },
      { id: 'popover', label: 'Popover' },
      { id: 'popconfirm', label: 'Popconfirm' },
      { id: 'tooltip', label: 'Tooltip' },
    ],
  },
  {
    key: 'data-display',
    label: '数据展示 Data',
    items: [
      { id: 'table', label: 'Table' },
      { id: 'pagination', label: 'Pagination' },
      { id: 'tabs', label: 'Tabs' },
      { id: 'collapse', label: 'Collapse' },
      { id: 'tree', label: 'Tree' },
      { id: 'cascader', label: 'Cascader' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'steps', label: 'Steps' },
      { id: 'descriptions', label: 'Descriptions' },
      { id: 'carousel', label: 'Carousel' },
      { id: 'progress', label: 'Progress' },
      { id: 'image', label: 'Image' },
    ],
  },
  {
    key: 'feedback',
    label: '反馈 Feedback',
    items: [
      { id: 'message', label: 'Message' },
      { id: 'alert', label: 'Alert' },
      { id: 'notification', label: 'Notification' },
      { id: 'loading', label: 'Loading' },
      { id: 'skeleton', label: 'Skeleton' },
      { id: 'result', label: 'Result' },
      { id: 'upload', label: 'Upload' },
    ],
  },
  {
    key: 'navigation',
    label: '导航布局 Navigation',
    items: [
      { id: 'breadcrumb', label: 'Breadcrumb' },
      { id: 'menu', label: 'Menu' },
      { id: 'anchor', label: 'Anchor' },
      { id: 'back-top', label: 'BackTop' },
      { id: 'affix', label: 'Affix' },
      { id: 'float-button', label: 'FloatButton' },
      { id: 'datepicker', label: 'DatePicker' },
      { id: 'timepicker', label: 'TimePicker' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'colorpicker', label: 'ColorPicker' },
      { id: 'transfer', label: 'Transfer' },
      { id: 'virtual-list', label: 'VirtualList' },
      { id: 'layout', label: 'Layout' },
      { id: 'grid', label: 'Grid' },
      { id: 'space', label: 'Space' },
    ],
  },
  {
    key: 'extras',
    label: '其他 Extras',
    items: [
      { id: 'watermark', label: 'Watermark' },
      { id: 'tour', label: 'Tour' },
      { id: 'qrcode', label: 'QRCode' },
    ],
  },
];
</script>

<template>
  <div class="min-h-screen">
    <aside
      class="fixed inset-y-0 left-0 z-30 w-60 overflow-y-auto border-r border-cumquat-border bg-cumquat-surface px-4 py-6"
    >
      <p class="mb-5 px-2 text-lg font-semibold tracking-tight text-cumquat-text">Cumquat</p>
      <nav class="flex flex-col gap-5 pb-24">
        <div v-for="group in groups" :key="group.key">
          <p class="mb-1.5 px-2 text-xs font-semibold tracking-wide text-cumquat-text-muted">
            {{ group.label }}
          </p>
          <a
            v-for="item in group.items"
            :key="item.id"
            :href="`#${item.id}`"
            class="block rounded px-2 py-1 text-sm text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text"
          >
            {{ item.label }}
          </a>
        </div>
      </nav>
    </aside>

    <main class="ml-60 flex-1 px-8 py-6">
      <header class="mb-8 flex justify-end">
        <div
          class="inline-flex items-center gap-1 rounded-cumquat border border-cumquat-border p-1"
        >
          <button
            v-for="item in themes"
            :key="item.key"
            type="button"
            class="h-7 cursor-pointer rounded-cumquat px-3 text-sm transition-colors"
            :class="
              theme === item.key
                ? 'bg-cumquat-accent text-cumquat-text-inverse'
                : 'text-cumquat-text-muted hover:bg-cumquat-surface-2 hover:text-cumquat-text'
            "
            @click="theme = item.key"
          >
            {{ item.label }}
          </button>
        </div>
      </header>

      <div class="flex flex-col gap-12">
        <Basic />
        <FormControls />
        <Overlay />
        <DataDisplay />
        <Feedback />
        <Navigation />
        <Extras />
      </div>
    </main>
  </div>
</template>
