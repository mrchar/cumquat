/**
 * 默认 schema → 视图 转换器。
 *
 * core 只定义 `Converter` 契约，这里提供基于类型定义与约束定义的默认实现：
 * - label：title 回落字段名；
 * - component：按 enum / type / format 推断控件；
 * - validation：required 由对象级 required 派生；schema 约束留在字段上，
 *   validation 只表达视图层的校验状态。
 */

import type { Context, Converter, Hint, Option, ResourceColumn, Schema, View } from '@cumquat/core';

export interface CreateViewOptions {
  /** 自定义控件推断：返回 undefined 时回落内置推断 */
  component?: (name: string, field: Schema) => string | undefined;
  /** 自定义标签：缺省 title 回落字段名 */
  label?: (name: string, field: Schema) => string | undefined;
}

function textOf(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/** description 与 example 合成帮助提示 */
export function helpOf(field: Schema): string | undefined {
  const parts: string[] = [];
  if (field.description) parts.push(field.description);
  if (field.example !== undefined) parts.push(`示例：${textOf(field.example)}`);
  return parts.length > 0 ? parts.join('；') : undefined;
}

/** enum + hint.enumLabels 生成选项 */
export function optionsOf(field: Schema, hint?: Hint): Option[] | undefined {
  if (!field.enum || field.enum.length === 0) return undefined;
  return field.enum.map((value, index) => ({
    label: hint?.enumLabels?.[index] ?? textOf(value),
    value,
  }));
}

/** 内置控件推断 */
export function componentOf(field: Schema, hint?: Hint): string {
  if (hint?.control) return hint.control;
  if (field.enum && field.enum.length > 0) return 'select';
  switch (field.type) {
    case 'boolean':
      return 'switch';
    case 'integer':
    case 'number':
      return 'number';
    case 'string':
      return field.format === 'date' ? 'date' : 'input';
    default:
      return 'input';
  }
}

export interface SchemaColumnOptions {
  /** 字段视图提示：label / 枚举文案 / 列表范围 */
  hints?: Record<string, Hint>;
  /** 仅投影列表视角的字段（hint.scope.list === true），资源池默认开启 */
  listOnly?: boolean;
}

/**
 * schema → 列投影：把字段的类型、格式与枚举展开为列元数据，组件无需再持有 schema。
 * 列即视图视角的 schema；调用方也可在投影结果上覆盖 title / filters / sortable 等。
 */
export function schemaToColumns(
  schema: Schema,
  options: SchemaColumnOptions = {},
): ResourceColumn[] {
  const columns: ResourceColumn[] = [];
  for (const [key, field] of Object.entries(schema.properties ?? {})) {
    const hint = options.hints?.[key];
    if (options.listOnly && hint?.scope?.list !== true) continue;

    const column: ResourceColumn = { key, title: field.title ?? key };
    if (field.type) column.type = field.type;
    if (field.format) column.format = field.format;

    const enumOptions = optionsOf(field, hint);
    if (enumOptions) column.enum = enumOptions;

    const help = helpOf(field);
    if (help) column.help = help;

    columns.push(column);
  }
  return columns;
}

/** 结构型字段默认不进入表单/列投影 */
function isStructural(field: Schema, hint?: Hint): boolean {
  return (field.type === 'array' || field.type === 'object') && !hint?.control;
}

export function createView(options: CreateViewOptions = {}): Converter {
  const toField = (name: string, field: Schema, context: Context): View => {
    const view: View = {
      name,
      label: options.label?.(name, field) ?? field.title ?? name,
      component: options.component?.(name, field) ?? componentOf(field, context.hint),
      validation: { required: context.required },
    };

    if (field.description) view.description = field.description;
    const help = helpOf(field);
    if (help) view.help = help;
    if (field.nullable) view.validation.nullable = true;

    const props: Record<string, unknown> = {};
    const opts = optionsOf(field, context.hint);
    if (opts) props.options = opts;
    if (context.hint?.placeholder) props.placeholder = context.hint.placeholder;
    if (field.format) props.format = field.format;
    if (context.hint?.bias) props.bias = context.hint.bias;
    if (Object.keys(props).length > 0) view.props = props;

    return view;
  };

  return {
    toField(name, field, context) {
      return toField(name, field, context);
    },
    toFields(schema, hints) {
      const required = new Set(schema.required ?? []);
      return Object.entries(schema.properties ?? {})
        .filter(([name, field]) => !isStructural(field, hints?.[name]))
        .map(([name, field]) =>
          toField(name, field, { required: required.has(name), schema, hint: hints?.[name] }),
        );
    },
  };
}

/** 默认转换器：项目内直接使用，可整体替换 */
export const defaultView: Converter = createView();
