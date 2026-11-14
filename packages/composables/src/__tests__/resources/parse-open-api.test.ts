import { describe, expect, it } from 'vitest';
import { parseOpenApi } from '../../resources/parse-open-api';
import type { Registry, Schema } from '@cumquat/core';
import { openApiDoc, swaggerDoc } from './openapi-fixtures';

/** 资源属性表转名称索引 */
function propsOf(registry: Registry, name: string): Record<string, Schema> {
  return registry.resources[name].schema.properties ?? {};
}

describe('parseOpenApi（OpenAPI 3.x）', () => {
  const registry: Registry = parseOpenApi(openApiDoc, { server: 'https://api.example.com/v1' });

  it('按 tag 聚合资源并归类五个操作', () => {
    const users = registry.resources.users;
    expect(users.name).toBe('users');
    expect(users.list).toEqual({ method: 'GET', path: '/users' });
    expect(users.detail).toEqual({ method: 'GET', path: '/users/{id}' });
    expect(users.create).toEqual({ method: 'POST', path: '/users' });
    expect(users.update).toEqual({ method: 'PUT', path: '/users/{id}' });
    expect(users.remove).toEqual({ method: 'DELETE', path: '/users/{id}' });
  });

  it('只读资源仅含声明过的操作', () => {
    const orders = registry.resources.orders;
    expect(orders.list).toEqual({ method: 'GET', path: '/orders' });
    expect(orders.detail).toEqual({ method: 'GET', path: '/orders/{id}' });
    expect(orders.remove).toEqual({ method: 'DELETE', path: '/orders/{id}' });
    expect(orders.create).toBeUndefined();
    expect(orders.update).toBeUndefined();
  });

  it('从列表查询参数识别统一片段命名（分页 / 关键词 / 排序）', () => {
    expect(registry.resources.users.queryNames).toEqual({
      page: 'page',
      size: 'pageSize',
      keyword: 'keyword',
    });
    expect(registry.resources.orders.queryNames).toEqual({
      page: 'current',
      size: 'size',
      sorter: 'sortBy',
    });
  });

  it('识别信封响应：数组、页码、页大小与总数属性的路径', () => {
    expect(registry.resources.users.response).toEqual({
      list: 'records',
      page: undefined,
      size: undefined,
      total: 'total',
    });
    expect(registry.resources.orders.response).toEqual({
      list: 'items',
      page: undefined,
      size: undefined,
      total: 'total',
    });
  });

  it('属性定义保留 title / description / example，视图层再据此生成 label 与 help', () => {
    const users = propsOf(registry, 'users');
    expect(users.id.title).toBe('用户ID');
    expect(users.id.description).toBe('用户唯一标识');
    expect(users.id.example).toBe(1001);
    expect(users.email.title).toBe('邮箱');
    expect(users.email.description).toBe('联系邮箱');
    expect(users.email.example).toBe('zhangsan@example.com');
    // 未声明 title 时不补造，label 由视图层回落字段名
    expect(propsOf(registry, 'orders').id.title).toBeUndefined();
  });

  it('类型定义严格使用 JSON Schema 词汇并保留 format', () => {
    const users = propsOf(registry, 'users');
    expect(users.id).toMatchObject({ type: 'integer' });
    expect(users.email).toMatchObject({ type: 'string', format: 'email' });
    expect(users.website).toMatchObject({ type: 'string', format: 'uri' });
    expect(users.score).toMatchObject({ type: 'number', format: 'int64' });
    expect(users.createdAt).toMatchObject({ type: 'string', format: 'date-time' });
    expect(users.birthday).toMatchObject({ type: 'string', format: 'date' });
    expect(users.active).toMatchObject({ type: 'boolean' });
    // 结构型字段保留原始类型，不再被丢弃
    expect(users.profile).toMatchObject({ type: 'object', description: '扩展信息' });
    expect(users.name.format).toBeUndefined();
  });

  it('约束定义保留在字段上，不再翻译为独立规则表', () => {
    const users = propsOf(registry, 'users');
    expect(users.name).toMatchObject({ type: 'string', minLength: 2, maxLength: 20 });
    expect(users.status.enum).toEqual(['active', 'disabled']);
    expect('rules' in registry.resources.users.schema).toBe(false);
  });

  it('场景标记：列表响应、创建 / 更新请求体、查询参数筛选', () => {
    const hints = registry.resources.users.hints;
    expect(hints?.name?.scope).toEqual({ list: true, create: true, update: true });
    expect(hints?.email?.scope).toEqual({ list: true, create: true, update: true });
    expect(hints?.status?.scope).toEqual({
      list: true,
      filter: true,
      create: true,
      update: true,
    });
    expect(hints?.id?.scope).toEqual({ list: true });
    expect(hints?.createdAt?.scope).toEqual({ list: true });
  });

  it('对象级 required 汇总 create / update 请求体，取并集', () => {
    expect(registry.resources.users.schema.required).toEqual(['name']);
  });

  it('兼容 OpenAPI 3.0 布尔与 3.1 数值排他边界', () => {
    const parse = (schema: Record<string, unknown>) =>
      parseOpenApi(
        {
          openapi: '3.0.3',
          paths: {
            '/things': {
              post: {
                tags: ['things'],
                requestBody: {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'object',
                        required: ['price'],
                        properties: { price: schema },
                      },
                    },
                  },
                },
                responses: { '200': { description: 'ok' } },
              },
            },
          },
        },
        { server: 'https://api.test' },
      );

    const v30 = parse({
      type: 'number',
      minimum: 0,
      maximum: 100,
      exclusiveMinimum: true,
      exclusiveMaximum: false,
    });
    expect(v30.resources.things.schema.properties?.price).toMatchObject({
      type: 'number',
      exclusiveMinimum: 0,
      maximum: 100,
    });
    expect(v30.resources.things.schema.required).toEqual(['price']);

    const v31 = parse({ type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 });
    expect(v31.resources.things.schema.properties?.price).toMatchObject({
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
    });
  });

  it('type 数组归一为单类型 + nullable', () => {
    const registry = parseOpenApi(
      {
        openapi: '3.1.0',
        paths: {
          '/things': {
            get: {
              tags: ['things'],
              responses: {
                '200': {
                  content: {
                    'application/json': {
                      schema: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            note: { type: ['string', 'null'], title: '备注' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      { server: 'https://api.test' },
    );
    expect(registry.resources.things.schema.properties?.note).toMatchObject({
      type: 'string',
      nullable: true,
    });
  });

  it('未在响应 schema 出现的筛选参数新建为筛选字段', () => {
    const orders = registry.resources.orders;
    const byName = propsOf(registry, 'orders');
    expect(orders.hints?.status?.scope).toEqual({ list: true, filter: true });
    expect(byName.status.enum).toEqual([0, 1, 2]);
    expect(orders.schema.required).toBeUndefined();
  });
});

describe('parseOpenApi（Swagger 2.0）', () => {
  const registry: Registry = parseOpenApi(swaggerDoc, {
    server: 'https://petstore.example.com',
  });

  it('支持 definitions 引用与 in:body 请求参数', () => {
    const pets = registry.resources.pets;
    expect(pets.list).toEqual({ method: 'GET', path: '/pets' });
    expect(pets.detail).toEqual({ method: 'GET', path: '/pets/{petId}' });
    expect(pets.create).toEqual({ method: 'POST', path: '/pets' });
    expect(pets.remove).toEqual({ method: 'DELETE', path: '/pets/{petId}' });
    expect(pets.update).toBeUndefined();
  });

  it('识别 limit 命名与 kind 枚举筛选', () => {
    const pets = registry.resources.pets;
    expect(pets.queryNames).toEqual({ page: 'page', size: 'limit' });
    const byName = propsOf(registry, 'pets');
    expect(pets.hints?.kind?.scope).toEqual({ list: true, filter: true, create: true });
    expect(byName.kind.enum).toEqual(['cat', 'dog']);
    expect(pets.hints?.name?.scope).toEqual({ list: true, create: true });
    expect(byName.homepage).toMatchObject({ type: 'string', format: 'uri' });
    expect(byName.tags).toMatchObject({ type: 'array', items: { type: 'string' } });
    expect(byName.owner).toMatchObject({ type: 'object' });
    expect(pets.response).toEqual({ list: 'records', total: 'total' });
    expect(pets.schema.required).toEqual(['name']);
  });
});

describe('parseOpenApi（异常输入）', () => {
  it('缺少 paths 的文档抛出错误', () => {
    expect(() => parseOpenApi({})).toThrow('paths');
    expect(() => parseOpenApi(undefined)).toThrow('paths');
  });
});
