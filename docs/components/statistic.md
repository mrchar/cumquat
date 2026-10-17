---
title: Statistic 统计数值
---

# Statistic 统计数值

指标数值展示，支持千分位、动画与倒计时；绑定 `fetch` 时挂载即请求单值并内置四态。

| Prop           | 类型                       | 默认值  | 说明                                                |
| -------------- | -------------------------- | ------- | --------------------------------------------------- |
| title          | `string`                   | `''`    | 标题                                                |
| value          | `string \| number \| Date` | -       | 数值；倒计时模式下为到期时刻；绑定 fetch 时可省略   |
| fetch          | `Fetch<StatisticValue>`    | -       | 远程单值；返回非数组即作为 value，优先于 value prop |
| prefix         | `string`                   | `''`    | 前缀                                                |
| suffix         | `string`                   | `''`    | 后缀                                                |
| precision      | `number`                   | -       | 小数位数                                            |
| groupSeparator | `string`                   | `''`    | 千分位分隔符（空串关闭）                            |
| animation      | `boolean`                  | `false` | 数字滚动动画                                        |
| duration       | `number`                   | `1000`  | 动画时长（ms）                                      |
| countdown      | `boolean`                  | `false` | 倒计时模式                                          |

| 事件   | 参数 | 说明       |
| ------ | ---- | ---------- |
| finish | -    | 倒计时结束 |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 自定义数值展示内容 |

```vue
<Statistic title="成交额" :value="128000" prefix="¥" group-separator="," animation />
<Statistic title="距截止" countdown :value="deadline" @finish="onFinish" />
```

## 交互演示

### 数值与后缀

<CodeCard v-model:code="statisticCode" editable title="数值与后缀">
  <LiveDemo :code="statisticCode" :scope="demoScope" />
</CodeCard>

<script setup lang="ts">

import { ref } from 'vue';

const statisticCode = ref(`
  <div class="flex flex-wrap gap-10">
    <Statistic title="下载量" :value="12834" suffix="次" />
    <Statistic title="星标数" :value="986" suffix="颗" />
    <Statistic title="完成率" :value="87" suffix="%" />
  </div>
`);

/** LiveDemo 渲染作用域 */
const demoScope = { statisticCode };
</script>
