import { runRules } from './form-types';
import type { FormRule, FormRules } from './form-types';
import { DEFAULT_VALIDATION_MESSAGES } from './validation-types';
import { defaultView } from '../resources/schema-view';
import type {
  CheckRule,
  Converter,
  Kind,
  MessageContext,
  MessageTemplate,
  MessageTemplates,
  Rule,
  RuleKind,
  Rules,
  Schema,
  ValidationResult,
  View,
} from '@cumquat/core';

/** 校验器：rules 可直接交给 Form / useForm，validate 用于脱离表单独立校验 */
export interface Validator<T extends Record<string, unknown> = Record<string, unknown>> {
  /** 按字段编译后的规则表 */
  readonly rules: FormRules<T>;
  /** 校验整份数据，返回仅包含失败字段的结果 */
  validate(values: T): Promise<ValidationResult>;
  /** 校验单个字段，通过返回 true */
  validateField(name: string, values: T): Promise<string | true>;
}

export interface CreateValidatorOptions {
  /** 自定义校验实现与跨字段检查；与纯数据 schema 分离 */
  rules?: Rules;
  /** 全局文案覆盖，优先级低于规则自身的 message */
  messages?: MessageTemplates;
  /** schema → 视图的转换器，默认使用内置实现 */
  view?: Converter;
}

/** 没有字段可挂载的检查项统一落到该保留键 */
const CHECK_FALLBACK = '$checks';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IPV4_PATTERN =
  /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  return Array.isArray(value) && value.length === 0;
}

function isDateString(value: string): boolean {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(value));
}

/** 类型判定：date / date-time 格式允许表单控件输出的时间戳 */
function matchesType(value: unknown, type: Kind, format?: string): boolean {
  switch (type) {
    case 'string':
      if (typeof value === 'string') return true;
      return typeof value === 'number' && (format === 'date' || format === 'date-time');
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'null':
      return value === null;
    default:
      return true;
  }
}

function matchesFormat(value: string, format: string): boolean {
  switch (format) {
    case 'email':
      return EMAIL_PATTERN.test(value);
    case 'uri':
    case 'url':
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      return UUID_PATTERN.test(value);
    case 'ipv4':
      return IPV4_PATTERN.test(value);
    case 'date':
      return isDateString(value);
    default:
      // 未知格式不误判：OpenAPI 允许自定义 format
      return true;
  }
}

function compilePattern(pattern: string | RegExp | undefined): RegExp | undefined {
  if (pattern === undefined) return undefined;
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.replace(/[gy]/g, '');
    return new RegExp(pattern.source, flags);
  }
  return new RegExp(pattern);
}

function isMultipleOf(value: number, multipleOf: number): boolean {
  if (!Number.isFinite(multipleOf) || multipleOf === 0) return true;
  const quotient = value / multipleOf;
  return Math.abs(quotient - Math.round(quotient)) < 1e-9;
}

function hasDuplicates(value: unknown[]): boolean {
  return new Set(value.map((item) => JSON.stringify(item))).size !== value.length;
}

/** 文案解析：规则 message > 视图 messages > options.messages > 内置默认 */
function formatMessage(
  template: MessageTemplate | undefined,
  context: MessageContext,
  fallback: MessageTemplate | undefined,
): string {
  const source = template ?? fallback ?? DEFAULT_VALIDATION_MESSAGES[context.rule];
  if (typeof source === 'function') return source(context);
  return source.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = (context as unknown as Record<string, unknown>)[key];
    return value === undefined ? match : String(value);
  });
}

/** 内置约束校验：读取 schema 字段上的类型与约束声明 */
async function checkField(
  value: unknown,
  field: Schema,
  pattern: RegExp | undefined,
  fail: (kind: RuleKind, extra?: Partial<MessageContext>) => string,
): Promise<string | true> {
  if (field.type && !matchesType(value, field.type, field.format)) {
    return fail('type');
  }

  if (field.const !== undefined && !Object.is(field.const, value)) return fail('enum');

  if (field.enum && field.enum.length > 0) {
    if (!field.enum.some((item) => Object.is(item, value))) return fail('enum');
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (field.minimum !== undefined && value < field.minimum) {
      return fail('minimum', { minimum: field.minimum });
    }
    if (field.maximum !== undefined && value > field.maximum) {
      return fail('maximum', { maximum: field.maximum });
    }
    if (field.exclusiveMinimum !== undefined && value <= field.exclusiveMinimum) {
      return fail('exclusiveMinimum', { exclusiveMinimum: field.exclusiveMinimum });
    }
    if (field.exclusiveMaximum !== undefined && value >= field.exclusiveMaximum) {
      return fail('exclusiveMaximum', { exclusiveMaximum: field.exclusiveMaximum });
    }
    if (field.multipleOf !== undefined && !isMultipleOf(value, field.multipleOf)) {
      return fail('multipleOf', { multipleOf: field.multipleOf });
    }
  }

  if (typeof value === 'string') {
    const length = [...value].length;
    if (field.minLength !== undefined && length < field.minLength) {
      return fail('minLength', { minLength: field.minLength });
    }
    if (field.maxLength !== undefined && length > field.maxLength) {
      return fail('maxLength', { maxLength: field.maxLength });
    }
    if (pattern && !pattern.test(value)) {
      return fail('pattern', { pattern: pattern.source });
    }
    if (field.format && !matchesFormat(value, field.format)) return fail('format');
  }

  if (Array.isArray(value)) {
    if (field.minItems !== undefined && value.length < field.minItems) {
      return fail('minItems', { minItems: field.minItems });
    }
    if (field.maxItems !== undefined && value.length > field.maxItems) {
      return fail('maxItems', { maxItems: field.maxItems });
    }
    if (field.uniqueItems && hasDuplicates(value)) return fail('uniqueItems');
  }

  return true;
}

/** 自定义校验实现：Rule 只承载 schema 约束之外的逻辑 */
async function checkCustomRules(
  value: unknown,
  values: Record<string, unknown>,
  rules: Rule[],
  fail: (kind: RuleKind, extra?: Partial<MessageContext>, template?: MessageTemplate) => string,
): Promise<string | true> {
  for (const rule of rules) {
    if (!rule.validate) continue;
    const result = await rule.validate(value, values);
    if (result === true) continue;
    if (typeof result === 'string') return result;
    return fail('validate', {}, rule.message);
  }
  return true;
}

/** 字段视图 → 表单规则：必填与空值语义在规则之前处理 */
function compileView(
  view: View,
  field: Schema,
  custom: Rule | undefined,
  messageOfKind: (kind: RuleKind) => MessageTemplate | undefined,
): FormRule {
  const { required, nullable, rules = [], messages } = view.validation;
  // 正则在此一次性编译：非法 pattern 在创建期抛错，而不是等到录入时
  const pattern = compilePattern(field.pattern);
  // 自定义校验 = 视图自带（宿主直接构造 View 时）+ 校验器选项追加
  const customRules = custom ? [...rules, custom] : rules;
  const fieldMessage = customRules.find((rule) => rule.message)?.message;

  return async (value, values) => {
    const label = view.label || view.name;
    const fail = (
      kind: RuleKind,
      extra: Partial<MessageContext> = {},
      template: MessageTemplate | undefined = fieldMessage,
    ): string =>
      formatMessage(
        template ?? messages?.[kind],
        { field: view.name, label, value, rule: kind, ...extra },
        messageOfKind(kind),
      );

    if (required && isEmpty(value)) return fail('required');
    // nullable 仅放行 null；必填语义已在上一步处理
    if (value === null && nullable) return true;
    // 可选字段的空值不进入后续约束
    if (isEmpty(value)) return true;

    const constraintError = await checkField(value, field, pattern, fail);
    if (constraintError !== true) return constraintError;

    return checkCustomRules(value, values, customRules, fail);
  };
}

function compileCheck(
  check: CheckRule,
  messageOfKind: (kind: RuleKind) => MessageTemplate | undefined,
): FormRule {
  return async (_value, values) => {
    const result = await check.validate(values);
    if (result === true) return true;
    if (typeof result === 'string') return result;
    const target = check.target ?? check.fields[0] ?? '';
    return formatMessage(
      check.message,
      { field: target, label: target, rule: 'check' },
      messageOfKind('check'),
    );
  };
}

/**
 * 从数据模型创建校验器。
 *
 * schema 是纯数据定义：先经 `Converter` 投影为字段视图，再编译视图里的
 * label / component / validation，字段约束直接读取。自定义校验通过
 * `options.rules` 独立传入，不写进 schema。规则在创建时一次性编译为
 * FormRules，可直接交给 Form / useForm；validate / validateField 复用同一套规则。
 */
export function createValidator<T extends Record<string, unknown> = Record<string, unknown>>(
  schema: Schema,
  options: CreateValidatorOptions = {},
): Validator<T> {
  const converter: Converter = options.view ?? defaultView;
  const modelRules = options.rules;
  const messageOfKind = (kind: RuleKind): MessageTemplate | undefined =>
    modelRules?.messages?.[kind] ?? options.messages?.[kind];

  const compiled: Record<string, FormRule[]> = {};

  // 校验覆盖 schema 的全部属性：结构型字段（array / object）同样受约束，
  // 只有表单布局会按视图层的可渲染性做过滤。
  for (const [name, field] of Object.entries(schema.properties ?? {})) {
    const view = converter.toField(name, field, {
      name,
      required: schema.required?.includes(name) ?? false,
      schema,
    });
    compiled[name] = [compileView(view, field, modelRules?.fields?.[name], messageOfKind)];
  }

  for (const check of modelRules?.checks ?? []) {
    const anchor = check.target ?? check.fields[0] ?? CHECK_FALLBACK;
    (compiled[anchor] ??= []).push(compileCheck(check, messageOfKind));
  }

  const rules = compiled as FormRules<T>;

  return {
    rules,

    async validate(values: T): Promise<ValidationResult> {
      const entries = await Promise.all(
        Object.keys(compiled).map(
          async (name) =>
            [
              name,
              await runRules(
                (values as Record<string, unknown>)[name],
                values,
                compiled[name],
              ),
            ] as const,
        ),
      );
      const errors: Record<string, string> = {};
      for (const [name, error] of entries) {
        if (error !== undefined) errors[name] = error;
      }
      return { valid: Object.keys(errors).length === 0, errors };
    },

    async validateField(name: string, values: T): Promise<string | true> {
      const fieldRules = compiled[name];
      if (!fieldRules) return true;
      const error = await runRules(
        (values as Record<string, unknown>)[name],
        values,
        fieldRules,
      );
      return error === undefined ? true : error;
    },
  };
}
