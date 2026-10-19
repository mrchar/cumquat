import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFetchAdapter, ResourceHttpError } from '../../resources/create-fetch-adapter';

function jsonResponse(status: number, body: string) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body),
  };
}

describe('createFetchAdapter', () => {
  const fetchMock = vi.fn();
  const adapter = createFetchAdapter();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('GET 以 query 拼装 URL 并省略 undefined 值', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, '{"ok":true}'));
    const result = await adapter({
      method: 'GET',
      url: 'https://api.test/users',
      query: { page: 1, skip: undefined, flag: true },
    });
    expect(result).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/users?page=1&flag=true');
    expect(init.method).toBe('GET');
    expect(init.body).toBeUndefined();
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('写操作以 JSON 提交请求体并声明 Content-Type；已有 Content-Type 不覆盖', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, 'null'));
    await adapter({ method: 'POST', url: 'https://api.test/users', body: { name: '李四' } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBe('{"name":"李四"}');
    expect(init.headers['Content-Type']).toBe('application/json');

    await adapter({
      method: 'POST',
      url: 'https://api.test/token',
      body: 'a=1&b=2',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const [, formInit] = fetchMock.mock.calls[1];
    expect(formInit.body).toBe('a=1&b=2');
    expect(formInit.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('非 2xx 状态拒绝为携带状态码与响应体的 ResourceHttpError', async () => {
    fetchMock.mockResolvedValue(jsonResponse(404, '{"message":"不存在"}'));
    const error = await adapter({ method: 'GET', url: 'https://api.test/users/1' }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(ResourceHttpError);
    expect((error as ResourceHttpError).status).toBe(404);
    expect((error as ResourceHttpError).body).toEqual({ message: '不存在' });
    expect((error as ResourceHttpError).message).toContain('404');
  });

  it('空响应体解析为 undefined，非 JSON 文本透传', async () => {
    fetchMock.mockResolvedValue(jsonResponse(204, ''));
    expect(await adapter({ method: 'DELETE', url: 'https://api.test/users/1' })).toBeUndefined();

    fetchMock.mockResolvedValue(jsonResponse(200, 'OK'));
    expect(await adapter({ method: 'GET', url: 'https://api.test/health' })).toBe('OK');
  });

  it('AbortSignal 与附加请求头透传', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, 'null'));
    const controller = new AbortController();
    await adapter({
      method: 'GET',
      url: 'https://api.test/users',
      headers: { Authorization: 'Bearer t' },
      signal: controller.signal,
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.signal).toBe(controller.signal);
    expect(init.headers.Authorization).toBe('Bearer t');
  });
});
