/**
 * 视图、组件与资源投影契约。
 *
 * schema 到 label / component / validation 的投影，以及资源客户端
 * 向组件暴露的投影形态。纯数据定义见 `schema.ts`，校验契约见 `validation.ts`。
 */

import type { ActionResult } from './action';
import type { FetchHandler } from './fetch';
import type { Kind, Model, Schema } from './schema';
import type { Status } from './status';
import type { Validation } from './validation';

/* ------------------------------------------------------------------ */
/* 视图层：label / component / validation                              */
/* ------------------------------------------------------------------ */

/** 字段出现场景标记 */
export interface Scope {
  list?: boolean;
  filter?: boolean;
  create?: boolean;
  update?: boolean;
}

/** 视图提示：不参与数据语义 */
export interface Hint {
  /** 出现场景：columns / filters / properties 的投影依据 */
  scope?: Scope;
  /** 强制指定控件，优先于类型推断 */
  control?: string;
  placeholder?: string;
  /** 控件竞选加权 */
  bias?: Record<string, number>;
  /** 与 enum 下标对齐的展示标签 */
  enumLabels?: string[];
}

/** 枚举选项：视图层消费 */
export interface Option {
  label: string;
  value: string | number | boolean | null;
}

/** 字段视图：schema 在视图层的一次投影 */
export interface View {
  name: string;
  /** 标签：title 回落字段名 */
  label: string;
  description?: string;
  /** 帮助提示：description 与 example 合成 */
  help?: string;
  /** 控件标识：input / select / number / date / date-time / switch… */
  component: string;
  /** 控件附加属性：options、placeholder 等 */
  props?: Record<string, unknown>;
  /** 校验视图 */
  validation: Validation;
}

/** 单字段投影上下文 */
export interface Context {
  name: string;
  required: boolean;
  schema: Schema;
  /** 当前字段的视图提示 */
  hint?: Hint;
}

/**
 * schema → 视图 的转换器契约。
 * 默认实现由 composables 提供（`createView` / `defaultView`），用户可替换。
 */
export interface Converter {
  toField(name: string, field: Schema, context: Context): View;
  toFields(schema: Schema, hints?: Record<string, Hint>): View[];
}

/* ------------------------------------------------------------------ */
/* 资源与注册表                                                        */
/* ------------------------------------------------------------------ */

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
  page?: string;
  /** 每页大小参数名，默认 size */
  size?: string;
  /** 排序参数名：值序列化为 key,order，无排序时不注入，默认 sorter */
  sorter?: string;
  /** 筛选参数名：设置时将 filters 对象整体 JSON 序列化为该参数；未设置时逐键展开为独立参数，数组值以逗号连接 */
  filters?: string;
}

/** 列表响应形状：数组、页码、页大小与总数在响应体中的点分路径；缺省时响应体即数组 */
export interface ListResponseMapping {
  list?: string;
  page?: string;
  size?: string;
  total?: string;
}

/** 资源：命名的数据模型 + 操作；未声明的操作不可用 */
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

/** 资源表：元数据解析的唯一产物，也是池运行的唯一依据 */
export interface Registry {
  resources: Record<string, Resource>;
}

/** 元数据解析器：输入任意协议文档，输出资源表 */
export type MetadataParser = (
  doc: unknown,
  context: { server: string },
) => Registry | Promise<Registry>;

/** 请求描述：池生成、适配器消费 */
export interface ResourceRequest {
  method: ResourceMethod;
  url: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** 竞态取消：由资源池内部的 FetchResult 实现创建并透传给适配器 */
  signal?: AbortSignal;
}

/** 传输适配器：发起请求并 resolve 响应体（未提供时使用内置 fetch 实现） */
export type RequestAdapter = (request: ResourceRequest) => Promise<unknown>;

/* ------------------------------------------------------------------ */
/* 资源投影与资源池                                                    */
/* ------------------------------------------------------------------ */

/**
 * 列表列投影：schema 在列表视角的展开形态，与 Table 的 columns 属性对齐。
 * 列本身就是视图视角的 schema——类型、格式与枚举在这里已展开为组件可直接消费的元数据。
 */
export interface ResourceColumn {
  key: string;
  title: string;
  help?: string;
  /** 类型提示：由字段 schema 投影，供组件竞选 */
  type?: Kind;
  /** 内容格式提示：由字段 schema 投影，供组件竞选 */
  format?: string;
  /** 枚举映射：由 schema.enum 与 hint.enumLabels 投影；值可为 string / number / boolean / null */
  enum?: Option[];
  sortable?: boolean;
}

/** useResources 选项 */
export interface UseResourcesOptions {
  /** 服务器根地址：请求 URL = server + 操作路径 */
  server: string;
  /** 元数据文档地址：相对 server 或绝对 URL */
  doc?: string;
  /** 元数据解析器，默认 OpenAPI（Swagger）解析 */
  parse?: MetadataParser;
  /** 直接提供资源表：跳过文档加载与解析，协议完全自定义时的出口 */
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

/** 资源客户端：请求方法与组件协议同形，字段按视图投影 */
export interface ResourceClient<D = unknown> {
  readonly name: string;
  /** 列表：FetchHandler 工厂，直接绑定 Table / Select / VirtualList 的 :fetch */
  list: FetchHandler<D>;
  /** 详情：FetchHandler 单值形态 */
  detail(id: string | number): Promise<D>;
  /** 创建：ActionHandler 形态，直接绑定 Form 的 :action */
  create(payload: unknown): Promise<ActionResult | void>;
  /** 更新：ActionHandler 形态 */
  update(id: string | number, payload: unknown): Promise<ActionResult | void>;
  /** 删除：ActionHandler 形态，直接绑定 Popconfirm / Button 的 :action */
  remove(id: string | number): Promise<ActionResult | void>;
  /** 完整字段视图 */
  readonly fields: View[];
  /** 列表列投影（scope.list），直接绑定 Table 的 :columns */
  readonly columns: ResourceColumn[];
  /** 筛选字段投影（scope.filter） */
  readonly filters: View[];
  /** 表单字段投影（scope.create / scope.update） */
  readonly properties: View[];
  /** 完整数据模型：schema 定义，可直接交给 createValidator / Form 的 schema */
  readonly schema: Schema;
}

/** 资源池：按名称取客户端，元数据加载状态可直接交给状态视图渲染 */
export interface ResourcePool {
  /** 元数据加载状态：idle / pending / success / error（带 retry） */
  readonly state: {
    status: Status;
    data?: Registry;
    error?: unknown;
    retry?: () => void;
  };
  /** 取资源客户端；资源不存在时抛出错误，让拼写问题在开发期即暴露 */
  client<D = unknown>(name: string): ResourceClient<D>;
  /** 资源是否存在（池就绪前恒为 false） */
  has(name: string): boolean;
  /** 全部资源名（池就绪前为空数组） */
  readonly names: string[];
}
