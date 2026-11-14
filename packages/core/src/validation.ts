/**
 * 校验契约：规则实现、文案与校验结果。
 *
 * 数据定义见 `schema.ts`，视图投影见 `component.ts`。
 * schema 的 `Constraint` 是声明式约束，`Rule` 只承载这些约束之外的
 * 自定义校验实现；两者不互相复制。
 */

/* ------------------------------------------------------------------ */
/* 规则与文案                                                          */
/* ------------------------------------------------------------------ */

/** 规则类型：用于定位失败项与选择默认文案 */
export type RuleKind =
  | 'required'
  | 'type'
  | 'enum'
  | 'minimum'
  | 'maximum'
  | 'exclusiveMinimum'
  | 'exclusiveMaximum'
  | 'multipleOf'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'format'
  | 'minItems'
  | 'maxItems'
  | 'uniqueItems'
  | 'validate'
  | 'check';

/** 文案上下文：模板占位与函数文案的入参 */
export interface MessageContext {
  field: string;
  label: string;
  value?: unknown;
  rule: RuleKind;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  multipleOf?: number;
  pattern?: string;
}

export type MessageTemplate = string | ((ctx: MessageContext) => string);

/** 规则类型 → 文案模板；未声明的类型使用内置默认文案 */
export type MessageTemplates = Partial<Record<RuleKind, MessageTemplate>>;

/**
 * 自定义校验实现。
 *
 * 内置约束（type / format / minimum / minLength…）由 schema 字段直接携带，
 * 不复制进 Rule；Rule 只描述 schema 无法表达的校验逻辑与字段级文案。
 */
export interface Rule {
  /** 自定义校验：返回 true 通过，字符串作为错误信息，false 使用配置文案 */
  validate?: (
    value: unknown,
    values: Record<string, unknown>,
  ) => boolean | string | Promise<boolean | string>;
  /** 字段级文案覆盖，优先于模型与全局模板 */
  message?: MessageTemplate;
}

/** 跨字段 / 整表规则：错误默认挂到 fields[0] */
export interface CheckRule {
  /** 参与校验的字段，用于文档与错误定位 */
  fields: string[];
  /** 错误挂载字段，缺省取 fields[0] */
  target?: string;
  validate: (values: Record<string, unknown>) => boolean | string | Promise<boolean | string>;
  message?: MessageTemplate;
}

/** 校验配置：独立于纯数据 schema，由宿主传入校验器 */
export interface Rules {
  fields?: Record<string, Rule>;
  checks?: CheckRule[];
  /** 模型级文案覆盖，优先于校验器全局文案 */
  messages?: MessageTemplates;
}

/* ------------------------------------------------------------------ */
/* 校验视图与结果                                                      */
/* ------------------------------------------------------------------ */

/**
 * 校验视图：schema 约束由字段自身携带，这里只表达视图层的校验状态
 * 与宿主追加的自定义实现。
 */
export interface Validation {
  /** 由 Schema.required 派生 */
  required: boolean;
  /** 允许 null：由字段 nullable 派生 */
  nullable?: boolean;
  /** 宿主自定义校验实现；schema 约束不进入这里 */
  rules?: Rule[];
  messages?: MessageTemplates;
}

/** 校验结果：errors 仅包含失败字段 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}
