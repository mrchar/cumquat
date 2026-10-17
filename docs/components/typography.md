---
title: Typography 排版
---

# Typography 排版

标题 / 段落文本，支持省略、复制、编辑。

| Prop      | 类型                           | 默认值  | 说明                             |
| --------- | ------------------------------ | ------- | -------------------------------- |
| level     | `0 \| 1 \| 2 \| 3 \| 4`        | `0`     | 标题级别；0 渲染为段落文本       |
| ellipsis  | `boolean`                      | `false` | 单行截断                         |
| lineClamp | `number`                       | -       | 多行截断行数（与 ellipsis 同用） |
| truncate  | `'end' \| 'middle' \| 'start'` | `'end'` | 截断方式                         |
| copyable  | `boolean`                      | `false` | 显示复制按钮                     |
| text      | `string`                       | -       | 复制内容（缺省取元素文本）       |
| editable  | `boolean`                      | `false` | 可编辑                           |

| 事件      | 参数                            | 说明         |
| --------- | ------------------------------- | ------------ |
| copy      | `text: string, result: boolean` | 复制完成     |
| change    | `text: string`                  | 编辑内容变更 |
| editStart | -                               | 进入编辑态   |
| editEnd   | -                               | 退出编辑态   |

| 插槽    | 说明     |
| ------- | -------- |
| default | 文本内容 |

```vue
<Typography :level="2">页面标题</Typography>
<Typography copyable text="CUMQ-2026">订单号 CUMQ-2026</Typography>
<Typography ellipsis style="max-width: 12rem">一段很长很长的文本</Typography>
```

## 交互演示

### 标题层级与复制

<CodeCard v-model:code="typographyCode" editable title="标题层级与复制">
  <LiveDemo :code="typographyCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const typographyCode = ref(`
  <div class="flex flex-col gap-2">
    <Typography :level="1">一级标题</Typography>
    <Typography :level="2">二级标题</Typography>
    <Typography :level="3">三级标题</Typography>
    <Typography>正文段落，用于展示常规文本内容。</Typography>
    <Typography :copyable="true">点击图标复制这段文本</Typography>
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { typographyCode };
</script>

