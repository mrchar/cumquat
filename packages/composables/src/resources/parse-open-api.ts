import type {
  Hint,
  Kind,
  MetadataParser,
  QueryNames,
  Resource,
  ResourceMethod,
  Registry,
  Schema,
  Scope,
} from '@cumquat/core';

/**
 * OpenAPI（Swagger）默认解析器：同时支持 OpenAPI 3.x 与 Swagger 2.0。
 * 只读文档、不做服务器校验；资源名取 tag（回落路径首段），
 * 操作按「路径 + 方法」归类，字段定义自响应与请求体 schema 提取。
 *
 * 产物是三层 schema：属性定义（title / description / example…）、
 * 类型定义（type / format / enum / items / properties…）、约束定义（minimum / minLength…）。
 * 解析器只负责「文档 → schema」，视图层投影由 Converter 完成。
 */

type Dict = Record<string, unknown>;

/** 分页 / 关键词 / 排序参数的常见命名（识别统一查询片段，不作为筛选项） */
const PAGE_NAME = /^(page|pageno|pageindex|pagenum|current)$/i;
const PAGE_SIZE_NAME = /^(pagesize|size|limit|perpage|per_page)$/i;
const KEYWORD_NAME = /^(keyword|kw|q|search)$/i;
const SORTER_NAME = /^(sort|sorter|sortby|sort_by|order|orderby|order_by)$/i;
const TOTAL_NAME = /^(total|totalcount|totalelements|total_items|count)$/i;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

const KINDS: readonly Kind[] = [
  'string',
  'number',
  'integer',
  'boolean',
  'array',
  'object',
  'null',
];

/** 按 $ref 指针（#/a/b/c）在文档中查找目标 */
function lookupRef(doc: Dict, ref: string): unknown {
  if (!ref.startsWith('#/')) return undefined;
  let current: unknown = doc;
  for (const segment of ref.slice(2).split('/')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Dict)[segment.replace(/~1/g, '/').replace(/~0/g, '~')];
  }
  return current;
}

/** 解引用（含引用链），带深度保护 */
function resolve(doc: Dict, schema: unknown, depth = 0): Dict | undefined {
  if (depth > 10 || schema === null || typeof schema !== 'object') return undefined;
  const ref = (schema as Dict).$ref;
  if (typeof ref === 'string') {
    const target = lookupRef(doc, ref);
    return target ? resolve(doc, target, depth + 1) : undefined;
  }
  return schema as Dict;
}

/** 操作的 2xx 响应 schema：3.x 取 content，2.0 直接取 schema */
function responseSchema(op: Dict): unknown {
  const responses = op.responses as Dict | undefined;
  if (!responses) return undefined;
  const ok = (responses['200'] ?? responses['201'] ?? responses.default) as Dict | undefined;
  if (!ok) return undefined;
  const content = ok.content as Dict | undefined;
  if (content) {
    const json = (content['application/json'] ?? Object.values(content)[0]) as Dict | undefined;
    return json?.schema;
  }
  return ok.schema;
}

/** 操作的请求体 schema：3.x 取 requestBody，2.0 取 in:body 参数 */
function requestBodySchema(doc: Dict, op: Dict): unknown {
  const requestBody = op.requestBody as Dict | undefined;
  if (requestBody) {
    const body =
      typeof requestBody.$ref === 'string'
        ? (lookupRef(doc, requestBody.$ref) as Dict | undefined)
        : requestBody;
    const content = body?.content as Dict | undefined;
    if (!content) return undefined;
    const json = (content['application/json'] ?? Object.values(content)[0]) as Dict | undefined;
    return json?.schema;
  }
  const params = op.parameters as Dict[] | undefined;
  return params?.find((param) => param.in === 'body')?.schema;
}

function numericValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function textValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * 类型定义：type / format / enum / const / nullable。
 * JSON Schema 允许 type 为数组，`[T, 'null']` 归一为单类型 + nullable。
 */
function extractType(schema: Dict): Partial<Schema> {
  const field: Partial<Schema> = {};
  const raw = schema.type;
  if (Array.isArray(raw)) {
    const kinds = raw.filter((value): value is Kind => KINDS.includes(value as Kind));
    const type = kinds.find((kind) => kind !== 'null');
    if (type) field.type = type;
    if (kinds.includes('null')) field.nullable = true;
  } else if (typeof raw === 'string' && KINDS.includes(raw as Kind)) {
    field.type = raw as Kind;
  }
  if (schema.nullable === true) field.nullable = true;

  const format = textValue(schema.format);
  if (format) field.format = format;

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    field.enum = schema.enum as Schema['enum'];
  }
  if (schema.const !== undefined) field.const = schema.const;

  return field;
}

/** 属性定义：标识与元数据 */
function extractMeta(schema: Dict): Partial<Schema> {
  const field: Partial<Schema> = {};
  const title = textValue(schema.title);
  if (title) field.title = title;
  const description = textValue(schema.description);
  if (description) field.description = description;
  if (schema.default !== undefined) field.default = schema.default;
  if (schema.example !== undefined) field.example = schema.example;
  if (schema.deprecated === true) field.deprecated = true;
  if (schema.readOnly === true) field.readOnly = true;
  if (schema.writeOnly === true) field.writeOnly = true;
  return field;
}

/**
 * 约束定义：命名对齐 JSON Schema。
 * OpenAPI 3.0 的布尔排他值（exclusiveMinimum: true + minimum: n）归一为数值形式。
 */
function extractConstraints(schema: Dict): Partial<Schema> {
  const field: Partial<Schema> = {};

  const minimum = numericValue(schema.minimum);
  const maximum = numericValue(schema.maximum);
  const exclusiveMinimum = schema.exclusiveMinimum;
  const exclusiveMaximum = schema.exclusiveMaximum;

  if (typeof exclusiveMinimum === 'number') {
    field.exclusiveMinimum = exclusiveMinimum;
  } else if (exclusiveMinimum === true && minimum !== undefined) {
    field.exclusiveMinimum = minimum;
  }
  if (minimum !== undefined && exclusiveMinimum !== true) field.minimum = minimum;

  if (typeof exclusiveMaximum === 'number') {
    field.exclusiveMaximum = exclusiveMaximum;
  } else if (exclusiveMaximum === true && maximum !== undefined) {
    field.exclusiveMaximum = maximum;
  }
  if (maximum !== undefined && exclusiveMaximum !== true) field.maximum = maximum;

  const multipleOf = numericValue(schema.multipleOf);
  if (multipleOf !== undefined) field.multipleOf = multipleOf;

  const minLength = numericValue(schema.minLength);
  if (minLength !== undefined) field.minLength = minLength;
  const maxLength = numericValue(schema.maxLength);
  if (maxLength !== undefined) field.maxLength = maxLength;

  const pattern = textValue(schema.pattern);
  if (pattern) field.pattern = pattern;

  const minItems = numericValue(schema.minItems);
  if (minItems !== undefined) field.minItems = minItems;
  const maxItems = numericValue(schema.maxItems);
  if (maxItems !== undefined) field.maxItems = maxItems;
  if (schema.uniqueItems === true) field.uniqueItems = true;

  return field;
}

/** 嵌套结构：items / properties / 组合关键字，原样保留为 schema */
function extractStructure(doc: Dict, schema: Dict): Partial<Schema> {
  const field: Partial<Schema> = {};

  if (schema.items !== undefined) {
    const items = extractField(doc, schema.items);
    if (items) field.items = items;
  }

  if (schema.properties !== undefined) {
    const { properties, required } = extractProperties(doc, schema);
    if (Object.keys(properties).length > 0) field.properties = properties;
    if (required.length > 0) field.required = required;
  }

  if (typeof schema.additionalProperties === 'boolean') {
    field.additionalProperties = schema.additionalProperties;
  } else if (schema.additionalProperties !== undefined) {
    const additional = extractField(doc, schema.additionalProperties);
    if (additional) field.additionalProperties = additional;
  }

  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const list = schema[key];
    if (!Array.isArray(list)) continue;
    const fields = list
      .map((item) => extractField(doc, item))
      .filter((item): item is Schema => item !== undefined);
    if (fields.length > 0) field[key] = fields;
  }

  if (schema.not !== undefined) {
    const not = extractField(doc, schema.not);
    if (not) field.not = not;
  }

  return field;
}

/** 单个字段定义：三层合并 */
function extractField(doc: Dict, rawSchema: unknown): Schema | undefined {
  const schema = resolve(doc, rawSchema);
  if (!schema) return undefined;
  return {
    ...extractType(schema),
    ...extractStructure(doc, schema),
    ...extractConstraints(schema),
    ...extractMeta(schema),
  };
}

/** 对象 schema → 属性表 + 对象级必填 */
function extractProperties(
  doc: Dict,
  rawSchema: unknown,
): { properties: Record<string, Schema>; required: string[] } {
  const resolved = resolve(doc, rawSchema);
  const raw = resolved?.properties as Dict | undefined;
  if (!raw) return { properties: {}, required: [] };

  const required = Array.isArray(resolved!.required)
    ? (resolved!.required as unknown[]).filter((name): name is string => typeof name === 'string')
    : [];

  const properties: Record<string, Schema> = {};
  for (const [name, prop] of Object.entries(raw)) {
    const field = extractField(doc, prop);
    if (field) properties[name] = field;
  }
  return { properties, required };
}

/** 顶层对象 schema；无属性时返回 undefined */
function schemaOf(doc: Dict, rawSchema: unknown): Schema | undefined {
  const { properties, required } = extractProperties(doc, rawSchema);
  if (Object.keys(properties).length === 0) return undefined;
  const schema: Schema = { type: 'object', properties };
  if (required.length > 0) schema.required = required;
  return schema;
}

interface ListShape {
  itemSchema: unknown;
  /** 列表数组在响应体中的路径 */
  listPath?: string;
  /** 页码在响应体中的路径 */
  pagePath?: string;
  /** 页大小在响应体中的路径 */
  sizePath?: string;
  /** 总数在响应体中的路径 */
  totalPath?: string;
}

/** 识别列表响应形状：裸数组或「数组属性 + 总数属性」的信封结构 */
function listShape(doc: Dict, schema: unknown): ListShape | null {
  const resolved = resolve(doc, schema);
  if (!resolved) return null;
  if (resolved.type === 'array') return { itemSchema: resolved.items };
  const properties = resolved.properties as Dict | undefined;
  if (!properties) return null;
  let listPath: string | undefined;
  let pagePath: string | undefined;
  let sizePath: string | undefined;
  let totalPath: string | undefined;
  let itemSchema: unknown;
  for (const [name, prop] of Object.entries(properties)) {
    const resolvedProp = resolve(doc, prop);
    if (!resolvedProp) continue;
    if (resolvedProp.type === 'array' && listPath === undefined) {
      listPath = name;
      itemSchema = resolvedProp.items;
    } else if (resolvedProp.type === 'integer' && PAGE_SIZE_NAME.test(name) && sizePath === undefined) {
      sizePath = name;
    } else if (resolvedProp.type === 'integer' && PAGE_NAME.test(name) && pagePath === undefined) {
      pagePath = name;
    } else if (
      TOTAL_NAME.test(name) &&
      resolvedProp.type === 'integer' &&
      totalPath === undefined
    ) {
      totalPath = name;
    }
  }
  return listPath === undefined ? null : { itemSchema, listPath, pagePath, sizePath, totalPath };
}

/** 操作归类：路径占位符区分集合与单项 */
function classify(
  method: string,
  hasPlaceholder: boolean,
): 'list' | 'detail' | 'create' | 'update' | 'remove' | null {
  switch (method) {
    case 'get':
      return hasPlaceholder ? 'detail' : 'list';
    case 'post':
      return hasPlaceholder ? null : 'create';
    case 'put':
    case 'patch':
      return hasPlaceholder ? 'update' : null;
    case 'delete':
      return hasPlaceholder ? 'remove' : null;
    default:
      return null;
  }
}

/** 资源名：首个 tag，回落路径首个非占位段 */
function resourceName(op: Dict, path: string): string {
  const tag = (op.tags as string[] | undefined)?.[0];
  if (tag) return tag;
  const segment = path.split('/').find((part) => part !== '' && !part.startsWith('{'));
  return segment ?? 'root';
}

/** 标记字段出现场景 */
function markScope(hints: Record<string, Hint>, name: string, key: keyof Scope): void {
  hints[name] = { ...hints[name], scope: { ...hints[name]?.scope, [key]: true } };
}

/** 再次出现的字段：补齐缺失键，保留先声明的定义 */
function fillMissing(target: Schema, source: Schema): void {
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if ((target as Record<string, unknown>)[key] === undefined) {
      (target as Record<string, unknown>)[key] = value;
    }
  }
}

/**
 * 合并多个来源的 schema（列表响应 / create 请求体 / update 请求体）：
 * 同名属性补齐缺失键；create / update 的对象级 required 取并集。
 */
function mergeSchema(
  resource: Resource,
  incoming: Schema | undefined,
  scopeKey: 'list' | 'create' | 'update',
): void {
  if (!incoming) return;
  const schema = resource.schema;
  const properties = (schema.properties ??= {});
  resource.hints ??= {};
  for (const [name, field] of Object.entries(incoming.properties ?? {})) {
    const existing = properties[name];
    if (!existing) properties[name] = field;
    else fillMissing(existing, field);
    markScope(resource.hints, name, scopeKey);
  }
  if (scopeKey !== 'list' && incoming.required && incoming.required.length > 0) {
    const required = new Set([...(schema.required ?? []), ...incoming.required]);
    schema.required = [...required];
  }
}

/** 从列表操作的查询参数识别统一查询片段命名 */
function applyQueryNames(resource: Resource, params: Dict[]): void {
  const queryNames: QueryNames = {};
  for (const param of params) {
    const name = param.name as string | undefined;
    if (!name || param.in !== 'query') continue;
    if (PAGE_NAME.test(name)) queryNames.page = name;
    else if (PAGE_SIZE_NAME.test(name)) queryNames.size = name;
    else if (KEYWORD_NAME.test(name)) queryNames.keyword = name;
    else if (SORTER_NAME.test(name)) queryNames.sorter = name;
  }
  if (Object.keys(queryNames).length > 0) resource.queryNames = queryNames;
}

/** 非分页 / 关键词 / 排序的查询参数标记为筛选项；不存在的字段新建 */
function applyFilters(doc: Dict, resource: Resource, params: Dict[]): void {
  const { properties } = resource.schema;
  resource.hints ??= {};
  for (const param of params) {
    const name = param.name as string | undefined;
    if (!name || param.in !== 'query') continue;
    if (
      PAGE_NAME.test(name) ||
      PAGE_SIZE_NAME.test(name) ||
      KEYWORD_NAME.test(name) ||
      SORTER_NAME.test(name)
    ) {
      continue;
    }

    const existing = properties[name];
    if (existing) {
      markScope(resource.hints, name, 'filter');
      continue;
    }

    const source = (param.schema as Dict | undefined) ?? param;
    const field = extractField(doc, source) ?? {};
    if (!field.title) {
      field.title =
        textValue(param.summary) ?? textValue(param.description) ?? name;
    }
    properties[name] = field;
    markScope(resource.hints, name, 'filter');
  }
}

/**
 * OpenAPI（Swagger）解析器。
 * 支持路径级 + 操作级参数合并（Swagger 2.0 常见）、$ref 引用、
 * 信封响应（数组属性 + 总数属性）与裸数组响应。
 */
export const parseOpenApi: MetadataParser = (rawDoc) => {
  const doc = rawDoc as Dict;
  const paths = doc?.paths as Dict | undefined;
  if (!paths || typeof paths !== 'object') {
    throw new Error('无法解析元数据文档：缺少 paths 定义');
  }

  const resources: Record<string, Resource> = {};
  const ensureResource = (name: string): Resource =>
    (resources[name] ??= { name, schema: { type: 'object', properties: {} } });

  for (const [path, rawItem] of Object.entries(paths)) {
    const item = rawItem as Dict;
    const sharedParams = (item.parameters as Dict[] | undefined) ?? [];
    for (const method of HTTP_METHODS) {
      const op = item[method] as Dict | undefined;
      if (!op) continue;
      const key = classify(method, path.includes('{'));
      if (!key) continue;

      const resource = ensureResource(resourceName(op, path));
      resource[key] = { method: method.toUpperCase() as ResourceMethod, path };

      const params = [...sharedParams, ...((op.parameters as Dict[] | undefined) ?? [])];
      if (key === 'list') {
        applyQueryNames(resource, params);
        const shape = listShape(doc, responseSchema(op));
        if (shape) {
          if (shape.listPath)
            resource.response = {
              list: shape.listPath,
              page: shape.pagePath,
              size: shape.sizePath,
              total: shape.totalPath,
            };
          mergeSchema(resource, schemaOf(doc, shape.itemSchema), 'list');
          applyFilters(doc, resource, params);
        }
      } else if (key === 'create' || key === 'update') {
        mergeSchema(resource, schemaOf(doc, requestBodySchema(doc, op)), key);
      }
    }
  }

  return { resources };
};
