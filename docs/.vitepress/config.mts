import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitepress';

type SidebarItem = { text: string; link: string };
type SidebarGroup = { text: string; collapsed: boolean; items: SidebarItem[] };

/** 七大分类与全部组件，与源码目录一一对应 */
const groups: Array<{ text: string; items: Array<[string, string, string]> }> = [
  {
    text: '基础',
    items: [
      ['button', 'Button 按钮'],
      ['icon', 'Icon 图标'],
      ['input', 'Input 输入框'],
      ['card', 'Card 卡片'],
      ['divider', 'Divider 分割线'],
      ['avatar', 'Avatar 头像'],
      ['badge', 'Badge 徽标'],
      ['statistic', 'Statistic 统计数值'],
      ['typography', 'Typography 排版'],
      ['tag', 'Tag 标签'],
      ['empty', 'Empty 空状态'],
    ],
  },
  {
    text: '表单控件',
    items: [
      ['select', 'Select 选择器'],
      ['checkbox', 'Checkbox 复选框'],
      ['radio', 'Radio 单选框'],
      ['radio-group', 'RadioGroup 单选组'],
      ['switch', 'Switch 开关'],
      ['input-number', 'InputNumber 数字输入框'],
      ['rate', 'Rate 评分'],
      ['segmented', 'Segmented 分段控制器'],
      ['auto-complete', 'AutoComplete 自动完成'],
      ['mention', 'Mention 提及'],
      ['form', 'Form 表单'],
      ['form-item', 'FormItem 表单项'],
      ['tree-select', 'TreeSelect 树选择'],
      ['slider', 'Slider 滑块'],
    ],
  },
  {
    text: '浮层',
    items: [
      ['dialog', 'Dialog 对话框'],
      ['drawer', 'Drawer 抽屉'],
      ['dropdown', 'Dropdown 下拉菜单'],
      ['popover', 'Popover 气泡卡片'],
      ['popconfirm', 'Popconfirm 气泡确认'],
      ['tooltip', 'Tooltip 文字提示'],
    ],
  },
  {
    text: '数据展示',
    items: [
      ['table', 'Table 表格'],
      ['pagination', 'Pagination 分页'],
      ['tabs', 'Tabs 标签页'],
      ['collapse', 'Collapse 折叠面板'],
      ['tree', 'Tree 树形控件'],
      ['cascader', 'Cascader 级联选择'],
      ['timeline', 'Timeline 时间线'],
      ['steps', 'Steps 步骤条'],
      ['descriptions', 'Descriptions 描述列表'],
      ['carousel', 'Carousel 走马灯'],
      ['progress', 'Progress 进度条'],
      ['image', 'Image 图片'],
    ],
  },
  {
    text: '反馈',
    items: [
      ['message', 'Message 全局提示'],
      ['message-container', 'MessageContainer 消息容器'],
      ['alert', 'Alert 警告提示'],
      ['notification', 'Notification 通知'],
      ['notification-container', 'NotificationContainer 通知容器'],
      ['loading', 'Loading 加载'],
      ['skeleton', 'Skeleton 骨架屏'],
      ['result', 'Result 结果页'],
      ['upload', 'Upload 上传'],
    ],
  },
  {
    text: '导航与布局',
    items: [
      ['breadcrumb', 'Breadcrumb 面包屑'],
      ['menu', 'Menu 导航菜单'],
      ['anchor', 'Anchor 锚点'],
      ['back-top', 'BackTop 回到顶部'],
      ['affix', 'Affix 固钉'],
      ['float-button', 'FloatButton 悬浮按钮'],
      ['date-picker', 'DatePicker 日期选择器'],
      ['time-picker', 'TimePicker 时间选择器'],
      ['calendar', 'Calendar 日历'],
      ['color-picker', 'ColorPicker 颜色选择器'],
      ['transfer', 'Transfer 穿梭框'],
      ['virtual-list', 'VirtualList 虚拟列表'],
      ['layout', 'Layout 布局'],
      ['grid', 'Grid 栅格'],
      ['space', 'Space 间距'],
    ],
  },
  {
    text: '其他',
    items: [
      ['qrcode', 'QRCode 二维码'],
      ['tour', 'Tour 漫游引导'],
      ['watermark', 'Watermark 水印'],
      ['code-card', 'CodeCard 代码卡片'],
      ['live-demo', 'LiveDemo 实时演示'],
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
      { text: '远程数据', link: '/fetch' },
      { text: '组合函数', link: '/composables' },
      {
        text: '设计文档',
        items: [
          { text: '数据请求机制', link: '/data-fetching' },
          { text: '组件清单与优先级', link: '/components-list' },
        ],
      },
    ],
    sidebar: {
      '/components/': componentSidebar,
      '/': [
        { text: '快速上手', link: '/getting-started' },
        { text: '远程数据 Fetch', link: '/fetch' },
        { text: '交互动作 Action', link: '/action' },
        { text: '数据订阅 Subscribe', link: '/subscribe' },
        { text: '组合函数', link: '/composables' },
        { text: '数据请求机制', link: '/data-fetching' },
        { text: '组件清单与优先级', link: '/components-list' },
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
      ],
    },
  },
});
