---
title: Chat 聊天框
---

# Chat 聊天框

消息流 + 底部固定输入区的聊天窗。三大协议各司其职：`fetch` 加载历史消息（向上翻页，结果前插）、`subscribe` 订阅最新消息（追加去重）、`action` 发送消息（乐观上屏，失败保留气泡可重试）。

| Prop        | 类型                                             | 默认值                 | 说明                                         |
| ----------- | ------------------------------------------------ | ---------------------- | -------------------------------------------- |
| fetch       | `Fetch<ChatMessage[]>`                           | —                      | 历史消息加载：currentPage 递增表示更早一页   |
| subscribe   | `SubscribeHandler<ChatMessage[] \| ChatMessage>` | —                      | 新消息订阅：推送单条或数组，响应式源持续推送 |
| action      | `(content: string) => Promise<unknown>`          | —                      | 发送动作：抛错或返回 error 结果即发送失败    |
| pageSize    | `number`                                         | `20`                   | 历史分页每页条数                             |
| placeholder | `string`                                         | `'输入消息，回车发送'` | 输入框占位文案                               |
| disabled    | `boolean`                                        | `false`                | 禁用整窗交互                                 |
| height      | `string`                                         | `'22rem'`              | 窗体高度                                     |
| olderText   | `string`                                         | `'加载更早消息'`       | 顶部加载更早消息按钮文案                     |

事件：

| 事件  | 参数                | 说明                               |
| ----- | ------------------- | ---------------------------------- |
| send  | `(message)`         | 消息发送成功，参数为落位的本地消息 |
| error | `(message: string)` | 发送失败，参数为错误文案           |

插槽：

| 插槽    | 作用域               | 说明                       |
| ------- | -------------------- | -------------------------- |
| message | `{ message, retry }` | 自定义气泡渲染，retry 重发 |

消息契约 `ChatMessage`：`{ id, sender?, content, time?, self?, status? }`。`id` 是唯一锚点——历史与推送按 id 去重；本地乐观消息以 `__local_` 前缀占位，自己消息（`self: true`）被服务端回显时自动收敛为服务端消息；`status` 标记本地消息的 `sending / sent / failed` 中间态。

行为细节：

- 消息流固定高度可滚动，输入区固定在底部；贴近底部时新消息自动跟随滚动，自己发送的消息强制回底
- 滚动到顶部或点击顶部按钮加载更早消息，加载后视口停驻在原有消息处
- 发送失败保留气泡并展示错误条，点击「重试」按原内容重发
- 历史加载失败展示错误条与重试入口，页码自动回退

## 交互演示

### 模拟聊天

<CodeCard v-model:code="chatCode" editable title="聊天框">
  <LiveDemo :code="chatCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';
import type { ChatMessage } from '@mrchar/cumquat/composables';

const SEED: ChatMessage[] = [
  { id: 'm1', sender: '林一', content: '这个组件库的协议设计真清爽', time: Date.now() - 3600_000 },
  { id: 'm2', sender: '我', content: 'fetch / action / subscribe 各管一摊', time: Date.now() - 3000_000, self: true },
  { id: 'm3', sender: '林一', content: '发送失败还能保留气泡重试', time: Date.now() - 1200_000 },
];

/** 历史消息：第 1 页最新 3 条，第 2 页更早 3 条 */
const loadHistory = async (query: { pagination?: { currentPage?: number } }) => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const page = query.pagination?.currentPage ?? 1;
  if (page === 1) return { list: SEED, total: 6 };
  return {
    list: [
      { id: 'm0', sender: '周九', content: '历史消息是向上翻页前插的', time: Date.now() - 7200_000 },
      { id: 'm-1', sender: '我', content: '视口还会停驻在原位置', time: Date.now() - 9000_000, self: true },
      { id: 'm-2', sender: '周九', content: '最早的问候 👋', time: Date.now() - 10800_000 },
    ] as ChatMessage[],
    total: 6,
  };
};

/** 订阅推送：响应式数组持续推送新消息 */
const live = ref<ChatMessage[]>([]);
let timer: ReturnType<typeof setTimeout> | undefined;
const subscribeLive = async () => {
  timer = setTimeout(() => {
    live.value.push({ id: 'live-1', sender: '林一', content: '这条是订阅推送的 ⚡', time: Date.now() });
  }, 3000);
  return live.value;
};

/** 发送动作：延迟后成功 */
const sendMessage = async (content: string) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (content.includes('失败')) throw new Error('演示：模拟发送失败');
  return { status: 'success' };
};

const chatCode = ref(`
<Chat
  :fetch="loadHistory"
  :subscribe="subscribeLive"
  :action="sendMessage"
  height="20rem"
/>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { loadHistory, subscribeLive, sendMessage };
</script>
