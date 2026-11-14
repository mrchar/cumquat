# Spec：core 异步契约字段统一为 MaybeRefOrGetter

## 背景与目标

用户要求：core 中的核心类型（`Status`、`AsyncResult`、`FetchResult`、`ActionResult`、`SubscribeResult` 等）的属性都应为 `MaybeRefOrGetter`。

目标：让异步状态信封同时接受裸值、`Ref` 与 getter，使宿主既能返回普通对象，也能返回响应式状态对象；所有消费方统一用 `toValue()` 解包，不假设字段一定是 `Ref`。

## 范围

### 1. `packages/core/src/status.ts`

- 新增 `import type { MaybeRefOrGetter } from 'vue'`。
- `Status` 本身仍是字符串联合，不变。
- `AsyncResult` 四个字段改为：

```ts
export interface AsyncResult<T = unknown, S extends Status = Status> {
  status?: MaybeRefOrGetter<S>;
  data?: MaybeRefOrGetter<T>;
  error?: MaybeRefOrGetter<unknown>;
  message?: MaybeRefOrGetter<string>;
}
```

- `ActionResult`、`SubscribeResult` 由别名自动继承，无需单独修改。

### 2. `packages/core/src/fetch.ts`

- 依赖从 `Ref` 改为 `MaybeRefOrGetter`。
- `FetchResult` 四个状态字段改为：

```ts
export interface FetchResult<T> {
  status: MaybeRefOrGetter<Status>;
  data: MaybeRefOrGetter<FetchData<T> | undefined>;
  error: MaybeRefOrGetter<unknown>;
  message: MaybeRefOrGetter<string | undefined>;
  execute: (query: FetchQuery) => void | Promise<void>;
  abort: () => void;
}
```

- `execute` / `abort` / `FetchQuery` / `PagedResult` 等协议不变。

### 3. `packages/core/src/result.ts`

- 引入 `toValue`。
- `extractAsyncFailure`：对 `status`、`error` 先 `toValue` 再判定。
- `asyncErrorText`：先 `toValue(error)`；候选对象上的 `message`、`error` 同样 `toValue` 后再提取。
- 保持现有归一语义：`status === 'error'` 或携带非空 `error` 即失败。

### 4. `packages/composables` 适配

- `data/fetch.ts`：`handle.status.value` / `handle.data.value` / `handle.error.value` 改为 `toValue(handle.status)` 等；`loading` / `error` 计算属性同样用 `toValue`。
- `data/useSubscribe.ts`：
  - `extractAsyncFailure` 已可处理 `MaybeRefOrGetter`。
  - `result.status` 判断改 `toValue(result.status)`。
  - 写入 Snapshot 的 `data` 用 `toValue(result.data)`（`reactive` 对象仍保持响应式；纯 `ref` 取当前值）。
- `data/useChat.ts`：`handle.status.value` / `handle.data.value` / `handle.error.value` 改为 `toValue(...)`。
- `resources/use-resources.ts`：仍返回 `ref`，天然满足 `MaybeRefOrGetter`，无需改动。

### 5. `packages/components` 适配

- `data-entry/Mention.vue`、`data-entry/AutoComplete.vue` 中对 `handle.status` / `handle.data` / `handle.error` 的 `.value` 访问改为 `toValue(...)`。
- 其余组件只消费 `useFetchResource` / `useSubscribeResource` 的投影，不直接触碰 `FetchResult` 字段，不需要改。

### 6. 测试与验证

- `packages/core/src/__tests__/result.test.ts`：新增 `ref` / getter 形态的 `status`、`error`、`message` 用例，验证 `toValue` 解包。
- `packages/composables/src/__tests__/resources/use-resources.test.ts` 等测试中 `handle.status.value` 等访问改为 `toValue(...)`，避免类型错误。
- `packages/composables/src/__tests__/helpers.ts` 的假资源对象可保持 `ref` 实现。

## 非目标

- 不改变 `Status` 的字符串联合语义。
- 不改变 `FetchQuery` 的响应式改造（另行实施）。
- 不删除 `Snapshot`（另行实施）。
- 不改变分页 `page` / `size` 的既有决策。

## 验收标准

1. `packages/core`、`packages/composables`、`packages/components` 的 `vp check --no-fmt` 均 0 error。
2. core 测试 16/16 通过；composables 与 components 测试通过数不低于基线（各保留 1 个既有 overlay 失败，不修复）。
3. 新增测试覆盖：`AsyncResult` 字段为 `ref` 或 getter 时，失败判定与错误文案仍正确。
4. 文档 `docs/types/basics/core.md`、`docs/composables/fetch.md`、`docs/state.md` 与 skills 中的类型片段同步为 `MaybeRefOrGetter`。
