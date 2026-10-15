<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    /** 标题级别；level=0 时渲染为段落文本 */
    level?: 0 | 1 | 2 | 3 | 4;
    /** 单行截断 */
    ellipsis?: boolean;
    /** 显示复制按钮 */
    copyable?: boolean;
  }>(),
  { level: 0, ellipsis: false, copyable: false },
);

const copied = ref(false);

const root = ref<HTMLElement | null>(null);

async function copy() {
  const text = root.value?.textContent?.trim() ?? '';
  try {
    await navigator.clipboard?.writeText(text);
  } catch {
    // 演示组件：忽略剪贴板不可用
  }
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1500);
}

const levelClass: Record<string, string> = {
  0: 'text-base',
  1: 'text-3xl font-bold',
  2: 'text-2xl font-bold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
};
</script>

<template>
  <component
    :is="level === 0 ? 'p' : `h${level}`"
    ref="root"
    class="cumquat-typography m-0 text-cumquat-text"
    :class="[levelClass[level], ellipsis ? 'truncate' : '']"
  >
    <slot />
    <button
      v-if="copyable"
      type="button"
      :aria-label="copied ? '已复制' : '复制'"
      class="cumquat-typography__copy ml-1.5 inline-flex size-5 cursor-pointer items-center justify-center align-text-bottom text-cumquat-text-muted transition-colors hover:text-cumquat-accent"
      @click="copy"
    >
      <svg
        v-if="!copied"
        class="size-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      <svg
        v-else
        class="size-3.5 text-cumquat-success"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m5 13 4 4L19 7" />
      </svg>
    </button>
  </component>
</template>
