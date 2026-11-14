import { describe, expect, it } from 'vitest';
import { createValidator } from '../../index';
import type { Schema } from '@cumquat/core';

function model(properties: Record<string, Schema>, required: string[] = []): Schema {
  const schema: Schema = { type: 'object', properties };
  if (required.length > 0) schema.required = required;
  return schema;
}

describe('createValidator', () => {
  it('必填与空值语义：0 与 false 不算空', async () => {
    const validator = createValidator(
      model(
        {
          name: { type: 'string', title: '名称' },
          count: { type: 'number', title: '数量' },
          enabled: { type: 'boolean', title: '启用' },
        },
        ['name', 'count', 'enabled'],
      ),
    );

    const result = await validator.validate({ name: '', count: 0, enabled: false });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBe('名称不能为空');
    expect(result.errors.count).toBeUndefined();
    expect(result.errors.enabled).toBeUndefined();
  });

  it('可选字段的空值跳过其余约束', async () => {
    const validator = createValidator(
      model({ age: { type: 'number', title: '年龄', minimum: 18 } }),
    );

    expect((await validator.validate({ age: undefined })).valid).toBe(true);
    expect((await validator.validate({ age: '' })).valid).toBe(true);
  });

  it('类型、枚举与日期', async () => {
    const validator = createValidator(
      model({
        age: { type: 'number', title: '年龄' },
        status: { type: 'integer', title: '状态', enum: [1, 0] },
        birthday: { type: 'string', title: '生日', format: 'date' },
      }),
    );

    let result = await validator.validate({
      age: '18',
      status: 2,
      birthday: '2024-01-01',
    });
    expect(result.errors.age).toBe('年龄格式不正确');
    expect(result.errors.status).toBe('状态不在可选范围内');
    expect(result.errors.birthday).toBeUndefined();

    result = await validator.validate({ age: 18, status: 1, birthday: Date.now() });
    expect(result.valid).toBe(true);

    result = await validator.validate({ birthday: 'not-a-date' });
    expect(result.errors.birthday).toBe('生日格式不正确');
  });

  it('数值边界、排他边界与倍数', async () => {
    const validator = createValidator(
      model({
        score: { type: 'number', title: '分数', minimum: 1, maximum: 10, multipleOf: 0.5 },
      }),
    );

    expect((await validator.validate({ score: 0 })).errors.score).toBe('分数不能小于1');
    expect((await validator.validate({ score: 11 })).errors.score).toBe('分数不能大于10');
    expect((await validator.validate({ score: 3.3 })).errors.score).toBe(
      '分数必须是0.5的倍数',
    );
    expect((await validator.validate({ score: 3.5 })).valid).toBe(true);

    const exclusive = createValidator(
      model({
        score: {
          type: 'number',
          title: '分数',
          exclusiveMinimum: 1,
          exclusiveMaximum: 10,
        },
      }),
    );
    expect((await exclusive.validate({ score: 1 })).errors.score).toBe('分数必须大于1');
    expect((await exclusive.validate({ score: 10 })).errors.score).toBe('分数必须小于10');
  });

  it('字符串长度按码点、pattern 与 format', async () => {
    const validator = createValidator(
      model({
        nickname: {
          type: 'string',
          title: '昵称',
          minLength: 2,
          maxLength: 3,
          pattern: '^[^0-9]+$',
        },
        email: { type: 'string', title: '邮箱', format: 'email' },
      }),
    );

    expect((await validator.validate({ nickname: '😀😀' })).valid).toBe(true);
    expect((await validator.validate({ nickname: 'a' })).errors.nickname).toBe(
      '昵称长度不能少于2个字符',
    );
    expect((await validator.validate({ nickname: 'abcd' })).errors.nickname).toBe(
      '昵称长度不能超过3个字符',
    );
    expect((await validator.validate({ nickname: 'a1' })).errors.nickname).toBe(
      '昵称格式不正确',
    );

    expect((await validator.validate({ email: 'bad' })).errors.email).toBe('邮箱格式不正确');
    expect((await validator.validate({ email: 'a@b.com' })).valid).toBe(true);
  });

  it('数组约束', async () => {
    const validator = createValidator(
      model({
        tags: { type: 'array', minItems: 2, maxItems: 3, uniqueItems: true },
      }),
    );

    expect((await validator.validate({ tags: ['a'] })).errors.tags).toBe('tags至少需要2项');
    expect((await validator.validate({ tags: ['a', 'b', 'c', 'd'] })).errors.tags).toBe(
      'tags最多允许3项',
    );
    expect((await validator.validate({ tags: ['a', 'a'] })).errors.tags).toBe(
      'tags不能包含重复项',
    );
    expect((await validator.validate({ tags: ['a', 'b'] })).valid).toBe(true);
  });

  it('自定义校验、异步与首错即止', async () => {
    const validator = createValidator(
      model({ name: { type: 'string', title: '名称', minLength: 2 } }),
      {
        rules: {
          fields: {
            name: {
              validate: async (value) => (value === 'taken' ? '名称已被占用' : true),
            },
          },
        },
      },
    );

    expect((await validator.validate({ name: 'a' })).errors.name).toBe(
      '名称长度不能少于2个字符',
    );
    expect((await validator.validate({ name: 'taken' })).errors.name).toBe('名称已被占用');
    expect((await validator.validate({ name: 'ok' })).valid).toBe(true);
  });

  it('规则抛错归一化为错误文案', async () => {
    const validator = createValidator(model({ name: { type: 'string' } }), {
      rules: {
        fields: {
          name: {
            validate: () => {
              throw new Error('同步异常');
            },
          },
        },
      },
    });

    expect((await validator.validate({ name: 'x' })).errors.name).toBe('同步异常');
  });

  it('文案优先级：规则 > 模型 > options > 默认', async () => {
    const base = model({ name: { type: 'string', title: '名称' } }, ['name']);

    expect((await createValidator(base).validate({ name: '' })).errors.name).toBe(
      '名称不能为空',
    );
    expect(
      (
        await createValidator(base, { messages: { required: '{label}必填' } }).validate({
          name: '',
        })
      ).errors.name,
    ).toBe('名称必填');
    expect(
      (
        await createValidator(base, {
          rules: { messages: { required: '请填写{label}' } },
          messages: { required: '{label}必填' },
        }).validate({ name: '' })
      ).errors.name,
    ).toBe('请填写名称');
    expect(
      (
        await createValidator(
          model({ name: { type: 'string', title: '名称', minLength: 2 } }),
          { rules: { fields: { name: { message: '规则文案' } } } },
        ).validate({ name: 'a' })
      ).errors.name,
    ).toBe('规则文案');
  });

  it('跨字段检查挂载到 target 或首个字段', async () => {
    const validator = createValidator(
      model({
        start: { type: 'string', title: '开始' },
        end: { type: 'string', title: '结束' },
      }),
      {
        rules: {
          checks: [
            {
              fields: ['end', 'start'],
              validate: (values) =>
                (values.end as string) >= (values.start as string)
                  ? true
                  : '结束时间不能早于开始时间',
            },
          ],
        },
      },
    );

    const result = await validator.validate({ start: '2024-02-01', end: '2024-01-01' });
    expect(result.valid).toBe(false);
    expect(result.errors.end).toBe('结束时间不能早于开始时间');
  });

  it('非法 pattern 在创建期抛错', () => {
    expect(() =>
      createValidator(model({ name: { type: 'string', pattern: '[' } })),
    ).toThrow();
  });
});
