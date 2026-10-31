<script setup lang="ts">
import { computed } from 'vue';
import { useVoiceButton } from '@cumquat/composables';
import type { VoiceButtonAction, VoiceReleasePayload } from '@cumquat/composables';

const props = withDefaults(
  defineProps<{
    /** 静置文案 */
    pressText?: string;
    /** 按住后原地松开的确认文案 */
    confirmText?: string;
    /** 上滑取消的提示文案 */
    cancelText?: string;
    /** 左右滑可选功能项：可传 0~N 个，滑动越过阈值即选中该方向功能 */
    actions?: VoiceButtonAction[];
    /** 转录文字：按住中由调用方实时更新（如语音识别中间结果），非空时气泡改为浮动展示文字 */
    transcript?: string;
    /** 实时音量 0~1（如 useVoiceLevel 采集结果）：传入后按钮内声波条随音量起伏，反馈有无声音录入 */
    level?: number;
    disabled?: boolean;
  }>(),
  {
    pressText: '按住说话',
    confirmText: '松开发送',
    cancelText: '松开取消',
    actions: () => [],
    transcript: '',
    disabled: false,
  },
);

const emit = defineEmits<{
  /** 按下（可据此开始录音） */
  pressstart: [];
  /** 松开：confirm 原地确认 / cancel 上滑取消 / action 左右滑选中功能（携带 key） */
  release: [payload: VoiceReleasePayload];
}>();

const { holding, gesture, activeAction, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
  useVoiceButton(() => props.actions, {
    disabled: () => props.disabled,
    onPressStart: () => emit('pressstart'),
    onRelease: (payload) => emit('release', payload),
  });

/** 按住中的提示文案：跟随手势区切换（提示由按钮本身承担） */
const gestureText = computed(() => {
  if (gesture.value === 'cancel') return props.cancelText;
  if (gesture.value === 'action') return `松开${activeAction.value?.label ?? ''}`;
  return props.confirmText;
});

/** 确认手势且有转录文字时，气泡浮动展示转录内容（按钮装不下的长文字） */
const showTranscript = computed(
  () => gesture.value === 'confirm' && props.transcript.trim() !== '',
);

/** 按钮内声波条的相位系数：制造自然的高低差 */
const METER_FACTORS = [0.55, 1, 0.8, 0.65];

/** 是否接入了音量数据：undefined 表示未接入，条走循环动画占位 */
const hasLevel = computed(() => props.level !== undefined);

const meterBarStyle = (factor: number) => {
  if (!hasLevel.value) return undefined;
  const level = Math.min(1, Math.max(0, props.level ?? 0));
  return { height: `${Math.round(6 + 14 * level * factor)}px` };
};

/** 键盘回退：空格按住/松开等价原地确认，不支持滑动 */
const onSpaceDown = (event: KeyboardEvent) => {
  if (event.repeat) return;
  onPointerDown(event);
};
const onSpaceUp = (event: KeyboardEvent) => {
  onPointerUp(event);
};
</script>

<template>
  <div class="cumquat-voice-button">
    <!-- 手势提示由按钮内文字承担，气泡仅浮动展示按钮装不下的转录长文字 -->
    <div
      v-if="holding && showTranscript"
      class="cumquat-voice-button__hint cumquat-voice-button__hint--text"
      aria-hidden="true"
    >
      <span class="cumquat-voice-button__transcript">{{ transcript }}</span>
    </div>
    <button
      type="button"
      class="cumquat-voice-button__trigger"
      :class="holding ? 'cumquat-voice-button__trigger--holding' : ''"
      :disabled="disabled"
      :aria-label="pressText"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      @contextmenu.prevent
      @keydown.space.prevent="onSpaceDown"
      @keyup.space="onSpaceUp"
    >
      <span
        v-if="holding"
        class="cumquat-voice-button__meter"
        :class="hasLevel ? 'cumquat-voice-button__meter--level' : ''"
        aria-hidden="true"
      >
        <i
          v-for="(factor, index) in METER_FACTORS"
          :key="index"
          class="cumquat-voice-button__meter-bar"
          :style="meterBarStyle(factor)"
        />
      </span>
      {{ holding ? gestureText : pressText }}
    </button>
  </div>
</template>
