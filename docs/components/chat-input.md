---
title: ChatInput 聊天输入条
---

# ChatInput 聊天输入条

聊天窗底部的输入条：左侧附件按钮、中间文本框、右侧语音键。为语音消息场景设计——长按说话、左滑切换纯语音模式、附件气泡预览，一气呵成。

| Prop        | 类型                                            | 默认值       | 说明                                        |
| ----------- | ----------------------------------------------- | ------------ | ------------------------------------------- |
| modelValue  | `string`                                        | —            | 输入文本（v-model），不绑定时组件内部自持   |
| attachments | [`ChatInputAttachment`](/types/view/scenarios#chatinputattachment)`[]`                         | —            | 附件列表（v-model:attachments），同上       |
| voice       | [`VoiceRecognizer`](/types/view/scenarios#voicerecognizer)                               | —            | 语音识别器协议：未提供时语音入口不渲染      |
| action      | `(payload: `[`ChatInputPayload`](/types/view/scenarios#chatinputpayload)`) => Promise<unknown>` | —          | 发送动作：抛错或返回 error 结果即发送失败   |
| placeholder | `string`                                        | `'输入消息…'` | 输入框占位文案                             |
| holdDelay   | `number`                                        | `300`        | 长按输入框触发语音的时长阈值（ms）          |
| swipeDistance | `number`                                      | `48`         | 左滑切换纯语音模式的触发距离（px）          |
| disabled    | `boolean`                                       | `false`      | 禁用整条输入                                |

事件：

| 事件                | 参数                | 说明                       |
| ------------------- | ------------------- | -------------------------- |
| update:modelValue   | `(value: string)`   | 输入文本变化               |
| update:attachments  | `(list)`            | 附件增删                   |
| send                | `(payload)`         | 发送成功，参数为整份草稿   |

语音识别器协议 [`VoiceRecognizer`](/types/view/scenarios#voicerecognizer)：组件不耦合任何识别实现，由调用方注入（原生 Web Speech、云服务等均可），结构见类型参考。

交互细节：

- **语音键与发送键互斥**：输入框为空时右侧显示语音键；录入文字或添加附件后替换为发送键，因此按住语音键发送的内容天然只包含转录与附件
- **长按输入框说话**：转录实时展示在输入框位置，松手写入输入框，由用户手动发送；录音中上滑取消本次转录
- **按住语音键说话**：松手即把转录并入草稿发送，失败时转录落回输入框可修改重试
- **左滑输入框**进入纯语音模式：输入框隐藏，语音键变全宽；按住全宽键说话、右滑恢复输入框
- **附件气泡**：图片附件以缩略图展示（组件生成预览地址），其余文件展示名称，均可点 × 移除
- 发送统一走 action 协议：执行中禁用，失败展示错误条并保留草稿；回车发送（输入法组合期间不触发）

脱离组件单独使用语音会话逻辑时，可直接使用组合函数 `useChatInput`（见[组合函数文档](/composables/chat-input)）。

## Expose

组件通过 `defineExpose` 暴露底层 `useChatInput` 返回对象：

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| input.draft | `WritableComputedRef<string>` | 草稿文本（受控 / 非受控统一） |
| input.attachments | `ComputedRef<`[`ChatInputAttachment`](/types/view/scenarios#chatinputattachment)`[]>` | 当前附件列表 |
| input.mode | `Ref<`[`ChatInputMode`](/types/view/scenarios#chatinputmode)`>` | 当前输入模式 |
| input.recording / input.sessionGesture | `Ref<boolean>` / `Ref<`[`VoiceGesture`](/types/view/scenarios#voicegesture)`>` | 语音会话状态与手势 |
| input.liveText / input.level | `ComputedRef<string>` / `ComputedRef<number \| undefined>` | 实时转录与音量 |
| input.canSend / input.sending / input.sendDisabled | `ComputedRef<boolean>` | 发送可用性派生状态 |
| input.sendError | `ComputedRef<string \| null>` | 发送失败文案 |
| input.setMode(mode) | `(mode: `[`ChatInputMode`](/types/view/scenarios#chatinputmode)`) => void` | 切换输入模式 |
| input.send() | `() => Promise<void>` | 发送整份草稿；成功清空，失败保留 |
| input.pickFiles(files) | `(files: FileList \| File[] \| null \| undefined) => void` | 追加附件 |
| input.removeAttachment(id) | `(id: string) => void` | 移除附件并回收预览地址 |
| input.startVoiceSession() / input.handleVoiceRelease(payload) | 语音会话控制 | 供 `useVoiceButton` 回调接入 |

通过模板 ref 访问：`inputRef.value?.input.send()`。

## 交互演示

### 模拟语音输入

<CodeCard v-model:code="chatInputCode" editable title="聊天输入条">
  <LiveDemo :code="chatInputCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">
import { ref } from 'vue';

/** 模拟识别器：会话期间定时吐字，音量为正弦波 */
const createMockRecognizer = () => {
  const transcript = ref('');
  const level = ref(0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let t = 0;
  let idx = 0;
  const words = ['今天下午三点', '的产品评审', '记得同步给设计组'];
  const tick = () => {
    level.value = Math.abs(Math.sin((t += 1) / 3));
    timer = setTimeout(() => {
      if (idx < words.length) transcript.value = words.slice(0, (idx += 1)).join('');
      tick();
    }, 700);
  };
  return {
    transcript,
    level,
    start: () => {
      t = 0;
      idx = 0;
      transcript.value = '';
      tick();
    },
    stop: () => {
      clearTimeout(timer);
      level.value = 0;
    },
    reset: () => {
      transcript.value = '';
      idx = 0;
    },
  };
};

const recognizer = createMockRecognizer();

/** 发送动作：延迟后成功，含「失败」时抛错演示失败态 */
const sendMessage = async (payload: { text: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (payload.text.includes('失败')) throw new Error('演示：模拟发送失败');
  return { status: 'success' };
};

const lastSent = ref<{ text: string; attachments: unknown[] }>();
const onSend = (payload: { text: string; attachments: unknown[] }) => {
  lastSent.value = payload;
};

const chatInputCode = ref(`
<ChatInput
  :voice="recognizer"
  :action="sendMessage"
  placeholder="长按说话，或输入消息…"
  @send="onSend"
/>
<p v-if="lastSent" style="margin-top: 8px; font-size: 12px; opacity: 0.7">
  已发送：{{ lastSent.text || '（仅附件）' }}，附件 {{ lastSent.attachments.length }} 个
</p>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { recognizer, sendMessage, onSend, lastSent };
</script>
