import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, shallowRef } from 'vue';
import { mount } from '@vue/test-utils';
import { useForm, useFormField } from '../../index';

/** 在表单内挂载一个字段，返回表单与字段模型引用 */
function mountField(options: Parameters<typeof useFormField>[0] = {}) {
  const formRef = shallowRef<ReturnType<typeof useForm>>();
  const fieldRef = shallowRef<ReturnType<typeof useFormField>>();
  const Field = defineComponent({
    setup() {
      fieldRef.value = useFormField(options);
      return () => h('input');
    },
  });
  const Form = defineComponent({
    setup() {
      formRef.value = useForm({
        defaultValue: { name: '' },
        rules: { name: (v) => (v ? true : '表单规则：必填') },
      });
      return () => h('form', [h(Field)]);
    },
  });
  mount(Form);
  return { form: formRef.value!, field: fieldRef.value! };
}

describe('useFormField', () => {
  it('change 回写整表聚合值', () => {
    const { form, field } = mountField({ name: 'name' });
    field.handleChange('hello');
    expect(form.values.name).toBe('hello');
    expect(field.value.value).toBe('hello');
  });

  it('blur 触发校验并写入字段与表单错误', async () => {
    const { form, field } = mountField({ name: 'name' });
    field.handleBlur();
    await vi.waitFor(() => expect(field.error.value).toBe('表单规则：必填'));
    expect(form.errors.name).toBe('表单规则：必填');
    expect(field.valid.value).toBe(false);
  });

  it('触碰后 change 自动重新校验直至通过', async () => {
    const { field } = mountField({ name: 'name' });
    field.handleBlur();
    await vi.waitFor(() => expect(field.error.value).toBeTruthy());
    field.handleChange('tom');
    await vi.waitFor(() => expect(field.error.value).toBeUndefined());
  });

  it('字段级规则与表单规则合并（表单规则先执行）', async () => {
    const formRef = shallowRef<ReturnType<typeof useForm>>();
    const fieldRef = shallowRef<ReturnType<typeof useFormField>>();
    const Field = defineComponent({
      setup() {
        fieldRef.value = useFormField({
          name: 'name',
          rules: [(v: unknown) => (String(v).length >= 3 ? true : '至少3个字符')],
        });
        return () => h('input');
      },
    });
    const Form = defineComponent({
      setup() {
        formRef.value = useForm({ defaultValue: { name: '' } });
        return () => h('form', [h(Field)]);
      },
    });
    mount(Form);
    fieldRef.value!.handleChange('ab');
    fieldRef.value!.handleBlur();
    await vi.waitFor(() => expect(fieldRef.value!.error.value).toBe('至少3个字符'));
    fieldRef.value!.handleChange('abc');
    await vi.waitFor(() => expect(fieldRef.value!.error.value).toBeUndefined());
  });

  it('reset 还原初值与状态', async () => {
    const { field } = mountField({
      name: 'name',
      defaultValue: 'init',
    });
    field.handleChange('changed');
    expect(field.value.value).toBe('changed');
    field.reset();
    expect(field.value.value).toBe('init');
    expect(field.touched.value).toBe(false);
    expect(field.error.value).toBeUndefined();
  });

  it('aria 描述集合随错误变化', async () => {
    const { field } = mountField({ name: 'name' });
    expect(field.aria.value['aria-invalid']).toBeUndefined();
    field.handleBlur();
    await vi.waitFor(() => expect(field.aria.value['aria-invalid']).toBe(true));
    expect(typeof field.aria.value['aria-describedby']).toBe('string');
  });

  it('表外独立使用：无表单也能校验自有规则', async () => {
    const fieldRef = shallowRef<ReturnType<typeof useFormField>>();
    const Host = defineComponent({
      setup() {
        fieldRef.value = useFormField({
          defaultValue: '',
          rules: [(v: unknown) => (v ? true : '必填')],
        });
        return () => h('input');
      },
    });
    mount(Host);
    fieldRef.value!.handleBlur();
    await vi.waitFor(() => expect(fieldRef.value!.error.value).toBe('必填'));
  });
});
