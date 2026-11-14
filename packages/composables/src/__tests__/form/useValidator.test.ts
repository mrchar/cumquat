import { describe, expect, it } from 'vitest';
import { nextTick, ref } from 'vue';
import { useValidator } from '../../index';
import type { Schema } from '@cumquat/core';

function model(required: string[] = []): Schema {
  const schema: Schema = {
    type: 'object',
    properties: { name: { type: 'string', title: '名称' } },
  };
  if (required.length > 0) schema.required = required;
  return schema;
}

describe('useValidator', () => {
  it('校验后写入 errors 并提供 valid / result', async () => {
    const validator = useValidator(model(['name']));

    expect(validator.valid.value).toBe(true);

    const result = await validator.validate({ name: '' });
    expect(result).toEqual({ valid: false, errors: { name: '名称不能为空' } });
    expect(validator.errors.name).toBe('名称不能为空');
    expect(validator.valid.value).toBe(false);

    await validator.validate({ name: 'ok' });
    expect(validator.errors.name).toBeUndefined();
    expect(validator.valid.value).toBe(true);
  });

  it('validateField 只更新目标字段', async () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        name: { type: 'string', title: '名称' },
        email: { type: 'string', title: '邮箱' },
      },
      required: ['name', 'email'],
    };
    const validator = useValidator(schema);

    expect(await validator.validateField('name', { name: '', email: '' })).toBe(
      '名称不能为空',
    );
    expect(validator.errors.name).toBe('名称不能为空');
    expect(validator.errors.email).toBeUndefined();
  });

  it('schema 替换后清空错误', async () => {
    const schema = ref<Schema | undefined>(model(['name']));
    const validator = useValidator(schema);

    await validator.validate({ name: '' });
    expect(validator.errors.name).toBe('名称不能为空');

    schema.value = model([]);
    await nextTick();

    expect(validator.errors.name).toBeUndefined();
    expect(validator.valid.value).toBe(true);
  });

  it('过期异步结果被丢弃', async () => {
    let resolveFirst!: (message: string) => void;
    const first = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });
    let calls = 0;

    const validator = useValidator(model([]), {
      rules: {
        fields: {
          name: {
            validate: async () => {
              calls += 1;
              return calls === 1 ? first : '第二次失败';
            },
          },
        },
      },
    });

    const firstRun = validator.validate({ name: 'x' });
    const second = await validator.validate({ name: 'x' });
    expect(second.errors.name).toBe('第二次失败');

    resolveFirst('第一次失败');
    await firstRun;

    expect(validator.errors.name).toBe('第二次失败');
    expect(validator.valid.value).toBe(false);
  });

  it('validating 在完成后复位', async () => {
    const validator = useValidator(model(['name']));

    const run = validator.validate({ name: '' });
    expect(validator.validating.value).toBe(true);
    await run;
    expect(validator.validating.value).toBe(false);
  });

  it('reset 清空状态', async () => {
    const validator = useValidator(model(['name']));

    await validator.validate({ name: '' });
    expect(validator.valid.value).toBe(false);

    validator.reset();
    expect(validator.errors.name).toBeUndefined();
    expect(validator.valid.value).toBe(true);
    expect(validator.validating.value).toBe(false);
  });
});
