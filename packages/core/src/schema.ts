/**
 * 纯数据 schema 契约。
 *
 * schema 是递归的 JSON Schema 节点，由三层内涵组成：
 * - 属性定义（Meta）：标识与元数据；
 * - 类型定义（Type）：JSON Schema 子集的类型与结构；
 * - 约束定义（Constraint）：对齐 JSON Schema 的校验约束。
 *
 * 视图提示见 `component.ts`，校验规则与结果见 `validation.ts`。
 */

/* ------------------------------------------------------------------ */
/* 三层 schema                                                         */
/* ------------------------------------------------------------------ */

/** 类型词汇：JSON Schema 子集 */
export type Kind = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object' | 'null';

/** 属性定义：标识与元数据 */
export interface Meta {
  /** 展示名，视图层 label 的首选来源 */
  title?: string;
  /** 说明文本，视图层 description / help 的来源 */
  description?: string;
  default?: unknown;
  example?: unknown;
  deprecated?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
}

/** 类型定义：结构、格式与枚举 */
export interface Type {
  type?: Kind;
  /** 内容格式：date / date-time / email / uri / int64… */
  format?: string;
  enum?: Array<string | number | boolean | null>;
  const?: unknown;
  /** OpenAPI 3.0 兼容：允许 null */
  nullable?: boolean;
  /** array 元素 */
  items?: Schema;
  /** 嵌套对象属性；属性值同样是 Schema */
  properties?: Record<string, Schema>;
  /** 嵌套对象必填字段名 */
  required?: string[];
  additionalProperties?: boolean | Schema;
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  not?: Schema;
}

/** 约束定义：命名对齐 JSON Schema */
export interface Constraint {
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
}

/** JSON Schema 节点：递归描述任意值，属性值、数组元素与组合分支都是 Schema */
export interface Schema extends Meta, Type, Constraint {}

/** 命名的数据模型：资源池与 Form 的共同输入 */
export interface Model {
  name: string;
  schema: Schema;
}
