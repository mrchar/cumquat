import { describe, expect, it, vi } from 'vitest';
import { toValue } from 'vue';
import { useResources } from '../../resources/use-resources';
import type { Registry, ResourceRequest } from '@cumquat/core';
import { openApiDoc, userRegistry } from './openapi-fixtures';

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
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    await handle.execute({
      page: 3,
      size: 10,
      keyword: '张',
    });
    expect(toValue(handle.status)).toBe('success');
    expect(toValue(handle.data)).toEqual([]);
    expect(requests[0]).toMatchObject({
      method: 'GET',
      url: 'https://api.test/users',
      query: { pageNo: 3, size: 10, keyword: '张' },
    });
  });

  it('排序序列化为 key,order；筛选逐键展开，数组逗号连接，空值省略', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    await handle.execute({
      sorter: { key: 'name', order: 'desc' },
      filters: { status: [1, 2], level: 3, empty: '' },
    });
    expect(requests[0].query).toEqual({ sorter: 'name,desc', status: '1,2', level: 3 });
  });

  it('显式声明 filters 参数名时整个筛选对象以 JSON 收口', async () => {
    const registry: Registry = {
      resources: {
        users: {
          name: 'users',
          list: { method: 'GET', path: '/users' },
          queryNames: { filters: 'filter' },
          schema: { type: 'object', properties: {} },
        },
      },
    };
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', registry, request: adapter });
    const handle = pool.client('users').list();
    await handle.execute({ filters: { status: [1] } });
    expect(requests[0].query).toEqual({ filter: '{"status":[1]}' });
  });

  it('无查询时仅注入分页基线；查询对象缺省片段不出现', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    await handle.execute();
    expect(requests[0].query).toEqual({});
    await handle.execute({ page: 2, size: 5 });
    expect(requests[1].query).toEqual({ pageNo: 2, size: 5 });
  });

  it('路径模板 {id} 替换并对特殊字符编码', async () => {
    const { adapter, requests } = recordingAdapter(() => null);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    await pool.client('users').detail(7);
    await pool.client('users').remove('a/b');
    expect(requests[0]).toMatchObject({ method: 'GET', url: 'https://api.test/users/7' });
    expect(requests[1]).toMatchObject({ method: 'DELETE', url: 'https://api.test/users/a%2Fb' });
  });

  it('create / update 以 JSON 请求体提交，remove 无请求体', async () => {
    const { adapter, requests } = recordingAdapter(() => null);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
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

  it('列表响应映射：信封补齐 list/page/size/total；未映射对象原样透传', async () => {
    const { adapter } = recordingAdapter(() => ({ records: [{ id: 1 }], total: 42 }));
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    await handle.execute({ page: 1, size: 1 });
    // 响应未回传 page/size 时以请求分页参数补齐
    expect(toValue(handle.data)).toEqual({ list: [{ id: 1 }], page: 1, size: 1, total: 42 });

    const unmapped: Registry = {
      resources: {
        users: {
          name: 'users',
          list: { method: 'GET', path: '/users' },
          response: { list: 'missing' },
          schema: { type: 'object', properties: {} },
        },
      },
    };
    const bare = useResources({
      server: 'https://api.test',
      registry: unmapped,
      request: recordingAdapter(() => ({ records: [] })).adapter,
    });
    const bareHandle = bare.client('users').list();
    await bareHandle.execute();
    expect(toValue(bareHandle.data)).toEqual({ records: [] });
  });

  it('headers 函数形式随每次请求注入', async () => {
    const { adapter, requests } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
      headers: () => ({ Authorization: 'Bearer t' }),
    });
    const handle = pool.client('users').list();
    await handle.execute();
    await pool.client('users').detail(1);
    expect(requests[0].headers).toEqual({ Authorization: 'Bearer t' });
    expect(requests[1].headers).toEqual({ Authorization: 'Bearer t' });
  });

  it('资源内部创建 signal 透传适配器，二次 execute / abort 作废在途请求', async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const { adapter, requests } = recordingAdapter(() =>
      requests.length === 1 ? firstGate.then(() => []) : [],
    );
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    void handle.execute({ keyword: 'a' });
    await flush();
    const firstSignal = requests[0].signal;
    expect(firstSignal).toBeInstanceOf(AbortSignal);
    expect(firstSignal?.aborted).toBe(false);

    // 第二次 execute 作废第一次请求的 signal
    await handle.execute({ keyword: 'b' });
    expect(firstSignal?.aborted).toBe(true);
    expect(requests[1].query.keyword).toBe('b');

    // 过期请求落回不覆盖新数据
    releaseFirst();
    await flush();
    expect(toValue(handle.status)).toBe('success');

    // 显式 abort 安全可重复调用
    expect(() => handle.abort()).not.toThrow();
    expect(() => handle.abort()).not.toThrow();
  });

  it('未声明的操作调用时抛错', async () => {
    const registry: Registry = {
      resources: {
        users: {
          name: 'users',
          list: { method: 'GET', path: '/users' },
          schema: { type: 'object', properties: {} },
        },
      },
    };
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', registry, request: adapter });
    await expect(pool.client('users').detail(1)).rejects.toThrow('未声明 detail');
  });

  it('适配器拒绝时资源进入 error 状态并携带错误，不向上抛出', async () => {
    const { adapter } = recordingAdapter(() => {
      throw new Error('网络错误');
    });
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    const handle = pool.client('users').list();
    await expect(handle.execute()).resolves.toBeUndefined();
    expect(toValue(handle.status)).toBe('error');
    expect((toValue(handle.error) as Error).message).toBe('网络错误');
    expect(toValue(handle.message)).toBe('网络错误');
  });
});

describe('useResources（元数据与状态）', () => {
  it('池就绪前 client 可取且视图为空，就绪后可读', async () => {
    let release!: (registry: Registry) => void;
    const gate = new Promise<Registry>((resolve) => {
      release = resolve;
    });
    const { adapter } = recordingAdapter();
    const pool = useResources({ server: 'https://api.test', registry: () => gate, request: adapter });
    const users = pool.client('users');
    expect(pool.state.status).toBe('pending');
    expect(users.columns).toEqual([]);
    expect(users.schema.properties).toEqual({});
    expect(pool.has('users')).toBe(false);

    release(userRegistry);
    await flush();
    expect(pool.state.status).toBe('success');
    expect(pool.has('users')).toBe(true);
    expect(pool.names).toEqual(['users']);
    expect(users.columns).toMatchObject([
      { key: 'id', title: 'ID', type: 'integer' },
      { key: 'name', title: '姓名', type: 'string' },
      { key: 'status', title: '状态', type: 'integer', enum: [{ label: '启用', value: 1 }] },
    ]);
    expect(users.columns[2].enum).toEqual([{ label: '启用', value: 1 }]);
    expect(users.filters.map((field) => field.name)).toEqual(['status']);
    expect(users.properties.map((field) => field.name)).toEqual(['name']);
    expect(users.fields).toHaveLength(3);

    // 视图投影：label / component / validation
    expect(users.fields.map((field) => field.label)).toEqual(['ID', '姓名', '状态']);
    expect(users.fields.map((field) => field.component)).toEqual([
      'number',
      'input',
      'select',
    ]);
    expect(users.fields[1].validation.required).toBe(true);

    expect(users.schema.required).toEqual(['name']);
    expect(users.schema.properties?.name?.minLength).toBe(2);
  });

  it('columns 投影展开类型、格式与帮助提示', async () => {
    const registry: Registry = {
      resources: {
        users: {
          name: 'users',
          list: { method: 'GET', path: '/users' },
          schema: {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
                title: '邮箱',
                description: '联系邮箱',
                example: 'a@b.com',
              },
              score: {
                type: 'number',
                format: 'int64',
                title: '积分',
              },
            },
          },
          hints: {
            email: { scope: { list: true } },
            score: { scope: { list: true } },
          },
        },
      },
    };
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({ server: 'https://api.test', registry, request: adapter });
    await flush();
    expect(pool.client('users').columns).toMatchObject([
      {
        key: 'email',
        title: '邮箱',
        type: 'string',
        format: 'email',
        help: '联系邮箱；示例：a@b.com',
      },
      { key: 'score', title: '积分', type: 'number', format: 'int64' },
    ]);
  });

  it('池就绪后取未知资源抛错；未声明操作的方法读取同样抛错', async () => {
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
    });
    await flush();
    expect(() => pool.client('ghost')).toThrow('ghost');
    const registry: Registry = {
      resources: {
        users: {
          name: 'users',
          list: { method: 'GET', path: '/users' },
          schema: { type: 'object', properties: {} },
        },
      },
    };
    const readonly = useResources({ server: 'https://api.test', registry, request: adapter });
    await expect(readonly.client('users').remove(1)).rejects.toThrow('未声明 remove');
  });

  it('自定义转换器可替换视图投影', async () => {
    const { adapter } = recordingAdapter(() => []);
    const pool = useResources({
      server: 'https://api.test',
      registry: userRegistry,
      request: adapter,
      view: {
        toField: (name, field, context) => ({
          name,
          label: `自定义：${field.title ?? name}`,
          component: 'custom',
          validation: { required: context.required, rules: [] },
        }),
        toFields: (schema) =>
          Object.entries(schema.properties ?? {}).map(([name, field]) => ({
            name,
            label: `自定义：${field.title ?? name}`,
            component: 'custom',
            validation: { required: (schema.required ?? []).includes(name), rules: [] },
          })),
      },
    });
    await flush();
    const users = pool.client('users');
    expect(users.fields[0]).toMatchObject({ name: 'id', label: '自定义：ID', component: 'custom' });
    expect(users.properties.map((field) => field.name)).toEqual(['name']);
  });

  it('doc 相对地址拼接到 server，绝对地址直传；自定义解析器与 refine 生效', async () => {
    const parse = vi.fn(() => userRegistry);
    const refine = vi.fn((registry: Registry) => registry);
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
    expect(refine).toHaveBeenCalledWith(userRegistry);
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
    const parse = vi.fn(() => userRegistry);
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

  it('缺少 doc 与 registry 时进入错误态', async () => {
    const { adapter } = recordingAdapter();
    const pool = useResources({ server: 'https://api.test', request: adapter });
    await flush();
    expect(pool.state.status).toBe('error');
    expect((pool.state.error as Error).message).toContain('doc');
  });
});
