<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { CodeCard, Drawer, LiveDemo } from '@cumquat/components';
import { useMediaQuery } from '@cumquat/composables';
import { samples } from './samples';
import MenuPanel from './MenuPanel.vue';

type ThemeKey = 'light' | 'dark' | 'high-contrast' | 'glass';

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

/** 当前片段；切换时重建演示码与作用域，内部状态回到初始 */
const activeKey = ref(samples[0].key);
const activeSample = () => samples.find((sample) => sample.key === activeKey.value) ?? samples[0];
const code = ref(samples[0].code);
/** shallowRef 避免深度代理：scope 内演示数据自持的 ref（如识别器 transcript）保持原样 */
const scope = shallowRef(samples[0].scope?.() ?? {});

watch(activeKey, () => {
  const sample = activeSample();
  code.value = sample.code;
  scope.value = sample.scope?.() ?? {};
});

/** 菜单响应式形态：窄屏为浮层抽屉，宽屏为与内容分配宽度的可收起侧栏 */
const isNarrow = useMediaQuery('(max-width: 768px)');
const drawerOpen = ref(false);
const sidebarCollapsed = ref(false);
const docked = computed(() => !isNarrow.value && !sidebarCollapsed.value);

const toggleMenu = () => {
  if (isNarrow.value) {
    drawerOpen.value = true;
  } else {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }
};

const selectSample = (key: string) => {
  activeKey.value = key;
  drawerOpen.value = false;
};
</script>

<template>
  <div class="min-h-screen">
    <!-- 窄屏：浮层抽屉 -->
    <Drawer v-if="isNarrow" v-model:open="drawerOpen" direction="left" size="15rem" title="Cumquat">
      <MenuPanel :active-key="activeKey" v-model:theme="theme" @select="selectSample" />
    </Drawer>

    <!-- 宽屏：停靠侧栏，可收起让内容占满屏幕 -->
    <aside
      v-if="docked"
      class="fixed inset-y-0 left-0 z-30 flex w-60 flex-col overflow-y-auto border-r border-cumquat-border bg-cumquat-surface px-4 py-6"
    >
      <p class="mb-5 px-2 text-lg font-semibold tracking-tight text-cumquat-text">Cumquat</p>
      <MenuPanel :active-key="activeKey" v-model:theme="theme" @select="selectSample" />
    </aside>

    <main class="px-8 py-6" :class="docked ? 'ml-60' : ''">
      <header class="mb-6 flex items-start gap-3">
        <button
          type="button"
          :aria-label="docked ? '收起菜单' : '打开菜单'"
          class="cursor-pointer rounded p-2 text-cumquat-text-muted transition-colors hover:bg-cumquat-surface-2 hover:text-cumquat-text"
          @click="toggleMenu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-semibold text-cumquat-text">组件调试沙盒</h1>
          <p class="mt-1 text-sm text-cumquat-text-muted">
            通过左上角按钮切换片段菜单，直接编辑代码即可实时预览；调试新组件时把模板贴入编辑区。
          </p>
        </div>
      </header>

      <CodeCard v-model:code="code" editable default-expand :title="activeSample().title">
        <LiveDemo :code="code" :scope="scope" />
      </CodeCard>
    </main>
  </div>
</template>
