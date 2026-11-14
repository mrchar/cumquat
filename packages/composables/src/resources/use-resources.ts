import { ref, shallowRef } from 'vue';
import { createFetchAdapter } from './create-fetch-adapter';
import { parseOpenApi } from './parse-open-api';
import { defaultView, schemaToColumns } from './schema-view';
import { asyncErrorText } from '@cumquat/core';
import type {
  ActionResult,
  Converter,
  FetchData,
  FetchQuery,
  FetchResult,
  Registry,
  RequestAdapter,
  Resource,
  ResourceClient,
  ResourceColumn,
  ResourceOperation,
  ResourcePool,
  ResourceRequest,
  ResolvedFetchQuery,
  Schema,
  Status,
  UseResourcesOptions,
  View,
} from '@cumquat/core';

const EMPTY_REGISTRY: Registry = { resources: {} };

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
function buildListQuery(
  resource: Resource,
  query?: ResolvedFetchQuery,
): ResourceRequest['query'] {
  const names = {
    keyword: 'keyword',
    page: 'page',
    size: 'size',
    sorter: 'sorter',
    ...resource.queryNames,
  };
  const params: Record<string, string | number | boolean | undefined> = {};
  if (!query) return params;
  if (query.keyword !== undefined && query.keyword !== null && query.keyword !== '') {
    params[names.keyword] = query.keyword;
  }
  if (query.page !== undefined) params[names.page] = query.page;
  if (query.size !== undefined) params[names.size] = query.size;
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

/**
 * 按资源表的列表响应映射归一化：信封取数组、页码、页大小与总数，裸数组直传。
 * 响应中缺失 page / size 时以本次请求的分页参数回填，保证分页信封四项齐全。
 */
function normalizeListResult(
  resource: Resource,
  body: unknown,
  query?: ResolvedFetchQuery,
): unknown {
  const mapping = resource.response;
  if (!mapping?.list) return body;
  const list = pickPath(body, mapping.list);
  if (!Array.isArray(list)) return body;
  const total = mapping.total ? pickPath(body, mapping.total) : undefined;
  if (total === undefined) return list;
  const page = mapping.page ? Number(pickPath(body, mapping.page)) : (query?.page ?? 1);
  const size = mapping.size ? Number(pickPath(body, mapping.size)) : (query?.size ?? list.length);
  return {
    list,
    page: Number.isFinite(page) ? page : (query?.page ?? 1),
    size: Number.isFinite(size) ? size : (query?.size ?? list.length),
    total: Number(total),
  };
}

/**
 * 元数据驱动的资源池：声明一次「服务器地址 + 元数据解析方式」，
 * 按资源名取客户端，请求方法与 fetch / action 协议同形。
 *
 * 字段在视图层的投影（fields / columns / filters / properties）由 `Converter` 完成：
 * schema 是唯一的数据来源，视图只是它的一次投影，默认使用内置实现，可整体替换。
 */
export function useResources(options: UseResourcesOptions): ResourcePool {
  const adapter: RequestAdapter = options.request ?? createFetchAdapter();
  const converter: Converter = options.view ?? defaultView;
  const registryRef = shallowRef<Registry | null>(null);
  const statusRef = shallowRef<Status>('pending');
  const errorRef = shallowRef<unknown>(undefined);
  let loadPromise: Promise<void> | null = null;

  const resolveHeaders = async (): Promise<Record<string, string> | undefined> =>
    typeof options.headers === 'function' ? options.headers() : options.headers;

  async function load(): Promise<void> {
    statusRef.value = 'pending';
    errorRef.value = undefined;
    try {
      let raw: Registry;
      if (options.registry !== undefined) {
        raw =
          typeof options.registry === 'function' ? await options.registry() : options.registry;
      } else if (options.doc) {
        const doc = await adapter({
          method: 'GET',
          url: resolveUrl(options.server, options.doc),
          headers: await resolveHeaders(),
        });
        raw = await (options.parse ?? parseOpenApi)(doc, { server: options.server });
      } else {
        throw new Error('useResources 需要提供 doc（元数据文档）或 registry（资源表）之一');
      }
      registryRef.value = options.refine ? await options.refine(raw) : raw;
      statusRef.value = 'success';
    } catch (error) {
      errorRef.value = error;
      statusRef.value = 'error';
    }
  }

  /** 等待资源表就绪；加载失败时抛出错误，由调用方决定如何呈现 */
  function ensureLoaded(): Promise<Registry> {
    if (!loadPromise) loadPromise = load();
    return loadPromise.then(() => {
      if (statusRef.value === 'error') throw errorRef.value;
      return registryRef.value as Registry;
    });
  }

  // 启动加载：错误记录在池状态中，未消费的 promise 静默兜底
  void ensureLoaded().catch(() => {});

  function client<D = unknown>(name: string): ResourceClient<D> {
    const loaded = registryRef.value;
    if (loaded && !loaded.resources[name]) {
      throw new Error(`资源池中不存在资源「${name}」`);
    }

    const requireResource = async (): Promise<Resource> => {
      const registry = await ensureLoaded();
      const resource = registry.resources[name];
      if (!resource) throw new Error(`资源池中不存在资源「${name}」`);
      return resource;
    };

    const requireOp = (
      resource: Resource,
      key: 'list' | 'detail' | 'create' | 'update' | 'remove',
    ): ResourceOperation => {
      const op = resource[key];
      if (!op) throw new Error(`资源「${name}」未声明 ${key} 操作`);
      return op;
    };

    const collectionUrl = (op: ResourceOperation): string => resolveUrl(options.server, op.path);
    const itemUrl = (op: ResourceOperation, id: string | number): string =>
      resolveUrl(options.server, op.path).replace(/\{id\}/g, encodeURIComponent(String(id)));

    /** schema 的完整字段视图 */
    const fieldsOf = (): View[] => {
      const resource = registryRef.value?.resources[name];
      return resource ? converter.toFields(resource.schema, resource.hints) : [];
    };

    /** 按场景标记过滤字段视图 */
    const scopedOf = (key: 'filter' | 'create' | 'update'): View[] => {
      const resource = registryRef.value?.resources[name];
      if (!resource) return [];
      return fieldsOf().filter((item) => {
        const scope = resource.hints?.[item.name]?.scope;
        return scope?.[key] === true;
      });
    };

    const columnsOf = (): ResourceColumn[] => {
      const resource = registryRef.value?.resources[name];
      if (!resource) return [];
      return schemaToColumns(resource.schema, { hints: resource.hints, listOnly: true });
    };

    const propertiesOf = (): View[] => {
      const resource = registryRef.value?.resources[name];
      if (!resource) return [];
      return fieldsOf().filter((item) => {
        const scope = resource.hints?.[item.name]?.scope;
        return scope?.create === true || scope?.update === true;
      });
    };

    return {
      name,

      list(_initialQuery?: FetchQuery): FetchResult<D> {
        // 资源池私有的 FetchResult 实现：内部持有状态机、竞态序号与取消信号，
        // 对外只暴露 execute / abort，组件库不感知 AbortController 的存在。
        const status = ref<Status>('idle');
        const data = ref<FetchData<D> | undefined>(undefined);
        const error = ref<unknown>(undefined);
        const message = ref<string | undefined>(undefined);
        let controller: AbortController | undefined;
        let runId = 0;

        return {
          status,
          data,
          error,
          message,
          async execute(query?: ResolvedFetchQuery) {
            const currentId = ++runId;
            controller?.abort();
            controller =
              typeof AbortController !== 'undefined' ? new AbortController() : undefined;
            status.value = 'pending';
            try {
              const resource = await requireResource();
              const op = requireOp(resource, 'list');
              const body = await adapter({
                method: op.method,
                url: collectionUrl(op),
                query: buildListQuery(resource, query),
                headers: await resolveHeaders(),
                signal: controller?.signal,
              });
              if (currentId !== runId) return;
              data.value = normalizeListResult(resource, body, query) as FetchData<D>;
              status.value = 'success';
            } catch (err) {
              if (currentId !== runId) return;
              error.value = err;
              message.value = asyncErrorText(err);
              status.value = 'error';
            }
          },
          abort() {
            runId++;
            controller?.abort();
          },
        };
      },

      async detail(id: string | number): Promise<D> {
        const resource = await requireResource();
        const op = requireOp(resource, 'detail');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          headers: await resolveHeaders(),
        })) as D;
      },

      async create(payload: unknown): Promise<ActionResult | void> {
        const resource = await requireResource();
        const op = requireOp(resource, 'create');
        return (await adapter({
          method: op.method,
          url: collectionUrl(op),
          body: payload,
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      async update(id: string | number, payload: unknown): Promise<ActionResult | void> {
        const resource = await requireResource();
        const op = requireOp(resource, 'update');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          body: payload,
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      async remove(id: string | number): Promise<ActionResult | void> {
        const resource = await requireResource();
        const op = requireOp(resource, 'remove');
        return (await adapter({
          method: op.method,
          url: itemUrl(op, id),
          headers: await resolveHeaders(),
        })) as ActionResult | void;
      },

      get fields(): View[] {
        return fieldsOf();
      },

      get columns(): ResourceColumn[] {
        return columnsOf();
      },

      get filters(): View[] {
        return scopedOf('filter');
      },

      get properties(): View[] {
        return propertiesOf();
      },

      get schema(): Schema {
        const resource = registryRef.value?.resources[name];
        return resource?.schema ?? { type: 'object', properties: {} };
      },
    };
  }

  const pool: ResourcePool = {
    state: {
      get status() {
        return statusRef.value;
      },
      get data() {
        return registryRef.value ?? EMPTY_REGISTRY;
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
    has: (target: string) => registryRef.value?.resources[target] !== undefined,
    get names() {
      return Object.keys(registryRef.value?.resources ?? {});
    },
  };

  return pool;
}
