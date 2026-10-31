<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useChatInput, useVoiceButton } from '@cumquat/composables';
import type {
  ChatInputAttachment,
  ChatInputPayload,
  VoiceRecognizer,
} from '@cumquat/composables';
import Button from '../basic/Button.vue';
import VoiceButton from '../form-controls/VoiceButton.vue';

/**
 * 聊天输入条：左侧附件按钮、中间文本框、右侧语音键（有文字时替换为发送键）。
 *
 * 语音识别经 voice 属性注入（VoiceRecognizer 协议），两条入口共享会话：
 * - 长按输入框说话：转录实时展示在输入框位置，松手写入输入框，手动发送
 * - 按住语音键说话：松手即把转录并入草稿发送；输入框上滑取消本次转录
 * - 左滑输入框进入纯语音模式（语音键全宽），全宽键右滑恢复输入框
 * 发送走 action 协议：执行中禁用，失败展示错误条并保留草稿。
 */
const props = withDefaults(
  defineProps<{
    /** 输入文本（v-model） */
    modelValue?: string;
    /** 附件列表（v-model:attachments），不绑定时组件内部自持 */
    attachments?: ChatInputAttachment[];
    /** 语音识别器协议：未提供时语音入口不渲染，仅保留输入与附件 */
    voice?: VoiceRecognizer;
    /** 发送动作：入参为整份草稿，抛错或返回 error 结果即失败 */
    action?: (payload: ChatInputPayload) => Promise<unknown>;
    /** 输入框占位文案 */
    placeholder?: string;
    /** 长按输入框触发语音的时长阈值（ms） */
    holdDelay?: number;
    /** 左滑切换纯语音模式的触发距离（px） */
    swipeDistance?: number;
    /** 禁用整条输入 */
    disabled?: boolean;
  }>(),
  {
    modelValue: undefined,
    attachments: undefined,
    voice: undefined,
    action: undefined,
    placeholder: '输入消息…',
    holdDelay: 300,
    swipeDistance: 48,
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'update:attachments': [value: ChatInputAttachment[]];
  /** 发送成功，参数为发出的整份草稿 */
  send: [payload: ChatInputPayload];
}>();

const input = useChatInput({
  modelValue: props.modelValue !== undefined ? () => props.modelValue : undefined,
  attachments: props.attachments !== undefined ? () => props.attachments : undefined,
  voice: () => props.voice,
  action: (...args: unknown[]) => props.action?.(args[0] as ChatInputPayload),
  holdDelay: () => props.holdDelay,
  swipeDistance: () => props.swipeDistance,
  disabled: () => props.disabled,
  emitUpdate: (value) => emit('update:modelValue', value),
  emitAttachments: (value) => emit('update:attachments', value),
  emitSend: (payload) => emit('send', payload),
});
const {
  draft,
  attachments,
  mode,
  recording,
  sessionGesture,
  liveText,
  level,
  hasVoice,
  canSend,
  sending,
  sendDisabled,
  sendError,
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
} = input;

/** 录音中失焦输入框：避免长按期间出现光标与文本选区 */
const inputRef = ref<HTMLInputElement>();
watch(recording, (active) => {
  if (active) inputRef.value?.blur();
});

// 右侧窄语音键：复用手势状态机（原地松手发送、上滑取消），取消提示镜像到录音浮层
const voiceTrigger = useVoiceButton(
  () => [],
  {
    disabled: () => props.disabled || !hasVoice.value || input.sending.value,
    onPressStart: () => void startVoiceSession(),
    onRelease: (payload) => {
      mirrorGesture(payload.result);
      void handleVoiceRelease(payload);
    },
  },
);
watch(voiceTrigger.gesture, mirrorGesture);

const fileRef = ref<HTMLInputElement>();
const onFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  pickFiles(target.files);
  target.value = '';
};

/** 录音浮层提示：跟随手势区切换 */
const recordingHint = computed(() =>
  sessionGesture.value === 'cancel' ? '松开取消' : '松开写入输入框',
);

/** 输入框回车发送（IME 组合中不触发） */
const onEnter = (event: KeyboardEvent) => {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  void send();
};

/** 全宽语音键：右滑恢复输入模式 */
const fullVoiceActions = [{ key: 'restore', label: '恢复输入', direction: 'right' as const }];

defineExpose({ input });
</script>

<template>
  <div
    class="cumquat-chat-input"
    :class="[
      mode === 'voice' ? 'cumquat-chat-input--voice' : '',
      disabled ? 'cumquat-chat-input--disabled' : '',
    ]"
  >
    <!-- 附件气泡：图片缩略图，其余文件以名称展示 -->
    <div v-if="attachments.length" class="cumquat-chat-input__attachments">
      <div v-for="item in attachments" :key="item.id" class="cumquat-chat-input__attachment">
        <img
          v-if="item.previewUrl"
          :src="item.previewUrl"
          :alt="item.name"
          :title="item.name"
          class="cumquat-chat-input__thumb"
        />
        <span v-else class="cumquat-chat-input__file" :title="item.name">{{ item.name }}</span>
        <button
          type="button"
          class="cumquat-chat-input__remove"
          :aria-label="`移除附件 ${item.name}`"
          :disabled="disabled"
          @click="removeAttachment(item.id)"
        >
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>
    <!-- 发送失败错误条 -->
    <div v-if="sendError" class="cumquat-chat-input__error" role="alert">
      发送失败：{{ sendError }}
    </div>
    <div class="cumquat-chat-input__bar">
      <template v-if="mode === 'text'">
        <button
          type="button"
          class="cumquat-chat-input__attach"
          :disabled="disabled"
          aria-label="添加附件"
          @click="fileRef?.click()"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
        <input
          ref="fileRef"
          type="file"
          multiple
          class="cumquat-chat-input__picker"
          tabindex="-1"
          aria-hidden="true"
          @change="onFileChange"
        />
        <!-- 输入框：轻点聚焦，长按语音，上滑取消，左滑切换纯语音模式 -->
        <div
          class="cumquat-chat-input__field"
          @pointerdown="onFieldPointerDown"
          @pointermove="onFieldPointerMove"
          @pointerup="onFieldPointerUp"
          @pointercancel="onFieldPointerCancel"
          @contextmenu.prevent
        >
          <input
            ref="inputRef"
            v-model="draft"
            class="cumquat-chat-input__input"
            type="text"
            :placeholder="placeholder"
            :disabled="disabled"
            @keydown.enter="onEnter"
          />
          <div v-if="recording" class="cumquat-chat-input__recording" aria-live="polite">
            <span v-if="level !== undefined" class="cumquat-chat-input__meter" aria-hidden="true">
              <i
                v-for="(factor, index) in [0.55, 1, 0.8, 0.65]"
                :key="index"
                class="cumquat-chat-input__meter-bar"
                :style="{ height: `${Math.round(6 + 14 * Math.min(1, Math.max(0, level ?? 0)) * factor)}px` }"
              />
            </span>
            <span class="cumquat-chat-input__recording-text">{{
              liveText.trim() || '请说话…'
            }}</span>
            <span class="cumquat-chat-input__recording-hint">{{ recordingHint }}</span>
          </div>
        </div>
        <!-- 有可发送内容时语音键替换为发送键 -->
        <Button
          v-if="canSend"
          type="primary"
          size="sm"
          class="cumquat-chat-input__send"
          :disabled="sendDisabled"
          :loading="sending"
          @click="send"
        >
          发送
        </Button>
        <button
          v-else-if="hasVoice"
          type="button"
          class="cumquat-chat-input__voice"
          :class="voiceTrigger.holding.value ? 'cumquat-chat-input__voice--holding' : ''"
          :disabled="disabled || !hasVoice"
          aria-label="按住说话"
          @pointerdown="voiceTrigger.onPointerDown"
          @pointermove="voiceTrigger.onPointerMove"
          @pointerup="voiceTrigger.onPointerUp"
          @pointercancel="voiceTrigger.onPointerCancel"
          @contextmenu.prevent
          @keydown.space.prevent="voiceTrigger.onPointerDown"
          @keyup.space="voiceTrigger.onPointerUp"
        >
          <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <rect x="7.5" y="2.5" width="5" height="9" rx="2.5" stroke="currentColor" stroke-width="1.6" />
            <path
              d="M4.5 9.5a5.5 5.5 0 0 0 11 0M10 15v2.5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </template>
      <!-- 纯语音模式：语音键全宽，右滑恢复输入框 -->
      <VoiceButton
        v-else
        class="cumquat-chat-input__voice-full"
        :transcript="liveText"
        :level="level"
        :actions="fullVoiceActions"
        :disabled="disabled"
        @pressstart="startVoiceSession"
        @release="handleVoiceRelease"
      />
    </div>
  </div>
</template>
