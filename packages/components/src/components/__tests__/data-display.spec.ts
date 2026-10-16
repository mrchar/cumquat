import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import {
  Table,
  Pagination,
  Tabs,
  Collapse,
  Tree,
  Cascader,
  Timeline,
  Steps,
  Descriptions,
  Carousel,
  Progress,
} from '../../index';
import type { TableColumn } from '../data-display/Table.vue';
import type { TabItem } from '../data-display/Tabs.vue';
import type { CollapseItem } from '../data-display/Collapse.vue';
import type { TreeNode } from '../data-display/Tree.vue';
import type { CascaderOption } from '../data-display/Cascader.vue';
import type { StepItem } from '../data-display/Steps.vue';
import type { TimelineItem } from '../data-display/Timeline.vue';
import type { DescriptionItem } from '../data-display/Descriptions.vue';

describe('Table', () => {
  const columns: TableColumn[] = [
    { key: 'name', title: '名称' },
    { key: 'age', title: '年龄', align: 'center' },
  ];
  const rows = [
    { name: 'Amber', age: 20 },
    { name: 'Bolt', age: 22 },
  ];

  it('渲染表头与行', () => {
    const wrapper = mount(Table, { props: { columns, rows } });
    expect(wrapper.findAll('.cumquat-table__th')).toHaveLength(2);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
    expect(wrapper.find('.cumquat-table__empty').exists()).toBe(false);
  });

  it('空数据显示空态', () => {
    const wrapper = mount(Table, { props: { columns, rows: [] } });
    expect(wrapper.find('.cumquat-table__empty').text()).toBe('暂无数据');
  });
});

describe('Pagination', () => {
  it('按 total/pageSize 生成页码', () => {
    const wrapper = mount(Pagination, { props: { total: 50, pageSize: 10, modelValue: 1 } });
    expect(wrapper.findAll('.cumquat-pagination__page')).toHaveLength(5);
  });

  it('点击页码更新当前页', async () => {
    const wrapper = mount(Pagination, { props: { total: 50, pageSize: 10, modelValue: 1 } });
    await wrapper.findAll('.cumquat-pagination__page')[2].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3]);
  });

  it('第一页时 prev 禁用', () => {
    const wrapper = mount(Pagination, { props: { total: 50, pageSize: 10, modelValue: 1 } });
    expect(wrapper.find('.cumquat-pagination__prev').attributes('disabled')).toBeDefined();
  });
});

describe('Tabs', () => {
  const tabs: TabItem[] = [
    { key: 'a', label: '标签一' },
    { key: 'b', label: '标签二' },
  ];

  it('点击切换激活标签', async () => {
    const wrapper = mount(Tabs, { props: { tabs, modelValue: 'a' } });
    const tabButtons = wrapper.findAll('.cumquat-tabs__tab');
    expect(tabButtons[0].classes()).toContain('cumquat-tabs__tab--active');
    await tabButtons[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['b']);
  });
});

describe('Collapse', () => {
  const items: CollapseItem[] = [
    { key: '1', title: '面板一', content: '内容一' },
    { key: '2', title: '面板二', content: '内容二' },
  ];

  it('点击标题切换展开', async () => {
    const wrapper = mount(Collapse, { props: { items } });
    expect(wrapper.find('.cumquat-collapse__content').exists()).toBe(false);
    await wrapper.find('.cumquat-collapse__header').trigger('click');
    expect(wrapper.find('.cumquat-collapse__content').text()).toBe('内容一');
    await wrapper.find('.cumquat-collapse__header').trigger('click');
    expect(wrapper.find('.cumquat-collapse__content').exists()).toBe(false);
  });
});

describe('Tree', () => {
  const nodes: TreeNode[] = [
    {
      key: 'p1',
      label: '父节点',
      children: [
        { key: 'c1', label: '子节点一' },
        { key: 'c2', label: '子节点二' },
      ],
    },
  ];

  it('defaultExpandAll 展示子节点', () => {
    const wrapper = mount(Tree, { props: { nodes, defaultExpandAll: true, checkable: true } });
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(3);
  });

  it('点击展开器收起子节点', async () => {
    const wrapper = mount(Tree, { props: { nodes, defaultExpandAll: true } });
    await wrapper.find('.cumquat-tree__expander').trigger('click');
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(1);
  });

  it('勾选节点更新 checked', async () => {
    const wrapper = mount(Tree, { props: { nodes, defaultExpandAll: true, checkable: true } });
    await wrapper.find('.cumquat-tree__checkbox').setValue();
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([['p1']]);
  });
});

describe('Cascader', () => {
  const options: CascaderOption[] = [
    {
      label: '华东',
      value: 'east',
      children: [{ label: '上海', value: 'sh' }],
    },
    { label: '华北', value: 'north' },
  ];

  it('逐级选择后回显路径', async () => {
    const wrapper = mount(Cascader, { props: { options } });
    await wrapper.find('.cumquat-cascader__trigger').trigger('click');
    const columns = wrapper.findAll('.cumquat-cascader__column');
    expect(columns).toHaveLength(1);
    await columns[0].findAll('.cumquat-cascader__option')[0].trigger('click');
    expect(wrapper.findAll('.cumquat-cascader__column')).toHaveLength(2);
    await wrapper
      .findAll('.cumquat-cascader__column')[1]
      .find('.cumquat-cascader__option')
      .trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['sh']);
  });
});

describe('Timeline', () => {
  const items: TimelineItem[] = [
    { key: '1', title: '创建', time: '10:00' },
    { key: '2', title: '发布', type: 'success' },
  ];

  it('渲染节点与连线', () => {
    const wrapper = mount(Timeline, { props: { items } });
    expect(wrapper.findAll('.cumquat-timeline__item')).toHaveLength(2);
    expect(wrapper.find('.cumquat-timeline__line').exists()).toBe(true);
  });
});

describe('Steps', () => {
  const steps: StepItem[] = [
    { key: '1', title: '第一步' },
    { key: '2', title: '第二步' },
    { key: '3', title: '第三步' },
  ];

  it('当前步骤之前为完成态', () => {
    const wrapper = mount(Steps, { props: { steps, current: 1 } });
    const dots = wrapper.findAll('.cumquat-steps__dot');
    expect(dots[0].text()).toBe(''); // 完成态渲染对勾 svg
    expect(dots[1].text()).toBe('2');
    expect(dots[2].text()).toBe('3');
  });
});

describe('Descriptions', () => {
  const items: DescriptionItem[] = [
    { label: '名称', value: 'Cumquat' },
    { label: '版本', value: '0.1.0' },
  ];

  it('渲染标签与值', () => {
    const wrapper = mount(Descriptions, { props: { title: '详情', items } });
    expect(wrapper.find('.cumquat-descriptions__title').text()).toBe('详情');
    expect(wrapper.findAll('.cumquat-descriptions__label')).toHaveLength(2);
  });
});

describe('Carousel', () => {
  it('next/prev 切换轮播索引', async () => {
    const wrapper = mount(Carousel, { props: { items: ['一', '二', '三'], modelValue: 0 } });
    await wrapper.find('.cumquat-carousel__next').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([1]);
    await wrapper.find('.cumquat-carousel__prev').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([0]);
  });
});

describe('Progress', () => {
  it('按 value 渲染宽度与文本', () => {
    const wrapper = mount(Progress, { props: { value: 66 } });
    const bar = wrapper.find('.cumquat-progress__bar');
    expect(bar.attributes('style')).toContain('width: 66%');
    expect(wrapper.find('.cumquat-progress__text').text()).toBe('66%');
  });
});
