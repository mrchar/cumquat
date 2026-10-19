import { shallowRef } from 'vue';
import { createFetchAdapter } from './create-fetch-adapter';
import { parseOpenApi } from './parse-open-api';
import type { FetchQuery, FetchResult } from '../data/fetch';
import type { ActionResult } from '../types';
import type {
  RequestAdapter,
  ResourceColumn,
  ResourceClient,
  ResourceDefinition,
  ResourceField,
  ResourceOperation,
  ResourcePool,
  ResourceRequest,
  ResourceSchema,
  UseResourcesOptions,
} from './types';

const EMPTY_SCHEMA: ResourceSchema = { resources: {} };

/** 拼接服务器根地址与路径；路径为绝对 URL 时直接使用 */
function resolveUrl(server: string, path: string): string {
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(path)) return path;
  return `${server.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

/** 按点分路径从响应体中取值 */
function pickPath(body: unknown, path: string): unknown {
  let current: unknown = body;
  for (const segment of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** 统一查询片段 → 请求 query 参数（参数名按资源表映射，缺省回落默认名） */
function buildListQuery(definition: ResourceDefinition, query?: FetchQuery): ResourceRequest['query'] {
  const names = {
    keyword: 'keyword',
    currentPage: 'page',
    pageSize: 'pageSize',
    sorter: 'sorter',
    ...definition.queryNames,
  };
  const params: Record<string, string | number | boolean | undefined> = {};
  if (!query) return params;
  if (query.keyword !== undefined && query.keyword !== null && query.keyword !== '') {
    params[names.keyword] = query.keyword;
  }
  if (query.pagination) {
    params[names.currentPage] = query.pagination.currentPage;
    params[names.pageSize] = query.pagination.pageSize;
  }
  if (query.sorter && query.sorter.order) {
    params[names.sorter] = `${query.sorter.key},${query.sorter.order}`;
  }
  if (query.filters && typeof query.filters === 'object') {
    if (names.filters) {
      // 显式指定 filters 参数名：整个筛选对象以 JSON 序列化收口为单一参数
      params[names.filters] = JSON.stringify(query.filters);
    } else {
      // 默认逐键展开为独立参数，数组值以逗号连接
      for (const [key, value] of Object.entries(query.filters)) {
        if (value === undefined || value === null || value === '') continue;
        params[key] = Array.isArray(value)
          ? value.map(String).join(',')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : (value as string | number | boolean);
      }
    }
  }
  return params;
}

/** 按资源表的列表响应映射归一化：信封取数组与总数，裸数组直传 */
function normalizeListResult(definition: ResourceDefinition, body: unknown): unknown {
  const mapping = definition.response;
  if (!mapping?.list) return body;
  const list = pickPath(body, mapping.list);
  if (!Array.isArray(list)) return body;
  const total = mapping.total ? pickPath(body, mapping.total) : undefined;
  return total === undefined ? list : { list, total: Number(total) };
}

/**
 * 元数据驱动的资源池：声明一次「服务器地址 + 元数据解析方式」，
 * 按资源名取客户端，请求方法与 fetch / action 协议同形，
 * 字段元数据（columns / filters / properties）按组件属性形状导出。
 *
 * 池初始化时开始加载元数据；client() 无需等待就绪，方法调用时内部自动等待。
 */
export function useResources(options: UseResourcesOptions): ResourcePool {
  const adapter: RequestAdapter = options.request ?? createFetchAdapter();
  const schemaRef = shallowRef<ResourceSchema | null>(null);
  const statusRef = shallowRef<'pending' | 'success' | 'error'>('pending');
  const errorRef = shallowRef<unknown>(undefined);
  let loadPromise: Promise<void> | null = null;

  const resolveHeaders = async (): Promise<Record<string, string> | undefined> =>
    typeof options.headers === 'function' ? options.headers() : options.headers;

  async function load(): Promise<void> {
    statusRef.value = 'pending';
    errorRef.value = undefined;
    try {
      let raw: ResourceSchema;
      if (options.schema !== undefined) {
        raw = typeof options.schema === 'function' ? await options.schema() : options.schema;
      } else if (options.doc) {
        const doc = await adapter({
          method: 'GET',
          url: resolveUrl(options.server, options.doc),
          headers: await resolveHeaders(),
        });
        raw = await (options.parse ?? parseOpenApi)(doc, { server: options.server });
      } else {
        throw new Error('useResources 需要提供 doc（元数据文档）或 schema（资源表）之一');
      }
      schemaRef.value = options.refine ? await options.refine(raw) : raw;
      statusRef.value = 'success';
    } catch (error) {
      errorRef.value = error;
      statusRef.value = 'error';
    }
  }

  /** 等待资源表就绪；加载失败时抛出错误，由调用方决定如何呈现 */
  function ensureLoaded(): Promise<ResourceSchema> {
    if (!loadPromise) loadPromise = load();
    return loadPromise.then(() => {
      if (statusRef.value === 'error') throw errorRef.value;
      return schemaRef.value as ResourceSchema;
    });
  }

  // 启动加载：错误记录在池状态中，未消费的 promise 静默兜底
  void ensureLoaded().catch(() => {});

  function client<D = unknown>(name: string): ResourceClient<D> {
    const loaded = schemaRef.value;
    if (loaded && !loaded.resources[name]) {
      throw new Error(`资源池中不存在资源「${name}」`);
    }

    const requireDefinition = async (): Promise<ResourceDefinition> => {
      const schema = await ensureLoaded();
      const definition = schema.resources[name];
      if (!definition) throw new Error(`资源池中不存在资源「${name}」`);
      return definition;
    };

    const requireOp = (definition: ResourceDefinition, key: 'list' | 'detail' | 'create' | 'update' | 'remove'): ResourceOperation => {
      const op = definition[key];
      if (!op) throw new Error(`资源「${name}」未声明 ${key} 操作`);
      return op;
    };

    const collectionUrl = (op: ResourceOperation): string => resolveUrl(options.server, op.path);
    const itemUrl = (op: ResourceOperation, id: string | number): string =>
      resolveUrl(options.server, op.path).replace(/\{id\}/g, encodeURIComponent(String(id)));

    const fieldsOf = (): ResourceField[] => schemaRef.value?.resources[name]?.fields ?? [];

    const columnsOf = (): ResourceColumn[] =>
      fieldsOf()
        .filter((field) => field.scope?.list)
        .map((field) => {
          const column: ResourceColumn = { key: field.name, title: field.label, type: field.type };
          if (field.format) column.format = field.format;
          if (field.type === 'enum' && field.options && field.options.length > 0) {
            column.filters = field.options;
          }
          return column;
        });

    return {
      name,

      async list(query?: FetchQuery): Promise<FetchResult<D>> {
        const definition = await requireDefinition();
        const op = requireOp(definition, 'list');
        const body = await adapter({
          method: op.method,
          url: collectionUrl(op),
          query: buildListQuery(definition, query),
          headers: await resolveHeaders(),
          signal: query?.signal,
        });
        return normalizeListResult(definition, body) as FetchResult<D>;
      },

      async detail(id: string | number): Promise<D> {
        const definition = await requireDefinition();
        const op = requireOp(definition, 'detail');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          headers: await resolveHeaders(),
        })) as D;
      },

      async create(payload: unknown): Promise<ActionResult | void> {
        const definition = await requireDefinition();
        const op = requireOp(definition, 'create');
        return (await adapter({
          method: op.method,
          url: collectionUrl(op),
          body: payload,
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      async update(id: string | number, payload: unknown): Promise<ActionResult | void> {
        const definition = await requireDefinition();
        const op = requireOp(definition, 'update');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          body: payload,
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      async remove(id: string | number): Promise<ActionResult | void> {
        const definition = await requireDefinition();
        const op = requireOp(definition, 'remove');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      get fields(): ResourceField[] {
        return fieldsOf();
      },

      get columns(): ResourceColumn[] {
        return columnsOf();
      },

      get filters(): ResourceField[] {
        return fieldsOf().filter((field) => field.scope?.filter);
      },

      get properties(): ResourceField[] {
        return fieldsOf().filter((field) => field.scope?.create === true || field.scope?.update === true);
      },
    };
  }

  const pool: ResourcePool = {
    state: {
      get status() {
        return statusRef.value;
      },
      get data() {
        return schemaRef.value ?? EMPTY_SCHEMA;
      },
      get error() {
        return errorRef.value;
      },
      retry: () => {
        loadPromise = null;
        void ensureLoaded().catch(() => {});
      },
    },
    client,
    has: (target: string) => schemaRef.value?.resources[target] !== undefined,
    get names() {
      return Object.keys(schemaRef.value?.resources ?? {});
    },
  } satisfies ResourcePool;

  return pool;
}
