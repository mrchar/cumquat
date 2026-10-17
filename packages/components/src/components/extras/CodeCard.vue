<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue';
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
    /** 是否允许编辑代码；编辑内容通过 update:code 同步给宿主 */
    editable?: boolean;
  }>(),
  {
    title: '',
    language: 'vue',
    defaultExpand: false,
    editable: false,
  },
);

const emit = defineEmits<{
  /** 编辑防抖后的最新代码 */
  'update:code': [code: string];
  /** 点击恢复后触发 */
  reset: [];
}>();

const { value: expanded, toggle: toggleExpanded } = useToggle(props.defaultExpand);
const { copied, copy } = useClipboard();

/** 去除代码文本的公共缩进与首尾空行，便于在模板字符串中自然书写 */
const prettyCode = computed(() => {
  const lines = props.code.replace(/^\n+|\n+$/g, '').split('\n');
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)?.[0].length ?? 0);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((line) => sliceCommonIndent(line, min)).join('\n');
});

function sliceCommonIndent(line: string, min: number) {
  return line.slice(min);
}

/* ---------------- 编辑与恢复 ---------------- */
const editing = ref(false);
const draftCode = ref('');
/** 首次拿到代码时的快照，恢复的目标基准 */
const initialCode = ref('');
const dirty = ref(false);

let emitTimer: ReturnType<typeof setTimeout> | undefined;
function scheduleEmit(code: string) {
  if (emitTimer) clearTimeout(emitTimer);
  emitTimer = setTimeout(() => emit('update:code', code), 300);
}
onUnmounted(() => {
  if (emitTimer) clearTimeout(emitTimer);
});

function startEditing() {
  if (!initialCode.value) initialCode.value = prettyCode.value;
  draftCode.value = prettyCode.value;
  dirty.value = draftCode.value !== initialCode.value;
  editing.value = true;
  // 等待 textarea 挂载后自适应高度
  requestAnimationFrame(() => resizeEditor());
}

function finishEditing() {
  if (emitTimer) {
    clearTimeout(emitTimer);
    emitTimer = undefined;
    emit('update:code', draftCode.value);
  }
  editing.value = false;
}

function onEditorInput(event: Event) {
  const value = (event.target as HTMLTextAreaElement).value;
  draftCode.value = value;
  dirty.value = value !== initialCode.value;
  resizeEditor(event.target as HTMLTextAreaElement);
  scheduleEmit(value);
}

function resetCode() {
  if (emitTimer) {
    clearTimeout(emitTimer);
    emitTimer = undefined;
  }
  draftCode.value = initialCode.value;
  dirty.value = false;
  editing.value = false;
  emit('update:code', initialCode.value);
  emit('reset');
}

function resizeEditor(target?: HTMLTextAreaElement) {
  const el = target ?? editorRef.value;
  if (el) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
}

const editorRef = ref<HTMLTextAreaElement | null>(null);

/** 高亮完成的 HTML；为空时降级渲染纯文本 */
const highlightedHtml = ref('');

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
      <template v-if="editable">
        <button
          type="button"
          class="cumquat-code-card__action"
          :class="editing ? 'cumquat-code-card__action--active' : ''"
          :aria-pressed="editing"
          @click="editing ? finishEditing() : startEditing()"
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {{ editing ? '完成编辑' : '编辑代码' }}
        </button>
        <button v-if="dirty" type="button" class="cumquat-code-card__action" @click="resetCode()">
          <svg
            class="cumquat-code-card__action-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          恢复
        </button>
      </template>
    </div>

    <div v-show="expanded || editing" class="cumquat-code-card__code">
      <textarea
        v-if="editing"
        ref="editorRef"
        v-model="draftCode"
        class="cumquat-code-card__editor"
        spellcheck="false"
        aria-label="编辑示例代码"
        @input="onEditorInput"
      ></textarea>
      <template v-else>
        <div
          v-if="highlightedHtml"
          class="cumquat-code-card__highlight"
          v-html="highlightedHtml"
        ></div>
        <pre v-else class="cumquat-code-card__plain"><code>{{ prettyCode }}</code></pre>
      </template>
    </div>
  </section>
</template>
