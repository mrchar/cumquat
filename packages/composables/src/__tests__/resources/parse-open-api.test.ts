import { describe, expect, it } from 'vitest';
import { parseOpenApi } from '../../resources/parse-open-api';
import type { ResourceSchema } from '../../resources/types';
import { openApiDoc, swaggerDoc } from './openapi-fixtures';

describe('parseOpenApi（OpenAPI 3.x）', () => {
  const schema: ResourceSchema = parseOpenApi(openApiDoc, { server: 'https://api.example.com/v1' });

  it('按 tag 聚合资源并归类五个操作', () => {
    const users = schema.resources.users;
    expect(users.list).toEqual({ method: 'GET', path: '/users' });
    expect(users.detail).toEqual({ method: 'GET', path: '/users/{id}' });
    expect(users.create).toEqual({ method: 'POST', path: '/users' });
    expect(users.update).toEqual({ method: 'PUT', path: '/users/{id}' });
    expect(users.remove).toEqual({ method: 'DELETE', path: '/users/{id}' });
  });

  it('只读资源仅含声明过的操作', () => {
    const orders = schema.resources.orders;
    expect(orders.list).toEqual({ method: 'GET', path: '/orders' });
    expect(orders.detail).toEqual({ method: 'GET', path: '/orders/{id}' });
    expect(orders.remove).toEqual({ method: 'DELETE', path: '/orders/{id}' });
    expect(orders.create).toBeUndefined();
    expect(orders.update).toBeUndefined();
  });

  it('从列表查询参数识别统一片段命名（分页 / 关键词 / 排序）', () => {
    expect(schema.resources.users.queryNames).toEqual({
      currentPage: 'page',
      pageSize: 'pageSize',
      keyword: 'keyword',
    });
    expect(schema.resources.orders.queryNames).toEqual({
      currentPage: 'current',
      pageSize: 'size',
      sorter: 'sortBy',
    });
  });

  it('识别信封响应：数组属性与总数属性的路径', () => {
    expect(schema.resources.users.response).toEqual({ list: 'records', total: 'total' });
    expect(schema.resources.orders.response).toEqual({ list: 'items', total: 'total' });
  });

  it('字段元数据：名称 / 展示名 / 类型映射 / 枚举选项，非原始类型跳过', () => {
    const fields = schema.resources.users.fields ?? [];
    expect(fields.map((field) => field.name)).toEqual([
      'id',
      'name',
      'email',
      'status',
      'createdAt',
      'birthday',
      'active',
      'score',
    ]);
    const byName = Object.fromEntries(fields.map((field) => [field.name, field]));
    expect(byName.id).toMatchObject({ label: '用户ID', type: 'number', required: true });
    expect(byName.createdAt).toMatchObject({ label: '创建时间', type: 'datetime' });
    expect(byName.birthday).toMatchObject({ label: '生日', type: 'date' });
    expect(byName.active).toMatchObject({ label: '是否启用', type: 'boolean' });
    expect(byName.status).toMatchObject({
      label: '状态',
      type: 'enum',
      options: [
        { label: 'active', value: 'active' },
        { label: 'disabled', value: 'disabled' },
      ],
    });
  });

  it('场景标记：列表响应、创建 / 更新请求体、查询参数筛选与 required', () => {
    const byName = Object.fromEntries(
      (schema.resources.users.fields ?? []).map((field) => [field.name, field]),
    );
    expect(byName.name.scope).toEqual({ list: true, create: true, update: true });
    expect(byName.name.required).toBe(true);
    expect(byName.email.scope).toEqual({ list: true, create: true, update: true });
    expect(byName.status.scope).toEqual({ list: true, filter: true, create: true, update: true });
    expect(byName.id.scope).toEqual({ list: true });
    expect(byName.createdAt.scope).toEqual({ list: true });
  });

  it('未在响应 schema 出现的筛选参数新建为筛选字段', () => {
    // orders 的 status 查询参数与响应字段同名，走合并；此处验证 orders 字段场景
    const orders = schema.resources.orders;
    const byName = Object.fromEntries((orders.fields ?? []).map((field) => [field.name, field]));
    expect(byName.status.scope).toEqual({ list: true, filter: true });
    expect(byName.status.options).toEqual([
      { label: '0', value: 0 },
      { label: '1', value: 1 },
      { label: '2', value: 2 },
    ]);
    // 无描述的字段回落字段名
    expect(byName.id.label).toBe('id');
  });
});

describe('parseOpenApi（Swagger 2.0）', () => {
  const schema: ResourceSchema = parseOpenApi(swaggerDoc, { server: 'https://petstore.example.com' });

  it('支持 definitions 引用与 in:body 请求参数', () => {
    const pets = schema.resources.pets;
    expect(pets.list).toEqual({ method: 'GET', path: '/pets' });
    expect(pets.detail).toEqual({ method: 'GET', path: '/pets/{petId}' });
    expect(pets.create).toEqual({ method: 'POST', path: '/pets' });
    expect(pets.remove).toEqual({ method: 'DELETE', path: '/pets/{petId}' });
    expect(pets.update).toBeUndefined();
  });

  it('识别 limit 命名与 kind 枚举筛选', () => {
    const pets = schema.resources.pets;
    expect(pets.queryNames).toEqual({ currentPage: 'page', pageSize: 'limit' });
    const byName = Object.fromEntries((pets.fields ?? []).map((field) => [field.name, field]));
    expect(byName.kind.scope).toEqual({ list: true, filter: true, create: true });
    expect(byName.kind.options).toEqual([
      { label: 'cat', value: 'cat' },
      { label: 'dog', value: 'dog' },
    ]);
    expect(byName.name.scope).toEqual({ list: true, create: true });
    expect(byName.name.required).toBe(true);
    // 数组与对象类型不进入元数据
    expect(pets.fields?.map((field) => field.name)).toEqual(['id', 'name', 'kind']);
    expect(pets.response).toEqual({ list: 'records', total: 'total' });
  });
});

describe('parseOpenApi（异常输入）', () => {
  it('缺少 paths 的文档抛出错误', () => {
    expect(() => parseOpenApi({})).toThrow('paths');
    expect(() => parseOpenApi(undefined)).toThrow('paths');
  });
});
