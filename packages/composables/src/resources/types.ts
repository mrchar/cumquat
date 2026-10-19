import type { AsyncStateLike, ActionResult } from '../types';
import type { FetchQuery, FetchResult } from '../data/fetch';

/**
 * 资源池契约：解析器与池之间的唯一边界。
 * 自定义解析器只负责把协议与约定翻译成 ResourceSchema，
 * URL 拼装、路径参数替换、查询片段注入、请求体序列化等运行时行为全部由池完成。
 */

/** 资源操作支持的 HTTP 方法 */
export type ResourceMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** 资源操作：方法 + 路径模板 */
export interface ResourceOperation {
  method: ResourceMethod;
  /** 路径模板：{id} 占位在运行时以方法参数替换 */
  path: string;
}

/** 统一查询片段 → 请求参数名的映射，未声明的字段回落默认名 */
export interface QueryNames {
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

/** 列表响应形状：数组与总数在响应体中的点分路径；缺省时响应体即数组 */
export interface ListResponseMapping {
  /** 列表数组在响应体中的路径，如 'records' 或 'data.list'；缺省为响应体本身 */
  list?: string;
  /** 总数在响应体中的路径，如 'total' 或 'meta.total'；缺省则不启用分页 */
  total?: string;
}

/** 字段值类型：决定筛选与表单的控件选择 */
export type ResourceFieldType = 'string' | 'number' | 'boolean' | 'date' | 'datetime' | 'enum';

/** 枚举选项 */
export interface ResourceFieldOption {
  label: string;
  value: string | number;
}

/** 字段元数据：视图中性的字段描述，columns / filters / properties 均按 scope 投影 */
export interface ResourceField {
  /** 字段名：数据对象键 */
  name: string;
  /** 展示名，解析自文档描述，缺失回落字段名 */
  label: string;
  type: ResourceFieldType;
  /** 内容格式：原样透传文档声明的 format（如 email / uri / int64），与 type 的保存格式互补 */
  format?: string;
  /** 枚举选项：type 为 enum 时提供，可直接喂给选项组件 */
  options?: ResourceFieldOption[];
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

/** 列表列投影：与 Table 的 columns 属性形状对齐 */
export interface ResourceColumn {
  key: string;
  title: string;
  /** 保存格式提示：字段 type 原样投影，供 Table 单元格竞选消费 */
  type?: ResourceFieldType;
  /** 内容格式提示：字段 format 原样透传（如 email / uri / int64） */
  format?: string;
  sortable?: boolean;
  /** 枚举字段的筛选项（表头勾选面板） */
  filters?: ResourceFieldOption[];
}

/** 单个资源的操作集合与元数据：未声明的操作不可用（只读资源仅声明 list / detail 即可） */
export interface ResourceDefinition {
  list?: ResourceOperation;
  detail?: ResourceOperation;
  create?: ResourceOperation;
  update?: ResourceOperation;
  remove?: ResourceOperation;
  queryNames?: QueryNames;
  /** 列表响应形状，由解析器从文档响应结构中识别 */
  response?: ListResponseMapping;
  /** 字段元数据：columns / filters / properties 的唯一来源，文档缺失时为空数组 */
  fields?: ResourceField[];
}

/** 资源表：元数据解析的唯一产物，也是池运行的唯一依据 */
export interface ResourceSchema {
  resources: Record<string, ResourceDefinition>;
}

/** 元数据解析器：输入任意协议文档，输出资源表 */
export type MetadataParser = (
  doc: unknown,
  context: { server: string },
) => ResourceSchema | Promise<ResourceSchema>;

/** 请求描述：池生成、适配器消费 */
export interface ResourceRequest {
  method: ResourceMethod;
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 竞态取消：由消费侧的 FetchQuery 透传 */
  signal?: AbortSignal;
}

/** 传输适配器：发起请求并 resolve 响应体（未提供时使用内置 fetch 实现） */
export type RequestAdapter = (request: ResourceRequest) => Promise<unknown>;

/** useResources 选项 */
export interface UseResourcesOptions {
  /** 服务器根地址：请求 URL = server + 操作路径 */
  server: string;
  /** 元数据文档地址：相对 server 或绝对 URL */
  doc?: string;
  /** 元数据解析器，默认 OpenAPI（Swagger）解析 */
  parse?: MetadataParser;
  /** 直接提供资源表：跳过文档加载与解析，协议完全自定义时的出口 */
  schema?: ResourceSchema | (() => ResourceSchema | Promise<ResourceSchema>);
  /** 传输适配器，默认基于 fetch */
  request?: RequestAdapter;
  /** 附加请求头：鉴权 token 等随每次请求注入 */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** 解析后的微调：改名、合并资源、调整参数映射与字段标记 */
  refine?: (schema: ResourceSchema) => ResourceSchema | Promise<ResourceSchema>;
}

/** 资源客户端：请求方法与组件协议同形，字段元数据按组件属性形状投影 */
export interface ResourceClient<D = unknown> {
  readonly name: string;
  /** 列表：Fetch 形态，直接绑定 Table / Select / VirtualList 的 :fetch */
  list(query?: FetchQuery): Promise<FetchResult<D>>;
  /** 详情：Fetch 单值形态 */
  detail(id: string | number): Promise<D>;
  /** 创建：ActionLike 形态，直接绑定 Form 的 :action */
  create(payload: unknown): Promise<ActionResult | void>;
  /** 更新：ActionLike 形态 */
  update(id: string | number, payload: unknown): Promise<ActionResult | void>;
  /** 删除：ActionLike 形态，直接绑定 Popconfirm / Button 的 :action */
  remove(id: string | number): Promise<ActionResult | void>;
  /** 完整字段元数据原始列表 */
  readonly fields: ResourceField[];
  /** 列表列投影（scope.list），直接绑定 Table 的 :columns */
  readonly columns: ResourceColumn[];
  /** 筛选字段投影（scope.filter） */
  readonly filters: ResourceField[];
  /** 表单字段投影（scope.create / scope.update，保留场景标记） */
  readonly properties: ResourceField[];
}

/** 资源池：按名称取客户端，元数据加载状态可直接交给状态视图渲染 */
export interface ResourcePool {
  /** 元数据加载状态：pending / success / error（带 retry） */
  readonly state: AsyncStateLike<ResourceSchema>;
  /** 取资源客户端；资源不存在时抛出错误，让拼写问题在开发期即暴露 */
  client<D = unknown>(name: string): ResourceClient<D>;
  /** 资源是否存在（池就绪前恒为 false） */
  has(name: string): boolean;
  /** 全部资源名（池就绪前为空数组） */
  readonly names: string[];
}
