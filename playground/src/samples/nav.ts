import { ref } from 'vue';
import type { Sample } from '../samples';

/** 导航与布局 */
export const navSamples: Sample[] = [
  {
    key: 'breadcrumb',
    title: 'Breadcrumb 面包屑',
    code: `
  <Breadcrumb :items="items" />
`,
    scope: () => ({
      items: [{ label: '首页' }, { label: '组件' }, { label: '导航' }],
    }),
  },
  {
    key: 'menu',
    title: 'Menu 菜单',
    code: `
  <Menu v-model="active" :items="items" :default-expanded-keys="['sub']" class="w-52" />
`,
    scope: () => ({
      active: ref('dashboard'),
      items: [
        { key: 'dashboard', label: '仪表盘' },
        {
          key: 'sub',
          label: '管理中心',
          children: [
            { key: 'users', label: '用户管理' },
            { key: 'roles', label: '角色管理' },
          ],
        },
        { key: 'settings', label: '设置' },
      ],
    }),
  },
  {
    key: 'anchor',
    title: 'Anchor 锚点',
    code: `
  <Anchor :items="items" class="w-40" />
`,
    scope: () => ({
      items: [
        { href: '#basic', label: '基本用法' },
        { href: '#api', label: 'API' },
        { href: '#faq', label: '常见问题' },
      ],
    }),
  },
  {
    key: 'back-top',
    title: 'BackTop 回到顶部',
    code: `
  <div class="relative h-64 overflow-hidden rounded-cumquat border border-cumquat-border">
    <BackTop mount visible :right="16" :bottom="16" />
    <p class="absolute inset-x-0 bottom-3 text-center text-xs text-cumquat-text-muted">mount 挂载：按钮悬停于本演示区域右下角</p>
  </div>
`,
  },
  {
    key: 'affix',
    title: 'Affix 固钉',
    code: `
  <Affix :top="80">
    <Button type="primary">滚动时固定在距顶部 80px</Button>
  </Affix>
`,
  },
  {
    key: 'float-button',
    title: 'FloatButton 悬浮按钮',
    code: `
  <div class="relative h-64 overflow-hidden rounded-cumquat border border-cumquat-border">
    <FloatButton mount :actions="actions" />
    <FloatButton mount :actions="actions" :style="{ bottom: '96px' }">
      <span class="text-xs font-semibold">客服</span>
      <template #icon-edit><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></template>
      <template #icon-top><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg></template>
    </FloatButton>
    <p class="absolute inset-x-0 bottom-3 text-center text-xs text-cumquat-text-muted">下：默认加号 + 动作组；上：默认插槽自定义「客服」触发按钮</p>
  </div>
`,
    scope: () => ({
      actions: [
        { key: 'edit', label: '编辑' },
        { key: 'share', label: '分享' },
        { key: 'top', label: '置顶' },
      ],
    }),
  },
  {
    key: 'date-picker',
    title: 'DatePicker 日期选择器',
    code: `
  <div class="flex items-center gap-3">
    <DatePicker v-model="day" placeholder="选择日期" class="w-48" />
    <span class="text-sm text-cumquat-text-muted">已选：{{ day ?? '无' }}</span>
  </div>
`,
    scope: () => ({ day: ref<number | null>(null) }),
  },
  {
    key: 'time-picker',
    title: 'TimePicker 时间选择器',
    code: `
  <div class="flex items-center gap-3">
    <TimePicker v-model="time" placeholder="选择时间" :minute-step="5" class="w-48" />
    <span class="text-sm text-cumquat-text-muted">已选：{{ time ?? '无' }}</span>
  </div>
`,
    scope: () => ({ time: ref<string | null>(null) }),
  },
  {
    key: 'calendar',
    title: 'Calendar 日历',
    code: `
  <Calendar v-model="day" class="max-w-md" />
`,
    scope: () => ({ day: ref<string | null>(null) }),
  },
  {
    key: 'color-picker',
    title: 'ColorPicker 颜色选择器',
    code: `
  <div class="flex items-center gap-3">
    <ColorPicker v-model="color" :presets="presets" />
    <span class="text-sm text-cumquat-text-muted">当前：{{ color }}</span>
  </div>
`,
    scope: () => ({
      color: ref('#f59e0b'),
      presets: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'],
    }),
  },
  {
    key: 'transfer',
    title: 'Transfer 穿梭框',
    code: `
  <Transfer v-model="selected" :data="data" :titles="['待选', '已选']" searchable />
`,
    scope: () => ({
      selected: ref<string[]>(['2']),
      data: Array.from({ length: 8 }, (_, i) => ({
        key: String(i + 1),
        label: `选项 ${i + 1}`,
      })),
    }),
  },
  {
    key: 'virtual-list',
    title: 'VirtualList 虚拟列表',
    code: `
  <VirtualList :items="items" :height="240" :item-height="32" class="max-w-md" />
`,
    scope: () => ({
      items: Array.from({ length: 5000 }, (_, i) => `第 ${i + 1} 行`),
    }),
  },
  {
    key: 'layout',
    title: 'Layout 布局',
    code: `
  <Layout class="h-48 max-w-2xl overflow-hidden rounded-lg border border-cumquat-border">
    <template #header>
      <div class="px-4 py-2 text-sm">页头</div>
    </template>
    <template #sider>
      <div class="w-32 px-3 py-2 text-sm">侧栏</div>
    </template>
    <div class="px-4 py-2 text-sm">内容区</div>
    <template #footer>
      <div class="px-4 py-2 text-sm">页脚</div>
    </template>
  </Layout>
`,
  },
  {
    key: 'grid',
    title: 'Grid 栅格',
    code: `
  <Grid :cols="2" :md="4" class="gap-3">
    <div v-for="i in 8" :key="i" class="rounded bg-cumquat-surface-2 py-4 text-center text-sm">{{ i }}</div>
  </Grid>
`,
  },
  {
    key: 'space',
    title: 'Space 间距',
    code: `
  <div class="flex flex-col gap-6">
    <Space>
      <Button>按钮一</Button>
      <Button>按钮二</Button>
      <Button>按钮三</Button>
    </Space>
    <Space direction="vertical" size="lg">
      <Button block>垂直排列 A</Button>
      <Button block>垂直排列 B</Button>
    </Space>
  </div>
`,
  },
];
