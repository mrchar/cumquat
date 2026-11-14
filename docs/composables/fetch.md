---
title: 数据请求
---

# 数据请求

fetch 协议是一个**资源工厂**（[`FetchHandler`](/types/basics/core#fetchhandler)）：以初始 [`FetchQuery`](/types/basics/core#fetchquery) 创建一个长命的资源对象 [`FetchResult`](/types/basics/core#fetchresult)，对象自带响应式状态（`status / data / error / message`）与两个方法（`execute / abort`）。组件库只管调用，**状态机、竞态与取消的实现完全交给开发者**——库不创建 `AbortController`，也不向 query 注入 `signal`。

## 协议形状

```ts
interface FetchResult<T> {
  status: MaybeRefOrGetter<Status>;                  // idle | pending | success | error
  data: MaybeRefOrGetter<FetchData<T> | undefined>;  // T[] | { list, page, size, total } | T
  error: MaybeRefOrGetter<unknown>;
  message: MaybeRefOrGetter<string | undefined>;
  execute(query?: ResolvedFetchQuery): void | Promise<void>; // 查询变化时调用
  abort(): void;                                     // 卸载 / 源切换时调用
}

type FetchHandler<T> = (
  query: FetchQuery,
) => FetchResult<T> | Promise<FetchResult<T>>;
```

约定：

- `FetchQuery` 继承 `FetchQueryPagination`，即 `page? / size? / keyword? / sorter? / filters?`，**没有 `signal`**
- `execute` 失败**不得 reject**：统一写入 `status = 'error'` 与 `error / message`
- 工厂只负责创建资源对象，首次请求由消费方调用 `execute` 发起；入参的初始 query 可用于初始化资源内部状态
- `data` 为数组 → 普通列表；为 `{ list, page, size, total }` → 组件自动启用分页，并以响应中的 `page / size` 作为分页条展示值（便于后端裁剪页大小或使用不同起始页码）；为单值 → 单值组件（如 Statistic）
- `FetchQuery` 的每个字段（含继承的 `page / size`）都接受裸值、`Ref` 或 getter；`execute` 收到的是由 `resolveFetchQuery` 解包的纯值快照 `ResolvedFetchQuery`
- 组件内部以 deep watch 监听查询源，更新 `reactive` 查询对象中的响应式值即自动重新调用 `execute`
- 状态字段是 `MaybeRefOrGetter`：可返回 `ref()` 创建的响应式字段，也可返回裸值或 getter；消费方统一以 `toValue` 读取

## 手写资源工厂（宿主侧）

宿主侧不需要任何库内助手，直接在闭包里写自己的竞态与取消逻辑：

```ts
import { ref } from 'vue';
import {
  asyncErrorText,
  type FetchData,
  type FetchHandler,
  type FetchResult,
  type ResolvedFetchQuery,
  type Status,
} from '@mrchar/cumquat';
import { fetchUsersApi, type UserRow } from './api/user';

export const fetchUsers: FetchHandler<UserRow> = () => {
  const status = ref<Status>('idle');
  const data = ref<FetchData<UserRow> | undefined>(undefined);
  const error = ref<unknown>(undefined);
  const message = ref<string | undefined>(undefined);

  // 竞态与取消完全是资源内部的私有实现，组件库无感知
  let controller: AbortController | undefined;
  let runId = 0;

  return {
    status,
    data,
    error,
    message,
    async execute(query: ResolvedFetchQuery) {
      const current = ++runId;
      controller?.abort();
      controller = new AbortController();
      status.value = 'pending';
      try {
        const envelope = await fetchUsersApi(
          {
            page: query.page ?? 1,
            size: query.size ?? 10,
            kw: query.keyword,
          },
          controller.signal,
        );
        if (envelope.code !== 0) throw new Error(envelope.message);
        if (current !== runId) return; // 过期响应不落地
        data.value = {
          list: envelope.records,
          page: envelope.page,
          size: envelope.size,
          total: envelope.total,
        };
        status.value = 'success';
      } catch (err) {
        if (current !== runId) return;
        error.value = err;
        message.value = asyncErrorText(err);
        status.value = 'error'; // 失败写状态，不向上抛
      }
    },
    abort() {
      runId += 1;
      controller?.abort();
    },
  };
};
```

```vue
<List :fetch="fetchUsers" />
```

组件侧的调用时序：挂载时以当前查询调用工厂拿到资源对象并执行一次 `execute`；之后查询片段变化只调 `execute`；组件卸载或 fetch 源切换时调用旧对象的 `abort`。一次绑定对应一个资源对象，不重复创建。

## useFetchResource

组件内部的纯编排器：何时调 `execute`、何时调 `abort`，自身不持有任何状态机或控制器。供组件作者使用，宿主侧无需接触。

```ts
const { enabled, state, total, pageInfo, loading, error, refresh } = useFetchResource<Row[]>(
  () => props.fetch, // 必须传 ref/getter，裸函数会被 toValue 当 getter 调用
  {
    getQuery: () => ({ page, size, sorter }),
    initialData: [],
    debounce: 300,                        // 关键词类组件使用
    merge: (previous, next, query) => …,  // 累积分页 / 树懒加载挂载子级
  },
);
```

- 每个 `FetchHandler` 源在组件内部绑定独立资源对象；首次绑定在微任务执行，查询监听器在首次绑定时完成依赖收集
- `await handle.execute()` 后校验资源对象未被替换，过期对象的产出不落地
- 失败时不覆盖旧数据与旧分页信息，状态由 `state` 的 error 分支反映
- `pageInfo` 暴露最近一次成功响应的 `{ page, size, total }`（响应缺失的字段以请求参数兜底），供 Table 等组件把分页条校正为真实响应值
- `merge` 模式下仅当 `query.page <= 1` 时重置数据；无分页参数的懒加载查询不重置，由 `merge` 依据 `filters.parentKey` 挂回子树
- 作用域销毁时统一调用当前资源的 `abort()`
- 组件外需要观察异步状态（点击按钮才加载、自定义触发时机）时使用 [`useAsyncState`](/composables/subscribe#useasyncstate)
