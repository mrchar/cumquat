import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';
import type { FormRule } from '../../index';
import { useForm } from '../../index';

function mountForm(options: Parameters<typeof useForm>[0] = {}) {
  const ref = shallowRef<ReturnType<typeof useForm>>();
  const Host = defineComponent({
    setup() {
      ref.value = useForm(options as never);
      return () => h('form');
    },
  });
  const wrapper = mount(Host);
  return { form: ref.value!, wrapper };
}

describe('useForm', () => {
  it('初始值聚合与 setFieldValue', () => {
    const { form } = mountForm({
      defaultValue: { name: 'tom', age: 18 },
    });
    expect(form.values.name).toBe('tom');
    form.setFieldValue('name', 'jerry');
    expect(form.values.name).toBe('jerry');
  });

  it('规则校验：失败写入 errors，全部通过 validate 返回 true', async () => {
    const required: FormRule = (v) => (v ? true : '必填');
    const { form } = mountForm({
      defaultValue: { name: '', age: 1 },
      rules: { name: required },
    });
    const result = await form.validateField('name');
    expect(result).toBe('必填');
    expect(form.errors.name).toBe('必填');
    expect(await form.validate()).toBe(false);

    form.setFieldValue('name', 'ok');
    expect(await form.validate()).toBe(true);
    expect(form.valid.value).toBe(true);
  });

  it('异步规则与抛错归一', async () => {
    const asyncRule: FormRule = async (v) => (v === 'ok' ? true : '异步失败');
    const throwing: FormRule = () => {
      throw new Error('同步异常');
    };
    const { form } = mountForm({
      defaultValue: { a: '', b: '' },
      rules: { a: asyncRule, b: throwing },
    });
    expect(await form.validateField('a')).toBe('异步失败');
    expect(await form.validateField('b')).toBe('同步异常');
  });

  it('submit 校验失败触发 onInvalid，通过触发 onSubmit', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const { form } = mountForm({
      defaultValue: { name: '' },
      rules: { name: (v) => (v ? true : '必填') },
      onSubmit,
      onInvalid,
    });
    await form.submit();
    expect(onInvalid).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();

    form.setFieldValue('name', 'x');
    await form.submit();
    expect(onSubmit).toHaveBeenCalledWith({ name: 'x' });
  });

  it('reset 回到初始快照并清理错误', async () => {
    const { form } = mountForm({
      defaultValue: { name: 'a' },
      rules: { name: (v) => (v ? true : '必填') },
    });
    form.setFieldValue('name', '');
    await form.validate();
    expect(form.errors.name).toBe('必填');
    form.reset();
    expect(form.values.name).toBe('a');
    expect(form.errors.name).toBeUndefined();
    expect(form.dirty.value).toBe(false);
  });

  it('clearValidate 清理错误', async () => {
    const { form } = mountForm({
      defaultValue: { name: '' },
      rules: { name: () => 'x' },
    });
    await form.validate();
    expect(form.errors.name).toBe('x');
    form.clearValidate('name');
    expect(form.errors.name).toBeUndefined();
  });

  it('字段注册与注销', () => {
    const { form } = mountForm({ defaultValue: {} });
    const unregister = form.registerField('f1', {
      validate: () => true,
      reset: () => {},
      clearValidate: () => {},
      getValue: () => 42,
    });
    expect(form.values.f1).toBe(42);
    unregister();
    // 注销后 map 中移除（再次注册不冲突）
    const again = form.registerField('f1', {
      validate: () => true,
      reset: () => {},
      clearValidate: () => {},
    });
    expect(typeof again).toBe('function');
  });
});
