---
title: 类型参考 · 资源池
---

# 资源池类型

资源池是“协议归一”的落点：把 OpenAPI、Swagger 或自定义文档变成同一张资源表 `Registry`，再投影成组件可直接绑定的方法和元数据。

状态自持和竞选机制都要求定义是统一的，但后端协议并不统一。`useResources` 负责在两者之间做一次收敛：

```ts
const pool = useResources({
  server: 'https://api.example.com',
  doc: '/v3/api-docs', // 默认 OpenAPI / Swagger 解析
});

const users = pool.client('users');
```

一个资源客户端同时导出行为与形态：

```ts
users.list;       // FetchHandler 资源工厂：Table / Select / VirtualList 的 :fetch
users.create;     // ActionHandler：Form 的 :action
users.columns;    // 列表列投影：Table 的 :columns
users.properties; // 表单字段投影：Form 的 :properties
users.schema;     // 数据定义：createValidator / Form 的 schema
```

```vue
<Table :columns="users.columns" :fetch="users.list" />
<Form :properties="users.properties" :action="users.create" />
```

这就是“元数据导出”：**一份资源定义，同时导出请求方法和视图元数据。** 组件消费请求方法时自持状态，消费视图元数据时通过竞选机制推导展示与录入。页面不写字段列表，也不写加载与提交流程。

完整契约见[资源池 useResources](/composables/resources)；此处收录解析器、资源表与客户端相关类型。数据定义（`Schema` / `Model`）见[数据模型与表单](/types/model/form#schema)，视图投影（`View` / `Hint`）见[视图投影与竞选](/types/model/rendering)。

## 操作与映射

### ResourceMethod {#resourcemethod}

```ts
export type ResourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
```

### ResourceOperation {#resourceoperation}

```ts
export interface ResourceOperation {
  method: ResourceMethod;
  /** 路径模板：{id} 占位在运行时以方法参数替换 */
  path: string;
}
```

### QueryNames {#querynames}

统一查询片段 → 请求参数名的映射，未声明的字段回落默认名。

```ts
export interface QueryNames {
  /** 关键词参数名，默认 keyword */
  keyword?: string;
  /** 页码参数名（页码从 1 起），默认 page */
  page?: string;
  /** 每页大小参数名，默认 size */
  size?: string;
  /** 排序参数名：值序列化为 key,order，无排序时不注入，默认 sorter */
  sorter?: string;
  /** 筛选参数名：设置时将 filters 对象整体 JSON 序列化；未设置时逐键展开为独立参数 */
  filters?: string;
}
```

### ListResponseMapping {#listresponsemapping}

列表响应形状：数组与总数在响应体中的点分路径；缺省时响应体即数组。

```ts
export interface ListResponseMapping {
  /** 列表数组在响应体中的路径，如 'records' 或 'data.list'；缺省为响应体本身 */
  list?: string;
  /** 总数在响应体中的路径，如 'total' 或 'meta.total'；缺省则不启用分页 */
  total?: string;
}
```

## 字段与列投影

字段的三层定义（属性 / 类型 / 约束）见[数据模型与表单](/types/model/form#schema)。解析器只产出 schema，视图投影交给转换器。

### Option {#option}

```ts
export interface Option {
  label: string;
  value: string | number | boolean | null;
}
```

### ResourceColumn {#resourcecolumn}

列表列投影：schema 在列表视角的展开形态，与 Table 的 columns 属性对齐。列就是视图视角的 schema，类型、格式与枚举已展开为组件可直接消费的元数据。

```ts
export interface ResourceColumn {
  key: string;
  title: string;
  /** 帮助提示：字段 description 与 example 合成 */
  help?: string;
  /** 类型提示：由字段 schema 投影，供组件竞选 */
  type?: Kind;
  /** 内容格式提示：由字段 schema 投影，供组件竞选 */
  format?: string;
  /** 枚举映射：由 schema.enum 与 hint.enumLabels 投影 */
  enum?: Option[];
  sortable?: boolean;
}
```

## 资源表

### Resource {#resource}

schema 中的资源条目：`Model` + 操作；未声明的操作不可用（只读资源仅声明 list / detail 即可）。

```ts
export interface Resource extends Model {
  list?: ResourceOperation;
  detail?: ResourceOperation;
  create?: ResourceOperation;
  update?: ResourceOperation;
  remove?: ResourceOperation;
  queryNames?: QueryNames;
  /** 列表响应形状，由解析器从文档响应结构中识别 */
  response?: ListResponseMapping;
  /** 字段视图提示：按字段名索引，与纯数据 schema 分离 */
  hints?: Record<string, Hint>;
}
```

### Registry {#registry}

资源表：元数据解析的唯一产物，也是池运行的唯一依据。

```ts
export interface Registry {
  resources: Record<string, Resource>;
}
```

### MetadataParser {#metadataparser}

元数据解析器：输入任意协议文档，输出资源表（默认提供 OpenAPI 3 / Swagger 2.0 解析器）。

```ts
export type MetadataParser = (
  doc: unknown,
  context: { server: string },
) => Registry | Promise<Registry>;
```

## 请求

### ResourceRequest {#resourcerequest}

请求描述：池生成、适配器消费。

```ts
export interface ResourceRequest {
  method: ResourceMethod;
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 竞态取消：资源池内部创建 AbortController 后透传（FetchQuery 不含 signal） */
  signal?: AbortSignal;
}
```

### RequestAdapter {#requestadapter}

传输适配器：发起请求并 resolve 响应体（未提供时使用内置 fetch 实现）。

```ts
export type RequestAdapter = (request: ResourceRequest) => Promise<unknown>;
```

## 客户端与池

### UseResourcesOptions {#useresourcesoptions}

```ts
export interface UseResourcesOptions {
  /** 服务器根地址：请求 URL = server + 操作路径 */
  server: string;
  /** 元数据文档地址：相对 server 或绝对 URL */
  doc?: string;
  /** 元数据解析器，默认 OpenAPI（Swagger）解析 */
  parse?: MetadataParser;
  /** 直接提供资源表：跳过文档加载与解析 */
  registry?: Registry | (() => Registry | Promise<Registry>);
  /** 传输适配器，默认基于 fetch */
  request?: RequestAdapter;
  /** 附加请求头：鉴权 token 等随每次请求注入 */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** schema → 视图的转换器，默认使用内置实现 */
  view?: Converter;
  /** 解析后的微调：改名、合并资源、调整参数映射与字段标记 */
  refine?: (registry: Registry) => Registry | Promise<Registry>;
}
```

### ResourceClient {#resourceclient}

资源客户端：请求方法与组件协议同形，字段元数据按组件属性形状投影。

```ts
export interface ResourceClient<D = unknown> {
  readonly name: string;
  /** 列表：FetchHandler 资源工厂，同步返回资源对象，查询经其 execute 驱动，直接绑定 Table / Select / VirtualList 的 :fetch */
  list(query?: FetchQuery): FetchResult<D>;
  /** 详情：FetchHandler 单值形态 */
  detail(id: string | number): Promise<D>;
  /** 创建：ActionHandler 形态，可直接作为 Form 的提交处理函数 */
  create(payload: unknown): Promise<ActionResult | void>;
  /** 更新：ActionHandler 形态 */
  update(id: string | number, payload: unknown): Promise<ActionResult | void>;
  /** 删除：ActionHandler 形态 */
  remove(id: string | number): Promise<ActionResult | void>;
  readonly fields: View[];
  readonly columns: ResourceColumn[];
  readonly filters: View[];
  readonly properties: View[];
  /** 资源的数据 schema：可直接交给 createValidator 或 Form 的 schema */
  readonly schema: Schema;
}
```

### ResourcePool {#resourcepool}

资源池：按名称取客户端，元数据加载状态可直接交给状态视图渲染。

```ts
export interface ResourcePool {
  /** 元数据加载状态：idle / pending / success / error（带 retry） */
  readonly state: {
    status: Status;
    data?: Registry;
    error?: unknown;
    retry?: () => void;
  };
  client<D = unknown>(name: string): ResourceClient<D>;
  has(name: string): boolean;
  readonly names: string[];
}
```
