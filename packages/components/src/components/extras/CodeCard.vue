<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useClipboard, useToggle } from '@cumquat/composables';
import { getCodeHighlighter } from './codeHighlighter';

const props = withDefaults(
  defineProps<{
    /** 卡片标题，不传则不渲染标题栏 */
    title?: string;
    /** 示例源码文本，支持带公共缩进的模板字符串 */
    code: string;
    /** 源码语言（vue / typescript / javascript / css / html / json） */
    language?: string;
    /** 初始是否展开代码 */
    defaultExpand?: boolean;
  }>(),
  {
    title: '',
    language: 'vue',
    defaultExpand: false,
  },
);

const { value: expanded, toggle: toggleExpanded } = useToggle(props.defaultExpand);
const { copied, copy } = useClipboard();

/** 去除代码文本的公共缩进与首尾空行，便于在模板字符串中自然书写 */
const prettyCode = computed(() => {
  const lines = props.code.replace(/^\n+|\n+$/g, '').split('\n');
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(min)).join('\n');
});

/** 高亮完成的 HTML；为空时降级渲染纯文本 */
const highlightedHtml = ref('');

onMounted(() => {
  watch(
    [prettyCode, () => props.language],
    async ([code, language]) => {
      try {
        const highlighter = await getCodeHighlighter();
        highlightedHtml.value = highlighter.codeToHtml(code, {
          lang: language,
          themes: { light: 'github-light', dark: 'github-dark' },
          // 颜色交给主题包按 cq-theme-* 选择，此处不输出默认色
          defaultColor: false,
        });
      } catch {
        highlightedHtml.value = '';
      }
    },
    { immediate: true },
  );
});
</script>

<template>
  <section class="cumquat-code-card">
    <header v-if="title" class="cumquat-code-card__header">
      <h3 class="cumquat-code-card__title">{{ title }}</h3>
    </header>

    <div class="cumquat-code-card__preview">
      <slot />
    </div>

    <div class="cumquat-code-card__toolbar">
      <button type="button" class="cumquat-code-card__action" @click="copy(prettyCode)">
        <svg
          class="cumquat-code-card__action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect width="14" height="14" x="8" y="8" rx="2" />
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
        </svg>
        {{ copied ? '已复制' : '复制' }}
      </button>
      <button
        type="button"
        class="cumquat-code-card__action"
        :class="expanded ? 'cumquat-code-card__action--active' : ''"
        :aria-expanded="expanded"
        @click="toggleExpanded()"
      >
        <svg
          class="cumquat-code-card__action-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m8 6-6 6 6 6" />
          <path d="m16 6 6 6-6 6" />
        </svg>
        {{ expanded ? '收起代码' : '展开代码' }}
      </button>
    </div>

    <div v-show="expanded" class="cumquat-code-card__code">
      <div
        v-if="highlightedHtml"
        class="cumquat-code-card__highlight"
        v-html="highlightedHtml"
      ></div>
      <pre v-else class="cumquat-code-card__plain"><code>{{ prettyCode }}</code></pre>
    </div>
  </section>
</template>
