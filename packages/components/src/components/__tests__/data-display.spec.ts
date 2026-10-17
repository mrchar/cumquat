import { describe, expect, it, vi } from 'vitest';
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

/** post watcher + Promise 链走完一个宏任务周期 */
const wait = () => new Promise((resolve) => setTimeout(resolve, 0));

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

  it('fetch：挂载即请求，分页结果自动渲染并回填总数', async () => {
    const fetcher = vi.fn(async () => ({ list: rows, total: 36 }));
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true },
    });
    await wait();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0].pagination).toEqual({ currentPage: 1, pageSize: 10 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
    expect(wrapper.find('.cumquat-pagination__total').text()).toContain('共 36 条');
  });

  it('fetch：翻页自动以最新 pagination 重取', async () => {
    const fetcher = vi.fn(async ({ pagination }) => ({
      list: pagination?.currentPage === 1 ? rows : [{ name: 'Ciri', age: 30 }],
      total: 12,
    }));
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true },
    });
    await wait();
    const pageButtons = wrapper.findAll('.cumquat-pagination__page--active');
    expect(pageButtons.length).toBe(1);
    await wrapper
      .findAll('.cumquat-pagination__page')
      .find((btn) => btn.text() === '2')!
      .trigger('click');
    await wait();
    expect(fetcher.mock.calls[1][0].pagination).toEqual({ currentPage: 2, pageSize: 10 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
  });

  it('fetch：切换每页条数以新 pageSize 重取并回第一页', async () => {
    const fetcher = vi.fn(async ({ pagination }) => ({
      list: Array.from({ length: pagination?.pageSize === 20 ? 20 : 10 }, (_, index) => ({
        name: `用户 ${index + 1}`,
        age: index,
      })),
      total: 57,
    }));
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true, pageSizes: [10, 20] },
    });
    await wait();
    const select = wrapper.find('.cumquat-pagination__select');
    (select.element as HTMLSelectElement).value = '20';
    await select.trigger('change');
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].pagination).toEqual({ currentPage: 1, pageSize: 20 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(20);
    expect((wrapper.find('.cumquat-pagination__select').element as HTMLSelectElement).value).toBe(
      '20',
    );
  });

  it('fetch：排序自动注入 sorter 重取（远程模式不本地排序）', async () => {
    const sortableColumns: TableColumn[] = [{ key: 'name', title: '名称', sortable: true }];
    const fetcher = vi.fn(async () => ({ list: rows, total: 2 }));
    const wrapper = mount(Table, {
      props: { columns: sortableColumns, fetch: fetcher },
    });
    await wait();
    await wrapper.find('.cumquat-table__sorter').trigger('click');
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].sorter).toEqual({ key: 'name', order: 'asc' });
  });

  it('fetch：失败展示重试，点击后以最近查询重发', async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce({ list: rows, total: 2 });
    const wrapper = mount(Table, { props: { columns, fetch: fetcher } });
    await wait();
    const retry = wrapper.find('.cumquat-table__retry');
    expect(retry.exists()).toBe(true);
    await retry.trigger('click');
    await wait();
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
  });

  it('fetch：已有数据时重取失败保留旧数据并展示错误条，重试后恢复', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ list: rows, total: 12 })
      .mockRejectedValueOnce(new Error('网络错误'))
      .mockResolvedValueOnce({ list: [{ name: 'Ciri', age: 30 }], total: 12 });
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true },
    });
    await wait();
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
    await wrapper
      .findAll('.cumquat-pagination__page')
      .find((btn) => btn.text() === '2')!
      .trigger('click');
    await wait();
    const errorbar = wrapper.find('.cumquat-table__errorbar');
    expect(errorbar.exists()).toBe(true);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
    await errorbar.find('.cumquat-table__retry').trigger('click');
    await wait();
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[2][0].pagination).toEqual({ currentPage: 2, pageSize: 10 });
    expect(wrapper.find('.cumquat-table__errorbar').exists()).toBe(false);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
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

  it('受控模式：外部 modelValue 变化同步高亮与区间', async () => {
    const wrapper = mount(Pagination, { props: { total: 50, pageSize: 10, modelValue: 1 } });
    expect(wrapper.find('.cumquat-pagination__page--active').text()).toBe('1');
    await wrapper.setProps({ modelValue: 3 });
    expect(wrapper.find('.cumquat-pagination__page--active').text()).toBe('3');
    expect(wrapper.find('.cumquat-pagination__total').text()).toContain('第 21-30 条');
  });

  it('非受控：切换每页条数生效并回发事件', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 50, pageSizes: [10, 20], showSizeChanger: true },
    });
    const select = wrapper.find('.cumquat-pagination__select');
    (select.element as HTMLSelectElement).value = '20';
    await select.trigger('change');
    expect(wrapper.emitted('update:pageSize')?.[0]).toEqual([20]);
    expect((wrapper.find('.cumquat-pagination__select').element as HTMLSelectElement).value).toBe(
      '20',
    );
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

  it('fetch：挂载即拉页签并自动激活首个可用页签', async () => {
    const fetcher = vi.fn(async () => [
      { key: 'remote-a', label: '远程一' },
      { key: 'remote-b', label: '远程二' },
    ]);
    const wrapper = mount(Tabs, { props: { fetch: fetcher } });
    await wait();
    expect(wrapper.findAll('.cumquat-tabs__tab')).toHaveLength(2);
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['remote-a']);
    expect(wrapper.findAll('.cumquat-tabs__tab')[0].classes()).toContain(
      'cumquat-tabs__tab--active',
    );
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

  it('fetch：挂载拉根节点，展开懒加载父节点时注入 parentKey', async () => {
    const fetcher = vi.fn(async ({ filters }: { filters?: { parentKey?: string } }) =>
      filters?.parentKey
        ? ([{ key: 'a1', label: '懒加载子节点', leaf: true }] as TreeNode[])
        : ([{ key: 'a', label: '懒加载父节点', leaf: false }] as TreeNode[]),
    );
    const wrapper = mount(Tree, { props: { fetch: fetcher } });
    await wait();
    expect(fetcher.mock.calls[0][0].filters).toBeUndefined();
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(1);
    await wrapper.find('.cumquat-tree__expander').trigger('click');
    await wait();
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].filters).toEqual({ parentKey: 'a' });
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(2);
    expect(wrapper.findAll('.cumquat-tree__node')[1].text()).toContain('懒加载子节点');
  });

  it('fetch：根节点未标记 leaf 时默认可展开，空子级回标为叶子', async () => {
    const fetcher = vi.fn(async ({ filters }: { filters?: { parentKey?: string } }) =>
      filters?.parentKey ? ([] as TreeNode[]) : ([{ key: 'a', label: '未知节点' }] as TreeNode[]),
    );
    const wrapper = mount(Tree, { props: { fetch: fetcher } });
    await wait();
    expect(wrapper.find('.cumquat-tree__expander').exists()).toBe(true);
    await wrapper.find('.cumquat-tree__expander').trigger('click');
    await wait();
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].filters).toEqual({ parentKey: 'a' });
    // 空响应后节点回标为叶子，不再渲染展开器
    expect(wrapper.find('.cumquat-tree__expander').exists()).toBe(false);
    expect(wrapper.find('.cumquat-tree__node--leaf').exists()).toBe(true);
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

  it('fetch：懒加载下一级时注入 parentKey 并可选中叶子', async () => {
    const fetcher = vi.fn(async ({ filters }: { filters?: { parentKey?: string } }) =>
      filters?.parentKey
        ? ([{ label: '远程市', value: 'city', leaf: true }] as CascaderOption[])
        : ([{ label: '远程省', value: 'prov', leaf: false }] as CascaderOption[]),
    );
    const wrapper = mount(Cascader, { props: { fetch: fetcher } });
    await wait();
    await wrapper.find('.cumquat-cascader__trigger').trigger('click');
    await wrapper
      .findAll('.cumquat-cascader__column')[0]
      .findAll('.cumquat-cascader__option')[0]
      .trigger('click');
    await wait();
    await wait();
    expect(fetcher.mock.calls.at(-1)?.[0].filters).toEqual({ parentKey: 'prov' });
    expect(wrapper.findAll('.cumquat-cascader__column')).toHaveLength(2);
    await wrapper
      .findAll('.cumquat-cascader__column')[1]
      .find('.cumquat-cascader__option')
      .trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['city']);
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
