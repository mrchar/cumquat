import type {
  MetadataParser,
  QueryNames,
  ResourceDefinition,
  ResourceField,
  ResourceFieldType,
  ResourceMethod,
  ResourceSchema,
} from './types';

/**
 * OpenAPI（Swagger）默认解析器：同时支持 OpenAPI 3.x 与 Swagger 2.0。
 * 只读文档、不做服务器校验；资源名取 tag（回落路径首段），
 * 操作按「路径 + 方法」归类，字段元数据自响应与请求体 schema 提取。
 */

type Dict = Record<string, unknown>;

/** 分页 / 关键词 / 排序参数的常见命名（识别统一查询片段，不作为筛选项） */
const PAGE_NAME = /^(page|pageno|pageindex|pagenum|current)$/i;
const PAGE_SIZE_NAME = /^(pagesize|size|limit|perpage|per_page)$/i;
const KEYWORD_NAME = /^(keyword|kw|q|search)$/i;
const SORTER_NAME = /^(sort|sorter|sortby|sort_by|order|orderby|order_by)$/i;
const TOTAL_NAME = /^(total|totalcount|totalelements|total_items|count)$/i;

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

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

/** schema 的元数据字段类型；object / array 等非原始类型返回 null（不进入元数据） */
function fieldType(schema: Dict): ResourceFieldType | null {
  // enum 可挂在 string 或 integer 上，优先判定
  if (
    Array.isArray(schema.enum) &&
    schema.enum.length > 0 &&
    (schema.type === 'string' || schema.type === 'integer' || schema.type === 'number')
  ) {
    return 'enum';
  }
  switch (schema.type) {
    case 'integer':
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'string':
      if (schema.format === 'date-time') return 'datetime';
      if (schema.format === 'date') return 'date';
      return 'string';
    default:
      return null;
  }
}

function fieldOptions(schema: Dict): Array<{ label: string; value: string | number }> | undefined {
  if (!Array.isArray(schema.enum)) return undefined;
  return schema.enum.map((value) => ({ label: String(value), value: value as string | number }));
}

interface ExtractedField {
  name: string;
  label: string;
  type: ResourceFieldType;
  /** 文档声明的内容格式，原样透传（date-time / date / email / uri / int64…） */
  format?: string;
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
}

/** 文档声明的内容格式：仅透传字符串形式的 format，其余忽略 */
function fieldFormat(schema: Dict): string | undefined {
  return typeof schema.format === 'string' && schema.format !== '' ? schema.format : undefined;
}

/** 从对象 schema 的 properties 提取字段描述（仅原始类型） */
function extractFields(doc: Dict, schema: unknown): ExtractedField[] {
  const resolved = resolve(doc, schema);
  const properties = resolved?.properties as Dict | undefined;
  if (!properties) return [];
  const requiredList = Array.isArray(resolved?.required) ? (resolved!.required as string[]) : [];
  const fields: ExtractedField[] = [];
  for (const [name, prop] of Object.entries(properties)) {
    const resolvedProp = resolve(doc, prop);
    if (!resolvedProp) continue;
    const type = fieldType(resolvedProp);
    if (!type) continue;
    fields.push({
      name,
      label: (resolvedProp.description as string) ?? (resolvedProp.title as string) ?? name,
      type,
      format: fieldFormat(resolvedProp),
      options: type === 'enum' ? fieldOptions(resolvedProp) : undefined,
      required: requiredList.includes(name) || undefined,
    });
  }
  return fields;
}

interface ListShape {
  itemSchema: unknown;
  /** 列表数组在响应体中的路径 */
  listPath?: string;
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
  let totalPath: string | undefined;
  let itemSchema: unknown;
  for (const [name, prop] of Object.entries(properties)) {
    const resolvedProp = resolve(doc, prop);
    if (!resolvedProp) continue;
    if (resolvedProp.type === 'array' && listPath === undefined) {
      listPath = name;
      itemSchema = resolvedProp.items;
    } else if (
      TOTAL_NAME.test(name) &&
      resolvedProp.type === 'integer' &&
      totalPath === undefined
    ) {
      totalPath = name;
    }
  }
  return listPath === undefined ? null : { itemSchema, listPath, totalPath };
}

/** 把提取的字段合并进资源：已存在则追加场景标记，否则新建 */
function mergeField(
  definition: ResourceDefinition,
  partial: ExtractedField,
  scopeKey: 'list' | 'create' | 'update',
): void {
  const fields = (definition.fields ??= []);
  let field = fields.find((item) => item.name === partial.name);
  if (!field) {
    field = { name: partial.name, label: partial.label, type: partial.type, scope: {} };
    if (partial.options) field.options = partial.options;
    if (partial.format) field.format = partial.format;
    fields.push(field);
  } else if (partial.format) {
    field.format ??= partial.format;
  }
  field.scope = { ...field.scope, [scopeKey]: true };
  if (partial.required) field.required = true;
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

/** 从列表操作的查询参数识别统一查询片段命名 */
function applyQueryNames(definition: ResourceDefinition, params: Dict[]): void {
  const queryNames: QueryNames = {};
  for (const param of params) {
    const name = param.name as string | undefined;
    if (!name || param.in !== 'query') continue;
    if (PAGE_NAME.test(name)) queryNames.currentPage = name;
    else if (PAGE_SIZE_NAME.test(name)) queryNames.pageSize = name;
    else if (KEYWORD_NAME.test(name)) queryNames.keyword = name;
    else if (SORTER_NAME.test(name)) queryNames.sorter = name;
  }
  if (Object.keys(queryNames).length > 0) definition.queryNames = queryNames;
}

/** 非分页 / 关键词 / 排序的查询参数标记为筛选项；不存在的字段新建 */
function applyFilterScopes(doc: Dict, definition: ResourceDefinition, params: Dict[]): void {
  const fields = (definition.fields ??= []);
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
    const schema = resolve(doc, (param.schema as Dict | undefined) ?? param);
    const type = (schema && fieldType(schema)) ?? 'string';
    const existing = fields.find((field) => field.name === name);
    if (existing) {
      existing.scope = { ...existing.scope, filter: true };
    } else {
      const field: ResourceField = {
        name,
        label: (param.description as string) ?? (param.summary as string) ?? name,
        type,
        scope: { filter: true },
      };
      if (schema) {
        const format = fieldFormat(schema);
        if (format) field.format = format;
        if (fieldType(schema) === 'enum') field.options = fieldOptions(schema);
      }
      fields.push(field);
    }
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

  const resources: Record<string, ResourceDefinition> = {};
  const ensureResource = (name: string): ResourceDefinition => (resources[name] ??= { fields: [] });

  for (const [path, rawItem] of Object.entries(paths)) {
    const item = rawItem as Dict;
    const sharedParams = (item.parameters as Dict[] | undefined) ?? [];
    for (const method of HTTP_METHODS) {
      const op = item[method] as Dict | undefined;
      if (!op) continue;
      const key = classify(method, path.includes('{'));
      if (!key) continue;

      const definition = ensureResource(resourceName(op, path));
      definition[key] = { method: method.toUpperCase() as ResourceMethod, path };

      const params = [...sharedParams, ...((op.parameters as Dict[] | undefined) ?? [])];
      if (key === 'list') {
        applyQueryNames(definition, params);
        const shape = listShape(doc, responseSchema(op));
        if (shape) {
          if (shape.listPath)
            definition.response = { list: shape.listPath, total: shape.totalPath };
          for (const field of extractFields(doc, shape.itemSchema))
            mergeField(definition, field, 'list');
          applyFilterScopes(doc, definition, params);
        }
      } else if (key === 'create' || key === 'update') {
        for (const field of extractFields(doc, requestBodySchema(doc, op)))
          mergeField(definition, field, key);
      }
    }
  }

  return { resources };
};
