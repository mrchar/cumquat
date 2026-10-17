---
title: Tour 漫游引导
---

# Tour 漫游引导

分步新手引导，目标元素高亮挖空。

`TourStep` 结构：

```ts
interface TourStep {
  key: string;
  title: string;
  content: string;
  target?: string; // 目标元素选择器（高亮挖空 + 卡片定位）
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}
```

| Prop      | 类型         | 默认值  | 说明                     |
| --------- | ------------ | ------- | ------------------------ |
| steps     | `TourStep[]` | `[]`    | 引导步骤配置             |
| open      | `boolean`    | `false` | 是否打开（v-model:open） |
| skippable | `boolean`    | `true`  | 显示"跳过"按钮           |
| closable  | `boolean`    | `true`  | 显示关闭按钮             |
| gap       | `number`     | `8`     | 挖空区与目标的间距（px） |

| 事件        | 参数              | 说明         |
| ----------- | ----------------- | ------------ |
| update:open | `value: boolean`  | 开合更新     |
| close       | -                 | 关闭引导     |
| finish      | -                 | 完成全部步骤 |
| skip        | -                 | 跳过引导     |
| change      | `current: number` | 步骤切换     |

```vue
<Tour
  v-model:open="touring"
  :steps="[
    { key: '1', title: '欢迎', content: '这是工作台', target: '#dashboard', placement: 'bottom' },
    { key: '2', title: '创建', content: '点击这里新建', target: '#create-btn' },
  ]"
  @finish="markDone"
/>
```

## 交互演示

### 分步引导

<CodeCard v-model:code="tourCode" editable title="分步引导">
  <LiveDemo :code="tourCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const tourOpen = ref(false);

const tourSteps = [
  { key: '1', title: '第一步', content: '这里是引导说明的第一步。' },
  { key: '2', title: '第二步', content: '这是引导说明的最后一步。' },
];

const tourCode = ref(`
  <Button type="primary" @click="tourOpen = true">开始引导</Button>
  <Tour v-model:open="tourOpen" :steps="tourSteps" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { tourOpen, tourSteps, tourCode };
</script>
