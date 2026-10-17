<script setup lang="ts">
import { ref } from 'vue';
import { CodeCard } from '@cumquat/components';
import LiveDemo from '../components/LiveDemo.vue';

const text = ref('');
const tagVisible = ref(true);

const buttonTypeCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary">主要按钮</Button>
    <Button>次要按钮</Button>
    <Button type="danger">危险按钮</Button>
    <Button type="ghost">幽灵按钮</Button>
  </div>
`);

const buttonSizeCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button type="primary" size="sm">小号</Button>
    <Button type="primary">中号</Button>
    <Button type="primary" size="lg">大号</Button>
  </div>
`);

const buttonStateCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Button disabled>禁用</Button>
    <Button type="primary" loading>加载中</Button>
  </div>
`);

const iconCode = ref(`
  <div class="flex flex-wrap items-center gap-4">
    <Icon class="size-5 text-cumquat-warning">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2l-5-4.9 6.9-1z" />
    </Icon>
    <Icon class="size-5 text-cumquat-accent">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4m0 4h.01" />
    </Icon>
    <Icon class="size-5 text-cumquat-danger">
      <path
        d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
      />
    </Icon>
  </div>
`);

const inputCode = ref(`
  <div class="flex flex-col gap-3">
    <Input v-model="text" placeholder="请输入内容" class="w-64" />
    <Input placeholder="禁用态" disabled class="w-64" />
    <Input placeholder="校验失败态" invalid class="w-64" />
    <p class="text-sm text-cumquat-text-muted">当前值：{{ text || '（空）' }}</p>
  </div>
`);

const cardCode = ref(`
  <div class="grid grid-cols-2 gap-4">
    <Card title="基础卡片" hoverable>
      <p class="text-sm text-cumquat-text-muted">卡片内容区域，支持任意内容。</p>
    </Card>
    <Card title="无边框卡片" :bordered="false">
      <p class="text-sm text-cumquat-text-muted">bordered 为 false 时不渲染描边。</p>
    </Card>
  </div>
`);

const dividerCode = ref(`
  <Divider label="section" />
  <Divider :dashed="true" label="虚线" />
  <div class="flex items-center gap-4">
    <span class="text-sm">左侧</span>
    <Divider orientation="vertical" />
    <span class="text-sm">右侧</span>
  </div>
`);

const avatarCode = ref(`
  <div class="flex flex-wrap items-center gap-4">
    <Avatar text="柠" />
    <Avatar text="檬" size="lg" />
    <Avatar text="Q" shape="square" />
    <Avatar text="F" size="sm" />
  </div>
`);

const badgeCode = ref(`
  <div class="flex flex-wrap items-center gap-8">
    <Badge :count="5">
      <Avatar text="C" shape="square" />
    </Badge>
    <Badge :count="120">
      <Avatar text="M" shape="square" />
    </Badge>
    <Badge :dot="true">
      <Avatar text="D" shape="square" />
    </Badge>
  </div>
`);

const statisticCode = ref(`
  <div class="flex flex-wrap gap-10">
    <Statistic title="下载量" :value="12834" suffix="次" />
    <Statistic title="星标数" :value="986" suffix="颗" />
    <Statistic title="完成率" :value="87" suffix="%" />
  </div>
`);

const typographyCode = ref(`
  <div class="flex flex-col gap-2">
    <Typography :level="1">一级标题</Typography>
    <Typography :level="2">二级标题</Typography>
    <Typography :level="3">三级标题</Typography>
    <Typography>正文段落，用于展示常规文本内容。</Typography>
    <Typography :copyable="true">点击图标复制这段文本</Typography>
  </div>
`);

const tagCode = ref(`
  <div class="flex flex-wrap items-center gap-3">
    <Tag>默认标签</Tag>
    <Tag type="success">成功</Tag>
    <Tag type="warning">警告</Tag>
    <Tag type="danger">危险</Tag>
    <Tag v-model="tagVisible" closable>可关闭</Tag>
    <Button v-if="!tagVisible" size="sm" @click="tagVisible = true">恢复标签</Button>
  </div>
`);

const emptyCode = ref(`
  <Empty description="暂无订单数据" />
`);

/** LiveDemo 渲染作用域：代码卡片模板中可访问的变量与函数 */
const demoScope = {
  text,
  tagVisible,
};
</script>

<template>
  <div class="flex flex-col gap-10">
    <section id="button" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Button 按钮</h2>
      <div class="flex flex-col gap-4">
        <CodeCard v-model:code="buttonTypeCode" editable title="按钮类型">
          <LiveDemo :code="buttonTypeCode" :scope="demoScope" />
        </CodeCard>
        <CodeCard v-model:code="buttonSizeCode" editable title="按钮尺寸">
          <LiveDemo :code="buttonSizeCode" :scope="demoScope" />
        </CodeCard>
        <CodeCard v-model:code="buttonStateCode" editable title="禁用与加载">
          <LiveDemo :code="buttonStateCode" :scope="demoScope" />
        </CodeCard>
      </div>
    </section>

    <section id="icon" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Icon 图标</h2>
      <CodeCard v-model:code="iconCode" editable title="内置路径与语义色">
        <LiveDemo :code="iconCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="input" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Input 输入框</h2>
      <CodeCard v-model:code="inputCode" editable title="基础、禁用与校验态">
        <LiveDemo :code="inputCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="card" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Card 卡片</h2>
      <CodeCard v-model:code="cardCode" editable title="悬浮与无边框">
        <LiveDemo :code="cardCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="divider" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Divider 分割线</h2>
      <CodeCard v-model:code="dividerCode" editable title="水平、虚线与垂直">
        <LiveDemo :code="dividerCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="avatar" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Avatar 头像</h2>
      <CodeCard v-model:code="avatarCode" editable title="尺寸与形状">
        <LiveDemo :code="avatarCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="badge" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Badge 徽标数</h2>
      <CodeCard v-model:code="badgeCode" editable title="计数、溢出与红点">
        <LiveDemo :code="badgeCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="statistic" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Statistic 数值统计</h2>
      <CodeCard v-model:code="statisticCode" editable title="数值与后缀">
        <LiveDemo :code="statisticCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="typography" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Typography 排版</h2>
      <CodeCard v-model:code="typographyCode" editable title="标题层级与复制">
        <LiveDemo :code="typographyCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="tag" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Tag 标签</h2>
      <CodeCard v-model:code="tagCode" editable title="语义类型与可关闭">
        <LiveDemo :code="tagCode" :scope="demoScope" />
      </CodeCard>
    </section>

    <section id="empty" class="scroll-mt-4">
      <h2 class="mb-3 text-base font-semibold text-cumquat-text">Empty 空状态</h2>
      <CodeCard v-model:code="emptyCode" editable title="自定义描述">
        <LiveDemo :code="emptyCode" :scope="demoScope" />
      </CodeCard>
    </section>
  </div>
</template>
