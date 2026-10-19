import { describe, expect, it, vi } from 'vitest';
import { useResources } from '../../resources/use-resources';
import type { ResourceRequest, ResourceSchema } from '../../resources/types';
import { openApiDoc, userSchema } from './openapi-fixtures';

/** 记录请求的 mock 适配器，可注入响应或抛错 */
function recordingAdapter(handler?: (request: ResourceRequest, index: number) => unknown) {
  const requests: ResourceRequest[] = [];
  const adapter = vi.fn(async (request: ResourceRequest) => {
    const index = requests.length;
    requests.push({ ...request });
    return handler?.(request, index);
  });
  return { adapter, requests };
}

/** 等待池加载完成的微任务冲刷 */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

describe('useResources（请求方法）', () => {
  it('列表注入默认分页与关键词，参数名按 queryNames 映射', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    const users = pool.client('users');
    const result = await users.list({
      pagination: { currentPage: 3, pageSize: 10 },
      keyword: '张',
    });
    expect(result).toEqual([]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://api.test/users',
      query: { pageNo: 3, pageSize: 10, keyword: '张' },
    });
  });

  it('排序序列化为 key,order；筛选逐键展开，数组逗号连接，空值省略', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await pool.client('users').list({
      sorter: { key: 'name', order: 'desc' },
      filters: { status: [1, 2], level: 3, empty: '' },
    });
    expect(requests[0].query).toEqual({ sorter: 'name,desc', status: '1,2', level: 3 });
  });

  it('显式声明 filters 参数名时整个筛选对象以 JSON 收口', async () => {
    const schema: ResourceSchema = {
      resources: {
        users: {
          list: { method: 'GET', path: '/users' },
          queryNames: { filters: 'filter' },
        },
      },
    };
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema, request: adapter });
    await pool.client('users').list({ filters: { status: [1] } });
    expect(requests[0].query).toEqual({ filter: '{"status":[1]}' });
  });

  it('无查询时仅注入分页基线；查询对象缺省片段不出现', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await pool.client('users').list();
    expect(requests[0].query).toEqual({});
    await pool.client('users').list({ pagination: { currentPage: 2, pageSize: 5 } });
    expect(requests[1].query).toEqual({ pageNo: 2, pageSize: 5 });
  });

  it('路径模板 {id} 替换并对特殊字符编码', async () => {
    const { adapter, requests } = recordingAdapter(() => null);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await pool.client('users').detail(7);
    await pool.client('users').remove('a/b');
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'https://api.test/users/7' });
    expect(requests[1]).toMatchObject({ method: 'DELETE', url: 'https://api.test/users/a%2Fb' });
  });

  it('create / update 以 JSON 请求体提交，remove 无请求体', async () => {
    const { adapter, requests } = recordingAdapter(() => null);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await pool.client('users').create({ name: '李四' });
    await pool.client('users').update(7, { name: '王五' });
    await pool.client('users').remove(7);
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://api.test/users',
      body: { name: '李四' },
    });
    expect(requests[1]).toMatchObject({
      method: 'PUT',
      url: 'https://api.test/users/7',
      body: { name: '王五' },
    });
    expect(requests[2]).not.toHaveProperty('body');
  });

  it('列表响应映射：信封取数组与总数；未映射对象原样透传', async () => {
    const { adapter } = recordingAdapter(() => ({ records: [{ id: 1 }], total: 42 }));
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    expect(await pool.client('users').list()).toEqual({ list: [{ id: 1 }], total: 42 });

    const unmapped: ResourceSchema = {
      resources: { users: { list: { method: 'GET', path: '/users' }, response: { list: 'missing' } } },
    };
    const bare = useResources({
      server: 'https://api.test',
      schema: unmapped,
      request: recordingAdapter(() => ({ records: [] })).adapter,
    });
    expect(await bare.client('users').list()).toEqual({ records: [] });
  });

  it('headers 函数形式随每次请求注入', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      schema: userSchema,
      request: adapter,
      headers: () => ({ Authorization: 'Bearer t' }),
    });
    await pool.client('users').list();
    await pool.client('users').detail(1);
    expect(requests[0].headers).toEqual({ Authorization: 'Bearer t' });
    expect(requests[1].headers).toEqual({ Authorization: 'Bearer t' });
  });

  it('FetchQuery 的 signal 透传给适配器（竞态取消）', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    const controller = new AbortController();
    await pool.client('users').list({ signal: controller.signal });
    expect(requests[0].signal).toBe(controller.signal);
  });

  it('未声明的操作调用时抛错', async () => {
    const schema: ResourceSchema = {
      resources: { users: { list: { method: 'GET', path: '/users' } } },
    };
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema, request: adapter });
    await expect(pool.client('users').detail(1)).rejects.toThrow('未声明 detail');
  });

  it('适配器拒绝时错误原样抛出', async () => {
    const { adapter } = recordingAdapter(() => {
      throw new Error('网络错误');
    });
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await expect(pool.client('users').list()).rejects.toThrow('网络错误');
  });
});

describe('useResources（元数据与状态）', () => {
  it('池就绪前 client 可取且元数据为空，就绪后可读', async () => {
    let release!: (schema: ResourceSchema) => void;
    const gate = new Promise<ResourceSchema>((resolve) => {
      release = resolve;
    });
    const { adapter } = recordingAdapter();
    const pool = useResources({ server: 'https://api.test', schema: () => gate, request: adapter });
    const users = pool.client('users');
    expect(pool.state.status).toBe('pending');
    expect(users.columns).toEqual([]);
    expect(pool.has('users')).toBe(false);

    release(userSchema);
    await flush();
    expect(pool.state.status).toBe('success');
    expect(pool.has('users')).toBe(true);
    expect(pool.names).toEqual(['users']);
    expect(users.columns).toEqual([
      { key: 'id', title: 'ID' },
      { key: 'name', title: '姓名' },
      { key: 'status', title: '状态', filters: [{ label: '启用', value: 1 }] },
    ]);
    expect(users.filters.map((field) => field.name)).toEqual(['status']);
    expect(users.properties.map((field) => field.name)).toEqual(['name']);
    expect(users.fields).toHaveLength(3);
  });

  it('池就绪后取未知资源抛错；未声明操作的方法读取同样抛错', async () => {
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', schema: userSchema, request: adapter });
    await flush();
    expect(() => pool.client('ghost')).toThrow('ghost');
    const schema: ResourceSchema = {
      resources: { users: { list: { method: 'GET', path: '/users' } } },
    };
    const readonly = useResources({ server: 'https://api.test', schema, request: adapter });
    await expect(readonly.client('users').remove(1)).rejects.toThrow('未声明 remove');
  });

  it('doc 相对地址拼接到 server，绝对地址直传；自定义解析器与 refine 生效', async () => {
    const parse = vi.fn(() => userSchema);
    const refine = vi.fn((schema: ResourceSchema) => schema);
    const { adapter, requests } = recordingAdapter(() => openApiDoc);
    const pool = useResources({
      server: 'https://api.test',
      doc: '/v3/api-docs',
      parse,
      refine,
      request: adapter,
    });
    await flush();
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'https://api.test/v3/api-docs' });
    expect(parse).toHaveBeenCalledWith(openApiDoc, { server: 'https://api.test' });
    expect(refine).toHaveBeenCalledWith(userSchema);
    expect(pool.state.status).toBe('success');

    const absolute = useResources({
      server: 'https://api.test',
      doc: 'https://meta.test/doc.json',
      parse,
      request: adapter,
    });
    await flush();
    expect(requests[1].url).toBe('https://meta.test/doc.json');
    void absolute;
  });

  it('文档加载失败进入错误态，retry 后恢复', async () => {
    let failed = true;
    const { adapter } = recordingAdapter(() => {
      if (failed) throw new Error('boom');
      return openApiDoc;
    });
    const parse = vi.fn(() => userSchema);
    const pool = useResources({ server: 'https://api.test', doc: '/doc', parse, request: adapter });
    await flush();
    expect(pool.state.status).toBe('error');
    expect((pool.state.error as Error).message).toBe('boom');

    failed = false;
    pool.state.retry?.();
    await flush();
    expect(pool.state.status).toBe('success');
    expect(pool.state.data.resources.users).toBeDefined();
  });

  it('缺少 doc 与 schema 时进入错误态', async () => {
    const { adapter } = recordingAdapter();
    const pool = useResources({ server: 'https://api.test', request: adapter });
    await flush();
    expect(pool.state.status).toBe('error');
    expect((pool.state.error as Error).message).toContain('doc');
  });
});
