import { ref } from 'vue';
import type { Sample } from '../samples';

/** 其他 */
export const miscSamples: Sample[] = [
  {
    key: 'qrcode',
    title: 'QRCode 二维码',
    code: `
  <div class="flex items-start gap-6">
    <QRCode value="https://cumquat.dev" />
    <QRCode value="https://cumquat.dev" color="#f59e0b" :size="25" />
  </div>
`,
  },
  {
    key: 'tour',
    title: 'Tour 漫游引导',
    code: `
  <div class="flex items-center gap-4">
    <Button id="tour-a">第一步目标</Button>
    <Button id="tour-b" type="primary">第二步目标</Button>
    <Button @click="open = true">开始引导</Button>
    <Tour v-model:open="open" :steps="steps" />
  </div>
`,
    scope: () => ({
      open: ref(false),
      steps: [
        { target: '#tour-a', title: '第一步', content: '这里是第一个功能入口。' },
        { target: '#tour-b', title: '第二步', content: '然后来到主要操作按钮。' },
      ],
    }),
  },
  {
    key: 'watermark',
    title: 'Watermark 水印',
    code: `
  <Watermark content="Cumquat 内部资料" class="h-40 max-w-lg rounded-lg border border-cumquat-border">
    <div class="p-6 text-sm text-cumquat-text-muted">水印平铺覆盖在容器上方。</div>
  </Watermark>
`,
  },
  {
    key: 'code-card',
    title: 'CodeCard 代码卡片',
    code: `
  <CodeCard title="示例源码" :code="demoCode" language="vue" editable default-expand class="max-w-xl">
    <p class="text-sm text-cumquat-text-muted">插槽区域渲染演示内容，下方为可编辑源码。</p>
  </CodeCard>
`,
    scope: () => ({
      demoCode: ref(`<template>\n  <Button type="primary">你好</Button>\n</template>`),
    }),
  },
  {
    key: 'live-demo',
    title: 'LiveDemo 实时演示',
    code: `
  <div class="flex max-w-xl flex-col gap-3">
    <Input v-model="tpl" placeholder="编辑模板，下方实时渲染" />
    <LiveDemo :code="tpl" :scope="{ count }" />
  </div>
`,
    scope: () => ({
      tpl: ref('<Button type="primary">计数 {{ count }}</Button>'),
      count: ref(0),
    }),
  },
];
