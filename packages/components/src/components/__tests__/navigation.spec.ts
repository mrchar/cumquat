import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  Breadcrumb,
  Menu,
  Anchor,
  BackTop,
  Affix,
  FloatButton,
  DatePicker,
  TimePicker,
  Calendar,
  ColorPicker,
  Transfer,
  VirtualList,
  Layout,
  Grid,
  Space,
} from '../../index';
import type { BreadcrumbItem } from '../navigation/Breadcrumb.vue';
import type { MenuItem } from '../navigation/Menu.vue';
import type { AnchorItem } from '../navigation/Anchor.vue';
import type { TransferItem } from '../navigation/Transfer.vue';
import type { FloatAction } from '../navigation/FloatButton.vue';

const wait = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Breadcrumb', () => {
  const items: BreadcrumbItem[] = [
    { label: '首页', href: '/' },
    { label: '组件', href: '/components' },
    { label: '面包屑' },
  ];

  it('渲染分隔符与末级高亮', () => {
    const wrapper = mount(Breadcrumb, { props: { items } });
    expect(wrapper.findAll('.cumquat-breadcrumb__separator')).toHaveLength(2);
    const currents = wrapper.findAll('.cumquat-breadcrumb__current');
    expect(currents.at(-1)!.classes()).toContain('cumquat-breadcrumb__current--last');
  });
});

describe('Menu', () => {
  const items: MenuItem[] = [
    { key: 'home', label: '首页' },
    {
      key: 'manage',
      label: '管理',
      children: [{ key: 'users', label: '用户管理' }],
    },
  ];

  it('点击分组展开子项，点击子项激活', async () => {
    const wrapper = mount(Menu, { props: { items, modelValue: '' } });
    await wrapper.find('.cumquat-menu__group').trigger('click');
    expect(wrapper.find('.cumquat-menu__subgroup').exists()).toBe(true);
    await wrapper.find('.cumquat-menu__subgroup .cumquat-menu__item').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['users']);
  });

  it('fetch：挂载即拉菜单项并渲染', async () => {
    const fetcher = vi.fn(async () => [
      { key: 'dashboard', label: '仪表盘' },
      { key: 'settings', label: '设置' },
    ]);
    const wrapper = mount(Menu, { props: { fetch: fetcher } });
    await wait();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('.cumquat-menu__item')).toHaveLength(2);
    expect(wrapper.findAll('.cumquat-menu__item')[0].text()).toContain('仪表盘');
  });
});

describe('Anchor', () => {
  const items: AnchorItem[] = [
    { href: '#a', label: '章节 A' },
    { href: '#b', label: '章节 B' },
  ];

  it('点击链接激活', async () => {
    const wrapper = mount(Anchor, { props: { items } });
    await wrapper.findAll('.cumquat-anchor__link')[1].trigger('click');
    expect(wrapper.findAll('.cumquat-anchor__link')[1].classes()).toContain(
      'cumquat-anchor__link--active',
    );
  });
});

describe('BackTop', () => {
  it('visible=false 不渲染', () => {
    const wrapper = mount(BackTop, { props: { visible: false } });
    expect(wrapper.find('.cumquat-back-top').exists()).toBe(false);
  });

  it('点击派发 click', async () => {
    const wrapper = mount(BackTop);
    await wrapper.find('.cumquat-back-top').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});

describe('Affix', () => {
  it('以 sticky 定位渲染', () => {
    const wrapper = mount(Affix, { props: { top: 16 } });
    expect(wrapper.attributes('style')).toContain('sticky');
  });
});

describe('FloatButton', () => {
  const actions: FloatAction[] = [{ key: 'edit', label: '编' }];

  it('点击触发器展开动作组', async () => {
    const wrapper = mount(FloatButton, { props: { actions } });
    expect(wrapper.find('.cumquat-float-button__actions').exists()).toBe(false);
    await wrapper.find('.cumquat-float-button__trigger').trigger('click');
    expect(wrapper.find('.cumquat-float-button__actions').exists()).toBe(true);
    await wrapper.find('.cumquat-float-button__action').trigger('click');
    expect(wrapper.emitted('select')?.[0]).toEqual(['edit']);
  });
});

describe('DatePicker', () => {
  it('展开面板选择日期后回显', async () => {
    const wrapper = mount(DatePicker);
    expect(wrapper.find('.cumquat-date-picker__panel').exists()).toBe(false);
    await wrapper.find('.cumquat-date-picker__trigger').trigger('click');
    expect(wrapper.find('.cumquat-date-picker__panel').exists()).toBe(true);
    await wrapper.findAll('.cumquat-date-picker__day')[7].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([4]);
    expect(wrapper.find('.cumquat-date-picker__panel').exists()).toBe(false);
  });
});

describe('TimePicker', () => {
  it('选择小时与分钟后确认关闭', async () => {
    const wrapper = mount(TimePicker);
    await wrapper.find('.cumquat-time-picker__trigger').trigger('click');
    await wrapper.findAll('.cumquat-time-picker__hour')[3].trigger('click');
    await wrapper.findAll('.cumquat-time-picker__minute')[2].trigger('click');
    expect(wrapper.findAll('.cumquat-time-picker__hour')[3].classes()).toContain(
      'cumquat-time-picker__hour--selected',
    );
  });
});

describe('Calendar', () => {
  it('点击日期选中', async () => {
    const wrapper = mount(Calendar);
    const day = wrapper.findAll('.cumquat-calendar__day')[7];
    await day.trigger('click');
    expect(day.classes()).toContain('cumquat-calendar__day--selected');
  });

  it('fetch：挂载携带区间 filters.range，切月自动重取', async () => {
    const fetcher = vi.fn(async () => []);
    const wrapper = mount(Calendar, { props: { fetch: fetcher } });
    await wait();
    const firstRange = fetcher.mock.calls[0][0].filters.range as string[];
    expect(firstRange).toHaveLength(2);
    expect(firstRange[0] < firstRange[1]).toBe(true);
    await wrapper.find('button[aria-label="下一个"]').trigger('click');
    await wait();
    const nextRange = fetcher.mock.calls.at(-1)?.[0].filters.range as string[];
    expect(nextRange[1]).not.toBe(firstRange[1]);
  });
});

describe('ColorPicker', () => {
  const presets = ['#4f46e5', '#dc2626'];

  it('点击预设色更新取值', async () => {
    const wrapper = mount(ColorPicker, { props: { presets, modelValue: '#4f46e5' } });
    await wrapper.find('.cumquat-color-picker__trigger').trigger('click');
    await wrapper.findAll('.cumquat-color-picker__preset')[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['#dc2626']);
  });
});

describe('Transfer', () => {
  const data: TransferItem[] = [
    { key: '1', label: '条目一' },
    { key: '2', label: '条目二' },
  ];

  it('点击左栏条目移动到右栏', async () => {
    const wrapper = mount(Transfer, { props: { data, modelValue: [] } });
    const leftPanel = wrapper.findAll('.cumquat-transfer__panel')[0];
    await leftPanel.find('.cumquat-transfer__item').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([['1']]);
  });
});

describe('VirtualList', () => {
  it('静态渲染列表项', () => {
    const wrapper = mount(VirtualList, { props: { items: ['a', 'b', 'c'] } });
    expect(wrapper.findAll('.cumquat-virtual-list__item')).toHaveLength(3);
  });

  it('fetch：首页挂载即拉，触底以递增 pagination 累积', async () => {
    const fetcher = vi.fn(
      async ({ pagination }: { pagination: { currentPage: number; pageSize: number } }) => ({
        list: Array.from(
          { length: pagination.currentPage === 1 ? 20 : 5 },
          (_, i) => `item-${(pagination.currentPage - 1) * 20 + i + 1}`,
        ),
        total: 25,
      }),
    );
    const wrapper = mount(VirtualList, { props: { fetch: fetcher } });
    await wait();
    expect(fetcher.mock.calls[0][0].pagination).toEqual({ currentPage: 1, pageSize: 20 });
    expect(wrapper.find('.cumquat-virtual-list__inner').attributes('style')).toContain(
      'height: 800px',
    );
    await wrapper.find('.cumquat-virtual-list').trigger('scroll');
    await wait();
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].pagination).toEqual({ currentPage: 2, pageSize: 20 });
    expect(wrapper.find('.cumquat-virtual-list__inner').attributes('style')).toContain(
      'height: 1000px',
    );
  });
});

describe('Layout / Grid / Space', () => {
  it('Layout 渲染容器', () => {
    const wrapper = mount(Layout, { slots: { default: '<main>主体</main>' } });
    expect(wrapper.classes()).toContain('cumquat-layout');
  });

  it('Grid 列数映射', () => {
    const wrapper = mount(Grid, { props: { cols: 3 }, slots: { default: '<div/><div/><div/>' } });
    expect(wrapper.classes()).toContain('cumquat-grid--cols-3');
  });

  it('Space 均分子项', () => {
    const wrapper = mount(Space, { slots: { default: '<span>一</span><span>二</span>' } });
    expect(wrapper.classes()).toContain('cumquat-space');
    expect(wrapper.text()).toContain('一');
  });
});
