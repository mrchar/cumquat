---
title: Badge 徽标
---

# Badge 徽标

角标计数与状态点。

| Prop     | 类型                                                        | 默认值     | 说明                               |
| -------- | ----------------------------------------------------------- | ---------- | ---------------------------------- |
| count    | `number`                                                    | `0`        | 角标数值，0 时默认不显示           |
| max      | `number`                                                    | `99`       | 超过 max 显示 `max+`               |
| dot      | `boolean`                                                   | `false`    | 仅显示小红点                       |
| type     | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'danger'` | 语义色                             |
| showZero | `boolean`                                                   | `false`    | count 为 0 时也展示                |
| text     | `string \| number`                                          | -          | 自定义角标文本（优先级高于 count） |
| hidden   | `boolean`                                                   | `false`    | 隐藏角标                           |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 被角标包裹的内容   |
| count   | 自定义角标计数内容 |

```vue
<Badge :count="5"><Button>消息</Button></Badge>
<Badge dot type="success"><Avatar text="张" /></Badge>
<Badge text="hot" type="warning"><span>活动</span></Badge>
```

## 交互演示

### 计数、溢出与红点

<CodeCard v-model:code="badgeCode" editable title="计数、溢出与红点">
  <LiveDemo :code="badgeCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const text = ref('');

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

/** LiveDemo 渲染作用域 */
const demoScope = { text, badgeCode };
</script>

