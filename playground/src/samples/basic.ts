import { ref } from 'vue';
import type { Sample } from '../samples';

/** 基础 */
export const basicSamples: Sample[] = [
  {
    key: 'button',
    title: 'Button 按钮',
    code: `
  <div class="flex flex-wrap items-center gap-3">
    <Button>次要按钮</Button>
    <Button type="primary">主要按钮</Button>
    <Button type="danger">危险按钮</Button>
    <Button disabled>禁用状态</Button>
  </div>
`,
  },
  {
    key: 'icon',
    title: 'Icon 图标',
    code: `
  <div class="flex items-center gap-4 text-cumquat-text">
    <Icon class="size-5"><path d="M5 12h14M12 5l7 7-7 7" /></Icon>
    <Icon class="size-6 text-cumquat-accent"><circle cx="12" cy="12" r="9" /></Icon>
    <Icon class="size-8"><path d="M20 6L9 17l-5-5" /></Icon>
  </div>
`,
  },
  {
    key: 'input',
    title: 'Input 输入框',
    code: `
  <div class="flex w-72 flex-col gap-3">
    <Input v-model="text" placeholder="输入点什么" clearable />
    <Input invalid placeholder="校验失败" />
    <Input disabled placeholder="禁用状态" />
    <p class="text-sm text-cumquat-text-muted">当前值：{{ text }}</p>
  </div>
`,
    scope: () => ({ text: ref('') }),
  },
  {
    key: 'card',
    title: 'Card 卡片',
    code: `
  <div class="grid max-w-2xl grid-cols-2 gap-4">
    <Card title="基础卡片">
      <p class="text-sm text-cumquat-text-muted">卡片内容区域，支持任意插槽内容。</p>
    </Card>
    <Card title="悬浮阴影" hoverable>
      <p class="text-sm text-cumquat-text-muted">鼠标悬停时出现阴影。</p>
    </Card>
  </div>
`,
  },
  {
    key: 'divider',
    title: 'Divider 分割线',
    code: `
  <div class="max-w-md">
    <p class="text-sm text-cumquat-text">上方内容</p>
    <Divider />
    <p class="text-sm text-cumquat-text">带文案</p>
    <Divider label="分组" />
    <div class="flex h-6 items-center gap-3 text-sm text-cumquat-text">
      <span>左</span><Divider orientation="vertical" /><span>右</span>
    </div>
    <Divider dashed label="虚线" />
  </div>
`,
  },
  {
    key: 'avatar',
    title: 'Avatar 头像',
    code: `
  <div class="flex items-center gap-4">
    <Avatar text="金橘" />
    <Avatar text="陈" shape="square" />
    <Avatar text="大" size="lg" />
    <Avatar text="小" size="sm" />
  </div>
`,
  },
  {
    key: 'badge',
    title: 'Badge 徽标',
    code: `
  <div class="flex items-center gap-6">
    <Badge :count="5"><Avatar text="消息" shape="square" /></Badge>
    <Badge :count="120" :max="99"><Avatar text="通知" shape="square" /></Badge>
    <Badge dot><Avatar text="状态" shape="square" /></Badge>
  </div>
`,
  },
  {
    key: 'statistic',
    title: 'Statistic 统计数值',
    code: `
  <div class="flex items-start gap-10">
    <Statistic title="累计销量" :value="12893" suffix="件" />
    <Statistic title="完成率" :value="93.456" :precision="2" suffix="%" animation />
    <Statistic title="账户余额" :value="112893" prefix="¥" group-separator="," />
  </div>
`,
  },
  {
    key: 'typography',
    title: 'Typography 排版',
    code: `
  <div class="flex max-w-lg flex-col gap-2">
    <Typography :level="1">一级标题</Typography>
    <Typography :level="3">三级标题</Typography>
    <Typography>正文段落，支持复制、截断等能力。</Typography>
    <Typography copyable>这段文本可复制</Typography>
    <Typography ellipsis>这是一段很长很长很长很长很长很长很长很长的单行文本，会被截断</Typography>
  </div>
`,
  },
  {
    key: 'tag',
    title: 'Tag 标签',
    code: `
  <div class="flex flex-wrap items-center gap-2">
    <Tag>默认</Tag>
    <Tag type="primary">主要</Tag>
    <Tag type="success">成功</Tag>
    <Tag type="warning">警告</Tag>
    <Tag type="danger">危险</Tag>
    <Tag v-model="visible" closable>可关闭</Tag>
  </div>
`,
    scope: () => ({ visible: ref(true) }),
  },
  {
    key: 'empty',
    title: 'Empty 空状态',
    code: `
  <div class="flex max-w-md flex-col gap-6">
    <Empty />
    <Empty description="没有找到相关内容" />
  </div>
`,
  },
];
