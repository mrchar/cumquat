import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h, nextTick } from 'vue';
import {
  Checkbox,
  Form,
  FormItem,
  Input,
  Radio,
  RadioGroup,
  Switch,
  InputNumber,
  Rate,
  Segmented,
  Slider,
  AutoComplete,
  Mention,
  Select,
  TreeSelect,
  VoiceButton,
  registerField,
} from '../../index';
import type { FieldRenderer, FormFieldMeta } from '../../index';
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

  it('action 成功：勾选新值生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Checkbox, { props: { action } });
    await wrapper.find('input').setValue(true);
    await wait();
    expect(action).toHaveBeenCalledWith(true);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([true]);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：勾选回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Checkbox, { props: { action } });
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true]);
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
  });
});

describe('Radio', () => {
  it('选中值联动', async () => {
    const wrapper = mount(Radio, { props: { value: 'a', label: '选项A' } });
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a']);
  });

  it('action 成功：选中新值生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Radio, { props: { value: 'a', label: '选项A', action } });
    await wrapper.find('input').setValue(true);
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a']);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：选中回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Radio, { props: { value: 'a', label: '选项A', action } });
    await wrapper.find('input').setValue(true);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['a']);
    await wait();
    // 回退到初始 null 时经组件 onChange 语义不再 emit，选中态恢复为未选
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
    expect(wrapper.find('input').element.checked).toBe(false);
  });
});

describe('RadioGroup action', () => {
  const mountGroup = (action?: (...args: unknown[]) => unknown) =>
    mount(RadioGroup, {
      props: { modelValue: 'a', action },
      slots: {
        default: () => [h(Radio, { value: 'a', label: 'A' }), h(Radio, { value: 'b', label: 'B' })],
      },
    });

  it('action 成功：组内切换生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mountGroup(action);
    await wrapper.findAll('input[type=radio]')[1].setValue(true);
    await wait();
    expect(action).toHaveBeenCalledWith('b');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b']);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：组值回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mountGroup(action);
    await wrapper.findAll('input[type=radio]')[1].setValue(true);
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['a']);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
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

  it('action 成功：新评分生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Rate, { props: { modelValue: 2, action } });
    await wrapper.findAll('.cumquat-rate__star')[3].trigger('click');
    await wait();
    expect(action).toHaveBeenCalledWith(4);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([4]);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：评分回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Rate, { props: { modelValue: 2, action } });
    await wrapper.findAll('.cumquat-rate__star')[3].trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([2]);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
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

  it('action 成功：切换生效并等待动作确认', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Segmented, { props: { options, modelValue: 'day', action } });
    await wrapper.findAll('.cumquat-segmented__item')[1].trigger('click');
    await wrapper.setProps({ modelValue: 'week' });
    await wait();
    expect(action).toHaveBeenCalledWith('week');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['week']);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：回退旧分段并触发 actionError', async () => {
    let deny!: (error: Error) => void;
    const action = vi.fn(
      () =>
        new Promise<never>((_resolve, reject) => {
          deny = reject;
        }),
    );
    const wrapper = mount(Segmented, { props: { options, modelValue: 'day', action } });
    await wrapper.findAll('.cumquat-segmented__item')[1].trigger('click');
    // 外部先回写乐观值（模拟 v-model），再让动作失败
    await wrapper.setProps({ modelValue: 'week' });
    deny(new Error('deny'));
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['day']);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
  });
});

describe('Slider action', () => {
  it('action 成功：键盘步进的新值生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Slider, { props: { min: 0, max: 10, action } });
    await wrapper.find('.cumquat-slider__thumb').trigger('keydown', { key: 'ArrowRight' });
    await wait();
    expect(action).toHaveBeenCalledWith(1);
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([1]);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：值回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Slider, { props: { min: 0, max: 10, action } });
    await wrapper.find('.cumquat-slider__thumb').trigger('keydown', { key: 'ArrowRight' });
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0]);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
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

  /** 模拟面板滚动到底部（jsdom 下 scrollHeight/clientHeight 恒为 0，需显式定义） */
  async function scrollToBottom(element: HTMLElement, trigger: () => Promise<void>) {
    Object.defineProperty(element, 'scrollHeight', { value: 600, configurable: true });
    Object.defineProperty(element, 'clientHeight', { value: 240, configurable: true });
    element.scrollTop = 360;
    await trigger();
  }

  function makePagedFetcher(totalPerPage = 2) {
    return vi.fn(async (query: { pagination?: { currentPage: number } }) => {
      const page = query.pagination?.currentPage ?? 1;
      return {
        list: Array.from({ length: totalPerPage }, (_, i) => ({
          label: `第${page}页第${i + 1}项`,
          value: `p${page}-${i + 1}`,
        })),
        total: totalPerPage * 3,
      };
    });
  }

  it('fetch 注入分页参数：首页 currentPage 1，pageSize 可配置', async () => {
    const fetcher = makePagedFetcher();
    mount(Select, { props: { fetch: fetcher, pageSize: 10 } });
    await wait();
    expect(fetcher.mock.calls[0][0].pagination).toEqual({ currentPage: 1, pageSize: 10 });
  });

  it('滚动触底以递增页码取下一页并累积，取完后不再请求', async () => {
    const fetcher = makePagedFetcher();
    const wrapper = mount(Select, { props: { fetch: fetcher, pageSize: 2 } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(2);

    const dropdown = wrapper.find('.cumquat-select__dropdown');
    const element = dropdown.element as HTMLElement;
    await scrollToBottom(element, () => dropdown.trigger('scroll'));
    await wait();
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(4);

    await scrollToBottom(element, () => dropdown.trigger('scroll'));
    await wait();
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(6);

    // total 已取满，再触底不应产生新请求
    await scrollToBottom(element, () => dropdown.trigger('scroll'));
    await wait();
    expect(fetcher.mock.calls.map((call) => call[0].pagination?.currentPage)).toEqual([1, 2, 3]);
  });

  it('跨页重复 value 自动去重', async () => {
    const fetcher = vi.fn(async (query: { pagination?: { currentPage: number } }) => {
      const page = query.pagination?.currentPage ?? 1;
      return {
        list:
          page === 1
            ? [{ label: '甲', value: 'a' }]
            : [
                { label: '甲（重复）', value: 'a' },
                { label: '乙', value: 'b' },
              ],
        total: 3,
      };
    });
    const wrapper = mount(Select, { props: { fetch: fetcher, pageSize: 1 } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    const dropdown = wrapper.find('.cumquat-select__dropdown');
    await scrollToBottom(dropdown.element as HTMLElement, () => dropdown.trigger('scroll'));
    await wait();
    expect(wrapper.findAll('.cumquat-select__option').map((o) => o.text())).toEqual(['甲', '乙']);
  });

  it('关面板回到第 1 页并丢弃累积的翻页数据', async () => {
    const fetcher = makePagedFetcher();
    const wrapper = mount(Select, { props: { fetch: fetcher, pageSize: 2 } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    const dropdown = wrapper.find('.cumquat-select__dropdown');
    await scrollToBottom(dropdown.element as HTMLElement, () => dropdown.trigger('scroll'));
    await wait();
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(4);

    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].pagination?.currentPage).toBe(1);
    expect(wrapper.findAll('.cumquat-select__option')).toHaveLength(2);
  });

  it('单选：数据源被替换后，已选标签靠快照保留', async () => {
    const wrapper = mount(Select, {
      props: {
        state: { status: 'success' as const, data: [{ label: '苹果', value: 'apple' }] },
      },
    });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wrapper.findAll('.cumquat-select__option')[0].trigger('click');
    expect(wrapper.find('.cumquat-select__trigger').text()).toContain('苹果');

    // 数据源被替换为另一次查询的结果，苹果已不在其中
    await wrapper.setProps({
      state: { status: 'success' as const, data: [{ label: '香蕉', value: 'banana' }] },
    });
    await wait();
    // 单选选中后面板已关闭，重新展开查看候选项
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wait();
    expect(wrapper.findAll('.cumquat-select__option').map((o) => o.text())).toEqual(['香蕉']);
    expect(wrapper.find('.cumquat-select__trigger').text()).toContain('苹果');
  });

  it('多选：点击累积为数组值，标签渲染且可移除', async () => {
    const wrapper = mount(Select, { props: { options, multiple: true } });
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    await wrapper.findAll('.cumquat-select__option')[0].trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['bj']]);
    expect(wrapper.findAll('.cumquat-select__tag').map((t) => t.text())).toEqual(['北京']);

    await wrapper.findAll('.cumquat-select__option')[1].trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['bj', 'sh']]);
    expect(wrapper.findAll('.cumquat-select__tag')).toHaveLength(2);

    await wrapper.find('.cumquat-select__tag-close').trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([['sh']]);
    expect(wrapper.findAll('.cumquat-select__tag').map((t) => t.text())).toEqual(['上海']);
  });

  it('多选 + fetch：渲染搜索框且过滤交由服务端', async () => {
    const fetcher = vi.fn(async () => [{ label: '项一', value: 'x1' }]);
    const wrapper = mount(Select, { props: { multiple: true, fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    expect(wrapper.find('.cumquat-select__search').exists()).toBe(true);
    await wrapper.find('.cumquat-select__search').setValue('项');
    await wait(350);
    expect(fetcher.mock.calls.at(-1)?.[0].keyword).toBe('项');
  });

  it('条目达到阈值切虚拟滚动：仅渲染可视窗口并以占位撑高', async () => {
    const many = Array.from({ length: 150 }, (_, i) => ({ label: `项${i}`, value: `v${i}` }));
    const wrapper = mount(Select, {
      props: { state: { status: 'success' as const, data: many } },
    });
    await wait();
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    const rendered = wrapper.findAll('.cumquat-select__option');
    expect(rendered.length).toBeLessThan(150);
    expect(rendered[0].text()).toBe('项0');
    expect(wrapper.find('.cumquat-select__spacer').exists()).toBe(true);
  });

  it('低于阈值保留分组标题且不启用占位', async () => {
    const wrapper = mount(Select, {
      props: {
        options: [
          { label: '苹果', value: 'a', group: '水果' },
          { label: '白菜', value: 'b', group: '蔬菜' },
        ],
      },
    });
    await wrapper.find('.cumquat-select__trigger').trigger('click');
    expect(wrapper.findAll('.cumquat-select__group-title').map((n) => n.text())).toEqual([
      '水果',
      '蔬菜',
    ]);
    expect(wrapper.find('.cumquat-select__spacer').exists()).toBe(false);
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

describe('Form 字段竞选', () => {
  const baseProperties: FormFieldMeta[] = [
    { name: 'name', label: '姓名', type: 'string' },
    { name: 'age', label: '年龄', type: 'number' },
    { name: 'active', label: '启用', type: 'boolean' },
    {
      name: 'status',
      label: '状态',
      type: 'enum',
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'disabled' },
      ],
    },
    { name: 'birthday', label: '生日', type: 'date' },
  ];

  it('type 推断：string→输入框、number→数值、boolean→开关、enum→下拉、date→日期', () => {
    const wrapper = mount(Form, { props: { properties: baseProperties } });
    const items = wrapper.findAll('.cumquat-form-item');
    expect(items).toHaveLength(5);
    expect(items[0].find('.cumquat-form-item__label').text()).toContain('姓名');
    expect(items[0].find('input').exists()).toBe(true);
    expect(items[1].find('.cumquat-input-number').exists()).toBe(true);
    expect(items[2].find('[aria-checked]').exists()).toBe(true);
    expect(items[3].find('.cumquat-select').exists()).toBe(true);
    expect(items[4].find('.cumquat-date-picker').exists()).toBe(true);
  });

  it('format 推断：textarea 多行、email/uri/password 原生输入类型', () => {
    const wrapper = mount(Form, {
      props: {
        properties: [
          { name: 'bio', label: '简介', type: 'string', format: 'textarea' },
          { name: 'email', label: '邮箱', type: 'string', format: 'email' },
          { name: 'site', label: '主页', type: 'string', format: 'uri' },
          { name: 'pwd', label: '密码', type: 'string', format: 'password' },
        ],
      },
    });
    const items = wrapper.findAll('.cumquat-form-item');
    expect(items[0].find('textarea').exists()).toBe(true);
    expect(items[1].find('input[type="email"]').exists()).toBe(true);
    expect(items[2].find('input[type="url"]').exists()).toBe(true);
    expect(items[3].find('input[type="password"]').exists()).toBe(true);
  });

  it('required 派生校验：空提交报错，录入修正即时清除', async () => {
    const wrapper = mount(Form, {
      props: {
        properties: [{ name: 'name', label: '姓名', type: 'string', required: true }],
      },
    });
    await wrapper.find('form').trigger('submit');
    await wait();
    expect(wrapper.find('.cumquat-form-item__error').text()).toBe('姓名不能为空');
    expect(wrapper.emitted('invalid')).toHaveLength(1);
    // 录入修正：写回后自动重新校验并清除错误
    await wrapper.find('input').setValue('Amber');
    await wait();
    expect(wrapper.find('.cumquat-form-item__error').exists()).toBe(false);
  });

  it('自注册控件（Select）同样继承派生必填规则', async () => {
    const wrapper = mount(Form, {
      props: {
        properties: [
          {
            name: 'status',
            label: '状态',
            type: 'enum',
            required: true,
            options: [{ label: '启用', value: 'active' }],
          },
        ],
      },
    });
    await wrapper.find('form').trigger('submit');
    await wait();
    expect(wrapper.find('.cumquat-form-item__error').text()).toBe('状态不能为空');
  });

  it('宿主 rules 按字段名叠加在派生规则之后', async () => {
    const wrapper = mount(Form, {
      props: {
        properties: [{ name: 'name', label: '姓名', type: 'string', required: true }],
        rules: {
          name: (value: unknown) => (value === 'bad' ? '不允许该值' : true),
        },
      },
    });
    await wrapper.find('input').setValue('bad');
    await wrapper.find('form').trigger('submit');
    await wait();
    expect(wrapper.find('.cumquat-form-item__error').text()).toBe('不允许该值');
  });

  it('显式指定 control 跳过竞选', () => {
    const wrapper = mount(Form, {
      props: {
        properties: [{ name: 'status', label: '状态', type: 'enum', control: 'input' }],
      },
    });
    expect(wrapper.find('.cumquat-select').exists()).toBe(false);
    expect(wrapper.find('input').exists()).toBe(true);
  });

  it('bias 加成可翻转竞选结果', () => {
    const wrapper = mount(Form, {
      props: {
        properties: [{ name: 'active', label: '启用', type: 'boolean', bias: { select: 100 } }],
      },
    });
    // switch（90）原本胜出，加成后 select（100）反超
    expect(wrapper.find('[aria-checked]').exists()).toBe(false);
    expect(wrapper.find('.cumquat-select').exists()).toBe(true);
  });

  it('字段插槽优先级最高', () => {
    const wrapper = mount(Form, {
      props: { properties: [{ name: 'name', label: '姓名', type: 'string' }] },
      slots: { 'field-name': '<div class="custom-field">自定义</div>' },
    });
    expect(wrapper.find('.custom-field').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(false);
  });

  it('控件写回整表值并回发 update:modelValue；disabled 整表透传', async () => {
    const wrapper = mount(Form, {
      props: {
        modelValue: { name: '' },
        properties: [{ name: 'name', label: '姓名', type: 'string' }],
      },
    });
    await wrapper.find('input').setValue('Amber');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ name: 'Amber' }]);
    const disabledForm = mount(Form, {
      props: { disabled: true, properties: [{ name: 'name', label: '姓名', type: 'string' }] },
    });
    expect(disabledForm.find('input').attributes('disabled')).toBeDefined();
  });

  it('局部 controls 参与竞选，ResourceField 附加字段（scope）无害', async () => {
    const colorField: FieldRenderer = {
      name: 'color',
      fitness: (field) => (field.format === 'color' ? 95 : 0),
      render: (_value, _field, ctx) =>
        h('div', { class: 'cumquat-field--color-custom', onClick: () => ctx.setValue('#ff0000') }),
    };
    // ResourceField 形状：额外 scope 字段结构兼容
    const properties = [
      { name: 'theme', label: '主题色', type: 'string', format: 'color', scope: { create: true } },
    ] as unknown as FormFieldMeta[];
    const wrapper = mount(Form, { props: { properties, controls: [colorField] } });
    expect(wrapper.find('.cumquat-field--color-custom').exists()).toBe(true);
    await wrapper.find('.cumquat-field--color-custom').trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([{ theme: '#ff0000' }]);
  });

  it('registerField 同名覆盖内建实现，全局生效', () => {
    registerField({
      name: 'switch',
      fitness: (field) => (field.type === 'boolean' ? 90 : 0),
      render: (_value, _field, ctx) =>
        h('div', { class: 'cumquat-field--switch-custom', onClick: () => ctx.setValue(true) }),
    });
    const wrapper = mount(Form, {
      props: { properties: [{ name: 'active', label: '启用', type: 'boolean' }] },
    });
    expect(wrapper.find('.cumquat-field--switch-custom').exists()).toBe(true);
    // 还原内建实现，避免影响同文件后续用例
    registerField({
      name: 'switch',
      fitness: (field) => (field.type === 'boolean' ? 90 : 0),
      render: (value, _field, ctx) =>
        h(Switch, {
          modelValue: value === true,
          'onUpdate:modelValue': (next: boolean) => ctx.setValue(next),
          disabled: ctx.disabled,
        }),
    });
  });

  it('未绑定 properties 时保持既有插槽用法', () => {
    const wrapper = mount(Form, {
      props: { modelValue: { name: 'x' } },
      slots: {
        default: () => h(FormItem, { name: 'name', label: '姓名' }, { default: () => h(Input) }),
      },
    });
    expect(wrapper.findAll('.cumquat-form-item')).toHaveLength(1);
  });
});

describe('VoiceButton', () => {
  const trigger = (wrapper: ReturnType<typeof mount>) =>
    wrapper.find('.cumquat-voice-button__trigger');

  /** jsdom 的 MouseEvent clientX 只读，test-utils 赋值会抛错，改用原生构造分发 */
  const fire = async (
    wrapper: ReturnType<typeof mount>,
    type: string,
    x = 0,
    y = 0,
  ) => {
    trigger(wrapper)
      .element.dispatchEvent(
        new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      );
    await nextTick();
  };

  it('按下后按钮内出现提示文字与声波条，原地松开确认', async () => {
    const wrapper = mount(VoiceButton);
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
    await fire(wrapper, 'pointerdown', 0, 0);
    expect(wrapper.emitted('pressstart')).toHaveLength(1);
    // 提示由按钮本身承担：文字切换 + meter 出现，无气泡
    expect(trigger(wrapper).text()).toContain('松开发送');
    expect(wrapper.find('.cumquat-voice-button__meter').exists()).toBe(true);
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'confirm' }]);
    expect(wrapper.find('.cumquat-voice-button__meter').exists()).toBe(false);
  });

  it('上滑越过阈值进入取消区，按钮文字跟随，松开发出 cancel', async () => {
    const wrapper = mount(VoiceButton);
    await fire(wrapper, 'pointerdown', 100, 200);
    await fire(wrapper, 'pointermove', 100, 100);
    expect(trigger(wrapper).text()).toContain('松开取消');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'cancel' }]);
  });

  it('左滑选中方向功能项，松开携带 key', async () => {
    const wrapper = mount(VoiceButton, {
      props: { actions: [{ key: 'text', label: '转文字' }, { key: 'translate', label: '翻译' }] },
    });
    await fire(wrapper, 'pointerdown', 200, 200);
    await fire(wrapper, 'pointermove', 140, 200);
    expect(trigger(wrapper).text()).toContain('松开转文字');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'action', key: 'text' }]);
  });

  it('右滑选中缺省交替的功能项', async () => {
    const wrapper = mount(VoiceButton, {
      props: { actions: [{ key: 'text', label: '转文字' }, { key: 'translate', label: '翻译' }] },
    });
    await fire(wrapper, 'pointerdown', 100, 200);
    await fire(wrapper, 'pointermove', 160, 200);
    expect(trigger(wrapper).text()).toContain('松开翻译');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'action', key: 'translate' }]);
  });

  it('滑出阈值后回到中心自动复位为确认区', async () => {
    const wrapper = mount(VoiceButton);
    await fire(wrapper, 'pointerdown', 100, 200);
    await fire(wrapper, 'pointermove', 100, 100);
    expect(trigger(wrapper).text()).toContain('松开取消');
    await fire(wrapper, 'pointermove', 100, 200);
    expect(trigger(wrapper).text()).toContain('松开发送');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'confirm' }]);
  });

  it('未配置 actions 时左右滑保持确认区', async () => {
    const wrapper = mount(VoiceButton);
    await fire(wrapper, 'pointerdown', 100, 200);
    await fire(wrapper, 'pointermove', 200, 200);
    expect(trigger(wrapper).text()).toContain('松开发送');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'confirm' }]);
  });

  it('disabled 忽略按下', async () => {
    const wrapper = mount(VoiceButton, { props: { disabled: true } });
    await fire(wrapper, 'pointerdown', 0, 0);
    expect(wrapper.emitted('pressstart')).toBeUndefined();
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
  });

  it('pointercancel 按取消收尾', async () => {
    const wrapper = mount(VoiceButton);
    await fire(wrapper, 'pointerdown', 0, 0);
    await fire(wrapper, 'pointercancel');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'cancel' }]);
  });

  it('空格键按住/松开等价原地确认', async () => {
    const wrapper = mount(VoiceButton);
    await trigger(wrapper).trigger('keydown', { key: ' ' });
    expect(wrapper.emitted('pressstart')).toHaveLength(1);
    expect(trigger(wrapper).text()).toContain('松开发送');
    await trigger(wrapper).trigger('keyup', { key: ' ' });
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'confirm' }]);
  });

  it('转录文字非空时气泡浮动展示转录内容', async () => {
    const wrapper = mount(VoiceButton, { props: { transcript: '   ' } });
    await fire(wrapper, 'pointerdown', 100, 200);
    // 空白转录视为无内容：无气泡，提示由按钮承担
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
    expect(wrapper.find('.cumquat-voice-button__transcript').exists()).toBe(false);
    await wrapper.setProps({ transcript: '帮我订一杯冰美式' });
    expect(wrapper.find('.cumquat-voice-button__hint--text').exists()).toBe(true);
    expect(wrapper.find('.cumquat-voice-button__transcript').text()).toBe('帮我订一杯冰美式');
    // 转录清空后气泡消失，按钮提示仍在
    await wrapper.setProps({ transcript: '' });
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
    expect(trigger(wrapper).text()).toContain('松开发送');
    await fire(wrapper, 'pointerup');
    expect(wrapper.emitted('release')?.[0]).toEqual([{ result: 'confirm' }]);
  });

  it('上滑取消时气泡隐藏转录，回到中心恢复展示', async () => {
    const wrapper = mount(VoiceButton, { props: { transcript: '帮我订一杯冰美式' } });
    await fire(wrapper, 'pointerdown', 100, 200);
    expect(wrapper.find('.cumquat-voice-button__transcript').exists()).toBe(true);
    await fire(wrapper, 'pointermove', 100, 100);
    expect(wrapper.find('.cumquat-voice-button__hint').exists()).toBe(false);
    expect(trigger(wrapper).text()).toContain('松开取消');
    await fire(wrapper, 'pointermove', 100, 200);
    expect(wrapper.find('.cumquat-voice-button__transcript').exists()).toBe(true);
  });

  it('按住时按钮内出现声波条，未接音量时走循环动画', async () => {
    const wrapper = mount(VoiceButton);
    await fire(wrapper, 'pointerdown', 100, 200);
    const meter = wrapper.find('.cumquat-voice-button__meter');
    expect(meter.exists()).toBe(true);
    expect(meter.classes()).not.toContain('cumquat-voice-button__meter--level');
    expect(meter.findAll('.cumquat-voice-button__meter-bar')).toHaveLength(4);
    await fire(wrapper, 'pointerup');
    expect(wrapper.find('.cumquat-voice-button__meter').exists()).toBe(false);
  });

  it('接入 level 后条高随音量起伏', async () => {
    const wrapper = mount(VoiceButton, { props: { level: 0 } });
    await fire(wrapper, 'pointerdown', 100, 200);
    const meter = wrapper.find('.cumquat-voice-button__meter');
    expect(meter.classes()).toContain('cumquat-voice-button__meter--level');
    const bars = meter.findAll('.cumquat-voice-button__meter-bar');
    // 无声：条保持基础高度 6px
    expect(bars[0].element.getAttribute('style')).toContain('height: 6px');
    // 有声：主条（系数 1）随音量升高，6 + 14 * 0.8 ≈ 17px
    await wrapper.setProps({ level: 0.8 });
    expect(bars[1].element.getAttribute('style')).toContain('height: 17px');
    await fire(wrapper, 'pointerup');
  });
});
