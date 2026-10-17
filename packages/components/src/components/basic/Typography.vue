<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useClipboard, useResizeObserver } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 标题级别；level=0 时渲染为段落文本 */
    level?: 0 | 1 | 2 | 3 | 4;
    /** 单行截断 */
    ellipsis?: boolean;
    /** 多行截断行数（与 ellipsis 同时生效） */
    lineClamp?: number;
    /** 截断方式 */
    truncate?: 'end' | 'middle' | 'start';
    /** 显示复制按钮 */
    copyable?: boolean;
    /** 复制内容（缺省取元素文本） */
    text?: string;
    /** 可编辑 */
    editable?: boolean;
  }>(),
  {
    level: 0,
    ellipsis: false,
    lineClamp: undefined,
    truncate: 'end',
    copyable: false,
    text: undefined,
    editable: false,
  },
);

const emit = defineEmits<{
  copy: [text: string, result: boolean];
  change: [text: string];
  editStart: [];
  editEnd: [];
}>();

const rootRef = ref<HTMLElement | null>(null);

/* ---------- 溢出检测 ---------- */
const { width } = useResizeObserver(rootRef);
const overflowing = ref(false);

function measureOverflow() {
  const el = rootRef.value;
  if (!el || props.lineClamp !== undefined || props.truncate === 'middle') return;
  overflowing.value = el.scrollWidth > el.clientWidth + 1;
}

watch(width, measureOverflow);
onMounted(() => nextTick(measureOverflow));

const rawText = computed(() => props.text ?? rootRef.value?.textContent?.trim() ?? '');

/* ---------- 复制 ---------- */
const { copied, copy } = useClipboard();
// 剪贴板不可用环境下仍提供乐观反馈
const optimisticCopied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function onCopy() {
  const text = rawText.value;
  const result = await copy(text);
  optimisticCopied.value = true;
  emit('copy', text, result);
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    optimisticCopied.value = false;
  }, 1500);
}

onBeforeUnmount(() => copiedTimer && clearTimeout(copiedTimer));

const copiedState = computed(() => copied.value || optimisticCopied.value);

/* ---------- 编辑态 ---------- */
const editing = ref(false);
const draft = ref('');

function startEdit() {
  draft.value = rawText.value;
  editing.value = true;
  emit('editStart');
  nextTick(() => editorRef.value?.focus());
}

const editorRef = ref<HTMLTextAreaElement | null>(null);

function commitEdit() {
  if (!editing.value) return;
  editing.value = false;
  emit('change', draft.value);
  emit('editEnd');
}

function cancelEdit() {
  editing.value = false;
  emit('editEnd');
}

function onEditorKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    commitEdit();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelEdit();
  }
}

/* ---------- 中间截断 ---------- */
const middleParts = computed(() => {
  if (props.truncate !== 'middle') return null;
  const text = rawText.value;
  const midpoint = Math.ceil(text.length / 2);
  return { head: text.slice(0, midpoint), tail: text.slice(midpoint) };
});

const tag = computed(() => (props.level === 0 ? 'p' : `h${props.level}`));
const showActions = computed(() => !editing.value && (props.copyable || props.editable));
</script>

<template>
  <component
    :is="tag"
    ref="rootRef"
    class="cumquat-typography"
    :class="[
      level > 0 ? `cumquat-typography--${level}` : '',
      ellipsis ? 'cumquat-typography--ellipsis' : '',
      lineClamp !== undefined ? 'cumquat-typography--clamp' : '',
      truncate === 'middle' ? 'cumquat-typography--middle' : '',
      truncate === 'start' ? 'cumquat-typography--start' : '',
      editing ? 'cumquat-typography--editing' : '',
    ]"
    :style="
      lineClamp !== undefined
        ? {
            display: '-webkit-box',
            '-webkit-line-clamp': lineClamp,
            '-webkit-box-orient': 'vertical',
          }
        : undefined
    "
    :title="overflowing ? rawText : undefined"
  >
    <textarea
      v-if="editing"
      ref="editorRef"
      v-model="draft"
      class="cumquat-typography__editor"
      rows="2"
      @blur="commitEdit"
      @keydown="onEditorKeydown"
    />
    <template v-else-if="middleParts">
      <span class="cumquat-typography__head">{{ middleParts.head }}</span>
      <span class="cumquat-typography__tail">{{ middleParts.tail }}</span>
    </template>
    <slot v-else />

    <span v-if="showActions" class="cumquat-typography__actions">
      <button
        v-if="editable"
        type="button"
        aria-label="编辑"
        class="cumquat-typography__edit"
        @click="startEdit"
      >
        <svg
          class="cumquat-typography__edit-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        v-if="copyable"
        type="button"
        :aria-label="copiedState ? '已复制' : '复制'"
        class="cumquat-typography__copy"
        @click="onCopy"
      >
        <svg
          v-if="!copiedState"
          class="cumquat-typography__copy-icon"
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
          class="cumquat-typography__copy-icon cumquat-typography__copy-icon--success"
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
    </span>
  </component>
</template>
