---
title: VoiceButton 语音按钮
---

# VoiceButton 语音按钮

按住说话式语音按钮：按住开始（如录音），原地松开确认，上滑取消，左右滑选中可选功能项。

功能项完全可选可配置：`actions` 不传时仅支持确认与取消；传入后按滑动方向选中对应功能，方向可通过 `direction` 显式指定，缺省按序号左右交替。手势结果经 `release` 事件交由调用方消费，组件不耦合录音实现。

按住过程中可将语音识别的中间结果绑定到 `transcript`，提示气泡会浮动展示转录文字。手势提示统一由按钮本身承担：按住中按钮文字随手势区实时切换（松开发送 / 松开取消 / 松开功能名），按钮内声波条同步起伏，气泡仅在转录模式下浮动展示按钮装不下的长文字。

按钮内建声波条反馈：未传 `level` 时按住中播放循环动画占位；传入 `level`（0~1 实时音量）后声波条高度随音量起伏——安静时贴底静止，说话时明显起伏，有无声音录入一目了然，提示由按钮本身承担。配合 [`useVoiceLevel`](/composables/voice) 可从麦克风采集真实音量（自适应底噪追踪，无声时归零）。

`VoiceButtonAction` 结构：`{ key: string; label: string; direction?: 'left' | 'right' }`。

`VoiceReleasePayload` 结构：`{ result: 'confirm' | 'cancel' | 'action'; key?: string }`，`result` 为 `action` 时携带选中的功能 `key`。

| Prop        | 类型                  | 默认值       | 说明                                     |
| ----------- | --------------------- | ------------ | ---------------------------------------- |
| pressText   | `string`              | `按住说话`   | 静置文案                                 |
| confirmText | `string`              | `松开发送`   | 按住后原地松开的确认文案                 |
| cancelText  | `string`              | `松开取消`   | 上滑取消的提示文案                       |
| actions     | `VoiceButtonAction[]` | `[]`         | 左右滑可选功能项，可传 0~N 个            |
| transcript  | `string`              | `''`         | 按住中的实时转录文字，非空时气泡改为浮动展示 |
| level       | `number`              | -            | 实时音量 0~1，传入后按钮内声波条随音量起伏反馈录入状态 |
| disabled    | `boolean`             | `false`      | 禁用                                     |

| 事件       | 参数                        | 说明                                       |
| ---------- | --------------------------- | ------------------------------------------ |
| pressstart | -                           | 按下（可据此开始录音）                     |
| release    | `payload: VoiceReleasePayload` | 松开：confirm 确认 / cancel 取消 / action 选中功能 |

```vue
<VoiceButton @pressstart="startRecording" @release="onRelease" />
<VoiceButton
  :actions="[
    { key: 'text', label: '转文字' },
    { key: 'translate', label: '翻译', direction: 'right' },
  ]"
  @release="onRelease"
/>
```

松开后按手势区处理结果：

```ts
function onRelease(payload: VoiceReleasePayload) {
  if (payload.result === 'confirm') stopAndSend();
  else if (payload.result === 'cancel') stopAndDiscard();
  else stopAndHandle(payload.key);
}
```

---

## 交互演示

### 基础手势

按住按钮后上滑取消、原地松开确认；滑动过程按钮文字随手势区实时切换，回到中心自动复位。

<CodeCard v-model:code="basicCode" editable title="确认与取消">
  <LiveDemo :code="basicCode" :scope="basicScope" />
</CodeCard>

### 左右滑功能项

配置 `actions` 后，左滑 / 右滑越过阈值即选中对应功能项，松开时在 `release` 事件携带 `key`；未越过阈值仍按确认处理。

<CodeCard v-model:code="actionsCode" editable title="可配置功能项">
  <LiveDemo :code="actionsCode" :scope="actionsScope" />
</CodeCard>

### 转录文字浮动展示

按住过程中把语音识别的中间结果绑定到 `transcript`，提示气泡浮动展示转录文字（演示以定时器模拟识别逐步出字）；上滑取消或左右滑选中功能时气泡隐藏，提示由按钮文字承担。

<CodeCard v-model:code="transcriptCode" editable title="转录文字">
  <LiveDemo :code="transcriptCode" :scope="transcriptScope" />
</CodeCard>

### 音量反馈

传入 `level` 后，按住中按钮内的声波条随麦克风音量实时起伏：安静时贴底静止，说话时明显升高，停止说话回落，「是否有声音录入」的提示直接由按钮动画本身承担，无需额外状态文字。配合 `useVoiceLevel` 组合函数从麦克风采集音量（演示需授权麦克风；启动失败时条保持贴底）。

<CodeCard v-model:code="levelCode" editable title="音量反馈">
  <LiveDemo :code="levelCode" :scope="levelScope" />
</CodeCard>

<script setup lang="ts">
import { ref } from 'vue';
import type { VoiceReleasePayload } from '@cumquat/components';
import { useVoiceLevel } from '@cumquat/composables';

const basicLogs = ref<string[]>([]);

function logBasic(payload: VoiceReleasePayload) {
  const text =
    payload.result === 'confirm' ? '确认发送' : payload.result === 'cancel' ? '已取消' : '';
  if (text) basicLogs.value = [text, ...basicLogs.value].slice(0, 4);
}

const basicCode = ref(`
  <div class="flex flex-col items-center gap-6 py-12">
    <VoiceButton @pressstart="onPressStart" @release="onRelease" />
    <p class="text-sm text-cumquat-text-muted">结果：{{ logs[0] ?? '（尚未操作）' }}</p>
  </div>
`);

const basicScope = {
  logs: basicLogs,
  onPressStart: () => {
    basicLogs.value = ['开始录音', ...basicLogs.value].slice(0, 4);
  },
  onRelease: logBasic,
};

const actionsLogs = ref<string[]>([]);
const voiceActions = [
  { key: 'text', label: '转文字' },
  { key: 'translate', label: '翻译' },
];

const actionsCode = ref(`
  <div class="flex flex-col items-center gap-6 py-12">
    <VoiceButton :actions="voiceActions" @release="onRelease" />
    <p class="text-sm text-cumquat-text-muted">结果：{{ logs[0] ?? '（尚未操作）' }}</p>
  </div>
`);

const actionsScope = {
  logs: actionsLogs,
  voiceActions,
  onRelease: (payload: VoiceReleasePayload) => {
    const text =
      payload.result === 'action'
        ? `选中功能：${payload.key}`
        : payload.result === 'cancel'
          ? '已取消'
          : '确认发送';
    actionsLogs.value = [text, ...actionsLogs.value].slice(0, 4);
  },
};

const transcriptLogs = ref<string[]>([]);
const transcript = ref('');
const sentence = '帮我订一杯冰美式咖啡，少冰去糖，谢谢';
let timer: ReturnType<typeof setInterval> | null = null;

const stopSimulate = () => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
};

const transcriptCode = ref(`
  <div class="flex flex-col items-center gap-6 py-12">
    <VoiceButton :transcript="transcript" @pressstart="onPressStart" @release="onRelease" />
    <p class="text-sm text-cumquat-text-muted">结果：{{ logs[0] ?? '（尚未操作）' }}</p>
  </div>
`);

const transcriptScope = {
  logs: transcriptLogs,
  transcript,
  onPressStart: () => {
    transcriptLogs.value = ['开始录音', ...transcriptLogs.value].slice(0, 4);
    transcript.value = '';
    let index = 0;
    stopSimulate();
    timer = setInterval(() => {
      index += 1;
      transcript.value = sentence.slice(0, index);
      if (index >= sentence.length) stopSimulate();
    }, 300);
  },
  onRelease: (payload: VoiceReleasePayload) => {
    stopSimulate();
    const text =
      payload.result === 'cancel'
        ? '已取消'
        : `确认发送：${transcript.value || '（无内容）'}`;
    transcriptLogs.value = [text, ...transcriptLogs.value].slice(0, 4);
    transcript.value = '';
  },
};

const voice = useVoiceLevel();

const levelCode = ref(`
  <div class="flex flex-col items-center gap-6 py-12">
    <VoiceButton :level="level" @pressstart="onPressStart" @release="onRelease" />
  </div>
`);

const levelScope = {
  level: voice.level,
  onPressStart: () => {
    void voice.start();
  },
  onRelease: () => {
    voice.stop();
  },
};
</script>
