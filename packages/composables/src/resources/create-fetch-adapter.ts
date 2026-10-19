import type { RequestAdapter, ResourceRequest } from './types';

/** 内置适配器的 HTTP 错误：携带状态码与解析后的响应体 */
export class ResourceHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(method: string, url: string, status: number, body: unknown) {
    super(`${method} ${url} 请求失败（${status}）`);
    this.name = 'ResourceHttpError';
    this.status = status;
    this.body = body;
  }
}

/** 拼装 query 参数：undefined 值整体省略 */
function buildUrl(url: string, query: ResourceRequest['query']): string {
  if (!query) return url;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  if (!qs) return url;
  return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
}

/**
 * 基于 fetch 的内置传输适配器。
 * GET 以 query 拼装 URL，写操作以 JSON 提交 body；非 2xx 状态拒绝为
 * ResourceHttpError（携带状态码与响应体）；响应体自动 JSON 解析，空体为 undefined。
 */
export function createFetchAdapter(): RequestAdapter {
  return async (request: ResourceRequest) => {
    const headers: Record<string, string> = { ...request.headers };
    let body: string | undefined;
    if (request.body !== undefined) {
      headers['Content-Type'] ??= 'application/json';
      // 字符串请求体直传（如表单编码），其余经 JSON 序列化
      body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
    }
    const response = await fetch(buildUrl(request.url, request.query), {
      method: request.method,
      headers,
      body,
      signal: request.signal,
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text === '' ? undefined : JSON.parse(text);
    } catch {
      parsed = text;
    }
    if (!response.ok) {
      throw new ResourceHttpError(request.method, request.url, response.status, parsed);
    }
    return parsed;
  };
}
