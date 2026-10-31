import { ref } from 'vue';
import type { Sample } from '../samples';

/** 数据展示 */
export const dataSamples: Sample[] = [
  {
    key: 'table',
    title: 'Table 远程数据',
    code: `
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-cumquat-text">宽屏表格形态</p>
      <Table :columns="columns" :rows="rows" selectable expandable pagination :page-size="4" :actions="actions">
        <template #expanded="{ row }">
          <p class="text-sm text-cumquat-text-muted">{{ row.name }}：年龄 {{ row.age }} 岁</p>
        </template>
      </Table>
    </div>
    <div class="flex flex-col gap-2">
      <p class="text-sm font-medium text-cumquat-text">小屏卡片形态（断点强制 9999px 预览，实际按视口自动切换）</p>
      <Table :columns="columns" :rows="rows" responsive card-breakpoint="9999px" selectable pagination :page-size="3" :actions="actions" :visible-actions="1">
      </Table>
    </div>
    <p class="text-xs text-cumquat-text-muted">最近操作：{{ ops.join('、') || '暂无' }}</p>
  </div>
`,
    scope: () => {
      const ops = ref<string[]>([]);
      return {
        columns: [
          { key: 'name', title: '名称' },
          { key: 'age', title: '年龄', align: 'center' },
        ],
        rows: Array.from({ length: 8 }, (_, i) => ({ name: `用户 ${i + 1}`, age: 18 + i })),
        ops,
        actions: [
          {
            key: 'edit',
            label: '编辑',
            onClick: (row: { name: string }) => ops.value.unshift(`编辑「${row.name}」`),
          },
          {
            key: 'copy',
            label: '复制',
            onClick: (row: { name: string }) => ops.value.unshift(`复制「${row.name}」`),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            onClick: (row: { name: string }) => ops.value.unshift(`删除「${row.name}」`),
          },
        ],
      };
    },
  },
  {
    key: 'pagination',
    title: 'Pagination 分页',
    code: `
  <div class="flex flex-col gap-3">
    <Pagination v-model="page" :total="128" show-size-changer />
    <p class="text-sm text-cumquat-text-muted">当前第 {{ page }} 页</p>
  </div>
`,
    scope: () => ({ page: ref(1) }),
  },
  {
    key: 'tabs',
    title: 'Tabs 标签页',
    code: `
  <Tabs v-model="active" :tabs="tabs" class="max-w-lg" />
`,
    scope: () => ({
      active: ref('a'),
      tabs: [
        { key: 'a', label: '概览' },
        { key: 'b', label: '详情' },
        { key: 'c', label: '设置', disabled: true },
      ],
    }),
  },
  {
    key: 'collapse',
    title: 'Collapse 折叠面板',
    code: `
  <Collapse :items="items" :default-active-keys="['1']" class="max-w-lg" />
`,
    scope: () => ({
      items: [
        { key: '1', label: '第一项', content: '第一项的展开内容。' },
        { key: '2', label: '第二项', content: '第二项的展开内容。' },
        { key: '3', label: '第三项', content: '第三项的展开内容。' },
      ],
    }),
  },
  {
    key: 'tree',
    title: 'Tree 树形控件',
    code: `
  <Tree :nodes="nodes" checkable default-expand-all class="max-w-xs" />
`,
    scope: () => ({
      nodes: [
        {
          key: 'root',
          label: '根节点',
          children: [
            { key: 'a', label: '子节点 A' },
            { key: 'b', label: '子节点 B', children: [{ key: 'b1', label: '孙节点 B1' }] },
          ],
        },
      ],
    }),
  },
  {
    key: 'cascader',
    title: 'Cascader 级联选择',
    code: `
  <div class="w-64">
    <Cascader v-model="value" :options="options" placeholder="选择地区" />
  </div>
`,
    scope: () => ({
      value: ref<string | null>(null),
      options: [
        {
          value: 'zj',
          label: '浙江',
          children: [
            {
              value: 'hz',
              label: '杭州',
              children: [
                { value: 'xihu', label: '西湖区' },
                { value: 'binjiang', label: '滨江区' },
              ],
            },
          ],
        },
        { value: 'js', label: '江苏', children: [{ value: 'nj', label: '南京' }] },
      ],
    }),
  },
  {
    key: 'timeline',
    title: 'Timeline 时间线',
    code: `
  <Timeline :items="items" class="max-w-md" />
`,
    scope: () => ({
      items: [
        { title: '创建订单', content: '2026-10-01 10:00' },
        { title: '支付成功', content: '2026-10-01 10:05' },
        { title: '发货', content: '2026-10-02 09:00' },
        { title: '签收', content: '2026-10-04 15:30' },
      ],
    }),
  },
  {
    key: 'steps',
    title: 'Steps 步骤条',
    code: `
  <Steps :steps="steps" :current="1" class="max-w-xl" />
`,
    scope: () => ({
      steps: [{ title: '填写信息' }, { title: '确认订单' }, { title: '支付' }, { title: '完成' }],
    }),
  },
  {
    key: 'descriptions',
    title: 'Descriptions 描述列表',
    code: `
  <Descriptions title="用户信息" :data="user" :properties="properties" bordered :column="2" class="max-w-2xl" />
`,
    scope: () => ({
      user: {
        name: '金橘',
        role: '开发者',
        city: '杭州',
        createdAt: '2026-01-01',
        website: 'https://cumquat.dev',
      },
      properties: [
        { key: 'name', label: '姓名' },
        { key: 'role', label: '角色' },
        { key: 'city', label: '城市' },
        { key: 'createdAt', label: '注册时间', type: 'date' },
        { key: 'website', label: '主页', format: 'uri' },
      ],
    }),
  },
  {
    key: 'list',
    title: 'List 列表',
    code: `
  <List
    :items="departments"
    :title="(item) => item.name"
    :description="(item) => item.sign"
    header="部门"
    class="max-w-xl"
  />
`,
    scope: () => ({
      departments: [
        {
          id: 1,
          name: '研发部',
          sign: '12 人',
          children: [
            { id: 11, name: '前端组', sign: '4 人' },
            { id: 12, name: '后端组', sign: '5 人' },
          ],
        },
        { id: 2, name: '设计部', sign: '6 人' },
      ],
    }),
  },
  {
    key: 'carousel',
    title: 'Carousel 走马灯',
    code: `
  <Carousel :items="items" autoplay :interval="2000" height="160px" class="max-w-lg" />
`,
    scope: () => ({ items: ['第一屏', '第二屏', '第三屏'] }),
  },
  {
    key: 'progress',
    title: 'Progress 进度条',
    code: `
  <div class="flex max-w-md flex-col gap-4">
    <Progress :value="40" show-text />
    <Progress :value="70" status="success" show-text />
    <Progress :value="55" type="circle" show-text />
  </div>
`,
  },
  {
    key: 'image',
    title: 'Image 图片',
    code: `
  <div class="flex items-start gap-4">
    <Image :src="src" alt="示例图" rounded class="w-40" />
    <Image :src="src" alt="可预览" rounded previewable class="w-40" />
  </div>
`,
    scope: () => ({
      src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cumquat%20fruit%20on%20white%20background%2C%20minimal%20photo&image_size=square',
    }),
  },
];
