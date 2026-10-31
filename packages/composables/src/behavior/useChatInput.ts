import { computed, onScopeDispose, ref, toValue } from 'vue';
import type { ComputedRef, MaybeRefOrGetter, Ref, WritableComputedRef } from 'vue';
import { useControllableModel } from '../core/useControllableModel';
import type { ActionLike } from '../types';
import { actionErrorText, useActionState } from './useActionState';
import type { VoiceGesture, VoiceReleasePayload } from './useVoiceButton';

/**
 * 聊天输入条：附件气泡 + 文本输入 + 语音输入 + 发送。
 *
 * 语音识别经 VoiceRecognizer 协议注入（组件不耦合任何识别实现），
 * 两条语音入口共享同一会话语义：
 * - 长按输入框说话：转录实时写入输入框位置展示，松手后转录写入输入框，需手动发送
 * - 按住语音键说话（输入框为空时右侧窄键 / 左滑后的全宽键）：松手即把转录并入草稿发送
 * 输入框上滑取消本次转录；左滑隐藏输入框进入纯语音模式（语音键全宽，右滑恢复）。
 * 发送统一走 action 协议：执行中禁用，失败展示错误条并保留草稿（语音转录落回输入框可重试）。
 */

/** 附件条目：图片经 createObjectURL 生成缩略图，其余文件以名称气泡展示 */
export interface ChatInputAttachment {
  id: string;
  name: string;
  /** 图片预览地址 */
  previewUrl?: string;
  /** 原始文件（由组件从选择器产出，受控模式下调用方可自行构造） */
  file?: File;
}

/** 发送载荷：整份草稿（文本 + 附件） */
export interface ChatInputPayload {
  text: string;
  attachments: ChatInputAttachment[];
}

/**
 * 语音识别器协议：调用方注入实现（原生 Web Speech、讯飞等服务均可）。
 * transcript 会话期间持续更新（含中间结果），组件在会话开始前调用 reset 清空上一轮。
 */
export interface VoiceRecognizer {
  /** 实时转录文本（含中间结果） */
  transcript: Ref<string>;
  /** 实时音量 0~1（可选）：提供后录音浮层展示声波条 */
  level?: Ref<number>;
  start: () => void | Promise<void>;
  stop: () => void | Promise<void>;
  /** 清空转录（每次会话开始前调用） */
  reset: () => void;
}

/** 输入条模式：text 文本输入 / voice 纯语音（输入框隐藏，语音键全宽） */
export type ChatInputMode = 'text' | 'voice';

export interface UseChatInputOptions {
  /** 受控文本（组件传 `() => props.modelValue`，不传即非受控） */
  modelValue?: () => string | undefined;
  /** 受控附件列表（组件传 `() => props.attachments`，不传即非受控） */
  attachments?: () => ChatInputAttachment[] | undefined;
  /** 语音识别器协议：未提供时语音入口整体不渲染 */
  voice?: () => VoiceRecognizer | undefined;
  /** 发送动作：入参为整份草稿，抛错或返回 error 结果即发送失败 */
  action?: (payload: ChatInputPayload) => Promise<unknown>;
  /** 长按输入框触发语音的时长阈值（ms），默认 300 */
  holdDelay?: MaybeRefOrGetter<number>;
  /** 输入框左滑切换语音模式的触发距离（px），默认 48 */
  swipeDistance?: MaybeRefOrGetter<number>;
  /** 录音中上滑取消的触发距离（px），默认 48 */
  cancelDistance?: MaybeRefOrGetter<number>;
  disabled?: () => boolean;
  /** v-model 回发与事件（组件传 emit） */
  emitUpdate?: (text: string) => void;
  emitAttachments?: (list: ChatInputAttachment[]) => void;
  emitSend?: (payload: ChatInputPayload) => void;
}

export interface UseChatInputReturn {
  /** 统一读写入口：受控时读外部，非受控时内部自持 */
  draft: WritableComputedRef<string>;
  /** 解析后的附件列表 */
  attachments: ComputedRef<ChatInputAttachment[]>;
  /** 当前模式 */
  mode: Ref<ChatInputMode>;
  /** 语音会话进行中（长按输入框 / 语音键共用） */
  recording: Ref<boolean>;
  /** 录音手势区：confirm 原地 / cancel 上滑取消 */
  sessionGesture: Ref<VoiceGesture>;
  /** 录音中实时转录（未录音时为空串） */
  liveText: ComputedRef<string>;
  /** 识别器实时音量（未提供或未录音时为 undefined） */
  level: ComputedRef<number | undefined>;
  /** 是否注入了识别器 */
  hasVoice: ComputedRef<boolean>;
  /** 是否有可发送内容 */
  canSend: ComputedRef<boolean>;
  /** 发送执行中 */
  sending: Ref<boolean>;
  /** 发送失败文案（无错误时为 null） */
  sendError: ComputedRef<string | null>;
  /** 发送按钮禁用态 */
  sendDisabled: ComputedRef<boolean>;
  /** 切换模式 */
  setMode: (mode: ChatInputMode) => void;
  /** 发送整份草稿：成功清空草稿并触发 emitSend，失败保留 */
  send: () => Promise<void>;
  /** 追加选择器产出的文件为附件（图片自动生成缩略图） */
  pickFiles: (source: FileList | File[] | null | undefined) => void;
  /** 移除附件（内部生成的预览地址同步回收） */
  removeAttachment: (id: string) => void;
  /** 输入框手势绑定：轻点聚焦、长按语音、上滑取消、左滑切换纯语音模式 */
  onFieldPointerDown: (event: FieldPointerLike) => void;
  onFieldPointerMove: (event: FieldPointerLike) => void;
  onFieldPointerUp: (event?: FieldPointerLike) => Promise<void>;
  onFieldPointerCancel: () => Promise<void>;
  /** 语音键会话开始（useVoiceButton 的 onPressStart 回调） */
  startVoiceSession: () => Promise<void>;
  /** 语音键松开（useVoiceButton 的 onRelease 回调）：确认发送 / 取消丢弃 / action 处理恢复 */
  handleVoiceRelease: (payload: VoiceReleasePayload) => Promise<void>;
  /** 镜像外部手势源（语音键）的左右滑判定到录音浮层提示 */
  mirrorGesture: (gesture: VoiceGesture) => void;
}

/** 指针事件的最小形状（兼容测试环境的原生构造事件） */
export interface FieldPointerLike {
  pointerId?: number;
  currentTarget?: EventTarget | null;
  clientX?: number;
  clientY?: number;
}

/** 转录并入文本：追加到既有文本尾部（空格连接），空转录原样返回 */
function appendText(base: string, addition: string): string {
  const spoken = addition.trim();
  if (!spoken) return base;
  const current = base.trimEnd();
  return current ? `${current} ${spoken}` : spoken;
}

export function useChatInput(options: UseChatInputOptions = {}): UseChatInputReturn {
  const holdDelay = () => toValue(options.holdDelay ?? 300);
  const swipeDistance = () => toValue(options.swipeDistance ?? 48);
  const cancelDistance = () => toValue(options.cancelDistance ?? 48);

  const { value: draft } = useControllableModel<string>({
    modelValue: options.modelValue,
    defaultValue: '',
    onChange: options.emitUpdate,
  });
  const { value: attachments } = useControllableModel<ChatInputAttachment[]>({
    modelValue: options.attachments,
    defaultValue: [],
    onChange: options.emitAttachments,
  });

  const mode = ref<ChatInputMode>('text');
  const recording = ref(false);
  const sessionGesture = ref<VoiceGesture>('confirm');

  const hasVoice = computed(() => !!options.voice?.());
  const liveText = computed(() => {
    if (!recording.value) return '';
    return options.voice?.().transcript.value ?? '';
  });
  const level = computed(() => {
    if (!recording.value) return undefined;
    return options.voice?.().level?.value;
  });

  /** 附件管理：组件经选择器产出的预览地址记录在案，移除与作用域销毁时回收 */
  const createdUrls = new Set<string>();
  let seq = 0;

  const pickFiles = (source: FileList | File[] | null | undefined) => {
    if (!source) return;
    const picked: ChatInputAttachment[] = Array.from(source).map((file) => {
      let previewUrl: string | undefined;
      if (file.type.startsWith('image/') && typeof URL !== 'undefined' && URL.createObjectURL) {
        previewUrl = URL.createObjectURL(file);
        createdUrls.add(previewUrl);
      }
      seq += 1;
      return { id: `att-${seq}`, name: file.name, file, previewUrl };
    });
    attachments.value = [...attachments.value, ...picked];
  };

  const removeAttachment = (id: string) => {
    const target = attachments.value.find((item) => item.id === id);
    if (target?.previewUrl && createdUrls.has(target.previewUrl)) {
      URL.revokeObjectURL(target.previewUrl);
      createdUrls.delete(target.previewUrl);
    }
    attachments.value = attachments.value.filter((item) => item.id !== id);
  };

  onScopeDispose(() => {
    if (typeof URL === 'undefined' || !URL.revokeObjectURL) return;
    createdUrls.forEach((url) => URL.revokeObjectURL(url));
    createdUrls.clear();
  });

  // 发送：统一走 action 协议，失败保留草稿（错误归一展示），成功清空并回发 send
  let lastPayload: ChatInputPayload | null = null;
  const actionState = useActionState(options.action as ActionLike | undefined, {
    disabled: () => options.disabled?.() === true,
    onSuccess: () => {
      draft.value = '';
      attachments.value = [];
      if (lastPayload) options.emitSend?.(lastPayload);
      lastPayload = null;
    },
    onError: () => {
      lastPayload = null;
    },
  });

  const canSend = computed(
    () => draft.value.trim() !== '' || attachments.value.length > 0,
  );
  const sendDisabled = computed(
    () => options.disabled?.() === true || actionState.disabled.value || !canSend.value,
  );
  const sendError = computed(() =>
    actionState.error.value == null ? null : actionErrorText(actionState.error.value, '发送失败'),
  );

  /** 录音会话：识别器经协议启停，reset 保证每轮转录独立 */
  const startVoiceSession = async () => {
    const voice = options.voice?.();
    if (!voice || recording.value || options.disabled?.()) return;
    voice.reset();
    sessionGesture.value = 'confirm';
    recording.value = true;
    try {
      await voice.start();
    } catch {
      recording.value = false;
    }
  };

  /** 结束会话并读取本轮转录；上滑取消返回空串 */
  const finishSession = async (gesture: VoiceGesture): Promise<string> => {
    recording.value = false;
    sessionGesture.value = 'confirm';
    const voice = options.voice?.();
    if (!voice) return '';
    await voice.stop();
    return gesture === 'cancel' ? '' : voice.transcript.value;
  };

  const send = async () => {
    if (sendDisabled.value) return;
    // 附件取快照：成功清空后载荷仍保留发送时刻的内容
    const payload: ChatInputPayload = {
      text: draft.value,
      attachments: [...attachments.value],
    };
    if (!options.action) {
      // 无动作协议：本地直接成功
      draft.value = '';
      attachments.value = [];
      options.emitSend?.(payload);
      return;
    }
    lastPayload = payload;
    await actionState.run(payload);
  };

  const handleVoiceRelease = async (payload: VoiceReleasePayload) => {
    if (payload.result === 'action' && payload.key === 'restore') {
      // 右滑恢复：结束会话丢弃转录并切回文本模式
      await finishSession('cancel');
      mode.value = 'text';
      return;
    }
    if (!recording.value) return;
    const spoken = (await finishSession(payload.result)).trim();
    if (payload.result !== 'confirm' || !spoken) return;
    // 松手即发送：转录并入草稿（语音键仅在输入框无文字时存在），失败时保留在输入框可重试
    draft.value = appendText(draft.value, spoken);
    await send();
  };

  const mirrorGesture = (gesture: VoiceGesture) => {
    if (recording.value) sessionGesture.value = gesture === 'action' ? 'confirm' : gesture;
  };

  // 输入框手势：轻点聚焦（不拦截默认行为）；长按越阈进入录音；
  // 录音中上滑取消；未录音时左滑越过阈值立即切换纯语音模式并吞掉本次按压
  let pressTimer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let pressed = false;
  let swipedOut = false;

  const clearHold = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const onFieldPointerDown = (event: FieldPointerLike) => {
    if (options.disabled?.() || recording.value || swipedOut) return;
    pressed = true;
    startX = event.clientX ?? 0;
    startY = event.clientY ?? 0;
    try {
      const el = event.currentTarget as HTMLElement | null;
      if (el && event.pointerId !== undefined) el.setPointerCapture?.(event.pointerId);
    } catch {
      // 无效指针或测试环境无捕获能力时忽略
    }
    pressTimer = setTimeout(() => {
      pressTimer = null;
      void startVoiceSession();
    }, holdDelay());
  };

  const onFieldPointerMove = (event: FieldPointerLike) => {
    if (!pressed || swipedOut) return;
    const dx = (event.clientX ?? 0) - startX;
    const dy = (event.clientY ?? 0) - startY;
    if (recording.value) {
      // 录音中：纵向主导判定取消区，回中复位
      if (Math.abs(dy) >= Math.abs(dx) && dy <= -cancelDistance()) sessionGesture.value = 'cancel';
      else sessionGesture.value = 'confirm';
      return;
    }
    if (Math.abs(dx) > Math.abs(dy) && dx <= -swipeDistance()) {
      swipedOut = true;
      clearHold();
      mode.value = 'voice';
    }
  };

  const settleField = async (fallback: VoiceGesture) => {
    pressed = false;
    clearHold();
    if (swipedOut) {
      swipedOut = false;
      return;
    }
    if (!recording.value) return;
    const spoken = (await finishSession(fallback)).trim();
    // 长按输入框：转录写入输入框，由用户手动发送
    if (spoken) draft.value = appendText(draft.value, spoken);
  };

  const onFieldPointerUp = async (event?: FieldPointerLike) => {
    void event;
    await settleField(sessionGesture.value);
  };

  const onFieldPointerCancel = async () => {
    await settleField('cancel');
  };

  return {
    draft,
    attachments,
    mode,
    recording,
    sessionGesture,
    liveText,
    level,
    hasVoice,
    canSend,
    sending: actionState.pending,
    sendError,
    sendDisabled,
    setMode: (next) => {
      mode.value = next;
    },
    send,
    pickFiles,
    removeAttachment,
    onFieldPointerDown,
    onFieldPointerMove,
    onFieldPointerUp,
    onFieldPointerCancel,
    startVoiceSession,
    handleVoiceRelease,
    mirrorGesture,
  };
}
