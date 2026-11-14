---
title: Timeline 时间线
---

# Timeline 时间线

时间轴信息流。

[`TimelineItem`](/types/view/data-display#timelineitem) 结构：`{ key: string; title: string; content?: string; time?: string; type?: 'primary' | 'success' | 'warning' | 'danger' }`。

| Prop  | 类型                  | 默认值 | 说明                            |
| ----- | --------------------- | ------ | ------------------------------- |
| items | [`TimelineItem`](/types/view/data-display#timelineitem)`[]`      | `[]`   | 节点列表（绑定 fetch 时可省略） |
| fetch | [`FetchHandler`](/types/basics/core#fetchhandler)`<`[`TimelineItem`](/types/view/data-display#timelineitem)`>` | -      | 远程节点：挂载即请求，内置四态  |

| 插槽    | 说明                                              |
| ------- | ------------------------------------------------- |
| default | 每个节点的额外内容，slot props：`{ item, index }` |

```vue
<Timeline
  :items="[
    { key: '1', title: '创建订单', time: '10:00', type: 'primary' },
    { key: '2', title: '支付完成', time: '10:05', type: 'success' },
  ]"
/>
```

## 补充：订阅数据源

| Prop | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| subscribe | [`SubscribeHandler`](/types/basics/core#subscribehandler)`<`[`TimelineItem`](/types/view/data-display#timelineitem)`[]>` | `undefined` | 订阅时间轴项；挂载时调用，优先于本地 `items` |

`subscribe` 与本地 `items` 同时存在时优先使用 `subscribe`；订阅失败时回退到 `items`。

## 交互演示

### 时间线

<CodeCard v-model:code="timelineCode" editable title="时间线">
  <LiveDemo :code="timelineCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const timelineItems = [
  { key: '1', title: '创建项目', time: '10:00', description: '初始化仓库与脚手架' },
  {
    key: '2',
    title: '开发完成',
    time: '12:30',
    type: 'success' as const,
    description: '全部用例通过',
  },
  { key: '3', title: '发布上线', time: '15:00', description: '等待审核' },
];

const timelineCode = ref(`
  <Timeline :items="timelineItems" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { timelineItems, timelineCode };
</script>
