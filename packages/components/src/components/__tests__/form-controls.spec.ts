import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  Checkbox,
  Radio,
  Switch,
  InputNumber,
  Rate,
  Segmented,
  AutoComplete,
  Mention,
  Select,
} from '../../index';
import type { SelectOption } from '../form-controls/Select.vue';

describe('Switch', () => {
  it('点击切换 aria-checked', async () => {
    const wrapper = mount(Switch);
    expect(wrapper.attributes('aria-checked')).toBe('false');
    await wrapper.trigger('click');
    expect(wrapper.attributes('aria-checked')).toBe('true');
  });
});

describe('Checkbox', () => {
  it('点击切换选中', async () => {
    const wrapper = mount(Checkbox, { props: { label: '同意' } });
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
  });

  it('indeterminate 态显示横线', () => {
    const wrapper = mount(Checkbox, { props: { indeterminate: true } });
    expect(wrapper.find('.cumquat-checkbox__box').classes()).toContain('bg-cumquat-accent');
  });
});

describe('Radio', () => {
  it('选中值联动', async () => {
    const wrapper = mount(Radio, { props: { value: 'a', label: '选项A' } });
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a']);
  });
});

describe('InputNumber', () => {
  it('步进按钮更新数值', async () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 5, min: 0, max: 10 } });
    await wrapper.find('.cumquat-input-number__increase').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([6]);
    await wrapper.find('.cumquat-input-number__decrease').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([5]);
  });

  it('超过 max 后增加按钮禁用', () => {
    const wrapper = mount(InputNumber, { props: { modelValue: 10, min: 0, max: 10 } });
    expect(wrapper.find('.cumquat-input-number__increase').attributes('disabled')).toBeDefined();
  });
});

describe('Rate', () => {
  it('点击星星更新评分', async () => {
    const wrapper = mount(Rate);
    await wrapper.findAll('.cumquat-rate__star')[3].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4]);
  });
});

describe('Segmented', () => {
  const options = [
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
  ];

  it('点击切换激活项', async () => {
    const wrapper = mount(Segmented, { props: { options, modelValue: 'day' } });
    await wrapper.findAll('.cumquat-segmented__item')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['week']);
  });
});

describe('AutoComplete', () => {
  it('输入过滤联想项', async () => {
    const wrapper = mount(AutoComplete, { props: { options: ['apple', 'banana', 'cherry'] } });
    await wrapper.find('input').setValue('an');
    await wrapper.find('input').trigger('focus');
    const items = wrapper.findAll('.cumquat-autocomplete__option');
    expect(items).toHaveLength(1);
    expect(items[0].text()).toBe('banana');
  });
});

describe('Mention', () => {
  it('输入 @ 唤起候选', async () => {
    const wrapper = mount(Mention, { props: { members: ['Amber', 'Bolt'] } });
    await wrapper.find('input').setValue('hi @');
    await wrapper.find('input').trigger('input');
    expect(wrapper.findAll('.cumquat-mention__option')).toHaveLength(2);
  });
});

describe('Select', () => {
  const options: SelectOption[] = [
    { label: '北京', value: 'bj' },
    { label: '上海', value: 'sh' },
  ];

  it('展开下拉并选择选项', async () => {
    const wrapper = mount(Select, { props: { options } });
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    expect(wrapper.find('.cumquat-select__dropdown').exists()).toBe(true);
    await wrapper.findAll('.cumquat-select__option')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['sh']);
    expect(wrapper.find('.cumquat-select__dropdown').exists()).toBe(false);
  });

  it('选中项回显 label', () => {
    const wrapper = mount(Select, { props: { options, modelValue: 'bj' } });
    expect(wrapper.find('.cumquat-select__trigger').text()).toContain('北京');
  });
});
