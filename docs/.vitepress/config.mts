import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitepress';

type SidebarItem = { text: string; link: string };
type SidebarGroup = { text: string; collapsed: boolean; items: SidebarItem[] };

/** 组件文档按使用目的分类；子组件并入父组件文档 */
const groups: Array<{ text: string; items: Array<[string, string, string]> }> = [
  {
    text: '通用',
    items: [
      ['button', 'Button 按钮'],
      ['icon', 'Icon 图标'],
      ['typography', 'Typography 排版'],
    ],
  },
  {
    text: '布局',
    items: [
      ['divider', 'Divider 分割线'],
      ['grid', 'Grid 栅格'],
      ['layout', 'Layout 布局'],
      ['space', 'Space 间距'],
    ],
  },
  {
    text: '导航',
    items: [
      ['anchor', 'Anchor 锚点'],
      ['back-top', 'BackTop 回到顶部'],
      ['breadcrumb', 'Breadcrumb 面包屑'],
      ['dropdown', 'Dropdown 下拉菜单'],
      ['menu', 'Menu 导航菜单'],
      ['pagination', 'Pagination 分页'],
      ['steps', 'Steps 步骤条'],
      ['tabs', 'Tabs 标签页'],
    ],
  },
  {
    text: '数据输入',
    items: [
      ['auto-complete', 'AutoComplete 自动完成'],
      ['cascader', 'Cascader 级联选择'],
      ['checkbox', 'Checkbox 复选框'],
      ['color-picker', 'ColorPicker 颜色选择器'],
      ['date-picker', 'DatePicker 日期选择器'],
      ['form', 'Form 表单（含 FormItem）'],
      ['input', 'Input 输入框'],
      ['input-number', 'InputNumber 数字输入框'],
      ['mention', 'Mention 提及'],
      ['radio', 'Radio 单选框（含 RadioGroup）'],
      ['rate', 'Rate 评分'],
      ['select', 'Select 选择器'],
      ['segmented', 'Segmented 分段控制器'],
      ['slider', 'Slider 滑块'],
      ['switch', 'Switch 开关'],
      ['time-picker', 'TimePicker 时间选择器'],
      ['transfer', 'Transfer 穿梭框'],
      ['tree-select', 'TreeSelect 树选择'],
      ['upload', 'Upload 上传'],
    ],
  },
  {
    text: '数据展示',
    items: [
      ['avatar', 'Avatar 头像'],
      ['badge', 'Badge 徽标'],
      ['calendar', 'Calendar 日历'],
      ['card', 'Card 卡片'],
      ['carousel', 'Carousel 走马灯'],
      ['collapse', 'Collapse 折叠面板'],
      ['descriptions', 'Descriptions 描述列表'],
      ['empty', 'Empty 空状态'],
      ['image', 'Image 图片'],
      ['list', 'List 列表（含 ListItem、ListItemMeta）'],
      ['popover', 'Popover 气泡卡片'],
      ['qrcode', 'QRCode 二维码'],
      ['statistic', 'Statistic 统计数值'],
      ['table', 'Table 表格'],
      ['tag', 'Tag 标签'],
      ['timeline', 'Timeline 时间线'],
      ['tooltip', 'Tooltip 文字提示'],
      ['tree', 'Tree 树形控件'],
      ['virtual-list', 'VirtualList 虚拟列表'],
    ],
  },
  {
    text: '反馈',
    items: [
      ['alert', 'Alert 警告提示'],
      ['dialog', 'Dialog 对话框'],
      ['drawer', 'Drawer 抽屉'],
      ['loading', 'Loading 加载'],
      ['message', 'Message 全局提示（含 MessageContainer）'],
      ['notification', 'Notification 通知（含 NotificationContainer）'],
      ['popconfirm', 'Popconfirm 气泡确认'],
      ['progress', 'Progress 进度条'],
      ['result', 'Result 结果页'],
      ['skeleton', 'Skeleton 骨架屏'],
    ],
  },
  {
    text: '场景组件',
    items: [
      ['chat', 'Chat 聊天框'],
      ['chat-input', 'ChatInput 聊天输入条'],
      ['voice-button', 'VoiceButton 语音按钮'],
    ],
  },
  {
    text: '其他',
    items: [
      ['affix', 'Affix 固钉'],
      ['float-button', 'FloatButton 悬浮按钮'],
      ['tour', 'Tour 漫游引导'],
      ['watermark', 'Watermark 水印'],
    ],
  },
];

const componentSidebar: SidebarGroup[] = groups.map((group) => ({
  text: group.text,
  collapsed: false,
  items: group.items.map(([kebab, title]) => ({
    text: title,
    link: `/components/${kebab}`,
  })),
}));

const composableGroups: Array<{ text: string; items: Array<[string, string]> }> = [
  { text: '开始', items: [['index', '总览']] },
  {
    text: '数据',
    items: [
      ['fetch', '数据请求'],
      ['subscribe', '数据订阅'],
      ['resources', '资源池 useResources'],
      ['schema-view', '视图转换器 createView'],
      ['pagination', '分页 usePagination'],
      ['chat', '聊天消息 useChat'],
      ['mask', '数据遮罩 useMask'],
    ],
  },
  {
    text: '表单',
    items: [
      ['form', '表单模型'],
      ['validation', '数据校验'],
      ['date', '日期时间模型'],
    ],
  },
  {
    text: '反馈与浮层',
    items: [
      ['message', '消息服务'],
      ['overlay', '浮层模型'],
      ['chat-input', '聊天输入 useChatInput'],
    ],
  },
  {
    text: '基础',
    items: [
      ['control', '受控与动作'],
      ['dom', 'DOM 与浏览器'],
      ['focus', '焦点与键盘'],
      ['voice', '语音音量 useVoiceLevel'],
      ['internals', '协议辅助函数'],
    ],
  },
];

const composableSidebar: SidebarGroup[] = composableGroups.map((group) => ({
  text: group.text,
  collapsed: false,
  items: group.items.map(([slug, title]) => ({
    text: title,
    link: slug === 'index' ? '/composables/' : `/composables/${slug}`,
  })),
}));

const typeSidebar: SidebarGroup[] = [
  {
    text: '开始',
    collapsed: false,
    items: [
      { text: '快速开始', link: '/types/quickstart' },
      { text: '设计理念', link: '/types/philosophy' },
      { text: '类型总览', link: '/types/overview' },
    ],
  },
  {
    text: '基础层',
    collapsed: false,
    items: [
      { text: '核心类型', link: '/types/basics/core' },
      { text: '公共组合类型', link: '/types/basics/common' },
      { text: '浮层与视图基础', link: '/types/basics/overlay' },
    ],
  },
  {
    text: '模型层',
    collapsed: false,
    items: [
      { text: '数据模型与表单', link: '/types/model/form' },
      { text: '资源池类型', link: '/types/model/resources' },
      { text: '视图投影与竞选', link: '/types/model/rendering' },
    ],
  },
  {
    text: '视图层',
    collapsed: false,
    items: [
      { text: '导航组件', link: '/types/view/navigation' },
      { text: '数据展示组件', link: '/types/view/data-display' },
      { text: '数据输入组件', link: '/types/view/data-entry' },
      { text: '反馈组件', link: '/types/view/feedback' },
      { text: '场景组件', link: '/types/view/scenarios' },
      { text: '其他组件', link: '/types/view/other' },
    ],
  },
];

export default defineConfig({
  lang: 'zh-CN',
  title: 'Cumquat',
  description: 'Vue 3 组件库：Headless 组合函数 + 开箱即用默认渲染 + 主题包',
  cleanUrls: true,
  head: [['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }]],
  themeConfig: {
    nav: [
      { text: '指南', link: '/getting-started', activeMatch: '/getting-started' },
      { text: '组件', link: '/components/button', activeMatch: '/components/' },
      { text: '组合函数', link: '/composables/', activeMatch: '/composables/' },
      { text: '类型参考', link: '/types/quickstart', activeMatch: '/types/' },
    ],
    sidebar: {
      '/components/': componentSidebar,
      '/composables/': composableSidebar,
      '/types/': typeSidebar,
      '/': [
        { text: '快速上手', link: '/getting-started' },
        { text: '状态自持', link: '/state' },
        { text: '竞选机制', link: '/campaign' },
        { text: '元数据导出', link: '/metadata' },
        { text: '类型参考', link: '/types/quickstart' },
      ],
    },
    outline: [2, 3],
    socialLinks: [],
    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'layer-vitepress-base',
        // VitePress 默认主题的 base.css 以未分层形式注入，其中的元素重置
        // （button 的 background-color: transparent、border/padding: 0 等）
        // 会覆盖 @layer components 中的组件样式，这里将其归入 base 层，
        // 使其遵循 theme < base < components < utilities 的标准层顺序。
        transform(code, id) {
          if (id.includes('theme-default') && id.includes('styles/base.css')) {
            return `@layer base {\n${code}\n}`;
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: [
        {
          // LiveDemo 需要运行时编译模板，统一改用含编译器的完整版构建
          find: /^vue$/,
          replacement: 'vue/dist/vue.esm-bundler.js',
        },
        {
          // 开发态直接指向组件源码，无需先构建 dist
          find: /^@cumquat\/components$/,
          replacement: fileURLToPath(
            new URL('../../packages/components/src/index.ts', import.meta.url),
          ),
        },
        {
          find: /^@cumquat\/composables$/,
          replacement: fileURLToPath(
            new URL('../../packages/composables/src/index.ts', import.meta.url),
          ),
        },
        {
          find: /^@cumquat\/core$/,
          replacement: fileURLToPath(
            new URL('../../packages/core/src/index.ts', import.meta.url),
          ),
        },
      ],
    },
  },
});
