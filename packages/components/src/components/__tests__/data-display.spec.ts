import type { CellRenderer } from '../../index';
import type { TableColumn } from '../data-display/Table.vue';
import type { Option, Schema } from '@cumquat/core';
import { schemaToColumns } from '@cumquat/composables';
import type { TabItem } from '../navigation/Tabs.vue';
import type { CollapseItem } from '../data-display/Collapse.vue';
import type { TreeNode } from '../data-display/Tree.vue';
import type { CascaderOption } from '../data-entry/Cascader.vue';
import type { StepItem } from '../navigation/Steps.vue';
import type { TimelineItem } from '../data-display/Timeline.vue';
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { h } from 'vue';
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
  List,
  ListItem,
  ListItemMeta,
  Carousel,
  Progress,
  registerCell,
} from '../../index';
import { mockFetch } from './helpers';

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

  it('列 help 渲染表头说明图标，悬浮展示帮助提示', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          { key: 'name', title: '名称', help: '用户姓名（示例：Amber）' },
          { key: 'age', title: '年龄' },
        ],
        rows,
      },
    });
    expect(wrapper.findAll('.cumquat-table__th-help-icon')).toHaveLength(1);
    await wrapper.find('.cumquat-table__th-help').trigger('mouseenter');
    expect(wrapper.find('.cumquat-tooltip__content').text()).toBe('用户姓名（示例：Amber）');
  });

  it('schemaToColumns 将字段元数据投影为列', () => {
    const schema: Schema = {
      type: 'object',
      properties: {
        name: { type: 'string', title: '名称', description: '用户姓名' },
        status: { type: 'string', enum: ['active', 'disabled'], title: '状态' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    };
    const wrapper = mount(Table, {
      props: {
        columns: schemaToColumns(schema),
        rows: [{ name: 'Amber', status: 'active', createdAt: '2026-01-01T08:30:00Z' }],
      },
    });

    const headers = wrapper.findAll('.cumquat-table__th-text').map((item) => item.text());
    expect(headers).toEqual(['名称', '状态', 'createdAt']);
    expect(wrapper.findAll('.cumquat-table__th-help-icon')).toHaveLength(1);
    expect(wrapper.find('.cumquat-cell--datetime').exists()).toBe(true);
    expect(wrapper.find('.cumquat-cell--enum').text()).toBe('active');
  });

  it('列投影：title / help / type / format / enum 与默认筛选', () => {
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: {
        name: { type: 'string', title: '名称', description: '用户姓名' },
        status: { type: 'string', enum: ['active', 'disabled'] },
        createdAt: { type: 'string', format: 'date-time' },
      },
    });
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [{ name: 'Amber', status: 'active', createdAt: '2026-01-01T08:30:00Z' }],
      },
    });

    const headers = wrapper.findAll('.cumquat-table__th-text').map((item) => item.text());
    expect(headers).toEqual(['名称', 'status', 'createdAt']);
    expect(wrapper.findAll('.cumquat-table__th-help-icon')).toHaveLength(1);
    expect(wrapper.find('.cumquat-cell--datetime').exists()).toBe(true);
    expect(wrapper.find('.cumquat-cell--enum').text()).toBe('active');
    // enum 字段自动开启筛选
    expect(wrapper.findAll('.cumquat-table__filter-trigger')).toHaveLength(1);
  });

  it('手动列定义：enum 映射与 formatter 直接生效', () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          {
            key: 'active',
            title: '启用',
            enum: [
              { label: '是', value: true },
              { label: '否', value: false },
            ],
          },
          {
            key: 'score',
            title: '积分',
            formatter: (value, row, index) => `${row.name}-${index}-${Number(value) * 2}`,
          },
        ],
        rows: [{ name: 'Amber', active: true, score: 10 }],
      },
    });
    const cells = wrapper.findAll('.cumquat-table__row')[0].findAll('.cumquat-table__td');
    expect(cells[0].find('.cumquat-cell--enum').text()).toBe('是');
    expect(cells[1].text()).toBe('Amber-0-20');
    // formatter 列同样可映射布尔值
  });

  it('远程筛选项：绑定 FetchHandler，展开面板时拉取候选值', async () => {
    const fetcher = mockFetch<Option>(async () => [
      { label: '前端', value: 'front' },
      { label: '后端', value: 'back' },
    ]);
    const wrapper = mount(Table, {
      props: {
        columns: [{ key: 'role', title: '角色', options: fetcher }],
        rows: [{ role: 'front' }],
      },
    });

    await wrapper.find('.cumquat-table__filter-trigger').trigger('click');
    await wait();
    const inputs = wrapper.findAll('.cumquat-table__filter-panel input[type="checkbox"]');
    expect(inputs).toHaveLength(2);
    expect(wrapper.find('.cumquat-table__filter-panel').text()).toContain('前端');

    await inputs[0].setValue(true);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
  });

  it('本地筛选：勾选后过滤行，清空后恢复', async () => {
    const filterColumns: TableColumn[] = [
      { key: 'name', title: '名称' },
      {
        key: 'role',
        title: '角色',
        options: [
          { label: '前端', value: 'front' },
          { label: '后端', value: 'back' },
        ],
      },
    ];
    const wrapper = mount(Table, {
      props: {
        columns: filterColumns,
        rows: [
          { name: 'Amber', role: 'front' },
          { name: 'Bolt', role: 'back' },
        ],
      },
    });

    await wrapper.find('.cumquat-table__filter-trigger').trigger('click');
    const inputs = wrapper.findAll('.cumquat-table__filter-panel input[type="checkbox"]');
    expect(inputs).toHaveLength(2);

    await inputs[0].setValue(true);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);

    await wrapper.find('.cumquat-table__filter-clear').trigger('click');
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
  });

  it('远程筛选：写入查询并回到第 1 页', async () => {
    const filterColumns: TableColumn[] = [
      { key: 'name', title: '名称' },
      {
        key: 'role',
        title: '角色',
        options: [
          { label: '前端', value: 'front' },
          { label: '后端', value: 'back' },
        ],
      },
    ];
    const users = [
      { name: 'Amber', role: 'front' },
      { name: 'Bolt', role: 'back' },
    ];
    const fetcher = mockFetch<Record<string, unknown>>(async (query) => {
      const role = (query.filters as { role?: string[] } | undefined)?.role;
      const list = role?.length ? users.filter((item) => role.includes(item.role)) : users;
      const page = query.page ?? 1;
      const size = query.size ?? 1;
      return {
        list: list.slice((page - 1) * size, page * size),
        page,
        size,
        total: list.length,
      };
    });
    const wrapper = mount(Table, {
      props: { columns: filterColumns, fetch: fetcher, pagination: true, size: 1 },
    });
    await wait();

    await wrapper.find('.cumquat-pagination__next').trigger('click');
    await wait();
    expect(fetcher.queries.at(-1)?.page).toBe(2);

    await wrapper.find('.cumquat-table__filter-trigger').trigger('click');
    await wrapper.findAll('.cumquat-table__filter-panel input[type="checkbox"]')[0].setValue(true);
    await wait();

    expect(fetcher.queries.at(-1)?.page).toBe(1);
    expect(fetcher.queries.at(-1)?.filters).toEqual({ role: ['front'] });
  });

  it('v-model:filters 受控：筛选值来自 props，变更回发事件', async () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          { key: 'name', title: '名称' },
          {
            key: 'role',
            title: '角色',
            options: [
              { label: '前端', value: 'front' },
              { label: '后端', value: 'back' },
            ],
          },
        ],
        rows: [
          { name: 'Amber', role: 'front' },
          { name: 'Bolt', role: 'back' },
        ],
        filters: { role: ['front'] },
      },
    });

    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
    await wrapper.find('.cumquat-table__filter-trigger').trigger('click');
    await wrapper.findAll('.cumquat-table__filter-panel input[type="checkbox"]')[0].setValue(false);
    expect(wrapper.emitted('update:filters')?.at(-1)?.[0]).toEqual({ role: [] });
  });

  it('filterable: false：隐藏筛选入口、跳过本地过滤、不向 fetch 注入 filters', async () => {
    const filterColumns: TableColumn[] = [
      { key: 'name', title: '名称' },
      {
        key: 'role',
        title: '角色',
        options: [
          { label: '前端', value: 'front' },
          { label: '后端', value: 'back' },
        ],
      },
    ];
    const list = [
      { name: 'Amber', role: 'front' },
      { name: 'Bolt', role: 'back' },
    ];

    // 本地模式：即使传入 filters 也不过滤，筛选入口不渲染
    const local = mount(Table, {
      props: { columns: filterColumns, rows: list, filters: { role: ['front'] }, filterable: false },
    });
    expect(local.find('.cumquat-table__filter-trigger').exists()).toBe(false);
    expect(local.findAll('.cumquat-table__row')).toHaveLength(2);

    // 远程模式：查询参数中不包含 filters
    const fetcher = mockFetch(async () => list);
    mount(Table, { props: { columns: filterColumns, fetch: fetcher, filterable: false } });
    await wait();
    expect(fetcher.queries.at(-1)?.filters).toBeUndefined();
  });

  it('resizable：拖动表头分隔条调整列宽，默认不渲染', async () => {
    const resizeColumns: TableColumn[] = [
      { key: 'name', title: '名称' },
      { key: 'role', title: '角色' },
    ];
    const rows = [{ name: 'Amber', role: 'front' }];

    expect(mount(Table, { props: { columns: resizeColumns, rows } }).find('.cumquat-table__resizer').exists()).toBe(false);

    const wrapper = mount(Table, { props: { columns: resizeColumns, rows, resizable: true } });
    const handles = wrapper.findAll('.cumquat-table__resizer');
    expect(handles).toHaveLength(2);

    const firstTh = wrapper.findAll('.cumquat-table__th')[0];
    handles[0].element.dispatchEvent(
      new MouseEvent('pointerdown', { clientX: 100, bubbles: true }),
    );
    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 180 }));
    window.dispatchEvent(new MouseEvent('pointerup'));
    await wrapper.vm.$nextTick();

    // jsdom 中初始宽度为 0，向右拖动 80px 后取最小值 60px 与 80px 的较大者
    expect(firstTh.attributes('style')).toContain('width: 80px');
  });

  it('空数据显示空态', () => {
    const wrapper = mount(Table, { props: { columns, rows: [] } });
    expect(wrapper.find('.cumquat-table__empty').text()).toBe('暂无数据');
  });

  it('fetch：挂载即请求，分页结果自动渲染并回填总数', async () => {
    const fetcher = mockFetch(async () => ({ list: rows, total: 36 }));
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true },
    });
    await wait();
    expect(fetcher.queries).toHaveLength(1);
    expect(fetcher.queries[0]).toMatchObject({ page: 1, size: 10 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
    expect(wrapper.find('.cumquat-pagination__total').text()).toContain('共 36 条');
  });

  it('fetch：翻页自动以最新 pagination 重取', async () => {
    const fetcher = mockFetch(async ({ page = 1 }) => ({
      list: page === 1 ? rows : [{ name: 'Ciri', age: 30 }],
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
    expect(fetcher.queries[1]).toMatchObject({ page: 2, size: 10 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
  });

  it('fetch：切换每页条数以新 size 重取并回第一页', async () => {
    const fetcher = mockFetch(async ({ size = 10 }) => ({
      list: Array.from({ length: size === 20 ? 20 : 10 }, (_, index) => ({
        name: `用户 ${index + 1}`,
        age: index,
      })),
      total: 57,
    }));
    const wrapper = mount(Table, {
      props: { columns, fetch: fetcher, pagination: true, sizes: [10, 20] },
    });
    await wait();
    const select = wrapper.find('.cumquat-pagination__select');
    (select.element as HTMLSelectElement).value = '20';
    await select.trigger('change');
    await wait();
    expect(fetcher.queries.at(-1)).toMatchObject({ page: 1, size: 20 });
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(20);
    expect((wrapper.find('.cumquat-pagination__select').element as HTMLSelectElement).value).toBe(
      '20',
    );
  });

  it('fetch：排序自动注入 sorter 重取（远程模式不本地排序）', async () => {
    const sortableColumns: TableColumn[] = [{ key: 'name', title: '名称', sortable: true }];
    const fetcher = mockFetch(async () => ({ list: rows, total: 2 }));
    const wrapper = mount(Table, {
      props: { columns: sortableColumns, fetch: fetcher },
    });
    await wait();
    await wrapper.find('.cumquat-table__sorter').trigger('click');
    await wait();
    expect(fetcher.queries.at(-1)?.sorter).toEqual({ key: 'name', order: 'asc' });
  });

  it('fetch：失败展示重试，点击后以最近查询重发', async () => {
    const fetcher = mockFetch(() => {
      if (fetcher.queries.length === 1) throw new Error('网络错误');
      return { list: rows, total: 2 };
    });
    const wrapper = mount(Table, { props: { columns, fetch: fetcher } });
    await wait();
    const retry = wrapper.find('.cumquat-table__retry');
    expect(retry.exists()).toBe(true);
    await retry.trigger('click');
    await wait();
    expect(fetcher.queries).toHaveLength(2);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(2);
  });

  it('fetch：已有数据时重取失败保留旧数据并展示错误条，重试后恢复', async () => {
    const fetcher = mockFetch(() => {
      if (fetcher.queries.length === 2) throw new Error('网络错误');
      if (fetcher.queries.length === 1) return { list: rows, total: 12 };
      return { list: [{ name: 'Ciri', age: 30 }], total: 12 };
    });
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
    expect(fetcher.queries).toHaveLength(3);
    expect(fetcher.queries[2]).toMatchObject({ page: 2, size: 10 });
    expect(wrapper.find('.cumquat-table__errorbar').exists()).toBe(false);
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(1);
  });

  it('受控分页：v-model:page 自动显示分页器，翻页回发并以新页码重取', async () => {
    const fetcher = mockFetch(async () => ({ list: rows, total: 30 }));
    const wrapper = mount(Table, {
      props: {
        columns,
        fetch: fetcher,
        page: 1,
        'onUpdate:page': (page: number) => wrapper.setProps({ page }),
      },
    });
    await wait();
    // 未传 pagination 布尔开关，绑定即自动展示分页器
    expect(wrapper.find('.cumquat-table__footer').exists()).toBe(true);
    expect(fetcher.queries.at(-1)).toMatchObject({ page: 1, size: 10 });
    await wrapper
      .findAll('.cumquat-pagination__page')
      .find((btn) => btn.text() === '2')!
      .trigger('click');
    await wait();
    expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2]);
    expect(fetcher.queries.at(-1)).toMatchObject({ page: 2, size: 10 });
  });

  it('受控每页条数：@update:size 存在时按受控切换并重取', async () => {
    const fetcher = mockFetch(async () => ({ list: rows, total: 30 }));
    const wrapper = mount(Table, {
      props: {
        columns,
        fetch: fetcher,
        pagination: true,
        size: 10,
        'onUpdate:size': (size: number) => wrapper.setProps({ size }),
      },
    });
    await wait();
    await wrapper.find('.cumquat-pagination__select').setValue('20');
    await wait();
    expect(wrapper.emitted('update:size')?.at(-1)).toEqual([20]);
    expect(fetcher.queries.at(-1)).toMatchObject({ page: 1, size: 20 });
  });

  it('受控排序：v-model:sorter 回发排序状态并注入查询', async () => {
    const sortableColumns: TableColumn[] = [{ key: 'name', title: '名称', sortable: true }];
    const fetcher = mockFetch(async () => ({ list: rows, total: 2 }));
    const wrapper = mount(Table, {
      props: {
        columns: sortableColumns,
        fetch: fetcher,
        sorter: { key: '', order: null } as { key: string; order: 'asc' | 'desc' | null },
        'onUpdate:sorter': (sorter: { key: string; order: 'asc' | 'desc' | null }) =>
          wrapper.setProps({ sorter }),
      },
    });
    await wait();
    await wrapper.find('.cumquat-table__sorter').trigger('click');
    await wait();
    expect(wrapper.emitted('update:sorter')?.at(-1)).toEqual([{ key: 'name', order: 'asc' }]);
    expect(fetcher.queries.at(-1)?.sorter).toEqual({ key: 'name', order: 'asc' });
  });

  it('单向 :size 不传监听器时保持历史行为（作为初始条数，内部可切换）', async () => {
    const localRows = Array.from({ length: 30 }, (_, index) => ({
      name: `R${index}`,
      age: 20,
    }));
    const wrapper = mount(Table, {
      props: { columns, rows: localRows, pagination: true, size: 10 },
    });
    await wait();
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(10);
    await wrapper.find('.cumquat-pagination__select').setValue('20');
    await wait();
    // 非受控：内部状态自行切换，事件仍会回发（无监听器时无副作用）
    expect(wrapper.findAll('.cumquat-table__row')).toHaveLength(20);
  });
});

describe('Table 单元格竞选', () => {
  it('无提示列回落默认文本，不产出语义节点', () => {
    const wrapper = mount(Table, {
      props: {
        columns: [{ key: 'name', title: '名称' }],
        rows: [{ name: 'Amber' }],
      },
    });
    expect(wrapper.find('.cumquat-table__td').text()).toBe('Amber');
    expect(wrapper.find('.cumquat-cell').exists()).toBe(false);
  });

  it('空值显示为空字符串', () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          { key: 'name', title: '名称' },
          { key: 'age', title: '年龄' },
        ],
        rows: [{ name: null, age: undefined }],
      },
    });
    const cells = wrapper.findAll('.cumquat-table__td');
    expect(cells[0].text()).toBe('');
    expect(cells[1].text()).toBe('');
  });

  it('类型与格式推断：number 千分位、boolean 是/否、date/date-time 格式化', () => {
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: {
        score: { type: 'number', title: '积分' },
        active: { type: 'boolean', title: '启用' },
        birthday: { type: 'string', format: 'date', title: '生日' },
        createdAt: { type: 'string', format: 'date-time', title: '创建时间' },
      },
    });
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [
          {
            score: 1234567,
            active: true,
            birthday: '2026-03-05',
            createdAt: '2026-03-05T08:09:10',
          },
          { score: '不是数字', active: false, birthday: '生日未知', createdAt: null },
        ],
      },
    });
    const firstRow = wrapper.findAll('.cumquat-table__row')[0].findAll('.cumquat-table__td');
    expect(firstRow[0].find('.cumquat-cell--number').text()).toBe('1,234,567');
    expect(firstRow[1].find('.cumquat-cell--boolean-yes').text()).toBe('是');
    expect(firstRow[2].find('.cumquat-cell--date').text()).toBe('2026-03-05');
    expect(firstRow[3].find('.cumquat-cell--datetime').text()).toBe('2026-03-05 08:09:10');
    // 越界值由 Cell 自行降级：非法数字/日期显示原值，false 显示否，空值显示空
    const secondRow = wrapper.findAll('.cumquat-table__row')[1].findAll('.cumquat-table__td');
    expect(secondRow[0].text()).toBe('不是数字');
    expect(secondRow[1].find('.cumquat-cell--boolean-no').text()).toBe('否');
    expect(secondRow[2].text()).toBe('生日未知');
    expect(secondRow[3].text()).toBe('');
  });

  it('enum 列：显示 options label，越界值显示原值', () => {
    const wrapper = mount(Table, {
      props: {
        columns: [
          {
            key: 'status',
            title: '状态',
            enum: [
              { label: '启用', value: 'active' },
              { label: '禁用', value: 'disabled' },
            ],
          },
        ],
        rows: [{ status: 'active' }, { status: 'deleted' }, { status: null }],
      },
    });
    const rows = wrapper.findAll('.cumquat-table__row');
    expect(rows[0].find('.cumquat-cell--enum').text()).toBe('启用');
    expect(rows[1].find('.cumquat-cell--enum-unknown').text()).toBe('deleted');
    expect(rows[2].find('.cumquat-table__td').text()).toBe('');
  });

  it('format 推断：email 邮箱链接、uri 外链、tag/status 标签，均胜过兜底文本', () => {
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: {
        email: { format: 'email', title: '邮箱' },
        site: { format: 'uri', title: '主页' },
        level: { format: 'tag', title: '等级' },
        state: { format: 'status', title: '状态' },
      },
    });
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [{ email: 'a@b.com', site: 'https://x.dev', level: '黄金', state: '在线' }],
      },
    });
    const email = wrapper.find('.cumquat-cell--email');
    expect(email.text()).toBe('a@b.com');
    expect(email.attributes('href')).toBe('mailto:a@b.com');
    const link = wrapper.find('.cumquat-cell--link');
    expect(link.attributes('href')).toBe('https://x.dev');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toContain('noopener');
    expect(wrapper.find('.cumquat-cell--tag').text()).toBe('黄金');
    expect(wrapper.findAll('.cumquat-cell--tag')).toHaveLength(2);
  });

  it('bias 加成可翻转竞选结果，负向加成同样生效', () => {
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active'], format: 'status' },
        level: { type: 'string', enum: ['gold'], format: 'status' },
      },
    });
    columns[0].bias = { tag: 30 };
    columns[1].bias = { enum: -50 };
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [{ status: 'active', level: 'gold' }],
      },
    });
    // enum 原本 100 分胜出，加成后 tag（85 + 30）反超
    expect(wrapper.find('.cumquat-cell--tag').text()).toBe('active');
    // 负向加成把 enum 压到 50 分，tag（85）胜出
    expect(wrapper.findAll('.cumquat-cell--tag')[1].text()).toBe('gold');
  });

  it('显式指定 cell 跳过竞选，指定即生效', () => {
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: { status: { type: 'string', enum: ['active'] } },
    });
    columns[0].cell = 'text';
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [{ status: 'active' }],
      },
    });
    expect(wrapper.find('.cumquat-table__td').text()).toBe('active');
    expect(wrapper.find('.cumquat-cell--enum').exists()).toBe(false);
  });

  it('插槽优先级最高，覆盖竞选结果', () => {
    const wrapper = mount(Table, {
      props: {
        columns: [{ key: 'status', title: '状态' }],
        rows: [{ status: 'active' }],
      },
      slots: { 'cell-status': '<em class="custom">自定义</em>' },
    });
    expect(wrapper.find('.custom').text()).toBe('自定义');
    expect(wrapper.find('.cumquat-cell--enum').exists()).toBe(false);
  });

  it('局部 cells 参与竞选：按 format 命中、同分先注册者优先、显式指定命中局部', () => {
    const progressCell: CellRenderer = {
      name: 'progress',
      fitness: (column) => (column.format === 'percent' ? 95 : 0),
      render: (value) =>
        h('span', { class: 'cumquat-cell cumquat-cell--progress' }, `${Number(value)}%`),
    };
    const rivalCell: CellRenderer = {
      name: 'rival',
      fitness: (column) => (column.format === 'percent' ? 95 : 0),
      render: () => h('span', { class: 'cumquat-cell--rival' }, 'rival'),
    };
    const columns: TableColumn[] = schemaToColumns({
      type: 'object',
      properties: {
        rate: { format: 'percent', title: '进度' },
        score: { format: 'percent', title: '得分' },
      },
    });
    columns[1].cell = 'rival';
    const wrapper = mount(Table, {
      props: {
        columns,
        rows: [{ rate: 42, score: 7 }],
        cells: [progressCell, rivalCell],
      },
    });
    // 同分时先注册者（数组靠前）胜出
    expect(wrapper.find('.cumquat-cell--progress').text()).toBe('42%');
    // 显式指定在局部注册命中
    expect(wrapper.find('.cumquat-cell--rival').text()).toBe('rival');
  });

  it('Cell 可依据宿主附加字段评分', () => {
    const metaCell: CellRenderer = {
      name: 'meta',
      fitness: (column) =>
        (column as unknown as { cellMeta?: { highlight?: boolean } }).cellMeta?.highlight ? 99 : 0,
      render: (value) => h('strong', { class: 'cumquat-cell--meta' }, String(value)),
    };
    type MetaColumn = TableColumn & { cellMeta?: { highlight?: boolean } };
    const wrapper = mount(Table, {
      props: {
        columns: [
          { key: 'name', title: '名称' },
          { key: 'name2', title: '名称二', cellMeta: { highlight: true } },
        ] as MetaColumn[],
        rows: [{ name: 'Amber', name2: 'Bolt' }],
        cells: [metaCell],
      },
    });
    expect(wrapper.find('.cumquat-cell--meta').text()).toBe('Bolt');
    expect(wrapper.findAll('.cumquat-table__row')[0].findAll('.cumquat-table__td')[0].text()).toBe(
      'Amber',
    );
  });

  it('registerCell 同名覆盖内建实现，全局生效', () => {
    registerCell({
      name: 'email',
      fitness: (column) => (column.format === 'email' ? 95 : 0),
      render: (value) => h('b', { class: 'cumquat-cell--email-custom' }, String(value)),
    });
    const wrapper = mount(Table, {
      props: {
        columns: schemaToColumns({
          type: 'object',
          properties: { email: { format: 'email', title: '邮箱' } },
        }),
        rows: [{ email: 'a@b.com' }],
      },
    });
    expect(wrapper.find('.cumquat-cell--email-custom').text()).toBe('a@b.com');
    // 还原内建实现，避免影响同文件后续用例
    registerCell({
      name: 'email',
      fitness: (column) => (column.format === 'email' ? 95 : 0),
      render: (value) => {
        const text = value === null || value === undefined ? '' : String(value);
        return text === ''
          ? ''
          : h('a', { class: 'cumquat-cell cumquat-cell--email', href: `mailto:${text}` }, text);
      },
    });
  });
});

describe('Pagination', () => {
  it('按 total/size 生成页码', () => {
    const wrapper = mount(Pagination, { props: { total: 50, size: 10, page: 1 } });
    expect(wrapper.findAll('.cumquat-pagination__page')).toHaveLength(5);
  });

  it('点击页码更新当前页', async () => {
    const wrapper = mount(Pagination, { props: { total: 50, size: 10, page: 1 } });
    await wrapper.findAll('.cumquat-pagination__page')[2].trigger('click');
    expect(wrapper.emitted('update:page')?.[0]).toEqual([3]);
  });

  it('受控模式：外部 page 变化同步高亮与区间', async () => {
    const wrapper = mount(Pagination, { props: { total: 50, size: 10, page: 1 } });
    expect(wrapper.find('.cumquat-pagination__page--active').text()).toBe('1');
    await wrapper.setProps({ page: 3 });
    expect(wrapper.find('.cumquat-pagination__page--active').text()).toBe('3');
    expect(wrapper.find('.cumquat-pagination__total').text()).toContain('第 21-30 条');
  });

  it('非受控：切换每页条数生效并回发事件', async () => {
    const wrapper = mount(Pagination, {
      props: { total: 50, sizes: [10, 20], showSizeChanger: true },
    });
    const select = wrapper.find('.cumquat-pagination__select');
    (select.element as HTMLSelectElement).value = '20';
    await select.trigger('change');
    expect(wrapper.emitted('update:size')?.[0]).toEqual([20]);
    expect((wrapper.find('.cumquat-pagination__select').element as HTMLSelectElement).value).toBe(
      '20',
    );
  });

  it('第一页时 prev 禁用', () => {
    const wrapper = mount(Pagination, { props: { total: 50, size: 10, page: 1 } });
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
    const fetcher = mockFetch(async () => [
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

  it('action 成功：确认后才切换到新页签', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Tabs, { props: { tabs, modelValue: 'a', action } });
    await wrapper.findAll('.cumquat-tabs__tab')[1].trigger('click');
    await wait();
    expect(action).toHaveBeenCalledWith('b');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['b']);
    await wrapper.setProps({ modelValue: 'b' });
    expect(wrapper.findAll('.cumquat-tabs__tab')[1].classes()).toContain(
      'cumquat-tabs__tab--active',
    );
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：停留在原面板并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Tabs, { props: { tabs, modelValue: 'a', action } });
    await wrapper.findAll('.cumquat-tabs__tab')[1].trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.findAll('.cumquat-tabs__tab')[0].classes()).toContain(
      'cumquat-tabs__tab--active',
    );
    expect(wrapper.emitted('actionError')).toHaveLength(1);
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

  it('action 成功：勾选新值生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Tree, {
      props: { nodes, defaultExpandAll: true, checkable: true, action },
    });
    await wrapper.find('.cumquat-tree__checkbox').setValue();
    await wait();
    expect(action).toHaveBeenCalledWith(['p1']);
    expect(wrapper.emitted('update:checked')?.at(-1)).toEqual([['p1']]);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：勾选回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Tree, {
      props: { nodes, defaultExpandAll: true, checkable: true, action },
    });
    await wrapper.find('.cumquat-tree__checkbox').setValue();
    await wait();
    expect(wrapper.emitted('update:checked')?.at(-1)).toEqual([[]]);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
  });

  it('fetch：挂载拉根节点，展开懒加载父节点时注入 parentKey', async () => {
    const fetcher = mockFetch(async ({ filters }) =>
      filters?.parentKey
        ? ([{ key: 'a1', label: '懒加载子节点', leaf: true }] as TreeNode[])
        : ([{ key: 'a', label: '懒加载父节点', leaf: false }] as TreeNode[]),
    );
    const wrapper = mount(Tree, { props: { fetch: fetcher } });
    await wait();
    expect(fetcher.queries[0]?.filters).toBeUndefined();
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(1);
    await wrapper.find('.cumquat-tree__expander').trigger('click');
    await wait();
    await wait();
    expect(fetcher.queries.at(-1)?.filters).toEqual({ parentKey: 'a' });
    expect(wrapper.findAll('.cumquat-tree__node')).toHaveLength(2);
    expect(wrapper.findAll('.cumquat-tree__node')[1].text()).toContain('懒加载子节点');
  });

  it('fetch：根节点未标记 leaf 时默认可展开，空子级回标为叶子', async () => {
    const fetcher = mockFetch(async ({ filters }) =>
      filters?.parentKey ? ([] as TreeNode[]) : ([{ key: 'a', label: '未知节点' }] as TreeNode[]),
    );
    const wrapper = mount(Tree, { props: { fetch: fetcher } });
    await wait();
    expect(wrapper.find('.cumquat-tree__expander').exists()).toBe(true);
    await wrapper.find('.cumquat-tree__expander').trigger('click');
    await wait();
    await wait();
    expect(fetcher.queries.at(-1)?.filters).toEqual({ parentKey: 'a' });
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
    const fetcher = mockFetch(async ({ filters }) =>
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
    expect(fetcher.queries.at(-1)?.filters).toEqual({ parentKey: 'prov' });
    expect(wrapper.findAll('.cumquat-cascader__column')).toHaveLength(2);
    await wrapper
      .findAll('.cumquat-cascader__column')[1]
      .find('.cumquat-cascader__option')
      .trigger('click');
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['city']);
  });

  it('action 成功：选择叶子后新值生效', async () => {
    const action = vi.fn(async () => undefined);
    const wrapper = mount(Cascader, { props: { options, action } });
    await wrapper.find('.cumquat-cascader__trigger').trigger('click');
    await wrapper
      .findAll('.cumquat-cascader__column')[0]
      .findAll('.cumquat-cascader__option')[1]
      .trigger('click');
    await wait();
    expect(action).toHaveBeenCalledWith('north');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['north']);
    expect(wrapper.emitted('actionError')).toBeUndefined();
  });

  it('action 失败：选择回退旧值并触发 actionError', async () => {
    const action = vi.fn(async () => {
      throw new Error('deny');
    });
    const wrapper = mount(Cascader, { props: { options, action } });
    await wrapper.find('.cumquat-cascader__trigger').trigger('click');
    await wrapper
      .findAll('.cumquat-cascader__column')[0]
      .findAll('.cumquat-cascader__option')[1]
      .trigger('click');
    await wait();
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([null]);
    expect(wrapper.emitted('actionError')).toHaveLength(1);
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
  const data = { name: 'Cumquat', version: '0.1.0', createdAt: '2026-01-01', active: true };
  const properties = [
    { key: 'name', label: '名称' },
    { key: 'version', label: '版本' },
    { key: 'createdAt', label: '创建时间', format: 'date' },
    { key: 'active', label: '启用', type: 'boolean' as const },
  ];

  it('按元数据渲染标签与值', () => {
    const wrapper = mount(Descriptions, { props: { title: '详情', data, properties } });
    expect(wrapper.find('.cumquat-descriptions__title').text()).toBe('详情');
    expect(wrapper.findAll('.cumquat-descriptions__label')).toHaveLength(4);
    // Cell 竞选生效：date 格式化、boolean 转文案
    const text = wrapper.text();
    expect(text).toContain('2026-01-01');
    expect(text).toContain('是');
  });

  it('值插槽覆盖竞选渲染', () => {
    const wrapper = mount(Descriptions, {
      props: { data, properties: [{ key: 'name', label: '名称' }] },
      slots: { 'value-name': '自定义值' },
    });
    expect(wrapper.find('.cumquat-descriptions__value').text()).toBe('自定义值');
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

describe('List', () => {
  const users = [
    { id: 1, name: 'Amber', sign: '前端工程师', avatarUrl: 'https://example.com/a.png' },
    { id: 2, name: 'Bolt', sign: '设计师', avatarUrl: '' },
  ];

  it('数据模式：映射器驱动内建 Meta 渲染', () => {
    const wrapper = mount(List, {
      props: {
        items: users,
        title: (item: any) => item.name,
        description: (item: any) => item.sign,
        avatar: (item: any) => item.avatarUrl,
        rowKey: (item: any) => item.id,
      },
    });
    const items = wrapper.findAll('.cumquat-list-item');
    expect(items).toHaveLength(2);
    expect(wrapper.find('.cumquat-list-item-meta__title').text()).toBe('Amber');
    expect(wrapper.find('.cumquat-list-item-meta__description').text()).toBe('前端工程师');
    expect(wrapper.find('.cumquat-list-item-meta__avatar').exists()).toBe(true);
    // 头像地址为空的项不渲染头像区域
    expect(items[1].find('.cumquat-list-item-meta__avatar').exists()).toBe(false);
  });

  it('数据模式：无映射器时回退 String(item)', () => {
    const wrapper = mount(List, { props: { items: ['苹果', '香蕉'] } });
    const items = wrapper.findAll('.cumquat-list-item--plain');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toBe('苹果');
  });

  it('#item 插槽完全接管行渲染', () => {
    const wrapper = mount(List, {
      props: { items: users, title: (item: any) => item.name },
      slots: {
        item: `<template #item="{ item }"><div class="row-custom">{{ item.name }}-自绘</div></template>`,
      },
    });
    expect(wrapper.findAll('.row-custom')).toHaveLength(2);
    expect(wrapper.find('.cumquat-list-item-meta').exists()).toBe(false);
  });

  it('插槽模式：ListItem + Meta 编排，actions/extra 就位', () => {
    const wrapper = mount(List, {
      slots: {
        default: () =>
          h(ListItem, null, {
            default: () => h(ListItemMeta, { title: '标题', description: '描述' }),
            actions: () => h('span', { class: 'row-action' }, '操作'),
            extra: () => h('span', { class: 'row-extra' }, '附加'),
          }),
      },
    });
    expect(wrapper.find('.cumquat-list-item-meta__title').text()).toBe('标题');
    expect(wrapper.find('.row-action').exists()).toBe(true);
    expect(wrapper.find('.row-extra').exists()).toBe(true);
  });

  it('fetch：分页结果点「加载更多」累积下一页，取满后隐藏按钮', async () => {
    const fetcher = mockFetch(async ({ page = 1 }) => ({
      list: Array.from({ length: page === 1 ? 2 : 1 }, (_, index) => ({
        id: index + 1,
        name: `用户 ${(page - 1) * 2 + index + 1}`,
      })),
      total: 3,
    }));
    const wrapper = mount(List, { props: { fetch: fetcher, size: 2 } });
    await wait();
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(2);
    expect(wrapper.find('.cumquat-list__more').exists()).toBe(true);
    await wrapper.find('.cumquat-list__more-btn').trigger('click');
    await wait();
    expect(fetcher.queries[1]).toMatchObject({ page: 2, size: 2 });
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(3);
    expect(wrapper.find('.cumquat-list__more').exists()).toBe(false);
  });

  it('fetch：返回纯数组不分页，不显示加载更多', async () => {
    const fetcher = mockFetch(async () => ['一', '二']);
    const wrapper = mount(List, { props: { fetch: fetcher } });
    await wait();
    expect(wrapper.findAll('.cumquat-list-item--plain')).toHaveLength(2);
    expect(wrapper.find('.cumquat-list__more').exists()).toBe(false);
  });

  it('fetch：失败展示错误与重试，重试成功恢复', async () => {
    const fetcher = mockFetch(() => {
      if (fetcher.queries.length === 1) throw new Error('boom');
      return { list: users, total: 2 };
    });
    const wrapper = mount(List, { props: { fetch: fetcher } });
    await wait();
    expect(wrapper.find('.cumquat-list__state.cq-state--error').exists()).toBe(true);
    await wrapper.find('.cumquat-list__retry').trigger('click');
    await wait();
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(2);
  });

  it('数据模式空数据展示空态文案', () => {
    const wrapper = mount(List, { props: { items: [] } });
    expect(wrapper.find('.cumquat-list__state').text()).toBe('暂无数据');
  });

  it('header/footer 渲染且插槽优先', () => {
    const wrapper = mount(List, {
      props: { items: users, header: '头部', footer: '底部' },
      slots: { header: '插槽头' },
    });
    expect(wrapper.find('.cumquat-list__header').text()).toBe('插槽头');
    expect(wrapper.find('.cumquat-list__footer').text()).toBe('底部');
  });

  it('children 数据：缺省收起，点箭头展开并缩进，再点收起', async () => {
    const tree = [
      { id: 1, name: '研发部', children: [
        { id: 11, name: '前端组' },
        { id: 12, name: '后端组' },
      ] },
      { id: 2, name: '设计部' },
    ];
    const wrapper = mount(List, {
      props: {
        items: tree,
        title: (item: any) => item.name,
        rowKey: (item: any) => item.id,
      },
    });
    // 缺省收起：只有 2 个顶层项，含箭头的只有研发部
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(2);
    expect(wrapper.find('.cumquat-list__expander').exists()).toBe(true);
    // 展开后子项经映射器渲染并带缩进
    await wrapper.find('.cumquat-list__expander').trigger('click');
    const items = wrapper.findAll('.cumquat-list-item');
    expect(items).toHaveLength(4);
    expect(items[1].text()).toContain('前端组');
    expect(items[1].attributes('style')).toContain('padding-inline-start: calc(2.25rem)');
    expect(wrapper.emitted('expand')?.[0]).toEqual([{ item: tree[0], expanded: true }]);
    // 再点收起
    await wrapper.find('.cumquat-list__expander').trigger('click');
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(2);
    expect(wrapper.emitted('expand')?.[1]).toEqual([{ item: tree[0], expanded: false }]);
  });

  it('defaultExpandAll：初始展开全部，可手动收起', async () => {
    const tree = [
      { id: 1, name: '研发部', children: [
        { id: 11, name: '前端组', children: [{ id: 111, name: 'Web 组' }] },
      ] },
    ];
    const wrapper = mount(List, {
      props: { items: tree, title: (item: any) => item.name, rowKey: (item: any) => item.id, defaultExpandAll: true },
    });
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(3);
    expect(wrapper.text()).toContain('Web 组');
    // 收起顶层后子级整体隐藏
    await wrapper.find('.cumquat-list__expander').trigger('click');
    expect(wrapper.findAll('.cumquat-list-item')).toHaveLength(1);
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
