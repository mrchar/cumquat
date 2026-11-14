---
title: 聊天消息
---

# 聊天消息

## useChat

聊天消息模型：`fetch` 管历史（向上翻页前插）、`subscribe` 管新消息（追加去重）、`send` 管发送（乐观上屏 + 失败保留重试）。组件 [Chat](/components/chat) 由它驱动，也可脱离组件在自定义会话 UI 中使用。

```ts
const chat = useChat({
  // 资源工厂：useChat 挂载时建对象，加载历史只调 execute，卸载自动 abort
  fetch: () => {
    const status = ref<Status>('idle');
    const data = ref<FetchData<ChatMessage>>();
    const error = ref<unknown>();
    const message = ref<string>();
    return {
      status,
      data,
      error,
      message,
      async execute(query) {
        status.value = 'pending';
        try {
          data.value = await api.messages({
            page: query.page,
            size: query.size,
          });
          status.value = 'success';
        } catch (err) {
          error.value = err;
          message.value = err instanceof Error ? err.message : String(err);
          status.value = 'error';
        }
      },
      abort() {},
    };
  },
  subscribe: () => messageStream,
  send: (content) => api.send(content),
});

await chat.loadOlder(); // 加载更早一页历史
await chat.send('你好'); // 乐观上屏并发送
```

### 消息结构

```ts
interface ChatMessage {
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

### 选项

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `fetch` | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`ChatMessage`](/types/view/scenarios#chatmessage)`>` | - | 历史消息资源工厂；翻页经资源对象的 `execute` 驱动，`page` 递增表示更早一页，`data` 为数组或 `{ list, page, size, total }`，卸载时自动 `abort` |
| `subscribe` | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<`[`ChatMessage`](/types/view/scenarios#chatmessage)`[] \| `[`ChatMessage`](/types/view/scenarios#chatmessage)`>` | - | 新消息订阅；推送单条或数组，返回响应式数据时持续更新 |
| `send` | `(content: string) => Promise<`[`ActionResult`](/types/basics/core#actionresult)` \| void>` | - | 发送动作；抛错或返回 error 结果即发送失败 |
| `size` | `number` | `20` | 历史分页每页条数 |

### 返回

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `messages` | `Ref<`[`ChatMessage`](/types/view/scenarios#chatmessage)`[]>` | 展示消息列表（含本地乐观消息），新消息追加在末尾 |
| `sending` | `Ref<boolean>` | 发送中 |
| `loadingOlder` | `Ref<boolean>` | 加载更早历史中 |
| `hasMore` | `Ref<boolean>` | 是否还有更早的历史 |
| `sendError` | `Ref<string \| undefined>` | 最近一次发送失败文案 |
| `historyError` | `Ref<string \| undefined>` | 历史加载失败文案 |
| `send` | `(content: string) => Promise<`[`ChatMessage`](/types/view/scenarios#chatmessage)` \| undefined>` | 发送消息：乐观上屏，成功返回落位消息，失败返回 `undefined`（消息保留为 `failed` 可重试） |
| `retry` | `(message: `[`ChatMessage`](/types/view/scenarios#chatmessage)`) => Promise<`[`ChatMessage`](/types/view/scenarios#chatmessage)` \| undefined>` | 重试失败消息：移除原消息并按原内容重新发送 |
| `loadOlder` | `() => Promise<void>` | 加载更早一页历史：结果前插去重 |

### 行为说明

- **乐观上屏**：`send` 先以 `__local_` 前缀的临时 id 插入一条 `status: 'sending'` 的消息，成功后迁移为 `sent`，失败迁移为 `failed` 并写入 `sendError`
- **回显收敛**：订阅收到 `self: true` 的服务端消息时，若与本地已发送消息内容一致，则原地替换，id 收敛为服务端 id
- **去重**：历史前插与推送追加都按 `id` 去重；历史加载失败会回退页码，下次可重取同一页
- **历史终止**：资源 `data` 写数组时以「本页条数是否达到 `size`」判断 `hasMore`；写 `{ list, page, size, total }` 时优先用响应 `total` 与已加载条数比较
- 配置了 `fetch` 时会在微任务中自动加载最新一页历史（`page = 1`），与 `useFetchResource` / `useSubscribeResource` 的延迟调用惯例一致
- `retry` 只处理本地消息（`__local_` 前缀）；`send` 在内容为空、未配置 `send` 或正在发送时直接返回 `undefined`
