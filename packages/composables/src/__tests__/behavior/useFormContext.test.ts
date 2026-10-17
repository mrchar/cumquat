import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import {
  injectForm,
  injectFormField,
  provideForm,
  provideFormField,
  type FormContext,
  type FormFieldContext,
} from '../../index';

describe('useFormContext', () => {
  it('后代组件可 injectForm，表外为 undefined', () => {
    let injected: FormContext | undefined;
    const Child = defineComponent({
      setup() {
        injected = injectForm();
        return () => h('span');
      },
    });
    const submit = vi.fn();
    const registerField = vi.fn(() => () => {});
    const form: FormContext = {
      values: { name: 'a' },
      errors: {},
      registerField,
      submit,
      reset: () => {},
    };
    const Parent = defineComponent({
      setup() {
        provideForm(form);
        return () => h(Child);
      },
    });

    mount(Parent);
    expect(injected).toBe(form);
    expect(injected?.values.name).toBe('a');

    mount(Child);
    expect(injected).toBeUndefined();
  });

  it('字段上下文 provide/inject 链路完整', () => {
    let injected: FormFieldContext | undefined;
    const Control = defineComponent({
      setup() {
        injected = injectFormField();
        return () => h('input');
      },
    });
    const Item = defineComponent({
      setup() {
        provideFormField({
          name: 'email',
          touched: true,
          fieldId: 'cq-field-1',
          error: '格式错误',
        });
        return () => h(Control);
      },
    });

    mount(Item);
    expect(injected?.name).toBe('email');
    expect(injected?.error).toBe('格式错误');
    expect(injected?.fieldId).toBe('cq-field-1');
  });
});
