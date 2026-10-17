import { describe, expect, it, vi } from 'vitest';
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
  TreeSelect,
} from '../../index';
import type { SelectOption } from '../form-controls/Select.vue';

const wait = (ms = 0) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
    expect(wrapper.find('.cumquat-checkbox__box').classes()).toContain(
      'cumquat-checkbox__box--active',
    );
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

  it('统一 fetch 接收 FetchQuery 并支持分页结果', async () => {
    const fetcher = vi.fn(
      async (query: { keyword?: string }) =>
        ({ list: [`${query.keyword ?? ''}-1`, `${query.keyword ?? ''}-2`], total: 2 }) as const,
    );
    const wrapper = mount(AutoComplete, { props: { fetch: fetcher } });
    await wrapper.find('input').setValue('x');
    await wait(350);
    const lastCall = fetcher.mock.calls.at(-1)?.[0] as { keyword?: string };
    expect(lastCall.keyword).toBe('x');
    const items = wrapper.findAll('.cumquat-autocomplete__option');
    expect(items.map((item) => item.text())).toEqual(['x-1', 'x-2']);
  });

  it('兼容旧签名 (keyword) => Promise<string[]>', async () => {
    const fetcher = vi.fn(async (word: string) => [word.toUpperCase()]);
    const wrapper = mount(AutoComplete, { props: { fetch: fetcher } });
    await wrapper.find('input').setValue('ab');
    await wait(350);
    // 旧函数收到的参数字符串方法依旧可用
    const arg = fetcher.mock.calls.at(-1)?.[0];
    expect(String(arg).trim()).toBe('ab');
    expect(wrapper.find('.cumquat-autocomplete__option').text()).toBe('AB');
  });

  it('远程失败展示重试并可恢复', async () => {
    let failed = true;
    const fetcher = vi.fn(async (word: string) => {
      if (failed) throw new Error('boom');
      return [`ok-${word}`];
    });
    const wrapper = mount(AutoComplete, { props: { fetch: fetcher } });
    await wrapper.find('input').setValue('q');
    await wait(350);
    expect(wrapper.find('.cumquat-autocomplete__state.cq-state--error').exists()).toBe(true);
    failed = false;
    await wrapper.find('.cumquat-autocomplete__retry').trigger('mousedown');
    await wait(350);
    expect(wrapper.find('.cumquat-autocomplete__option').text()).toBe('ok-q');
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

  it('fetch 挂载即请求并渲染远程选项', async () => {
    const fetcher = vi.fn(async () => [
      { label: '远程一', value: 'r1' },
      { label: '远程二', value: 'r2' },
    ]);
    const wrapper = mount(Select, { props: { fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0].keyword).toBe('');
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(2);
  });

  it('输入关键词防抖重取并携带 keyword', async () => {
    const fetcher = vi.fn(async (query: { keyword?: string }) =>
      query.keyword
        ? [{ label: `匹配-${query.keyword}`, value: 'x' }]
        : [{ label: '默认项', value: 'd' }],
    );
    const wrapper = mount(Select, { props: { fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wrapper.find('.cumquat-select__search').setValue('北');
    await wait(350);
    expect(fetcher.mock.calls.at(-1)?.[0].keyword).toBe('北');
    await wait();
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(1);
    expect(wrapper.find('.cumquat-select__option').text()).toContain('匹配-北');
  });

  it('加载失败展示重试，点击后恢复', async () => {
    let failed = true;
    const fetcher = vi.fn(async () => {
      if (failed) throw new Error('boom');
      return [{ label: '恢复项', value: 'ok' }];
    });
    const wrapper = mount(Select, { props: { fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wait();
    expect(wrapper.find('.cumquat-select__error').exists()).toBe(true);
    failed = false;
    await wrapper.find('.cumquat-select__retry').trigger('click');
    await wait();
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(1);
    expect(wrapper.find('.cumquat-select__option').text()).toContain('恢复项');
  });
});

describe('TreeSelect', () => {
  it('fetch：未标记 leaf 的根节点可展开懒加载子级', async () => {
    interface Node {
      key: string;
      label: string;
      leaf?: boolean;
    }
    const fetcher = vi.fn(async ({ filters }: { filters?: { parentKey?: string } }) =>
      filters?.parentKey
        ? ([{ key: 'a1', label: '远程子节点', leaf: true }] as Node[])
        : ([{ key: 'a', label: '远程父节点' }] as Node[]),
    );
    const wrapper = mount(TreeSelect, { props: { fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-tree-select__trigger').trigger('click');
    expect(wrapper.find('.cumquat-tree-select__expander').exists()).toBe(true);
    await wrapper.find('.cumquat-tree-select__expander').trigger('click');
    await wait();
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].filters).toEqual({ parentKey: 'a' });
    const nodes = wrapper.findAll('.cumquat-tree-select__leaf');
    expect(nodes.some((node) => node.text().includes('远程子节点'))).toBe(true);
  });
});
