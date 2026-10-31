---
title: 资源池 useResources
---

# 资源池

声明一次「服务器地址 + 元数据解析方式」，得到全站可复用的**资源池**；按资源名取出**客户端**，客户端方法与组件的 fetch / action 协议同形，字段元数据（`columns` / `filters` / `properties`）按组件属性形状导出，页面无需再手写请求胶水代码。

## 动机

- 列表、详情、增删改的数据层高度重复：每个资源都要手写一遍请求方法、参数拼装与类型声明
- 这些信息服务器通常已经描述过（如 Swagger 文档）：把描述解析成结构化的资源表，即可一次性生成全部客户端
- 组件库已有统一协议（[Fetch](/fetch) / [Action](/action) / [Subscribe](/subscribe)），缺的是一个把这些协议「批量供给」的数据层入口

## 设计原则

1. **不绑定传输实现**：核心只依赖「请求适配器」接口；随包提供基于 fetch 的默认适配器，可整体替换为宿主已有的请求实现
2. **不绑定元数据协议**：核心只依赖「元数据解析器」接口；随包提供 OpenAPI（Swagger）解析器作为默认实现，可整体覆盖，也可直接传入资源表完全跳过解析。类型契约是唯一锚点：自定义解析器的职责仅是把协议与约定翻译成资源表
3. **方法与元数据形状即协议**：`list` / `detail` 与 Fetch 同形，`create` / `update` / `remove` 与 ActionLike 同形，可直接绑定组件属性；`columns` / `filters` / `properties` 等字段元数据同样按组件属性形状导出，页面装配只剩布局
4. **池与视图无关**：资源池属于逻辑层组合函数，不持有 UI 状态；四态渲染、错误重试、乐观回退仍由组件与既有组合函数承担

## 快速上手（以 Swagger 为例）

```ts
// src/api/resources.ts —— 模块级创建一次，全站复用
import { useResources } from '@mrchar/cumquat/composables';

export const pool = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs', // Swagger 文档地址
});

export const userApi = pool.client('users');
```

池初始化时拉取并解析文档；`client()` 无需等待加载完成，方法调用时内部自动等待。

页面侧零胶水：

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { userApi } from '@/api/resources';

// 列由元数据导出，操作列由宿主追加
const columns = computed(() => [...userApi.columns, { key: 'actions', title: '操作' }]);
</script>

<template>
  <Table :columns="columns" :fetch="userApi.list" :page-size="20">
    <template #cell-actions="{ row }">
      <Popconfirm :action="() => userApi.remove(row.id)">删除</Popconfirm>
    </template>
  </Table>

  <!-- 创建 / 编辑：字段由 properties 描述，required / type / options 已就绪 -->
  <Form :action="userApi.create">…</Form>

  <!-- 详情：数据对象 + properties 元数据驱动 -->
  <Descriptions :fetch="() => userApi.detail(currentId)" :properties="userApi.properties" />
</template>
```

## 使用说明

### 列表页：分页 / 排序 / 筛选 / 删除

分页、排序、筛选参数全部自动注入；枚举字段的表头筛选项随 `columns` 自动携带
（`filters`），服务端筛选无需额外接线：

```vue
<Table :columns="columns" :fetch="userApi.list" :page-size="20">…</Table>
```

### 创建 / 编辑

`create` / `update` 与 ActionLike 同形，直接绑给 Form 的 `:action`；执行中
loading、失败回退提示等行为与动作协议一致。`properties` 提供字段的必填、类型
与枚举选项，控件选择与布局由宿主决定：

```vue
<Form :action="userApi.create">…</Form>
<Form :action="(payload) => userApi.update(currentId, payload)">…</Form>
```

### 远程候选项

`list` 与 Select / AutoComplete 的 `:fetch` 同形：搜索词防抖、触底翻页、竞态
取消照常生效：

```vue
<Select v-model="ownerId" :fetch="userApi.list" filterable placeholder="按姓名搜索" />
```

### 详情

`detail` 返回单值对象，绑给 Descriptions 的 fetch；展示哪些字段、顺序与标签由
`properties` 元数据声明（可直接复用 `userApi.properties`）：

```vue
<Descriptions :fetch="() => userApi.detail(currentId)" :properties="userApi.properties" />
```

## useResources(options)

| 参数    | 类型                                                                    | 默认              | 说明                                                       |
| ------- | ----------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| server  | `string`                                                                | 必填              | 服务器根地址：请求 URL = server + 操作路径                 |
| doc     | `string`                                                                | -                 | 元数据文档地址：相对 server 或绝对 URL                     |
| parse   | `MetadataParser`                                                        | OpenAPI 解析器    | 元数据解析器，见下方「覆盖与适配」                         |
| schema  | `ResourceSchema \| () => ResourceSchema \| Promise<ResourceSchema>`     | -                 | 直接提供资源表：跳过文档加载与解析，协议完全自定义时的出口 |
| request | `RequestAdapter`                                                        | 内置 fetch 适配器 | 传输适配器                                                 |
| headers | `Record<string, string> \| () => …`                                     | -                 | 附加请求头：鉴权 token 等随每次请求注入                    |
| refine  | `(schema: ResourceSchema) => ResourceSchema \| Promise<ResourceSchema>` | -                 | 解析后的微调：改名、合并资源、调整参数映射                 |

文档内声明的服务地址（如 OpenAPI 的 servers 字段）仅在未传 `server` 时作为缺省，传入的 `server` 恒优先。

### ResourcePool

| 成员           | 类型                             | 说明                                                              |
| -------------- | -------------------------------- | ----------------------------------------------------------------- |
| `state`        | `AsyncStateLike<ResourceSchema>` | 元数据加载状态：pending / success / error，可直接交给状态视图渲染 |
| `client(name)` | `ResourceClient`                 | 取资源客户端；资源不存在时抛出错误，让拼写问题在开发期即暴露      |
| `has(name)`    | `boolean`                        | 资源是否存在                                                      |
| `names`        | `string[]`                       | 全部资源名                                                        |

### ResourceClient

请求方法：

| 方法     | 签名                                                                        | 对应协议与接入点                                |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| `list`   | `(query?: FetchQuery) => Promise<T[] \| PagedResult<T>>`                    | Fetch：Table / Select / VirtualList 的 `:fetch` |
| `detail` | `(id: string \| number) => Promise<T>`                                      | Fetch 单值形态：Descriptions 等                 |
| `create` | `(payload: unknown) => Promise<ActionResult \| void>`                       | ActionLike：Form                                |
| `update` | `(id: string \| number, payload: unknown) => Promise<ActionResult \| void>` | ActionLike：Form / Dialog                       |
| `remove` | `(id: string \| number) => Promise<ActionResult \| void>`                   | ActionLike：Popconfirm / Button                 |

字段元数据（同步只读值，随池初始化就绪，均由资源表的 `fields` 按场景标记投影）：

| 成员         | 类型                                                    | 说明                                                                                                                                                           |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`     | `ResourceField[]`                                       | 完整字段元数据原始列表                                                                                                                                         |
| `columns`    | `{ key, title, type?, format?, sortable?, filters? }[]` | 列表列投影（`scope.list`），直接绑定 Table 的 `:columns`；`type` / `format` 供[单元格竞选](/cell)自动推断显示                                                  |
| `filters`    | `ResourceField[]`                                       | 筛选字段投影（`scope.filter`），enum 字段自带 options                                                                                                          |
| `properties` | `ResourceField[]`                                       | 表单字段投影（`scope.create` / `scope.update`，保留场景标记），直接绑定 Form 的 `:properties`；`type` / `format` / `required` 供[字段竞选](/field)自动推断控件 |

`list` 透传统一查询片段（含 `signal`，翻页 / 搜索的竞态取消由消费侧照常生效）；`detail` / `update` / `remove` 的 `id` 经资源表中的路径模板（`{id}`）替换进 URL。

## 元数据与资源表

`ResourceSchema` 是核心唯一的数据契约，三种接入方式（默认解析、覆盖解析器、直接传入）殊途同归。

### 类型契约

全部类型由包统一导出，是解析器与池之间的唯一边界。**自定义解析器只承担一件事：把你的协议与约定翻译成 `ResourceSchema`**；URL 拼装、路径参数替换、查询片段注入、请求体序列化等运行时行为全部由池完成。

```ts
/** 资源表：元数据解析的唯一产物，也是池运行的唯一依据 */
interface ResourceSchema {
  resources: Record<string, ResourceDefinition>;
}

/** 单个资源的操作集合：未声明的操作不可用（只读资源仅声明 list / detail 即可） */
interface ResourceDefinition {
  list?: ResourceOperation; // GET 集合路径
  detail?: ResourceOperation; // GET 单项路径
  create?: ResourceOperation; // POST 集合路径
  update?: ResourceOperation; // PUT / PATCH 单项路径
  remove?: ResourceOperation; // DELETE 单项路径
  /** 统一查询片段 → 请求参数名的映射，未声明的字段回落默认名 */
  queryNames?: QueryNames;
  /** 列表响应形状，由解析器从文档响应结构中识别 */
  response?: ListResponseMapping;
  /** 字段元数据：columns / filters / properties 的唯一来源，文档缺失时为空数组 */
  fields?: ResourceField[];
}

/** 字段元数据：视图中性的字段描述，四个导出按 scope 投影 */
interface ResourceField {
  /** 字段名：数据对象键 */
  name: string;
  /** 展示名，解析自文档描述，缺失回落字段名 */
  label: string;
  /** 值类型：决定筛选与表单的控件选择 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';
  /** 内容格式：原样透传文档声明的 format（如 email / uri / int64），与 type 的保存格式互补 */
  format?: string;
  /** 枚举选项：type 为 enum 时提供，可直接喂给选项组件 */
  options?: Array<{ label: string; value: string | number }>;
  /** 表单场景是否必填 */
  required?: boolean;
  /** 出现场景标记：未标记的字段不进入任何投影 */
  scope?: {
    /** 出现在列表列 */
    list?: boolean;
    /** 作为筛选项 */
    filter?: boolean;
    /** 出现在创建表单 */
    create?: boolean;
    /** 出现在编辑表单 */
    update?: boolean;
  };
}

interface ResourceOperation {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** 路径模板：{id} 占位在运行时以方法参数替换 */
  path: string;
}

/** 列表响应形状：数组与总数在响应体中的点分路径；缺省时响应体即数组 */
interface ListResponseMapping {
  /** 列表数组在响应体中的路径，如 'records' 或 'data.list'；缺省为响应体本身 */
  list?: string;
  /** 总数路径，如 'total' 或 'meta.total'；缺省则不启用分页 */
  total?: string;
}

/** 元数据解析器：输入任意协议文档，输出资源表 */
type MetadataParser = (
  doc: unknown,
  context: { server: string },
) => ResourceSchema | Promise<ResourceSchema>;

/** 传输适配器：发起请求并 resolve 响应体（未提供时使用内置 fetch 实现） */
type RequestAdapter = (request: ResourceRequest) => Promise<unknown>;

interface ResourceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 竞态取消：由消费侧的 FetchQuery 透传 */
  signal?: AbortSignal;
}

interface QueryNames {
  /** 关键词参数名，默认 keyword */
  keyword?: string;
  /** 页码参数名（页码从 1 起），默认 page */
  currentPage?: string;
  /** 每页大小参数名，默认 pageSize */
  pageSize?: string;
  /** 排序参数名：值序列化为 key,order，无排序时不注入，默认 sorter */
  sorter?: string;
  /** 筛选参数名：设置时将 filters 对象整体 JSON 序列化为该参数；未设置时逐键展开为独立参数，数组值以逗号连接 */
  filters?: string;
}
```

运行时语义（解析器无需关心，由池保证）：

- 查询片段仅在组件实际产生时注入，未产生的片段不出现在请求中；参数值为 `undefined` 时该参数整体省略
- `list` 按资源的响应映射取数组与总数：信封响应（如 `{ records, total }`）归一为 `{ list, total }`，裸数组直传，组件据此自动启用分页
- `create` / `update` 的 payload 经 JSON 序列化作为请求体；GET / DELETE 不携带请求体
- `detail` / `update` / `remove` 的 `id` 替换 path 中的 `{id}` 占位；模板中其余占位需在解析期固化为具体值（如多租户前缀经 `refine` 生成）
- 适配器 resolve 即成功、reject 即失败，状态码语义由适配器自行决定

### 默认解析器的转换规则（以 Swagger 为例）

| 文档特征                     | 归属     |
| ---------------------------- | -------- |
| `GET /users`（无路径参数）   | `list`   |
| `GET /users/{id}`            | `detail` |
| `POST /users`                | `create` |
| `PUT /users/{id}` 或 `PATCH` | `update` |
| `DELETE /users/{id}`         | `remove` |

- 资源名取 tag（或 operationId 前缀），同一资源的操作聚合为一个 `ResourceDefinition`
- 请求参数名从文档的参数声明中识别常见命名（`page` / `pageNo` / `current` → currentPage，`pageSize` / `size` / `limit` → pageSize，`keyword` / `q` / `search` → keyword 等），识别失败回落默认命名，可用 `refine` 修正
- 字段元数据自文档 schema 提取：属性名 → `name`，description → `label`，format 映射 `type`（如 date-time → datetime、int64 → number），enum（含整型枚举）附带 options
- 场景标记按出现位置判定：create 请求体属性 → `scope.create`，update 请求体 → `scope.update`，`required` 取 schema 的 required 列表；查询参数中除分页 / 关键词外的项 → `scope.filter`；列表与详情响应属性 → `scope.list`
- 信封响应（数组属性 + 总数属性，如 `records` / `total`、`items` / `count`）自动映射为 `response` 路径；裸数组响应不映射
- 解析器只读文档，不校验服务器实现；路径与方法以文档为准，schema 缺失时 `fields` 为空数组，请求方法照常可用

## 覆盖与适配

按改造深度分三级，从轻到重：

**1. `refine` 微调** —— 文档大体准确，个别命名或资源名需要修正：

```ts
useResources({
  server,
  doc: '/v3/api-docs',
  refine: (schema) => {
    schema.resources['user-accounts'].queryNames = { currentPage: 'pageNo' };
    return schema;
  },
});
```

**2. 覆盖解析器** —— 元数据不是 OpenAPI 格式，`doc` 指向任意自描述端点：

```ts
useResources({
  server,
  doc: '/api/describe',
  parse: async (doc) => ({ resources: buildFromCustomDoc(doc) }),
});
```

**3. 直接传 `schema`** —— 跳过文档加载，资源表手写或由宿主工具生成，池即刻可用：

```ts
useResources({
  server,
  schema: {
    resources: {
      users: {
        list: { method: 'GET', path: '/users' },
        create: { method: 'POST', path: '/users' },
        remove: { method: 'DELETE', path: '/users/{id}' },
      },
    },
  },
});
```

### 传输适配器

适配器接口见上方[类型契约](#类型契约)的 `RequestAdapter`。内置适配器基于 fetch：GET 以 `query` 拼装 URL，写操作以 JSON 提交 `body`；非 2xx 状态拒绝为携带状态码与响应体的错误，响应体自动 JSON 解析。

需要携带鉴权、改用宿主请求实现时整体替换：

```ts
useResources({
  server,
  doc: '/v3/api-docs',
  request: (request) => hostRequest(request), // 宿主已有请求实现
});
```

## 状态与错误

- **元数据加载失败** → `pool.state` 进入 error（带 retry），页面可将依赖资源的区域交给状态视图统一渲染
- **请求失败** → 方法拒绝：绑到 `:fetch` 时组件进入错误态并提供重试入口；绑到 `:action` 时自动回退旧值并抛出 `actionError`
- 请求防抖、竞态取消、缓存由消费侧（组件与 useFetchResource）负责，池不做二次封装，保证两层职责边界清晰

## 非目标

- **不做自动布局**：字段元数据描述名称、类型、选项与场景，但页面结构、列宽、表单布局仍由宿主决定；元数据导出的是「可装配的零件」，不是生成的页面
- **不内置鉴权流程**：token 注入经 `headers` 或 `request` 适配器
- **不做请求缓存、轮询、乐观更新**：分别属于 useFetchResource、Subscribe 与组件 action 机制的职责
