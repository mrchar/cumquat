---
name: cumquat-composables
description: 使用 Cumquat 的 Headless 组合函数实现业务逻辑。涵盖三大异步协议的组合函数层对应物（useFetch/useActionState/useActionValue/useSubscribe/useAsyncState）、表单模型（useForm/useFormField/useSelectModel 等）、浮层反馈、分页、资源池与 L0/L1 行为原语速查，提供决策树、headless 自定义组件配方与可复用代码片段。当用户需要在组件外消费异步状态、编写无渲染逻辑、自建组件行为或使用 useForm/useResources 等组合函数时激活。
---

# Cumquat 组合函数使用指南

Cumquat 的组合函数层是组件库的 Headless 内核：**状态机与行为逻辑，零渲染**。引入
`@mrchar/cumquat/composables` 不会打包任何默认渲染代码与样式；组件层（`@mrchar/cumquat/components`）
只是同一套逻辑的默认渲染壳。二者通过 `AsyncStateLike`（status / data / error /
isStale? / retry?）等最小契约通信。

## 1. 包结构与引入

```ts
// 子包入口（推荐，无渲染）
import { useForm, useFetch, useAsyncState } from '@mrchar/cumquat/composables';

// 或主包命名空间
import { composables } from '@mrchar/cumquat';
const { useForm, useResources } = composables;
```

分层与依赖方向：**L2 领域模型 → L1 行为原语 → L0 工具原语**，上层可依赖下层，
下层禁止反向依赖。

## 2. 决策树：从哪一层找起？

```
要解决的问题属于哪个领域？
├─ 表单 / 日期 / 选项联动 → L2 表单模型（第 4 节）
├─ 浮层 / 消息反馈 / 全局 loading → L2 浮层与反馈（第 5 节）
├─ 远程数据 / 订阅 / 分页 → L2 数据（第 3、6 节）
├─ 资源 CRUD + 字段元数据 → L2 资源池（第 7 节）
├─ 聊天消息流（历史 + 推送 + 发送）→ useChat（第 3.5 节）
├─ 开 / 关、弹出、焦点圈、键盘导航 → L1 行为原语（第 8 节）
└─ 受控值、事件监听、定时、滚动、剪贴板 → L0 工具原语（第 8 节）
```

自建 headless 组件时自底向上组合：L0 搭基础能力，L1 组行为，L2 只在领域恰合时引入。

## 3. 三大异步协议的组合函数层

组件消费协议，组合函数**生产**协议状态。绑定同一方法即可在组件内 / 外共享行为。

### 3.1 useFetch：查询型请求

```ts
import { useFetch } from '@mrchar/cumquat/composables';

const { data, total, status, loading, error, refresh, fetch } = useFetch((query) =>
  loadUsers(query),
);

// fetch 可直接绑给组件：<Table :fetch="fetch" />；refresh 命令式重取
```

- 返回数组 → 普通列表；返回 `{ list, total }` → 自动分页
- `useFetchResource`：以资源方法（如 `userApi.list`）为源的组合封装
- `createFetchController`：需要手动管理生命周期 / 竞态取消时使用
- 辅助判定：`isPagedResult` / `normalizeFetchResult`

### 3.2 useActionState / useActionValue：交互动作

```ts
// 确认型（提交、保存）：执行中 loading 并禁用，失败拿到可展示错误
const { execute, loading, error } = useActionState(submitForm, { onSuccess: close });

// 切换型（收藏、开关）：乐观更新，失败自动回退旧值
const { value, pending } = useActionValue(initial, toggleStar);
```

错误归一 helpers：`extractActionFailure` / `actionErrorText`（message → error 字符串 →
Error.message → errorText 回退）。组件层同名行为即由这两个组合函数驱动。

### 3.3 useSubscribe：订阅推送

```ts
const { data, error, refresh } = useSubscribe(() => store.subscribe(cb));
```

- 返回响应式对象时持续更新视图；失败保留旧数据并给出错误
- 初始调用经 `queueMicrotask` 延迟（与 fetch 一致，兼容 effectScope 内测试）

### 3.4 useAsyncState：通用异步状态机

```ts
const state = useAsyncState(() => loadDetail(id)); // 产出 AsyncStateLike
// status / data / error / isStale / retry —— 视图组件消费的最小契约
```

不属于查询 / 动作 / 订阅三形态的异步逻辑，用它兜底；任何视图只依赖
`AsyncStateLike` 契约即可渲染四态。

### 3.5 useChat：聊天消息模型

三协议聚合体：`fetch` 管历史（currentPage 递增向上翻页，结果前插去重）、
`subscribe` 管推送（追加去重，自己消息回显自动收敛为服务端 id）、
`send` 管发送（乐观上屏，失败保留气泡可重试）。

```ts
const { messages, send, loadOlder, hasMore, sending } = useChat({
  fetch: loadHistory, // ChatMessage[] 或 { list, total }，判定是否还有更早消息
  subscribe: onPush, // 推送单条或数组；响应式源持续推送
  send: submitMessage, // 抛错或返回 error 结果即失败
});
```

## 4. 表单模型域

| 组合函数                                  | 职责                                                            |
| ----------------------------------------- | --------------------------------------------------------------- |
| useForm                                   | 整表状态机：values / errors / valid / dirty / validate / submit |
| useFormField                              | 单控件接入表单：取值、错误、校验触发（组件层 FormItem 即此）    |
| useCheckableGroup                         | 复选组值模型                                                    |
| useSelectModel                            | 选择器值模型（含已选快照、多选）                                |
| useTreeModel                              | 树选择值模型                                                    |
| useAsyncSuggest                           | 异步联想（防抖 + 竞态）                                         |
| useDateGrid / useDateModel / useTimeModel | 日历网格与日期 / 时刻值模型                                     |

```ts
const form = useForm({
  modelValue: () => initial, // 受控或初始值
  rules: () => props.rules, // FormRule / FormRule[]，支持异步校验
  onSubmit: (values) => api.save(values),
  onInvalid: (errors) => message.error(Object.values(errors)[0]!),
});
// form.registerField(name, controller)：自建控件接入整表校验
```

规则类型 `FormRule` / `FormRules` / `FieldRuleConfig` 从包入口导出。

## 5. 浮层与反馈域

| 组合函数               | 职责                                     |
| ---------------------- | ---------------------------------------- |
| useModal               | 模态状态机（开 / 关 / 遮罩 / 焦点圈）    |
| usePopoverModel        | 弹层定位与触发（hover / click / focus）  |
| message / notification | 命令式服务：`createMessage()` 后全局调用 |
| useLoadingService      | 全局 loading 汇聚（并发请求计数）        |
| useToastQueue          | 队列化提示                               |

命令式服务建议在应用入口创建一次并注入，不要在每个组件里重复创建。

## 6. 数据展示域

```ts
import { usePagination } from '@mrchar/cumquat/composables';

const pagination = usePagination({ pageSize: 20, onChange: () => refresh() });
// pagination.current / pageSize / total / pages / setPage …
```

组件层 Table 的分页器即消费该模型；组件外组合 useFetch + usePagination 即可
拼装任意远程列表。

## 7. 资源池 useResources

```ts
const userApi = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs', // OpenAPI 3 / Swagger 2.0 文档地址
}).client('users');

// userApi.list / detail / create / update / remove + columns / filters / properties
```

- `columns` 直接绑 Table、`properties` 直接绑 Form，`format` 原样透传文档声明
- 协议无关仅两条注入边界：`parse`（元数据解析器）与 `request`（请求适配器）
- 详见 docs/composables/resources.md 与「单元格竞选 / 字段竞选」机制文档

## 8. 行为原语速查（L1 / L0）

自建 headless 组件时按需取用：

| 原语                                                                       | 用途                                     |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| useOpen / useDismiss                                                       | 开关状态机 / 外点 + Esc 关闭（返回原因） |
| useFloating                                                                | 弹层定位锚定                             |
| useFocusTrap / useFocusReturn                                              | 焦点圈 / 关闭后焦点归还                  |
| useClickOutside                                                            | 外点检测                                 |
| useRovingFocus / useTypeahead                                              | 列表键盘漫游 / 首字跳转                  |
| useHoverIntent / useListboxNavigation                                      | 意图悬停 / 列表导航                      |
| useScrollLock / useScrollIntoView / useScroll                              | 滚动锁定 / 滚动定位 / 滚动监听           |
| useControllableModel                                                       | 受控 / 非受控统一值模型                  |
| useEventListener / useResizeObserver / useIntersectionObserver             | 事件与观察器（SSR 安全）                 |
| useTimeoutFn / useIntervalFn / useMediaQuery                               | 定时 / 媒体查询                          |
| useToggle / useClipboard / useDraggable / useZIndex / useTransitionVisible | 开关 / 剪贴板 / 拖拽 / 层级 / 过渡       |

## 9. 常见模式

### 组件外消费异步状态

```ts
const { data, refresh } = useFetch(() => loadStats());
// data 交给任意展示组件，也可喂给 :state 做四态渲染
```

### 自建 headless 弹层

```ts
const { open, toggle } = useOpen();
const { dismiss } = useDismiss({ onDismiss: () => (open.value = false) });
const { floating, reference } = useFloating({ open });
useFocusTrap(floating, { active: open });
// 模板自绘结构，行为全部来自组合函数
```

### 乐观更新 + 失败回退

```ts
const { value, pending } = useActionValue(props.liked, async (next) => {
  await api.like(next);
  return next; // 抛错则自动回退
});
```

### 元数据直通（资源池 + 竞选）

```ts
const userApi = useResources({ server, doc }).client('users');
// <Table :columns="userApi.columns" :fetch="userApi.list" />
// <Form :properties="userApi.properties" :action="userApi.create" />
```

## 10. 注意事项

- **组合函数不发请求**：请求时机由调用方决定（挂载、参数变化、命令式 refresh）
- **错误文案归一**：展示错误前过 `actionErrorText` / `extractActionFailure`，与组件层一致
- **effectScope 安全**：useFetch / useSubscribe 的初始化经 queueMicrotask 延迟，可在 effectScope 中测试
- **类型单点导出**：协议类型（Fetch / AsyncStateLike / ActionResult / SubscribeResult）从包入口导出，勿从深层路径引
- **组件优先**：若组件层已提供同等能力（如 Table 内置分页），优先绑协议属性而非自己拼组合函数
