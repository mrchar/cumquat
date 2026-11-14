---
title: 资源池 useResources
---

# 资源池

声明一次「服务器地址 + 元数据解析方式」，得到全站可复用的**资源池**；按资源名取出**客户端**，客户端方法与组件的 fetch / action 协议同形，字段元数据（`columns` / `filters` / `properties`）按组件属性形状导出，页面无需再手写请求胶水代码。

## 动机

- 列表、详情、增删改的数据层高度重复：每个资源都要手写一遍请求方法、参数拼装与类型声明
- 这些信息服务器通常已经描述过（如 Swagger 文档）：把描述解析成结构化的资源表，即可一次性生成全部客户端
- 组件库已有统一协议（[状态自持](/state)），缺的是一个把这些协议「批量供给」的数据层入口

## 设计原则

1. **不绑定传输实现**：核心只依赖「请求适配器」接口；随包提供基于 fetch 的默认适配器，可整体替换为宿主已有的请求实现
2. **不绑定元数据协议**：核心只依赖「元数据解析器」接口；随包提供 OpenAPI（Swagger）解析器作为默认实现，可整体覆盖，也可直接传入资源表完全跳过解析。类型契约是唯一锚点：自定义解析器的职责仅是把协议与约定翻译成资源表
3. **方法与元数据形状即协议**：`list` / `detail` 与 FetchHandler 同形，`create` / `update` / `remove` 与 ActionHandler 同形，可直接绑定组件属性；`columns` / `filters` / `properties` 等字段元数据同样按组件属性形状导出，页面装配只剩布局
4. **池与视图无关**：资源池属于逻辑层组合函数，不持有 UI 状态；四态渲染、错误重试、乐观回退仍由组件与既有组合函数承担

## 快速上手（以 Swagger 为例）

```ts
// src/api/resources.ts —— 模块级创建一次，全站复用
import { useResources } from '@mrchar/cumquat';

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
  <Table :columns="columns" :fetch="userApi.list" :size="20">
    <template #cell-actions="{ row }">
      <Popconfirm :action="() => userApi.remove(row.id)">删除</Popconfirm>
    </template>
  </Table>

  <!-- 创建 / 编辑：字段与内置校验由数据模型一次给出 -->
  <Form :schema="userApi.schema" :action="userApi.create">…</Form>

  <!-- 详情：数据对象 + properties 元数据驱动 -->
  <Descriptions :fetch="() => userApi.detail(currentId)" :properties="userApi.properties" />
</template>
```

## 使用说明

### 列表页：分页 / 排序 / 筛选 / 删除

分页、排序、筛选参数全部自动注入；枚举字段的表头筛选项随 `columns` 自动携带
（`filters`），服务端筛选无需额外接线：

```vue
<Table :columns="columns" :fetch="userApi.list" :size="20">…</Table>
```

### 创建 / 编辑

`create` / `update` 与 ActionHandler 同形，直接绑给 Form 的 `:action`；执行中
loading、失败回退提示等行为与动作协议一致。`properties` 提供字段的必填、类型
与枚举选项，控件选择与布局由宿主决定：

```vue
<Form :action="userApi.create">…</Form>
<Form :action="(payload) => userApi.update(currentId, payload)">…</Form>
```

需要按文档约束自动校验时，把 `userApi.schema` 传给 Form 的 `:schema`，字段与约束一次就绪；也可以单独 `createValidator(userApi.schema)` 在提交前校验，详见[数据校验](/composables/validation)。

### 远程候选项

`list` 本身就是符合 fetch 协议的资源工厂（[`FetchHandler`](/types/basics/core#fetchhandler)）：
以初始查询创建自带 `execute / abort` 的资源对象，搜索词防抖、触底翻页、竞态取消
由资源内部实现，组件侧只负责调用：

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

| 参数     | 类型                                                                        | 默认              | 说明                                                       |
| -------- | --------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| `server` | `string`                                                                    | 必填              | 服务器根地址：请求 URL = server + 操作路径                 |
| `doc`    | `string`                                                                    | -                 | 元数据文档地址：相对 server 或绝对 URL                     |
| `parse`  | [`MetadataParser`](/types/model/resources#metadataparser)                          | OpenAPI 解析器    | 元数据解析器，见下方「覆盖与适配」                         |
| `registry` | [`Registry`](/types/model/resources#registry)` \| () => `[`Registry`](/types/model/resources#registry)` \| Promise<`[`Registry`](/types/model/resources#registry)`>` | -                 | 直接提供资源表：跳过文档加载与解析，协议完全自定义时的出口 |
| `request` | [`RequestAdapter`](/types/model/resources#requestadapter)                          | 内置 fetch 适配器 | 传输适配器                                                 |
| `headers` | `Record<string, string> \| () => …`                                         | -                 | 附加请求头：鉴权 token 等随每次请求注入                    |
| `view`    | [`Converter`](/types/model/rendering#converter)                                        | 内置转换器        | schema → 视图的转换器，可整体替换                         |
| `refine`  | `(registry: `[`Registry`](/types/model/resources#registry)`) => `[`Registry`](/types/model/resources#registry)` \| Promise<…>` | -                 | 解析后的微调：改名、合并资源、调整参数映射                 |

文档内声明的服务地址（如 OpenAPI 的 servers 字段）仅在未传 `server` 时作为缺省，传入的 `server` 恒优先。

### ResourcePool

| 成员           | 类型                             | 说明                                                              |
| -------------- | -------------------------------- | ----------------------------------------------------------------- |
| `state`        | `ResourcePool['state']`（status / data / error / retry） | 元数据加载状态：idle / pending / success / error，可直接交给状态视图渲染 |
| `client(name)` | [`ResourceClient`](/types/model/resources#resourceclient)                 | 取资源客户端；资源不存在时抛出错误，让拼写问题在开发期即暴露      |
| `has(name)`    | `boolean`                        | 资源是否存在                                                      |
| `names`        | `string[]`                       | 全部资源名                                                        |

### ResourceClient

请求方法：

| 方法     | 签名                                                                        | 对应协议与接入点                                |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| `list`   | `(query?: `[`FetchQuery`](/types/basics/core#fetchquery)`) => `[`FetchResult`](/types/basics/core#fetchresult)`<T>`（同步工厂，查询经返回对象的 `execute` 驱动） | FetchHandler 工厂：Table / Select / VirtualList 的 `:fetch` |
| `detail` | `(id: string \| number) => Promise<T>`                                      | Promise 单值形态：Descriptions 等                 |
| `create` | `(payload: unknown) => Promise<`[`ActionResult`](/types/basics/core#actionresult)` \| void>`                       | ActionHandler：Form                                |
| `update` | `(id: string \| number, payload: unknown) => Promise<`[`ActionResult`](/types/basics/core#actionresult)` \| void>` | ActionHandler：Form / Dialog                       |
| `remove` | `(id: string \| number) => Promise<`[`ActionResult`](/types/basics/core#actionresult)` \| void>`                   | ActionHandler：Popconfirm / Button                 |

字段视图（同步只读值，随池初始化就绪；由 schema 经转换器投影）：

| 成员         | 类型                                                    | 说明                                                                                                                                                           |
| ------------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`     | [`View`](/types/model/rendering#view)`[]`                          | 完整字段视图（可渲染字段）：`label / component / validation`                                                                                                   |
| `columns`    | [`ResourceColumn`](/types/model/resources#resourcecolumn)`[]`  | 列表列投影（`scope.list`），直接绑定 Table 的 `:columns`；字段的 `type` / `format` / `enum` 已展开到列上，enum 列自动以 `enum` 作为筛选项 |
| `filters`    | [`View`](/types/model/rendering#view)`[]`                          | 筛选字段投影（`scope.filter`），枚举字段的选项在 `props.options`                                                                                               |
| `properties` | [`View`](/types/model/rendering#view)`[]`                          | 表单字段投影（`scope.create` / `scope.update`），直接绑定 Form 的 `:properties`；`component` 指定控件，`validation` 携带校验                         |
| `schema`     | [`Schema`](/types/model/form#schema)                      | 资源的数据 schema：可直接交给 `createValidator` / `useValidator`，或作为 Form 的 `:schema` 一步完成渲染与校验（见[数据校验](/composables/validation)） |

`list` 透传统一查询片段；`FetchQuery` 本身不含 `signal`——资源对象在内部为每次 `execute` 创建 `AbortController`，翻页 / 搜索时自动作废上一请求，并把内部 signal 经 `ResourceRequest` 透传给适配器。`detail` / `update` / `remove` 的 `id` 经资源表中的路径模板（`{id}`）替换进 URL。

## 元数据与资源表

[`Registry`](/types/model/resources#registry) 是核心唯一的数据契约，三种接入方式（默认解析、覆盖解析器、直接传入）殊途同归。

### 类型契约

全部类型由包统一导出，是解析器与池之间的唯一边界。**自定义解析器只承担一件事：把你的协议与约定翻译成 [`Registry`](/types/model/resources#registry)**；URL 拼装、路径参数替换、查询片段注入、请求体序列化等运行时行为全部由池完成。

```ts
/** 资源表：元数据解析的唯一产物，也是池运行的唯一依据 */
interface Registry {
  resources: Record<string, Resource>;
}

/** 单资源：数据 schema + 操作集合（未声明的操作不可用） */
interface Resource extends Model {
  list?: ResourceOperation; // GET 集合路径
  detail?: ResourceOperation; // GET 单项路径
  create?: ResourceOperation; // POST 集合路径
  update?: ResourceOperation; // PUT / PATCH 单项路径
  remove?: ResourceOperation; // DELETE 单项路径
  /** 统一查询片段 → 请求参数名的映射，未声明的字段回落默认名 */
  queryNames?: QueryNames;
  /** 列表响应形状，由解析器从文档响应结构中识别 */
  response?: ListResponseMapping;
  /** 字段视图提示：按字段名索引，与纯数据 schema 分离 */
  hints?: Record<string, Hint>;
}

/** 单资源数据模型：名称 + schema */
interface Model {
  name: string;
  schema: Schema;
}

/** JSON Schema 节点：递归描述任意值 */
interface Schema extends Meta, Type, Constraint {}
```

`Schema` 的三层定义见[表单与校验类型](/types/model/form#schema)。schema 节点只描述数据本身；视图提示（`scope` / `control` / `enumLabels` / `placeholder` / `bias`）挂在 `Resource.hints` 上，由转换器消费。

```ts
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
) => Registry | Promise<Registry>;

/** 传输适配器：发起请求并 resolve 响应体（未提供时使用内置 fetch 实现） */
type RequestAdapter = (request: ResourceRequest) => Promise<unknown>;

interface ResourceRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 竞态取消：资源池内部创建 AbortController 后透传（FetchQuery 不含 signal） */
  signal?: AbortSignal;
}

interface QueryNames {
  /** 关键词参数名，默认 keyword */
  keyword?: string;
  /** 页码参数名（页码从 1 起），默认 page */
  page?: string;
  /** 每页大小参数名，默认 size */
  size?: string;
  /** 排序参数名：值序列化为 key,order，无排序时不注入，默认 sorter */
  sorter?: string;
  /** 筛选参数名：设置时将 filters 对象整体 JSON 序列化为该参数；未设置时逐键展开为独立参数，数组值以逗号连接 */
  filters?: string;
}
```

运行时语义（解析器无需关心，由池保证）：

- 查询片段仅在组件实际产生时注入，未产生的片段不出现在请求中；参数值为 `undefined` 时该参数整体省略
- `list` 按资源的响应映射取数组、页码、页大小与总数：信封响应（如 `{ records, page, size, total }`）归一为 `{ list, page, size, total }`（响应缺 page / size 时以请求参数回填），裸数组直传，写入资源对象的 `data` Ref，组件据此自动启用分页
- `create` / `update` 的 payload 经 JSON 序列化作为请求体；GET / DELETE 不携带请求体
- `detail` / `update` / `remove` 的 `id` 替换 path 中的 `{id}` 占位；模板中其余占位需在解析期固化为具体值（如多租户前缀经 `refine` 生成）
- 适配器 resolve 即成功、reject 即失败，状态码语义由适配器自行决定；`list` 的 reject 在资源对象内部捕获并转为 `error` 状态，`execute` 本身不向上抛出

### 默认解析器的转换规则（以 Swagger 为例）

| 文档特征                     | 归属     |
| ---------------------------- | -------- |
| `GET /users`（无路径参数）   | `list`   |
| `GET /users/{id}`            | `detail` |
| `POST /users`                | `create` |
| `PUT /users/{id}` 或 `PATCH` | `update` |
| `DELETE /users/{id}`         | `remove` |

- 资源名取 tag（回落路径首个非占位段），同一资源的操作聚合为一个 [`Resource`](/types/model/resources#resource)
- 请求参数名从文档的参数声明中识别常见命名（`page` / `pageNo` / `current` → page，`pageSize` / `size` / `limit` → size，`keyword` / `q` / `search` → keyword 等），识别失败回落默认命名，可用 `refine` 修正
- 字段定义原样保留三层结构：`title` / `description` / `example` 等属性定义，`type`（含 `integer`）/ `format` / `enum` / `nullable` / `items` / `properties` 等类型定义，`minimum` / `minLength` / `pattern` 等约束定义；`type` 为数组时归一为单类型 + `nullable`
- 场景标记按出现位置判定：create 请求体属性 → `hints.scope.create`，update 请求体 → `hints.scope.update`；查询参数中除分页 / 关键词外的项 → `hints.scope.filter`；列表响应属性 → `hints.scope.list`；对象级 `required` 由 create / update 请求体合并取并集
- 约束不翻译成独立规则表：它们留在字段上，校验器直接读取；`hints` 只影响视图投影。OpenAPI 3.0 的布尔排他边界归一为数值形式；映射细节见[数据校验](/composables/validation#openapi-约束映射)
- 信封响应（数组属性 + 页码 / 页大小 / 总数属性，如 `records` / `page` / `size` / `total`、`items` / `current` / `count`）自动映射为 `response` 路径；裸数组响应不映射
- 解析器只读文档，不校验服务器实现；路径与方法以文档为准，schema 缺失时资源仍可创建，请求方法照常可用

### parseOpenApi

随包导出的默认元数据解析器，即 `useResources` 不传 `parse` 时的缺省实现，同时兼容 OpenAPI 3.x 与 Swagger 2.0。

```ts
const parseOpenApi: MetadataParser = (
  rawDoc: unknown,
  context: { server: string },
) => Registry | Promise<Registry>;
```

契约见 [`MetadataParser`](/types/model/resources#metadataparser)：输入原始文档与服务器上下文，输出[`Registry`](/types/model/resources#registry)；文档缺少 `paths` 定义时直接抛错。需要在资源池之外复用解析结果（离线生成资源表、构造测试夹具等）时可单独调用：

```ts
import { parseOpenApi } from '@mrchar/cumquat';

const registry = parseOpenApi(swaggerDoc, { server: 'https://api.example.com' });
```

转换规则即上方「默认解析器的转换规则」表格；解析器只负责「文档 → 资源表」，URL 拼装、参数注入等运行时行为仍由资源池承担。

## 覆盖与适配

按改造深度分三级，从轻到重：

**1. `refine` 微调** —— 文档大体准确，个别命名或资源名需要修正：

```ts
useResources({
  server,
  doc: '/v3/api-docs',
  refine: (registry) => {
    registry.resources['user-accounts'].queryNames = { page: 'pageNo' };
    return registry;
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

**3. 直接传 `registry`** —— 跳过文档加载，资源表手写或由宿主工具生成，池即刻可用：

```ts
useResources({
  server,
  registry: {
    resources: {
      users: {
        name: 'users',
        list: { method: 'GET', path: '/users' },
        create: { method: 'POST', path: '/users' },
        remove: { method: 'DELETE', path: '/users/{id}' },
        schema: { type: 'object', properties: {} },
      },
    },
  },
});
```

### 传输适配器

适配器接口见上方[类型契约](#类型契约)的 [`RequestAdapter`](/types/model/resources#requestadapter)。

#### createFetchAdapter

内置适配器工厂，`useResources` 不传 `request` 时内部以 `createFetchAdapter()` 取得实例，也可显式调用后再做包装：

```ts
function createFetchAdapter(): RequestAdapter;
```

行为约定：

- GET 以 `query` 拼装 URL（值为 `undefined` 的参数整体省略）；写操作以 JSON 提交 `body`，字符串请求体直传（如表单编码），其余经 `JSON.stringify`
- 透传 `ResourceRequest.signal`：该 signal 由 `list` 资源对象内部的 `AbortController` 创建，二次 `execute` 或 `abort()` 时作废在途请求
- 响应体先读文本再尝试 JSON 解析：空体为 `undefined`，非法 JSON 回落为原始文本
- 非 2xx 状态拒绝为 [`ResourceHttpError`](#resourcehttperror)

需要携带鉴权、改用宿主请求实现时整体替换：

```ts
useResources({
  server,
  doc: '/v3/api-docs',
  request: (request) => hostRequest(request), // 宿主已有请求实现
});
```

#### ResourceHttpError {#resourcehttperror}

内置适配器的失败错误类型，携带状态码与解析后的响应体，宿主可按状态码分支处理：

```ts
class ResourceHttpError extends Error {
  readonly status: number;
  readonly body: unknown;
}
```

`message` 形如 `GET /users 请求失败（500）`；`body` 为解析后的响应体（对象、文本或 `undefined`）。从主包 `@mrchar/cumquat` 导入后可用 `instanceof ResourceHttpError` 识别资源池请求失败与普通异常。

## 状态与错误

- **元数据加载失败** → `pool.state` 进入 error（带 retry），页面可将依赖资源的区域交给状态视图统一渲染
- **`list` 请求失败** → 资源对象进入 error 状态（`execute` 不 reject），绑到 `:fetch` 时组件渲染错误态并提供重试入口
- **`detail` / action 请求失败** → 方法拒绝：绑到 `:action` 时自动回退旧值并抛出 `actionError`
- 请求防抖由组件侧的 `useFetchResource` 编排；竞态取消由资源对象内部实现（池内 `list` 自带私有 `AbortController`，宿主工厂自行实现）；池不做二次封装，保证两层职责边界清晰

## 非目标

- **不做自动布局**：字段元数据描述名称、类型、选项与场景，但页面结构、列宽、表单布局仍由宿主决定；元数据导出的是「可装配的零件」，不是生成的页面
- **不内置鉴权流程**：token 注入经 `headers` 或 `request` 适配器
- **不做请求缓存、轮询、乐观更新**：分别属于 useFetchResource、Subscribe 与组件 action 机制的职责
