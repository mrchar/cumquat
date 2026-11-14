---
title: Tour 漫游引导
---

# Tour 漫游引导

分步新手引导，目标元素高亮挖空。

引导步骤 [`TourStep`](/types/view/feedback#tourstep) 的结构见类型参考。

| Prop      | 类型         | 默认值  | 说明                     |
| --------- | ------------ | ------- | ------------------------ |
| steps     | [`TourStep`](/types/view/feedback#tourstep)`[]` | `[]`    | 引导步骤配置             |
| open      | `boolean`    | `false` | 是否打开（v-model:open） |
| skippable | `boolean`    | `true`  | 显示"跳过"按钮           |
| closable  | `boolean`    | `true`  | 显示关闭按钮             |
| gap       | `number`     | `8`     | 挖空区与目标的间距（px） |
| appendTo  | [`MountTarget`](/types/basics/overlay#mounttarget) | -       | Teleport 目标；继承配置，最终回退 body |

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

## 补充：交互动作

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| action | [`ActionHandler`](/types/basics/core#actionhandler) | `undefined` | 交互动作；执行期间进入 pending/禁用状态，失败时保持并 emit `actionError` |
| errorText | `string` | `undefined` | 动作失败时的回退文案；未提供时使用组件内建兜底 |

| 事件 | 参数 | 说明 |
| --- | --- | --- |
| actionError | `error: unknown` | 动作失败（reject 或返回值导出错误）时触发 |

动作失败时停留在当前步骤并 emit `actionError`；`errorText` 用于错误条回退。

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
