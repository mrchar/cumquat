<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  actionErrorText,
  useActionState,
  useScrollIntoView,
  useZIndex,
} from '@cumquat/composables';
import type { ActionLike } from '@cumquat/composables';

export interface TourStep {
  key: string;
  title: string;
  content: string;
  /** 目标元素选择器（高亮挖空 + 卡片定位） */
  target?: string;
  /** 卡片相对目标的位置 */
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const props = withDefaults(
  defineProps<{
    steps: TourStep[];
    open?: boolean;
    /** 是否显示"跳过"按钮 */
    skippable?: boolean;
    /** 是否显示关闭按钮 */
    closable?: boolean;
    /** 高亮挖空区与目标的间距 */
    gap?: number;
    /** 步骤推进动作：执行期间禁用推进，失败停留当前步骤并展示错误提示 */
    action?: ActionLike;
    /** 动作失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    steps: () => [],
    open: false,
    skippable: true,
    closable: true,
    gap: 8,
    action: undefined,
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  close: [];
  finish: [];
  skip: [];
  change: [current: number];
  /** 推进动作失败（reject 或返回值导出错误）时触发 */
  actionError: [error: unknown];
}>();

const visible = defineModel<boolean>('open', { default: false });

const current = ref(0);
const { nextZIndex } = useZIndex();
const zIndex = ref(nextZIndex());
const scrollIntoView = useScrollIntoView();

const step = computed(() => props.steps[current.value]);
const isFirst = computed(() => current.value === 0);
const isLast = computed(() => current.value === props.steps.length - 1);

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const EMPTY_RECT: Rect = { top: 0, left: 0, width: 0, height: 0 };
const targetRect = ref<Rect>(EMPTY_RECT);
const hasTarget = ref(false);

/** 测量当前步骤目标元素矩形 */
function measureTarget() {
  const selector = step.value?.target;
  if (!selector || typeof document === 'undefined') {
    hasTarget.value = false;
    targetRect.value = EMPTY_RECT;
    return;
  }
  const el = document.querySelector(selector);
  if (!el) {
    hasTarget.value = false;
    targetRect.value = EMPTY_RECT;
    return;
  }
  const rect = el.getBoundingClientRect();
  hasTarget.value = true;
  targetRect.value = {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
  scrollIntoView(el, { behavior: 'smooth', block: 'center' });
}

/** 挖空遮罩：四块矩形围绕目标 */
const cutouts = computed(() => {
  if (!hasTarget.value) return [];
  const { top, left, width, height } = targetRect.value;
  const g = props.gap;
  const t = top - g;
  const l = left - g;
  const w = width + g * 2;
  const h = height + g * 2;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 0;
  return [
    { top: 0, left: 0, width: '100%', height: `${Math.max(0, t)}px` },
    { top: `${t + h}px`, left: 0, width: '100%', height: `${Math.max(0, vh - t - h)}px` },
    { top: `${t}px`, left: 0, width: `${Math.max(0, l)}px`, height: `${h}px` },
    {
      top: `${t}px`,
      left: `${l + w}px`,
      width: `${Math.max(0, vw - l - w)}px`,
      height: `${h}px`,
    },
  ];
});

/** 卡片定位（目标下方，超出视口翻到上方） */
const cardStyle = computed(() => {
  if (!hasTarget.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: zIndex.value + 1,
    };
  }
  const { top, left, width, height } = targetRect.value;
  const above = (step.value?.placement ?? 'bottom') === 'top';
  return {
    top: `${above ? top - props.gap : top + height + props.gap}px`,
    left: `${Math.max(12, left)}px`,
    minWidth: `${Math.min(width, 280)}px`,
    transform: above ? 'translateY(-100%)' : 'none',
    zIndex: zIndex.value + 1,
  };
});

const {
  pending: actionPending,
  error: actionError,
  run: runAction,
} = useActionState(() => props.action?.(), { onError: (err) => emit('actionError', err) });

const errorText = computed(() =>
  actionError.value != null ? actionErrorText(actionError.value, props.errorText) : null,
);

function activateStep(index: number) {
  current.value = index;
  emit('change', index);
  nextTick(measureTarget);
}

/** 推进：有 action 时执行并等待，成功才进入下一步/完成；失败停留当前步骤 */
async function next() {
  if (actionPending.value) return;
  if (props.action) {
    await runAction();
    if (actionError.value != null) return;
  }
  if (!isLast.value) activateStep(current.value + 1);
  else finish();
}

function prev() {
  if (!isFirst.value) activateStep(current.value - 1);
}

function close() {
  visible.value = false;
  emit('update:open', false);
  emit('close');
}

function finish() {
  visible.value = false;
  emit('update:open', false);
  emit('finish');
}

function skip() {
  emit('skip');
  close();
}

watch(
  () => visible.value,
  (open) => {
    if (open) {
      zIndex.value = nextZIndex();
      activateStep(0);
    }
  },
);

// 打开时即测量一次（受控 open=true 直接挂载）
watch(
  () => props.open,
  (open) => {
    if (open) nextTick(measureTarget);
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="cumquat-fade">
      <div v-if="visible" class="cumquat-tour">
        <!-- 高亮挖空遮罩 -->
        <span
          v-for="(cutout, index) in cutouts"
          :key="index"
          class="cumquat-tour__mask"
          :style="{ ...cutout, zIndex }"
          aria-hidden="true"
        />
        <div
          v-if="!hasTarget"
          class="cumquat-tour__mask cumquat-tour__mask--full"
          :style="{ zIndex }"
        />

        <div
          role="dialog"
          aria-modal="true"
          class="cumquat-tour__card"
          :class="hasTarget ? 'cumquat-tour__card--anchored' : 'cumquat-tour__card--center'"
          :style="cardStyle"
        >
          <button
            v-if="closable"
            type="button"
            aria-label="关闭引导"
            class="cumquat-tour__close"
            @click="close"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          <p v-if="step" class="cumquat-tour__step-count">{{ current + 1 }} / {{ steps.length }}</p>
          <h4 class="cumquat-tour__title">
            {{ step?.title }}
          </h4>
          <p class="cumquat-tour__content">
            {{ step?.content }}
          </p>
          <p v-if="errorText" class="cumquat-tour__error cq-state--error" role="alert">
            {{ errorText }}
          </p>
          <div class="cumquat-tour__actions">
            <button
              v-if="skippable"
              type="button"
              class="cumquat-tour__skip"
              :disabled="actionPending"
              @click="skip"
            >
              跳过
            </button>
            <button
              v-if="current > 0"
              type="button"
              class="cumquat-tour__prev"
              :disabled="actionPending"
              @click="prev"
            >
              上一步
            </button>
            <span v-else />
            <button
              type="button"
              class="cumquat-tour__next"
              :disabled="actionPending"
              @click="next"
            >
              {{ isLast ? '完成' : actionPending ? '处理中…' : '下一步' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
