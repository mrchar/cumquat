import { computed, ref } from 'vue';

/**
 * 语音按钮手势状态机：按住说话、上滑取消、左右滑选中功能项。
 *
 * 按下后指针被捕获，移出按钮仍持续追踪；松开时按当前手势区产出结果：
 * - 原地松开 → confirm（正常确认）
 * - 上滑越过阈值 → cancel（取消）
 * - 左右滑越过阈值 → action（选中该方向的功能项，回到中心复位）
 * 纵向位移占优走取消区，横向位移占优走功能区，两轴独立判定互不干扰。
 */

/** 左右滑可选功能项 */
export interface VoiceButtonAction {
  key: string;
  label: string;
  /** 滑动方向：left 左滑选中 / right 右滑选中；缺省按序号左右交替 */
  direction?: 'left' | 'right';
}

/** 手势区域：confirm 原地确认 / cancel 上滑取消 / action 左右滑功能项 */
export type VoiceGesture = 'confirm' | 'cancel' | 'action';

/** 松开结果：result 为 action 时携带选中的功能键 */
export interface VoiceReleasePayload {
  result: VoiceGesture;
  key?: string;
}

/** 指针事件的最小形状（兼容键盘回退事件：无 pointerId / 无位移坐标） */
interface GesturePointerLike {
  pointerId?: number;
  currentTarget?: EventTarget | null;
  clientX?: number;
  clientY?: number;
}

export interface UseVoiceButtonOptions {
  /** 上滑取消的触发距离（px，位移向上量为负） */
  cancelDistance?: number;
  /** 左右滑选中功能的触发距离（px） */
  actionDistance?: number;
  /** 是否忽略按下（禁用态） */
  disabled?: () => boolean;
  /** 按下回调（可据此开始录音） */
  onPressStart?: () => void;
  /** 松开回调（按住期间被系统打断按取消处理） */
  onRelease?: (payload: VoiceReleasePayload) => void;
}

export function useVoiceButton(
  actions: () => VoiceButtonAction[] | undefined,
  options: UseVoiceButtonOptions = {},
) {
  const cancelDistance = options.cancelDistance ?? 48;
  const actionDistance = options.actionDistance ?? 48;

  const holding = ref(false);
  const gesture = ref<VoiceGesture>('confirm');
  const activeAction = ref<VoiceButtonAction>();

  const actionList = computed(() => actions() ?? []);

  /** 按方向解析功能项：显式 direction 优先，缺省按序号左右交替 */
  const actionOf = (direction: 'left' | 'right') =>
    actionList.value.find(
      (action, index) =>
        (action.direction ?? (index % 2 === 0 ? 'left' : 'right')) === direction,
    );

  let startX = 0;
  let startY = 0;

  /** 按位移更新手势区：回到阈值内自动复位为确认区 */
  const evaluate = (dx: number, dy: number) => {
    if (Math.abs(dy) >= Math.abs(dx) && dy <= -cancelDistance) {
      gesture.value = 'cancel';
      activeAction.value = undefined;
      return;
    }
    const direction =
      Math.abs(dx) > Math.abs(dy)
        ? dx <= -actionDistance
          ? 'left'
          : dx >= actionDistance
            ? 'right'
            : undefined
        : undefined;
    const hit = direction ? actionOf(direction) : undefined;
    if (hit) {
      gesture.value = 'action';
      activeAction.value = hit;
    } else {
      gesture.value = 'confirm';
      activeAction.value = undefined;
    }
  };

  const onPointerDown = (event: GesturePointerLike) => {
    if (holding.value || options.disabled?.()) return;
    holding.value = true;
    gesture.value = 'confirm';
    activeAction.value = undefined;
    startX = event.clientX ?? 0;
    startY = event.clientY ?? 0;
    try {
      const el = event.currentTarget as HTMLElement | null;
      if (el && event.pointerId !== undefined) el.setPointerCapture?.(event.pointerId);
    } catch {
      // 无效指针或测试环境无捕获能力时忽略
    }
    options.onPressStart?.();
  };

  const onPointerMove = (event: GesturePointerLike) => {
    if (!holding.value) return;
    evaluate((event.clientX ?? 0) - startX, (event.clientY ?? 0) - startY);
  };

  const release = (fallback: VoiceReleasePayload) => {
    if (!holding.value) return;
    holding.value = false;
    const payload: VoiceReleasePayload =
      gesture.value === 'action'
        ? { result: 'action', key: activeAction.value?.key }
        : { result: gesture.value };
    gesture.value = 'confirm';
    activeAction.value = undefined;
    options.onRelease?.(fallback.result === 'cancel' ? fallback : payload);
  };

  const onPointerUp = (event?: GesturePointerLike) => {
    void event;
    release({ result: 'confirm' });
  };

  /** 系统打断（来电、手势冲突等）：按取消收尾 */
  const onPointerCancel = () => {
    release({ result: 'cancel' });
  };

  return {
    holding,
    gesture,
    activeAction,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
