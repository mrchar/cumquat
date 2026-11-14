<script setup lang="ts">
import type { ActionHandler } from '@cumquat/core';
import { asyncErrorText } from '@cumquat/core';
import type { MountTarget } from '@cumquat/composables';
import { useActionState, useModal, useOverlayContainer } from '@cumquat/composables';
import { computed, reactive, watch } from 'vue';
import CqButton from '../general/Button.vue';

import { useCumquatConfig } from '../../config';

/** Dialog 按钮协议：动作配置对象（actions prop 每项必须是此形态；action prop 也可为此形态） */
interface DialogAction {
  /** 动作标识；不传则按索引 */
  key?: string;
  /** 按钮文案 */
  label: string;
  /** 异步执行方法 */
  handler: ActionHandler;
  /** 按钮类型，与 CqButton.type 对齐 */
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  /** 成功后是否自动关闭，默认 true */
  closeOnSuccess?: boolean;
  /** 失败后是否关闭（而非保持打开展示错误），默认 false */
  closeOnFail?: boolean;
  /** 覆盖组件默认错误文案 */
  errorText?: string;
  /** 按钮禁用态 */
  disabled?: boolean | (() => boolean);
}

/** action prop 形态：直接函数（文案用 confirmText）或配置对象 */
type ActionProp = ActionHandler | DialogAction;
/** actions prop 形态：对象数组 */
type ActionsProp = DialogAction[];

const props = withDefaults(
  defineProps<{
    /** v-model:open 控制开合 */
    open?: boolean;
    title?: string;
    width?: string;
    closable?: boolean;
    /** 点击遮罩是否关闭 */
    maskClosable?: boolean;
    /** ESC 是否关闭 */
    escClosable?: boolean;
    /** 是否锁定背景滚动 */
    lockScroll?: boolean;
    /** Teleport 目标；未传时继承 ConfigProvider 或应用配置，默认 body */
    appendTo?: MountTarget;
    /**
     * 单个动作：未提供 footer 插槽或 actions 时渲染默认底部按钮。
     * 形态一：直接传异步函数 → 按钮文案取 confirmText，类型 primary。
     * 形态二：传配置对象 → 可定制 label / type / closeOnFail 等。
     * 动作失败默认保持打开并展示错误条。
     */
    action?: ActionProp;
    /**
     * 多个动作：每个对象渲染为独立按钮，按数组顺序排列。
     * 每个动作独立 pending/loading 状态。
     */
    actions?: ActionsProp;
    /** 默认底部确认按钮文案（action prop 为函数形态时使用） */
    confirmText?: string;
    /** 默认底部取消按钮文案 */
    cancelText?: string;
    /** 动作失败时的回退文案 */
    errorText?: string;
  }>(),
  {
    open: false,
    title: '',
    width: '32rem',
    closable: true,
    maskClosable: true,
    escClosable: true,
    lockScroll: true,
    appendTo: undefined,
    action: undefined,
    actions: undefined,
    confirmText: '确认',
    cancelText: '取消',
    errorText: undefined,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  open: [];
  close: [];
  /** 动作成功后触发（无 action/actions 时点击确认即触发） */
  confirm: [];
  /** 默认底部取消按钮点击后触发 */
  cancel: [];
  /** 动作失败（reject 或返回值导出错误）时触发 */
  actionError: [error: unknown];
}>();

/* ---------------- 归一化：统一转为 DialogAction[] ---------------- */

function isDialogAction(v: unknown): v is DialogAction {
  return !!v && typeof v === 'object' && typeof (v as DialogAction).handler === 'function';
}

/** 最终要渲染的按钮数组 */
const normalizedActions = computed<DialogAction[]>(() => {
  if (props.actions && props.actions.length > 0) return props.actions;
  if (props.action) {
    if (typeof props.action === 'function') {
      return [{ label: props.confirmText, handler: props.action, type: 'primary' }];
    }
    if (isDialogAction(props.action)) return [props.action];
  }
  return [];
});

/** 是否有动作按钮（用于 footer 渲染判断） */
const hasActions = computed(() => normalizedActions.value.length > 0);

/* ---------------- 每个动作独立的状态管理 ---------------- */

interface ActionRuntime {
  pending: boolean;
  error: unknown;
  run: () => Promise<unknown>;
  closeOnSuccess: boolean;
  closeOnFail: boolean;
  errorText?: string;
  type: 'primary' | 'secondary' | 'danger' | 'ghost';
  label: string;
  disabled: boolean | (() => boolean);
}

/**
 * 运行时状态 Map：key = action.key 或索引。
 * 用 reactive 保证 computed 能追踪到各按钮的 pending/error。
 */
const runtime = reactive<Record<string, ActionRuntime>>({});

/** 最近一次出错的动作 key，用于底部错误条展示 */
const lastErrorKey = computed(() => {
  let last: string | undefined;
  for (const [k, v] of Object.entries(runtime)) {
    if (v.error != null) last = k;
  }
  return last;
});

const errorBanner = computed(() => {
  const key = lastErrorKey.value;
  if (!key) return null;
  const rt = runtime[key];
  if (!rt) return null;
  // 动作自带 errorText 时直接覆盖（跳过 asyncErrorText 对 Error.message 的提取）
  if (rt.errorText) return rt.errorText;
  return asyncErrorText(rt.error, props.errorText);
});

/** 创建/更新 runtime 条目 */
function ensureRuntime(key: string, action: DialogAction) {
  if (!runtime[key]) {
    const state = useActionState(action.handler, {
      onError: (err) => emit('actionError', err),
    });
    runtime[key] = {
      pending: false,
      error: undefined,
      run: state.run,
      closeOnSuccess: action.closeOnSuccess ?? true,
      closeOnFail: action.closeOnFail ?? false,
      errorText: action.errorText,
      type: action.type ?? 'secondary',
      label: action.label,
      disabled: action.disabled ?? false,
    };
    // 用 watch 桥接 useActionState 的响应式字段到 reactive 对象
    watch(state.pending, (v) => (runtime[key].pending = v));
    watch(state.error, (v) => (runtime[key].error = v));
  } else {
    // 配置变更时刷新非状态字段
    runtime[key].closeOnSuccess = action.closeOnSuccess ?? true;
    runtime[key].closeOnFail = action.closeOnFail ?? false;
    runtime[key].errorText = action.errorText;
    runtime[key].type = action.type ?? 'secondary';
    runtime[key].label = action.label;
    runtime[key].disabled = action.disabled ?? false;
  }
}

watch(
  normalizedActions,
  (list) => {
    const seen = new Set<string>();
    list.forEach((a, i) => {
      const key = a.key ?? String(i);
      seen.add(key);
      ensureRuntime(key, a);
    });
    // 清理已移除的 runtime 条目
    for (const key of Object.keys(runtime)) {
      if (!seen.has(key)) delete runtime[key];
    }
  },
  { immediate: true, deep: true },
);

/** 全局 pending：任一按钮在 loading 时禁用取消 */
const anyPending = computed(() => Object.values(runtime).some((r) => r.pending));

/* ---------------- 事件处理 ---------------- */

async function handleAction(key: string) {
  const rt = runtime[key];
  if (!rt || rt.pending) return;
  const result = await rt.run();
  const hasError = rt.error != null;
  if (hasError) {
    if (rt.closeOnFail) {
      emit('confirm');
      close();
    }
    // 失败默认保持打开（show error banner）
    return;
  }
  if (rt.closeOnSuccess) {
    emit('confirm');
    close();
  }
}

function handleCancel() {
  if (anyPending.value) return;
  emit('cancel');
  close();
}

/* ---------------- Modal & Overlay ---------------- */

const {
  isOpen,
  open: setOpen,
  close,
  contentRef,
  rendered,
  onAfterLeave,
  zIndex,
  onMaskClick,
} = useModal({
  modelValue: props.open !== undefined ? () => props.open : undefined,
  maskClosable: props.maskClosable,
  escClosable: props.escClosable,
  lockScroll: props.lockScroll,
  onChange: (next) => emit('update:open', next),
  onOpen: () => emit('open'),
  onClose: () => emit('close'),
});

const config = useCumquatConfig();
const { container } = useOverlayContainer({
  to: () => props.appendTo ?? config.value.overlay?.appendTo,
});
const teleportTarget = computed<MountTarget>(() => container.value ?? 'body');

defineExpose({ open: setOpen, close });
</script>

<template>
  <Teleport :to="teleportTarget">
    <Transition name="cumquat-fade" @after-leave="onAfterLeave">
      <div v-if="rendered" v-show="isOpen" class="cumquat-dialog" :style="{ zIndex }">
        <div class="cumquat-dialog__mask" @click="onMaskClick" />
        <div
          ref="contentRef"
          role="dialog"
          aria-modal="true"
          class="cumquat-dialog__panel"
          :style="{ maxWidth: width }"
        >
          <header v-if="title || closable || $slots.title" class="cumquat-dialog__header">
            <slot name="title">
              <h3 class="cumquat-dialog__title">{{ title }}</h3>
            </slot>
            <button
              v-if="closable"
              type="button"
              aria-label="关闭"
              class="cumquat-dialog__close"
              @click="close"
            >
              <svg
                class="cumquat-dialog__close-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </header>

          <div class="cumquat-dialog__body">
            <slot />
            <p v-if="errorBanner" class="cumquat-dialog__error cq-state--error" role="alert">
              {{ errorBanner }}
            </p>
          </div>

          <footer v-if="$slots.footer" class="cumquat-dialog__footer">
            <slot name="footer" />
          </footer>
          <footer v-else-if="hasActions" class="cumquat-dialog__footer" @click.self>
            <CqButton :disabled="anyPending" @click="handleCancel">{{ cancelText }}</CqButton>
            <CqButton
              v-for="(a, i) in normalizedActions"
              :key="a.key ?? i"
              :data-action-key="a.key ?? String(i)"
              :type="runtime[a.key ?? i]?.type"
              :loading="runtime[a.key ?? i]?.pending"
              :disabled="
                runtime[a.key ?? i]?.pending ||
                (typeof a.disabled === 'function' ? (a.disabled as () => boolean)() : a.disabled)
              "
              @click="handleAction(a.key ?? String(i))"
            >
              {{ a.label }}
            </CqButton>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>