import { describe, expect, expectTypeOf, it } from 'vitest';
import type { Converter, Model, Registry, Resource, Schema, View } from '../index';

describe('schema 三层模型', () => {
  it('Schema 组合属性、类型、约束三层定义', () => {
    const field: Schema = {
      title: '标题',
      description: '文章标题',
      type: 'string',
      maxLength: 80,
    };
    const schema: Schema = {
      type: 'object',
      properties: { title: field },
      required: ['title'],
    };
    const model: Model = { name: 'article', schema };
    const resource: Resource = { ...model, list: { method: 'GET', path: '/articles' } };
    const registry: Registry = { resources: { article: resource } };

    expect(schema.properties?.title?.type).toBe('string');
    expect(schema.required).toEqual(['title']);
    expect(registry.resources.article.schema.properties?.title?.maxLength).toBe(80);
  });

  it('View 以 label / component / validation 表达视图层', () => {
    const view: View = {
      name: 'title',
      label: '标题',
      component: 'input',
      validation: { required: true, rules: [{ validate: () => true }] },
    };

    expectTypeOf<View>().toHaveProperty('label');
    expectTypeOf<View>().toHaveProperty('component');
    expectTypeOf<View>().toHaveProperty('validation');
    expect(view.validation.required).toBe(true);
  });

  it('Converter 描述 schema → 视图的转换契约', () => {
    const converter: Converter = {
      toField: (_name, _field, context) => ({
        name: context.name,
        label: context.name,
        component: 'input',
        validation: { required: context.required, rules: [] },
      }),
      toFields: () => [],
    };
    const schema: Schema = { properties: {} };

    expect(converter.toFields(schema)).toEqual([]);
  });
});
