---
title: Carousel 走马灯
---

# Carousel 走马灯

轮播内容，支持自动播放与悬停暂停。

| Prop         | 类型            | 默认值    | 说明                             |
| ------------ | --------------- | --------- | -------------------------------- |
| items        | `string[]`      | `[]`      | 轮播项标题（也可用插槽自定义）   |
| modelValue   | `number`        | -         | 当前索引（v-model）              |
| height       | `string`        | `'14rem'` | 容器高度                         |
| autoplay     | `boolean`       | `false`   | 自动播放                         |
| interval     | `number`        | `3000`    | 播放间隔（ms）                   |
| pauseOnHover | `boolean`       | `true`    | 悬停暂停                         |
| loop         | `boolean`       | `true`    | 循环切换                         |
| fetch        | `Fetch<string>` | -         | 远程轮播项：挂载即请求，内置四态 |

| 事件              | 参数                              | 说明     |
| ----------------- | --------------------------------- | -------- |
| update:modelValue | `index: number`                   | 索引更新 |
| change            | `index: number, previous: number` | 切换     |

| 插槽    | 说明                                            |
| ------- | ----------------------------------------------- |
| default | 自定义轮播内容，slot props：`{ index: number }` |

```vue
<Carousel autoplay :interval="4000" :items="['新品发布', '限时优惠', '会员专享']" />
```

## 交互演示

### 走马灯

<CodeCard v-model:code="carouselCode" editable title="走马灯">
  <LiveDemo :code="carouselCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const carouselIndex = ref(0);

const carouselItems = ['第一屏', '第二屏', '第三屏'];

const carouselCode = ref(`
  <Carousel v-model="carouselIndex" :items="carouselItems" />
`);

/** LiveDemo 渲染作用域 */
const demoScope = { carouselIndex, carouselItems, carouselCode };
</script>
