---
title: 类型参考 · 场景组件
---

# 场景组件类型

场景类组件（聊天、语音）props / 事件 / 插槽携带的数据形状。组件用法见对应的组件文档页。

## 场景组件

### ChatMessage {#chatmessage}

[Chat 聊天框](/components/chat) 的消息项。

```ts
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string | number;
  /** 发送者展示名 */
  sender?: string;
  /** 消息内容 */
  content: string;
  /** 发送时间戳（毫秒） */
  time?: number;
  /** 是否自己发送：决定气泡方向 */
  self?: boolean;
  /** 发送状态：本地消息的中间态，服务端消息可缺省 */
  status?: 'sending' | 'sent' | 'failed';
}
```

### ChatInputAttachment {#chatinputattachment}

[ChatInput 聊天输入条](/components/chat-input) 的附件项。

```ts
export interface ChatInputAttachment {
  id: string;
  name: string;
  /** 图片预览地址 */
  previewUrl?: string;
  /** 原始文件（由组件从选择器产出，受控模式下调用方可自行构造） */
  file?: File;
}
```

### ChatInputPayload {#chatinputpayload}

一次发送的整份草稿（文本 + 附件）。

```ts
export interface ChatInputPayload {
  text: string;
  attachments: ChatInputAttachment[];
}
```

### ChatInputMode {#chatinputmode}

```ts
export type ChatInputMode = 'text' | 'voice';
```

### VoiceRecognizer {#voicerecognizer}

语音识别器协议：调用方注入实现（原生 Web Speech、讯飞等服务均可）。

```ts
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
```

### VoiceGesture {#voicegesture}

[VoiceButton 语音按钮](/components/voice-button) 的释放结果。

```ts
export type VoiceGesture = 'confirm' | 'cancel' | 'action';
```

### VoiceButtonAction {#voicebuttonaction}

```ts
export interface VoiceButtonAction {
  key: string;
  label: string;
  /** 滑动方向：left 左滑选中 / right 右滑选中；缺省按序号左右交替 */
  direction?: 'left' | 'right';
}
```

### VoiceReleasePayload {#voicereleasepayload}

```ts
export interface VoiceReleasePayload {
  result: VoiceGesture;
  key?: string;
}
```
