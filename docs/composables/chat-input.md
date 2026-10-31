---
title: 聊天输入
---

# 聊天输入

## useChatInput

聊天输入条的完整会话逻辑：草稿文本、附件管理、语音会话与发送编排。组件 [ChatInput](/components/chat-input) 由它驱动，也可脱离组件在自定义 UI 中使用。

语音识别经 `VoiceRecognizer` 协议注入，组合函数不耦合任何识别实现。两条语音入口共享同一会话语义：

- **长按输入框说话**：转录实时写入输入框位置展示，松手后转录写入输入框，需手动发送
- **按住语音键说话**（输入框为空时右侧窄键 / 左滑后的全宽键）：松手即把转录并入草稿发送
- 录音中上滑取消本次转录；未录音时左滑输入框切换纯语音模式，全宽语音键右滑恢复

```ts
const input = useChatInput({
  voice: recognizer,
  action: async (payload) => {
    await sendMessage(payload);
  },
  emitSend: (payload) => console.log('已发送', payload),
});

input.draft.value = '你好';
input.pickFiles(fileList);
await input.send();
```

选项：

| 成员            | 类型                                 | 说明                                     |
| --------------- | ------------------------------------ | ---------------------------------------- |
| modelValue      | `() => string \| undefined`          | 受控文本 getter，不传即非受控            |
| attachments     | `() => ChatInputAttachment[] \| undefined` | 受控附件 getter，不传即非受控      |
| voice           | `() => VoiceRecognizer \| undefined` | 识别器 getter，未提供时语音入口整体不渲染 |
| action          | `(payload) => Promise<unknown>`      | 发送动作，抛错或返回 error 结果即失败    |
| holdDelay       | `MaybeRefOrGetter<number>`           | 长按阈值 ms，默认 `300`                  |
| swipeDistance   | `MaybeRefOrGetter<number>`           | 左滑切换距离 px，默认 `48`               |
| cancelDistance  | `MaybeRefOrGetter<number>`           | 上滑取消距离 px，默认 `48`               |
| disabled        | `() => boolean`                      | 禁用判定                                 |
| emitUpdate      | `(text: string) => void`             | 文本变化回发（v-model）                  |
| emitAttachments | `(list) => void`                     | 附件变化回发（v-model:attachments）      |
| emitSend        | `(payload) => void`                  | 发送成功回发                             |

返回：

| 成员                  | 类型                                  | 说明                                       |
| --------------------- | ------------------------------------- | ------------------------------------------ |
| draft                 | `WritableComputedRef<string>`         | 统一读写入口：受控读外部，非受控内部自持   |
| attachments           | `ComputedRef<ChatInputAttachment[]>`  | 解析后的附件列表                           |
| mode                  | `Ref<'text' \| 'voice'>`              | 当前模式                                   |
| recording             | `Ref<boolean>`                        | 语音会话进行中                             |
| sessionGesture        | `Ref<'confirm' \| 'cancel'>`          | 录音手势区（提示用）                       |
| liveText              | `ComputedRef<string>`                 | 录音中实时转录（未录音为空串）             |
| level                 | `ComputedRef<number \| undefined>`    | 识别器实时音量（未提供或未录音为 undefined） |
| hasVoice              | `ComputedRef<boolean>`                | 是否注入了识别器                           |
| canSend               | `ComputedRef<boolean>`                | 是否有可发送内容                           |
| sending               | `Ref<boolean>`                        | 发送执行中                                 |
| sendError             | `ComputedRef<string \| null>`         | 发送失败文案                               |
| sendDisabled          | `ComputedRef<boolean>`                | 发送按钮禁用态                             |
| setMode               | `(mode) => void`                      | 切换模式                                   |
| send                  | `() => Promise<void>`                 | 发送整份草稿，成功清空，失败保留           |
| pickFiles             | `(source) => void`                    | 追加文件为附件，图片自动生成预览地址       |
| removeAttachment      | `(id: string) => void`                | 移除附件并回收内部生成的预览地址           |
| onFieldPointerDown    | `(event) => void`                     | 输入框手势绑定                             |
| onFieldPointerMove    | `(event) => void`                     | 输入框手势绑定                             |
| onFieldPointerUp      | `(event?) => Promise<void>`           | 输入框手势绑定                             |
| onFieldPointerCancel  | `() => Promise<void>`                 | 输入框手势绑定（系统打断按取消收尾）       |
| startVoiceSession     | `() => Promise<void>`                 | 语音键会话开始                             |
| handleVoiceRelease    | `(payload) => Promise<void>`          | 语音键松开：确认发送 / 取消 / 右滑恢复     |
| mirrorGesture         | `(gesture) => void`                   | 镜像外部手势源到录音提示                   |

类型：

```ts
/** 附件条目：图片经 createObjectURL 生成缩略图，其余文件以名称展示 */
interface ChatInputAttachment {
  id: string;
  name: string;
  previewUrl?: string;
  file?: File;
}

/** 发送载荷：整份草稿 */
interface ChatInputPayload {
  text: string;
  attachments: ChatInputAttachment[];
}

/** 识别器协议：transcript 会话期间持续更新（含中间结果） */
interface VoiceRecognizer {
  transcript: Ref<string>;
  level?: Ref<number>;
  start: () => void | Promise<void>;
  stop: () => void | Promise<void>;
  reset: () => void;
}
```

行为细节：

- 发送统一走 action 协议：执行中禁用，失败保留草稿（语音转录落回输入框可重试），成功清空文本与附件后回发 `emitSend`
- 发送载荷取附件快照：成功清空后载荷仍保留发送时刻的内容
- 识别器实例在每次会话开始前被 `reset`，保证每轮转录独立；`start` 抛错时会话不开启
- 图片附件的预览地址由组件内部 `createObjectURL` 生成并在移除、作用域销毁时回收；受控模式自行构造的 `previewUrl` 不参与回收
- 长按输入框的转录以空格追加到既有文本尾部；语音键松手发送失败时转录保留在输入框，可直接手动重发
- 组件配合使用见 [ChatInput](/components/chat-input)
