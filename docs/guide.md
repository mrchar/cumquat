# 组件使用指南

> 覆盖组件库全部 71 个组件的属性（Props）、事件（Events）、插槽（Slots）与典型用例。
> 组件按源码目录分为七类：基础、表单控件、浮层、数据展示、反馈、导航与布局、其他。

## 引入方式

```ts
// 全量注册：模板中以 <c-button> 等 C 前缀标签使用
import { Cumquat } from '@cumquat/vue/components';
app.use(Cumquat);

// 按需导入：无注册前缀，直接使用
import { Button, Select, Table } from '@cumquat/vue/components';
```

## 通用约定

- **v-model 纯同步**：所有 `modelValue` / `open` / `visible` 等绑定值只做同步回写，异步副作用一律由外层驱动。
- **异步状态 `:state` / `:data`**：数据型组件（Table、Select 等）可接收 `AsyncStateLike<T>`（`status / data / error / isStale? / retry?`），传入后组件内置加载 / 错误重试 / 空态 / stale 提示四态渲染，组件自身不发请求。
- **远程资源 `:fetch`**：17 个资源型组件可绑定统一的 `Fetch<T>` 方法，挂载即请求，翻页 / 排序 / 筛选 / 搜索 / 展开自动重取，防抖、竞态、四态渲染全部内置，详见[远程数据](#远程数据fetch)。
- **动作 `:action`**：动作型组件（Button、Popconfirm 等）接收一个同步或异步函数，执行期间自动派生 loading / disabled。
- **受控 / 非受控统一**：所有异步 props 均可选，不传即为普通非受控组件。
- **语义 class**：每个组件保留 `cumquat-xxx` 语义类名，作为主题化与测试锚点。

---

## 一、基础组件（basic）

### Button 按钮

触发操作，支持语义类型、尺寸、加载态；传入 `action` 后点击自动执行并派生 loading / disabled。

| Prop     | 类型                                              | 默认值        | 说明                                            |
| -------- | ------------------------------------------------- | ------------- | ----------------------------------------------- |
| type     | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'secondary'` | 按钮语义类型                                    |
| size     | `'sm' \| 'md' \| 'lg'`                            | `'md'`        | 按钮尺寸                                        |
| disabled | `boolean`                                         | `false`       | 是否禁用                                        |
| loading  | `boolean`                                         | `false`       | 外部直接指定加载态                              |
| block    | `boolean`                                         | `false`       | 是否撑满一行                                    |
| action   | `ActionLike`                                      | -             | 传入动作后，点击自动执行并派生 loading/disabled |
| id       | `string`                                          | -             | 按钮元素 id                                     |

| 事件  | 参数                | 说明     |
| ----- | ------------------- | -------- |
| click | `event: MouseEvent` | 点击事件 |

| 插槽    | 说明     |
| ------- | -------- |
| default | 按钮内容 |

```vue
<Button type="primary" @click="save">保存</Button>
<Button danger :action="deleteAction">删除</Button>
<Button loading block size="lg">提交中…</Button>
```

### Icon 图标

内联 SVG 图标容器，是其他组件的基础依赖。无 props / 事件。

| 插槽    | 说明             |
| ------- | ---------------- |
| default | SVG 图标路径内容 |

```vue
<Icon>
  <path d="m5 13 4 4L19 7" />
</Icon>
```

### Input 输入框

单行 / 多行文本输入，支持前后缀、清空、字数统计、trim 与表单校验联动。

| Prop          | 类型                   | 默认值   | 说明                                                       |
| ------------- | ---------------------- | -------- | ---------------------------------------------------------- |
| modelValue    | `string`               | -        | 绑定值（v-model）                                          |
| type          | `string`               | `'text'` | 原生输入类型                                               |
| size          | `'sm' \| 'md' \| 'lg'` | `'md'`   | 尺寸                                                       |
| placeholder   | `string`               | `''`     | 占位文本                                                   |
| disabled      | `boolean`              | `false`  | 禁用                                                       |
| readonly      | `boolean`              | `false`  | 只读                                                       |
| invalid       | `boolean`              | `false`  | 外部强制校验失败态（红框）；表单上下文中也会取字段校验错误 |
| textarea      | `boolean`              | `false`  | 多行文本域                                                 |
| rows          | `number`               | `3`      | 多行行数                                                   |
| clearable     | `boolean`              | `false`  | 可清空（聚焦且有值时显示清除按钮）                         |
| showWordLimit | `boolean`              | `false`  | 显示字数统计                                               |
| maxlength     | `number`               | -        | 最大输入长度                                               |
| trim          | `boolean`              | `false`  | 失焦时去除首尾空白并回发                                   |
| name          | `string`               | -        | 表单字段名（Form 上下文中参与校验）                        |

| 事件              | 参数                | 说明         |
| ----------------- | ------------------- | ------------ |
| update:modelValue | `value: string`     | 输入值更新   |
| clear             | -                   | 点击清空按钮 |
| blur              | `event: FocusEvent` | 失焦         |
| focus             | `event: FocusEvent` | 聚焦         |

| 插槽   | 说明       |
| ------ | ---------- |
| prefix | 输入框前缀 |
| suffix | 输入框后缀 |

Expose：`validate()` 触发校验、`clearValidate()` 清除校验态、`focus()` 聚焦。

```vue
<Input v-model="name" placeholder="请输入名称" clearable />
<Input v-model="bio" textarea :rows="4" show-word-limit :maxlength="120" />
<Input v-model="keyword">
  <template #prefix>🔍</template>
</Input>
```

### Card 卡片

内容分块容器。

| Prop      | 类型      | 默认值  | 说明         |
| --------- | --------- | ------- | ------------ |
| title     | `string`  | `''`    | 卡片标题     |
| bordered  | `boolean` | `true`  | 是否带描边   |
| hoverable | `boolean` | `false` | 悬浮时带阴影 |

| 插槽    | 说明           |
| ------- | -------------- |
| header  | 自定义头部内容 |
| default | 卡片主体       |
| footer  | 自定义底部内容 |

```vue
<Card title="账户信息" hoverable>
  <p>主体内容</p>
  <template #footer><Button size="sm">编辑</Button></template>
</Card>
```

### Divider 分割线

| Prop        | 类型                         | 默认值         | 说明     |
| ----------- | ---------------------------- | -------------- | -------- |
| orientation | `'horizontal' \| 'vertical'` | `'horizontal'` | 方向     |
| label       | `string`                     | `''`           | 中间文案 |
| dashed      | `boolean`                    | `false`        | 虚线     |

| 插槽    | 说明                                      |
| ------- | ----------------------------------------- |
| default | 自定义中间文案（优先级高于 `label` prop） |

```vue
<Divider label="基本信息" />
<Divider dashed />
<Divider orientation="vertical" />
```

### Avatar 头像

用户头像，支持图片、懒加载、失败兜底与文字回退。

| Prop        | 类型                   | 默认值     | 说明                         |
| ----------- | ---------------------- | ---------- | ---------------------------- |
| src         | `string`               | `''`       | 图片地址                     |
| alt         | `string`               | `''`       | 图片替代文本                 |
| size        | `'sm' \| 'md' \| 'lg'` | `'md'`     | 尺寸                         |
| shape       | `'circle' \| 'square'` | `'circle'` | 形状                         |
| text        | `string`               | `''`       | 无图片时显示的文字（取首字） |
| lazy        | `boolean`              | `false`    | 进入视口再加载               |
| fallbackSrc | `string`               | `''`       | 加载失败时的兜底地址         |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 无图片且无兜底时的自定义内容 |

```vue
<Avatar src="/u/1.png" alt="张三" />
<Avatar text="张三" shape="square" />
```

### Badge 徽标

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

### Statistic 统计数值

指标数值展示，支持千分位、动画与倒计时；绑定 `fetch` 时挂载即请求单值并内置四态。

| Prop           | 类型                       | 默认值  | 说明                         |
| -------------- | -------------------------- | ------- | ---------------------------- |
| title          | `string`                   | `''`    | 标题                         |
| value          | `string \| number \| Date` | -       | 数值；倒计时模式下为到期时刻；绑定 fetch 时可省略 |
| fetch          | `Fetch<StatisticValue>`    | -       | 远程单值；返回非数组即作为 value，优先于 value prop |
| prefix         | `string`                   | `''`    | 前缀                         |
| suffix         | `string`                   | `''`    | 后缀                         |
| precision      | `number`                   | -       | 小数位数                     |
| groupSeparator | `string`                   | `''`    | 千分位分隔符（空串关闭）     |
| animation      | `boolean`                  | `false` | 数字滚动动画                 |
| duration       | `number`                   | `1000`  | 动画时长（ms）               |
| countdown      | `boolean`                  | `false` | 倒计时模式                   |

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

### Typography 排版

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

### Tag 标签

状态标记，可关闭。

| Prop       | 类型                                                           | 默认值      | 说明                |
| ---------- | -------------------------------------------------------------- | ----------- | ------------------- |
| type       | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger'` | `'default'` | 语义类型            |
| closable   | `boolean`                                                      | `false`     | 可关闭              |
| modelValue | `boolean`                                                      | -           | 显隐绑定（v-model） |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:modelValue | `value: boolean` | 显隐更新     |
| close             | -                | 点击关闭按钮 |

| 插槽    | 说明     |
| ------- | -------- |
| default | 标签内容 |

```vue
<Tag type="success">已完成</Tag>
<Tag v-model="visible" closable type="primary">可关闭</Tag>
```

### Empty 空状态

无数据占位。

| Prop        | 类型     | 默认值       | 说明     |
| ----------- | -------- | ------------ | -------- |
| description | `string` | `'暂无数据'` | 描述文本 |

| 插槽    | 说明                           |
| ------- | ------------------------------ |
| default | 额外操作区（默认显示描述文本） |

```vue
<Empty description="还没有订单">
  <Button type="primary" size="sm">去创建</Button>
</Empty>
```

---

## 二、表单控件（form-controls）

### Select 选择器

下拉单选 / 多选，支持搜索、分组、清空与远程四态。

`SelectOption` 结构：`{ label: string; value: string | number; disabled?: boolean; group?: string }`，相同 `group` 的选项在面板内聚合为分组。

| Prop        | 类型                             | 默认值     | 说明                                                      |
| ----------- | -------------------------------- | ---------- | --------------------------------------------------------- |
| modelValue  | `V \| V[] \| null`               | -          | 绑定值（v-model，多选为数组）                             |
| options     | `SelectOption[]`                 | `[]`       | 静态选项                                                  |
| placeholder | `string`                         | `'请选择'` | 占位文本                                                  |
| disabled    | `boolean`                        | `false`    | 禁用                                                      |
| multiple    | `boolean`                        | `false`    | 多选（标签回显，可逐个移除）                              |
| filterable  | `boolean`                        | `false`    | 可搜索                                                    |
| clearable   | `boolean`                        | `false`    | 可清空                                                    |
| name        | `string`                         | -          | 表单字段名                                                |
| state       | `AsyncStateLike<SelectOption[]>` | -          | 远程数据状态：传入后优先于 options 渲染，组件自身不发请求 |
| fetch       | `Fetch<SelectOption>`            | -          | 远程选项源：挂载即请求，输入时以 `query.keyword` 自动重取（防抖 300ms），自动四态 |

| 事件              | 参数                      | 说明   |
| ----------------- | ------------------------- | ------ |
| update:modelValue | `value: V \| V[] \| null` | 值更新 |
| change            | `value: V \| V[] \| null` | 值变化 |

```vue
<Select v-model="city" :options="cityOptions" placeholder="选择城市" clearable />
<Select v-model="tags" :options="tagOptions" multiple filterable />
<Select v-model="uid" :state="userListState" filterable />
<Select v-model="uid" :fetch="fetchUsers" filterable placeholder="搜索用户" />
```

### Checkbox 复选框

| Prop          | 类型                          | 默认值  | 说明                                     |
| ------------- | ----------------------------- | ------- | ---------------------------------------- |
| modelValue    | `boolean`                     | -       | 勾选态（v-model）                        |
| value         | `string \| number \| boolean` | -       | 成组使用时该选项的取值（配合成组上下文） |
| label         | `string`                      | `''`    | 文本                                     |
| disabled      | `boolean`                     | `false` | 禁用                                     |
| indeterminate | `boolean`                     | `false` | 半选态（纯视觉）                         |
| name          | `string`                      | -       | 表单字段名                               |

| 事件              | 参数             | 说明     |
| ----------------- | ---------------- | -------- |
| update:modelValue | `value: boolean` | 勾选更新 |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 自定义文本（缺省显示 label） |

```vue
<Checkbox v-model="agree" label="我已阅读协议" />
<Checkbox indeterminate :model-value="false" label="全选" />
```

### Radio 单选框

| Prop       | 类型               | 默认值  | 说明                      |
| ---------- | ------------------ | ------- | ------------------------- |
| value      | `string \| number` | -       | 该选项的取值（必填）      |
| modelValue | `V \| null`        | -       | 单用时的绑定值（v-model） |
| label      | `string`           | `''`    | 文本                      |
| disabled   | `boolean`          | `false` | 禁用                      |
| name       | `string`           | -       | 表单字段名                |

| 事件              | 参数       | 说明     |
| ----------------- | ---------- | -------- |
| update:modelValue | `value: V` | 选中更新 |

| 插槽    | 说明                         |
| ------- | ---------------------------- |
| default | 自定义文本（缺省显示 label） |

```vue
<Radio v-model="size" value="sm" label="小" />
<RadioGroup v-model="size">
  <Radio value="sm" label="小" />
  <Radio value="md" label="中" />
  <Radio value="lg" label="大" disabled />
</RadioGroup>
```

### RadioGroup 单选组

互斥选择容器，通过上下文接管子 Radio 的值与互斥。

| Prop       | 类型                         | 默认值         | 说明              |
| ---------- | ---------------------------- | -------------- | ----------------- |
| modelValue | `string \| number \| null`   | -              | 绑定值（v-model） |
| direction  | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向          |
| disabled   | `boolean`                    | `false`        | 整组禁用          |

| 事件              | 参数               | 说明   |
| ----------------- | ------------------ | ------ |
| update:modelValue | `value: V \| null` | 值更新 |

| 插槽    | 说明          |
| ------- | ------------- |
| default | 放置 Radio 项 |

### Switch 开关

| Prop       | 类型      | 默认值  | 说明              |
| ---------- | --------- | ------- | ----------------- |
| modelValue | `boolean` | -       | 绑定值（v-model） |
| label      | `string`  | `''`    | 右侧文本          |
| disabled   | `boolean` | `false` | 禁用              |
| name       | `string`  | -       | 表单字段名        |

| 事件              | 参数             | 说明   |
| ----------------- | ---------------- | ------ |
| update:modelValue | `value: boolean` | 值更新 |
| change            | `value: boolean` | 值变化 |

```vue
<Switch v-model="enabled" label="开启通知" />
```

### InputNumber 数字输入框

步进、范围限制与精度修正的数字输入，支持长按连续步进。

| Prop        | 类型             | 默认值                     | 说明                         |
| ----------- | ---------------- | -------------------------- | ---------------------------- |
| modelValue  | `number \| null` | -                          | 绑定值（v-model，空为 null） |
| min         | `number`         | `-Number.MAX_SAFE_INTEGER` | 最小值                       |
| max         | `number`         | `Number.MAX_SAFE_INTEGER`  | 最大值                       |
| step        | `number`         | `1`                        | 步进                         |
| precision   | `number`         | -                          | 小数位数（缺省按 step 推导） |
| disabled    | `boolean`        | `false`                    | 禁用                         |
| placeholder | `string`         | `''`                       | 占位文本                     |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: number \| null` | 值更新 |
| change            | `value: number \| null` | 值变化 |

```vue
<InputNumber v-model="qty" :min="1" :max="99" />
<InputNumber v-model="price" :step="0.01" :precision="2" />
```

### Rate 评分

星级评分，支持半星、悬停预览与键盘调节。

| Prop       | 类型      | 默认值  | 说明                             |
| ---------- | --------- | ------- | -------------------------------- |
| modelValue | `number`  | -       | 绑定值（v-model）                |
| count      | `number`  | `5`     | 星星总数                         |
| disabled   | `boolean` | `false` | 禁用                             |
| readonly   | `boolean` | `false` | 只读（不可交互）                 |
| allowHalf  | `boolean` | `false` | 允许半星                         |
| allowClear | `boolean` | `true`  | 允许清除（再次点击同值取消为 0） |

| 事件              | 参数            | 说明         |
| ----------------- | --------------- | ------------ |
| update:modelValue | `value: number` | 值更新       |
| change            | `value: number` | 值变化       |
| hoverChange       | `value: number` | 悬停预览变化 |

```vue
<Rate v-model="score" allow-half />
<Rate :model-value="4" readonly />
```

### Segmented 分段控制器

紧凑的选项切换。

`SegmentedOption` 结构：`{ label: string; value: string | number; disabled?: boolean }`。

| Prop       | 类型                | 默认值  | 说明              |
| ---------- | ------------------- | ------- | ----------------- |
| options    | `SegmentedOption[]` | `[]`    | 选项列表          |
| modelValue | `string \| number`  | -       | 绑定值（v-model） |
| disabled   | `boolean`           | `false` | 整体禁用          |
| size       | `'sm' \| 'md'`      | `'md'`  | 尺寸              |

| 事件              | 参数                      | 说明   |
| ----------------- | ------------------------- | ------ |
| update:modelValue | `value: string \| number` | 值更新 |
| change            | `value: string \| number` | 值变化 |

```vue
<Segmented
  v-model="view"
  :options="[
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' },
  ]"
/>
```

### AutoComplete 自动完成

输入联想补全，支持本地候选与异步候选源。

| Prop             | 类型                                     | 默认值         | 说明                             |
| ---------------- | ---------------------------------------- | -------------- | -------------------------------- |
| modelValue       | `string`                                 | -              | 绑定值（v-model）                |
| options          | `string[]`                               | `[]`           | 静态候选（本地包含匹配）         |
| fetch            | `Fetch<string> \| ((keyword: string) => Promise<string[]>)` | -              | 异步候选源（提供时替代本地过滤；新签名经 query.keyword 收参，旧签名继续兼容） |
| placeholder      | `string`                                 | `'输入以搜索'` | 占位文本                         |
| disabled         | `boolean`                                | `false`        | 禁用                             |
| triggerOnFocus   | `boolean`                                | `true`         | 聚焦即触发建议                   |
| debounce         | `number`                                 | `300`          | 防抖时长（异步源生效，ms）       |
| minKeywordLength | `number`                                 | `0`            | 触发请求的最小关键词长度         |

| 事件              | 参数            | 说明         |
| ----------------- | --------------- | ------------ |
| update:modelValue | `value: string` | 值更新       |
| change            | `value: string` | 值变化       |
| select            | `value: string` | 选中某条建议 |

| 插槽   | 说明                                                  |
| ------ | ----------------------------------------------------- |
| option | 自定义建议项，slot props：`{ option, index, active }` |

Expose：`focus()` 聚焦输入框。

```vue
<AutoComplete v-model="kw" :options="candidates" />
<AutoComplete v-model="kw" :fetch="searchUsers" :min-keyword-length="2" />
```

### Mention 提及

输入中的 @ 成员唤起。

| Prop        | 类型                                     | 默认值                            | 说明                                   |
| ----------- | ---------------------------------------- | --------------------------------- | -------------------------------------- |
| modelValue  | `string`                                 | -                                 | 文本绑定值（v-model）                  |
| members     | `string[]`                               | `['Amber','Bolt','Cedar','Dawn']` | 本地候选成员（与 fetch 二选一）        |
| fetch       | `Fetch<string> \| ((keyword: string) => Promise<string[]>)` | -                                 | 异步候选源（触发符后的片段作为关键词；兼容旧签名） |
| trigger     | `string`                                 | `'@'`                             | 触发符                                 |
| placeholder | `string`                                 | `'输入 @ 唤起提及'`               | 占位文本                               |
| debounce    | `number`                                 | `300`                             | 异步防抖（ms）                         |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:modelValue | `value: string`  | 文本更新     |
| select            | `member: string` | 选中某位成员 |

```vue
<Mention v-model="content" :members="team" />
<Mention v-model="content" trigger="#" :fetch="searchTags" />
```

### Form 表单

字段容器与校验编排，配合 FormItem 使用。

| Prop          | 类型                      | 默认值   | 说明                                |
| ------------- | ------------------------- | -------- | ----------------------------------- |
| modelValue    | `Record<string, unknown>` | -        | 整表值（受控或作为初始值）          |
| rules         | `FormRules`               | `{}`     | 校验规则表（详见 composables 文档） |
| disabled      | `boolean`                 | `false`  | 整表禁用                            |
| labelPosition | `'top' \| 'left'`         | `'top'`  | 标签摆放位置                        |
| labelWidth    | `string`                  | `'6rem'` | 左排标签宽度                        |

| 事件              | 参数                                          | 说明           |
| ----------------- | --------------------------------------------- | -------------- |
| update:modelValue | `values: Record<string, unknown>`             | 任意字段值更新 |
| submit            | `values: Record<string, unknown>`             | 校验通过后提交 |
| invalid           | `errors: Record<string, string \| undefined>` | 校验失败       |

| 插槽    | 说明                                                                    |
| ------- | ----------------------------------------------------------------------- |
| default | 表单内容，slot props：`{ values, errors, valid, dirty, submit, reset }` |

Expose：`values / errors / valid / dirty / validate() / validateField(name) / reset() / clearValidate() / submit()`。

```vue
<Form v-model="form" :rules="rules" @submit="onSubmit">
  <FormItem name="username" label="用户名" required>
    <Input name="username" />
  </FormItem>
  <Button type="primary" native-type="submit">提交</Button>
</Form>
```

### FormItem 表单项

字段标签、必填标记与错误提示的编排容器。

| Prop     | 类型      | 默认值  | 说明                                                 |
| -------- | --------- | ------- | ---------------------------------------------------- |
| name     | `string`  | -       | 字段名：与表单 rules/values 对应，并用于错误提示联动 |
| label    | `string`  | `''`    | 标签文本                                             |
| required | `boolean` | `false` | 显示必填星号                                         |
| error    | `string`  | `''`    | 外部直接指定错误信息（非空时优先于表单上下文错误）   |

| 插槽    | 说明                                      |
| ------- | ----------------------------------------- |
| default | 字段控件，slot props：`{ error: string }` |

### TreeSelect 树选择

树形结构的选择器，叶子可选、回显完整路径。

`TreeSelectNode` 结构：`{ key: string; label: string; disabled?: boolean; children?: TreeSelectNode[] }`。

| Prop             | 类型               | 默认值     | 说明                             |
| ---------------- | ------------------ | ---------- | -------------------------------- |
| nodes            | `TreeSelectNode[]` | `[]`       | 树数据                           |
| modelValue       | `string \| null`   | -          | 选中叶子 key（v-model）          |
| placeholder      | `string`           | `'请选择'` | 占位文本                         |
| disabled         | `boolean`          | `false`    | 禁用                             |
| filterable       | `boolean`          | `false`    | 可搜索（过滤并自动展开命中路径） |
| defaultExpandAll | `boolean`          | `false`    | 默认展开全部父节点               |
| fetch            | `Fetch<TreeSelectNode>` | -      | 远程树：展开节点时以 `query.filters.parentKey` 请求子级，自动懒加载与四态 |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: string \| null` | 值更新 |
| change            | `value: string \| null` | 值变化 |

```vue
<TreeSelect v-model="dept" :nodes="deptTree" filterable default-expand-all />
```

### Slider 滑块

单点 / 区间数值选择，支持刻度、键盘步进与轨道点击定位。

`SliderMark` 结构：`{ value: number; label?: string }`。

| Prop       | 类型                          | 默认值  | 说明                                |
| ---------- | ----------------------------- | ------- | ----------------------------------- |
| modelValue | `number \| [number, number]`  | -       | 绑定值（v-model，range 时为二元组） |
| min        | `number`                      | `0`     | 最小值                              |
| max        | `number`                      | `100`   | 最大值                              |
| step       | `number`                      | `1`     | 步进                                |
| disabled   | `boolean`                     | `false` | 禁用                                |
| range      | `boolean`                     | `false` | 区间选择                            |
| marks      | `Array<number \| SliderMark>` | `[]`    | 刻度（数值或对象）                  |
| showValue  | `boolean`                     | `true`  | 显示当前值文字                      |

| 事件              | 参数                 | 说明   |
| ----------------- | -------------------- | ------ |
| update:modelValue | `value: SliderValue` | 值更新 |
| change            | `value: SliderValue` | 值变化 |

```vue
<Slider v-model="volume" :min="0" :max="100" />
<Slider v-model="range" range :marks="[0, 25, 50, 75, 100]" />
```

---

## 三、浮层组件（overlay）

### Dialog 对话框

模态弹层，承载确认、表单等临时交互。

| Prop         | 类型                    | 默认值    | 说明                       |
| ------------ | ----------------------- | --------- | -------------------------- |
| open         | `boolean`               | `false`   | 开合（v-model:open）       |
| title        | `string`                | `''`      | 标题                       |
| width        | `string`                | `'32rem'` | 面板最大宽度               |
| closable     | `boolean`               | `true`    | 显示关闭按钮               |
| maskClosable | `boolean`               | `true`    | 点击遮罩关闭               |
| escClosable  | `boolean`               | `true`    | ESC 关闭                   |
| lockScroll   | `boolean`               | `true`    | 锁定背景滚动               |
| appendTo     | `string \| HTMLElement` | -         | Teleport 目标（默认 body） |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| open        | -                | 打开后   |
| close       | -                | 关闭后   |

| 插槽    | 说明         |
| ------- | ------------ |
| title   | 自定义标题区 |
| default | 主体内容     |
| footer  | 底部操作区   |

Expose：`open()` / `close()`。

```vue
<Dialog v-model:open="show" title="确认删除" width="24rem">
  <p>删除后不可恢复。</p>
  <template #footer>
    <Button @click="show = false">取消</Button>
    <Button type="primary" danger :action="doDelete">删除</Button>
  </template>
</Dialog>
```

### Drawer 抽屉

侧边滑出面板。

| Prop         | 类型                                     | 默认值    | 说明                           |
| ------------ | ---------------------------------------- | --------- | ------------------------------ |
| open         | `boolean`                                | `false`   | 开合（v-model:open）           |
| title        | `string`                                 | `''`      | 标题                           |
| direction    | `'left' \| 'right' \| 'top' \| 'bottom'` | `'right'` | 滑出方向                       |
| size         | `string`                                 | `'24rem'` | 面板尺寸（左右为宽，上下为高） |
| closable     | `boolean`                                | `true`    | 显示关闭按钮                   |
| maskClosable | `boolean`                                | `true`    | 点击遮罩关闭                   |
| escClosable  | `boolean`                                | `true`    | ESC 关闭                       |
| lockScroll   | `boolean`                                | `true`    | 锁定背景滚动                   |
| appendTo     | `string \| HTMLElement`                  | -         | Teleport 目标                  |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| open        | -                | 打开后   |
| close       | -                | 关闭后   |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 主体内容   |
| footer  | 底部操作区 |

Expose：`open()` / `close()`。

```vue
<Drawer v-model:open="show" title="编辑资料" direction="right" size="20rem">
  <Form v-model="profile">…</Form>
</Drawer>
```

### Dropdown 下拉菜单

悬停 / 点击触发的操作菜单。

`DropdownItem` 结构：`{ key: string; label: string; disabled?: boolean; divider?: boolean }`，`divider: true` 渲染为分隔线。

| Prop      | 类型             | 默认值           | 说明                              |
| --------- | ---------------- | ---------------- | --------------------------------- |
| items     | `DropdownItem[]` | `[]`             | 数据驱动菜单项；不传时用默认插槽  |
| trigger   | `PopoverTrigger` | `'click'`        | 触发方式（click / hover / focus） |
| placement | `Placement`      | `'bottom-start'` | 菜单位置                          |
| open      | `boolean`        | -                | 开合（v-model:open）              |
| disabled  | `boolean`        | `false`          | 禁用                              |

| 事件        | 参数                 | 说明       |
| ----------- | -------------------- | ---------- |
| update:open | `value: boolean`     | 开合更新   |
| select      | `item: DropdownItem` | 选中菜单项 |

| 插槽    | 说明                          |
| ------- | ----------------------------- |
| trigger | 触发器内容（必填）            |
| default | 自定义菜单内容（无 items 时） |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Dropdown :items="menuItems" @select="onSelect">
  <template #trigger><Button>更多操作</Button></template>
</Dropdown>
```

### Popover 气泡卡片

悬停 / 点击触发的轻量浮层。

| Prop       | 类型             | 默认值    | 说明                 |
| ---------- | ---------------- | --------- | -------------------- |
| title      | `string`         | `''`      | 标题                 |
| trigger    | `PopoverTrigger` | `'click'` | 触发方式             |
| placement  | `Placement`      | `'top'`   | 气泡位置             |
| open       | `boolean`        | -         | 开合（v-model:open） |
| openDelay  | `number`         | `100`     | 打开延迟（ms）       |
| closeDelay | `number`         | `100`     | 关闭延迟（ms）       |
| disabled   | `boolean`        | `false`   | 禁用                 |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |

| 插槽    | 说明                                            |
| ------- | ----------------------------------------------- |
| trigger | 触发器内容（必填）                              |
| default | 气泡主体                                        |
| footer  | 底部操作区，slot props：`{ close: () => void }` |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Popover title="筛选条件" trigger="click">
  <template #trigger><Button ghost>筛选</Button></template>
  <p>气泡内容</p>
  <template #footer="{ close }">
    <Button size="sm" @click="close">完成</Button>
  </template>
</Popover>
```

### Popconfirm 气泡确认

轻量二次确认，确认动作执行期间按钮自动 loading。

| Prop        | 类型         | 默认值                 | 说明                                          |
| ----------- | ------------ | ---------------------- | --------------------------------------------- |
| text        | `string`     | `'确定执行该操作吗？'` | 确认气泡文案                                  |
| confirmText | `string`     | `'确定'`               | 确认按钮文案                                  |
| cancelText  | `string`     | `'取消'`               | 取消按钮文案                                  |
| placement   | `Placement`  | `'top'`                | 气泡位置                                      |
| open        | `boolean`    | -                      | 开合（v-model:open）                          |
| action      | `ActionLike` | -                      | 确认时执行的异步动作（期间按钮 loading/禁用） |
| disabled    | `boolean`    | `false`                | 禁用                                          |

| 事件        | 参数             | 说明     |
| ----------- | ---------------- | -------- |
| update:open | `value: boolean` | 开合更新 |
| confirm     | -                | 点击确认 |
| cancel      | -                | 点击取消 |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 触发器内容（必填） |

Expose：`open()` / `close()` / `toggle()`。

```vue
<Popconfirm text="确认删除这条记录？" :action="removeRow" @confirm="refresh">
  <Button danger size="sm">删除</Button>
</Popconfirm>
```

### Tooltip 文字提示

悬停提示。

| Prop       | 类型        | 默认值  | 说明           |
| ---------- | ----------- | ------- | -------------- |
| content    | `string`    | `''`    | 提示文本       |
| placement  | `Placement` | `'top'` | 气泡位置       |
| openDelay  | `number`    | `0`     | 打开延迟（ms） |
| closeDelay | `number`    | `0`     | 关闭延迟（ms） |
| disabled   | `boolean`   | `false` | 禁用           |

| 插槽    | 说明                                    |
| ------- | --------------------------------------- |
| default | 触发器内容（必填）                      |
| content | 自定义提示内容（缺省显示 content prop） |

```vue
<Tooltip content="复制到剪贴板"><Button ghost>复制</Button></Tooltip>
```

---

## 四、数据展示（data-display）

### Table 表格

数据列表展示，内置排序、筛选、分页、展开、选择与远程四态。可二选一驱动远程数据：传入 `data` 状态时组件自身不发请求、状态变化通过统一 `change` 事件回发；直接绑定 `fetch` 方法时，翻页 / 排序 / 筛选由组件自动重取。

`TableColumn` 结构：

```ts
interface TableColumn {
  key: string;
  title: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean; // 该列可排序
  sorter?: (a: Row, b: Row) => number; // 本地排序比较器；远程时仅回发状态
  filters?: Array<{ label: string; value: string | number }>; // 表头筛选面板
  filterMethod?: (value: string | number, row: Row) => boolean; // 本地筛选谓词
}
```

| Prop        | 类型                                            | 默认值         | 说明                                       |
| ----------- | ----------------------------------------------- | -------------- | ------------------------------------------ |
| columns     | `TableColumn[]`                                 | -              | 列配置（必填）                             |
| rows        | `Row[]`                                         | `[]`           | 本地数据                                   |
| striped     | `boolean`                                       | `false`        | 斑马纹                                     |
| loading     | `boolean`                                       | `false`        | 外部加载态                                 |
| emptyText   | `string`                                        | `'暂无数据'`   | 空态文案                                   |
| data        | `AsyncStateLike<Row[]>`                         | -              | 远程数据状态：传入后 rows/loading 由其派生 |
| total       | `number`                                        | -              | 远程数据总条数（本地默认取 rows 长度）     |
| rowKey      | `(row: Row, index: number) => string \| number` | 取行索引       | 行唯一键                                   |
| selectable  | `boolean`                                       | `false`        | 显示行选择列                               |
| expandable  | `boolean`                                       | `false`        | 显示展开列                                 |
| pagination  | `boolean`                                       | `false`        | 内置分页条                                 |
| pageSize    | `number`                                        | `10`           | 每页条数                                   |
| pageSizes   | `number[]`                                      | `[10, 20, 50]` | 每页条数选项                               |
| defaultSort | `{ key: string; order: 'asc' \| 'desc' }`       | -              | 初始排序                                   |
| fetch       | `Fetch<Row>`                                     | -              | 远程数据源：自动注入 pagination/sorter/filters；返回 `{ list, total }` 自动分页，返回数组按全量渲染 |

| 事件                | 参数                                                                                            | 说明                                     |
| ------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------- |
| update:selectedKeys | `keys: Array<string \| number>`                                                                 | 选中行 key 更新                          |
| change              | `{ pagination: { currentPage, pageSize }, sorter: { key, order }, filters: Record<string, …> }` | 分页/排序/筛选统一变化（外层据此发请求） |
| rowExpand           | `{ row, expanded: boolean, key }`                                                               | 行展开/收起                              |

| 插槽              | 说明                                       |
| ----------------- | ------------------------------------------ |
| `cell-${col.key}` | 自定义单元格，slot props：`{ row, value }` |
| expanded          | 展开行内容，slot props：`{ row, index }`   |

```vue
<Table
  :columns="columns"
  :fetch="fetchUsers"
  selectable
  pagination
  :page-size="20"
>
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>
```

```vue
<!-- 也可继续使用 data 状态模式：请求由外层 change 事件驱动 -->
<Table
  :columns="columns"
  :data="tableState"
  :total="total"
  selectable
  pagination
  :page-size="20"
  @change="onTableChange"
>
  <template #cell-status="{ value }"><Tag>{{ value }}</Tag></template>
</Table>
```

### Pagination 分页

页码导航，与表格 / 列表联动。

| Prop            | 类型       | 默认值              | 说明                 |
| --------------- | ---------- | ------------------- | -------------------- |
| total           | `number`   | -                   | 总条数（必填）       |
| pageSize        | `number`   | `10`                | 每页条数             |
| modelValue      | `number`   | -                   | 当前页（v-model）    |
| pageSizes       | `number[]` | `[10, 20, 50, 100]` | 每页条数选项         |
| showSizeChanger | `boolean`  | `false`             | 显示每页条数选择器   |
| showJumper      | `boolean`  | `false`             | 显示跳页输入框       |
| boundaryCount   | `number`   | `1`                 | 首尾边界页码数       |
| siblingCount    | `number`   | `1`                 | 当前页两侧兄弟页码数 |

| 事件              | 参数                                        | 说明                 |
| ----------------- | ------------------------------------------- | -------------------- |
| update:modelValue | `page: number`                              | 页码更新             |
| update:pageSize   | `size: number`                              | 页大小更新           |
| change            | `{ currentPage: number, pageSize: number }` | 页码或页大小统一变化 |

```vue
<Pagination v-model="page" :total="128" show-size-changer show-jumper @change="load" />
```

### Tabs 标签页

平级内容切换，支持增减页签与懒渲染。

`TabItem` 结构：`{ key: string; label: string; disabled?: boolean; closable?: boolean }`。

| Prop       | 类型        | 默认值  | 说明                                            |
| ---------- | ----------- | ------- | ----------------------------------------------- |
| tabs       | `TabItem[]` | `[]`    | 页签列表（绑定 fetch 时可省略）                  |
| fetch      | `Fetch<TabItem>` | -  | 远程页签：挂载即请求，数据就绪后自动激活首个可用页签 |
| modelValue | `string`    | -       | 激活 key（v-model）                             |
| editable   | `boolean`   | `false` | 允许增减页签（触发 add/remove，数据由外层维护） |
| addText    | `string`    | `'+'`   | 新增按钮文案                                    |
| lazy       | `boolean`   | `true`  | 面板懒渲染（首次激活后才挂载）                  |

| 事件              | 参数           | 说明          |
| ----------------- | -------------- | ------------- |
| update:modelValue | `key: string`  | 激活 key 更新 |
| change            | `key: string`  | 切换          |
| add               | -              | 点击新增      |
| remove            | `tab: TabItem` | 关闭页签      |

| 插槽    | 说明                                         |
| ------- | -------------------------------------------- |
| default | 面板内容区，slot props：`{ active: string }` |

```vue
<Tabs v-model="tab" :tabs="tabs">
  <div v-if="tab === 'a'">面板 A</div>
  <div v-else-if="tab === 'b'">面板 B</div>
</Tabs>
```

### Collapse 折叠面板

内容分节展开收起，支持手风琴模式。

`CollapseItem` 结构：`{ key: string; title: string; content: string; disabled?: boolean }`。

| Prop              | 类型             | 默认值  | 说明                                 |
| ----------------- | ---------------- | ------- | ------------------------------------ |
| items             | `CollapseItem[]` | `[]`    | 面板列表（绑定 fetch 时可省略） |
| fetch             | `Fetch<CollapseItem>` | -  | 远程面板：挂载即请求，内置四态 |
| activeKeys        | `string[]`       | -       | 展开 key（受控，v-model:activeKeys） |
| defaultActiveKeys | `string[]`       | `[]`    | 非受控初始展开 key                   |
| accordion         | `boolean`        | `false` | 手风琴：同时至多展开一个             |

| 事件              | 参数             | 说明         |
| ----------------- | ---------------- | ------------ |
| update:activeKeys | `keys: string[]` | 展开集合更新 |
| change            | `keys: string[]` | 展开集合变化 |

```vue
<Collapse :items="faq" accordion />
<Collapse v-model:active-keys="openKeys" :items="sections" />
```

### Tree 树形控件

层级数据展示与勾选，含半选传播；绑定 `fetch` 后为远程懒加载树。

`TreeNode` 结构：`{ key: string; label: string; disabled?: boolean; leaf?: boolean; children?: TreeNode[] }`（远程模式用 `leaf: true` 标记叶子，避免空节点显示展开箭头）。

| Prop             | 类型         | 默认值  | 说明                                   |
| ---------------- | ------------ | ------- | -------------------------------------- |
| nodes            | `TreeNode[]` | -       | 树数据（绑定 fetch 时可省略）          |
| fetch            | `Fetch<TreeNode>` | -   | 远程树：展开时以 `query.filters.parentKey` 请求子级并挂回，内置加载/失败重试 |
| checkable        | `boolean`    | `false` | 显示勾选框                             |
| defaultExpandAll | `boolean`    | `false` | 默认展开全部父节点                     |
| checked          | `string[]`   | -       | 受控勾选集合（保存被点选节点自身 key） |

| 事件           | 参数                                    | 说明          |
| -------------- | --------------------------------------- | ------------- |
| update:checked | `keys: string[]`                        | 勾选集合更新  |
| check          | `keys: string[]`                        | 勾选变化      |
| expand         | `{ node: TreeNode, expanded: boolean }` | 节点展开/收起 |
| node-click     | `node: TreeNode`                        | 点击节点      |

```vue
<Tree :nodes="orgTree" checkable default-expand-all v-model:checked="checkedKeys" />
```

### Cascader 级联选择

多级联动选择。

`CascaderOption` 结构：`{ label: string; value: string | number; disabled?: boolean; children?: CascaderOption[] }`。

| Prop           | 类型                                                  | 默认值     | 说明                               |
| -------------- | ----------------------------------------------------- | ---------- | ---------------------------------- |
| options        | `CascaderOption[]`                                    | -          | 级联数据（绑定 fetch 时可省略） |
| fetch          | `Fetch<CascaderOption>`                               | -          | 远程级联：展开列时以 `query.filters.parentKey` 懒加载下一列 |
| modelValue     | `string \| number \| Array<string \| number> \| null` | -          | 叶子 value；emitPath 时为路径数组  |
| placeholder    | `string`                                              | `'请选择'` | 占位文本                           |
| disabled       | `boolean`                                             | `false`    | 禁用                               |
| changeOnSelect | `boolean`                                             | `false`    | 允许选择任意一级                   |
| emitPath       | `boolean`                                             | `false`    | v-model 携带完整路径而非叶子 value |

| 事件              | 参数               | 说明   |
| ----------------- | ------------------ | ------ |
| update:modelValue | `value: … \| null` | 值更新 |
| change            | `value: … \| null` | 值变化 |

```vue
<Cascader v-model="region" :options="regions" />
<Cascader v-model="path" :options="regions" emit-path change-on-select />
```

### Timeline 时间线

时间轴信息流。

`TimelineItem` 结构：`{ key: string; title: string; content?: string; time?: string; type?: 'primary' | 'success' | 'warning' | 'danger' }`。

| Prop  | 类型             | 默认值 | 说明     |
| ----- | ---------------- | ------ | -------- |
| items | `TimelineItem[]` | `[]`   | 节点列表（绑定 fetch 时可省略） |
| fetch | `Fetch<TimelineItem>` | -   | 远程节点：挂载即请求，内置四态 |

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

### Steps 步骤条

分步流程引导。

`StepItem` 结构：`{ key: string; title: string; description?: string; status?: 'done' | 'active' | 'error'; disabled?: boolean }`。

| Prop       | 类型         | 默认值 | 说明                      |
| ---------- | ------------ | ------ | ------------------------- |
| steps      | `StepItem[]` | `[]`   | 步骤列表                  |
| current    | `number`     | `0`    | 当前步骤索引（从 0 开始） |
| changeable | `boolean`    | `true` | 允许点击已到达的步骤跳转  |

| 事件           | 参数            | 说明         |
| -------------- | --------------- | ------------ |
| update:current | `index: number` | 当前步骤更新 |
| change         | `index: number` | 步骤变化     |

Expose：`next()` / `prev()` / `goTo(index)`。

```vue
<Steps :steps="steps" :current="current" @change="current = $event" />
<Button @click="stepsRef.next()">下一步</Button>
```

### Descriptions 描述列表

只读字段的规整展示。

`DescriptionItem` 结构：`{ label: string; value: string }`。

| Prop     | 类型                | 默认值  | 说明             |
| -------- | ------------------- | ------- | ---------------- |
| title    | `string`            | `''`    | 标题             |
| items    | `DescriptionItem[]` | -       | 字段列表（绑定 fetch 时可省略） |
| fetch    | `Fetch<DescriptionItem>` | -   | 远程字段：挂载即请求，内置四态 |
| bordered | `boolean`           | `false` | 单元格带边框     |
| column   | `number`            | `2`     | 每行列数         |

```vue
<Descriptions title="用户信息" bordered :column="3" :items="userFields" />
```

### Carousel 走马灯

轮播内容，支持自动播放与悬停暂停。

| Prop         | 类型       | 默认值    | 说明                           |
| ------------ | ---------- | --------- | ------------------------------ |
| items        | `string[]` | `[]`      | 轮播项标题（也可用插槽自定义） |
| modelValue   | `number`   | -         | 当前索引（v-model）            |
| height       | `string`   | `'14rem'` | 容器高度                       |
| autoplay     | `boolean`  | `false`   | 自动播放                       |
| interval     | `number`   | `3000`    | 播放间隔（ms）                 |
| pauseOnHover | `boolean`  | `true`    | 悬停暂停                       |
| loop         | `boolean`  | `true`    | 循环切换                       |
| fetch        | `Fetch<string>` | -    | 远程轮播项：挂载即请求，内置四态 |

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

### Progress 进度条

线形 / 环形进度展示，满格自动转 success。

| Prop        | 类型                                             | 默认值     | 说明             |
| ----------- | ------------------------------------------------ | ---------- | ---------------- |
| value       | `number`                                         | `0`        | 进度 0-100       |
| status      | `'normal' \| 'success' \| 'warning' \| 'danger'` | `'normal'` | 状态             |
| type        | `'line' \| 'circle'`                             | `'line'`   | 形态             |
| showText    | `boolean`                                        | `true`     | 显示百分比       |
| size        | `number`                                         | `80`       | 环形直径（px）   |
| strokeWidth | `number`                                         | `6`        | 环描边宽度（px） |
| lineHeight  | `number`                                         | `8`        | 条形高度（px）   |

```vue
<Progress :value="60" />
<Progress type="circle" :value="100" />
```

### Image 图片

图片加载占位与预览放大，支持缩放 / 旋转 / 翻转 / 拖拽平移。

| Prop        | 类型      | 默认值  | 说明                     |
| ----------- | --------- | ------- | ------------------------ |
| src         | `string`  | -       | 图片地址（必填）         |
| alt         | `string`  | `''`    | 替代文本                 |
| rounded     | `boolean` | `false` | 圆角                     |
| lazy        | `boolean` | `false` | 进入视口才加载           |
| previewable | `boolean` | `false` | 点击进入预览             |
| previewSrc  | `string`  | `''`    | 预览图地址（缺省用 src） |

| 事件  | 参数           | 说明     |
| ----- | -------------- | -------- |
| load  | `event: Event` | 加载成功 |
| error | `event: Event` | 加载失败 |
| close | -              | 关闭预览 |

```vue
<Image src="/cover.jpg" alt="封面" rounded lazy previewable />
```

---

## 五、反馈组件（feedback）

### Message 全局提示

轻量反馈浮层。声明式单条渲染，也可配合 MessageContainer 命令式调用。

| Prop     | 类型                                                                   | 默认值   | 说明                      |
| -------- | ---------------------------------------------------------------------- | -------- | ------------------------- |
| type     | `'info' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'loading'` | `'info'` | 语义类型                  |
| closable | `boolean`                                                              | `false`  | 显示关闭按钮              |
| visible  | `boolean`                                                              | -        | 可见性（v-model:visible） |

| 事件           | 参数             | 说明     |
| -------------- | ---------------- | -------- |
| update:visible | `value: boolean` | 显隐更新 |
| close          | -                | 关闭     |

| 插槽    | 说明     |
| ------- | -------- |
| default | 消息内容 |

```vue
<Message v-model:visible="showTip" type="success" closable>保存成功</Message>
```

### MessageContainer 消息容器

命令式消息服务的全局渲染层，在应用根部挂载一次即可。

| Prop | 类型         | 默认值             | 说明                                |
| ---- | ------------ | ------------------ | ----------------------------------- |
| api  | `MessageApi` | 全局单例 `message` | 可传入自建服务（`createMessage()`） |

```vue
<!-- App.vue -->
<MessageContainer />
```

```ts
import { message } from '@cumquat/composables';
message.success('保存成功');
message.error('提交失败'); // 默认 5s
message.loading('上传中…'); // duration 为 0，需手动 remove
const id = message.info('处理中', 0);
message.remove(id);
```

### Alert 警告提示

页面内的静态反馈条。

| Prop       | 类型                                           | 默认值   | 说明            |
| ---------- | ---------------------------------------------- | -------- | --------------- |
| type       | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | 语义类型        |
| title      | `string`                                       | `''`     | 标题            |
| closable   | `boolean`                                      | `false`  | 可关闭          |
| showIcon   | `boolean`                                      | `true`   | 显示类型图标    |
| modelValue | `boolean`                                      | -        | 显隐（v-model） |

| 事件              | 参数             | 说明     |
| ----------------- | ---------------- | -------- |
| update:modelValue | `value: boolean` | 显隐更新 |
| close             | -                | 关闭     |

| 插槽    | 说明       |
| ------- | ---------- |
| title   | 自定义标题 |
| default | 正文内容   |

```vue
<Alert type="warning" title="注意" closable>当前配置将在 24 小时后生效。</Alert>
```

### Notification 通知

角落弹出的主动通知。声明式单条渲染，也可配合 NotificationContainer 命令式调用。

| Prop     | 类型                                           | 默认值   | 说明                    |
| -------- | ---------------------------------------------- | -------- | ----------------------- |
| title    | `string`                                       | `''`     | 标题                    |
| type     | `'info' \| 'success' \| 'warning' \| 'danger'` | `'info'` | 语义类型                |
| closable | `boolean`                                      | `true`   | 显示关闭按钮            |
| visible  | `boolean`                                      | -        | 显隐（v-model:visible） |

| 事件           | 参数             | 说明     |
| -------------- | ---------------- | -------- |
| update:visible | `value: boolean` | 显隐更新 |
| close          | -                | 关闭     |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 通知正文   |
| action  | 动作区内容 |

```vue
<Notification v-model:visible="show" title="新版本" type="info">
  2.0 已发布，建议升级。
  <template #action><Button size="sm">查看</Button></template>
</Notification>
```

### NotificationContainer 通知容器

命令式通知服务的全局渲染层，按角落方向分组堆叠。

| Prop      | 类型                                                           | 默认值                  | 说明           |
| --------- | -------------------------------------------------------------- | ----------------------- | -------------- |
| api       | `NotificationApi`                                              | 全局单例 `notification` | 可传入自建服务 |
| placement | `'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'` | `'top-right'`           | 默认弹出角落   |

```vue
<!-- App.vue -->
<NotificationContainer placement="top-right" />
```

```ts
import { notification } from '@cumquat/composables';
notification.success('导入完成', '共导入 128 条记录');
notification.error('同步失败', '请检查网络后重试');
```

### Loading 加载

局部 / 全屏加载指示。

| Prop       | 类型                   | 默认值  | 说明                                            |
| ---------- | ---------------------- | ------- | ----------------------------------------------- |
| size       | `'sm' \| 'md' \| 'lg'` | `'md'`  | 指示器尺寸                                      |
| text       | `string`               | `''`    | 文案                                            |
| active     | `boolean`              | `true`  | 局部加载是否激活（非全屏形态使用）              |
| fullscreen | `boolean`              | `false` | 全屏遮罩形态：可见性与全局 loading 服务计数联动 |

Expose：`service`（全局 loading 服务，可 `service.show() / hide()`）。

```vue
<Loading :active="fetching" text="加载中…" />
<Loading fullscreen text="提交中…" />
```

### Skeleton 骨架屏

加载占位结构。

| Prop   | 类型      | 默认值  | 说明         |
| ------ | --------- | ------- | ------------ |
| avatar | `boolean` | `false` | 显示头像骨架 |
| rows   | `number`  | `3`     | 文本行数     |

```vue
<Skeleton avatar :rows="4" />
```

### Result 结果页

操作结果反馈页。

| Prop     | 类型                                          | 默认值      | 说明   |
| -------- | --------------------------------------------- | ----------- | ------ |
| status   | `'success' \| 'error' \| 'warning' \| 'info'` | `'success'` | 状态   |
| title    | `string`                                      | `''`        | 标题   |
| subTitle | `string`                                      | `''`        | 副标题 |

| 插槽     | 说明         |
| -------- | ------------ |
| title    | 自定义标题   |
| subTitle | 自定义副标题 |
| default  | 额外操作区   |

```vue
<Result status="success" title="支付成功" sub-title="订单号 CUMQ-2026-0001">
  <Button type="primary">查看订单</Button>
</Result>
```

### Upload 上传

文件选择、拖拽上传与列表管理。

`UploadFile` 结构：`{ uid?: string | number; name: string; size?: string; status?: 'uploading' | 'done' | 'error'; percent?: number; raw?: File }`。

| Prop     | 类型                                                                      | 默认值  | 说明                                           |
| -------- | ------------------------------------------------------------------------- | ------- | ---------------------------------------------- |
| fileList | `UploadFile[]`                                                            | `[]`    | 外部文件列表（v-model:fileList）               |
| accept   | `string`                                                                  | `''`    | 接受类型（扩展名 / MIME，逗号分隔）            |
| multiple | `boolean`                                                                 | `false` | 多选                                           |
| maxCount | `number`                                                                  | -       | 最多文件数                                     |
| maxSize  | `number`                                                                  | -       | 单文件大小上限（字节）                         |
| uploader | `(file: File, onProgress: (percent: number) => void) => Promise<unknown>` | -       | 实际上传动作；不提供时入队即标记成功（演示态） |
| dragging | `boolean`                                                                 | `false` | 外部强制拖拽高亮态（默认组件自管）             |
| disabled | `boolean`                                                                 | `false` | 禁用                                           |

| 事件            | 参数                                   | 说明                    |
| --------------- | -------------------------------------- | ----------------------- |
| update:fileList | `files: UploadFile[]`                  | 文件列表更新            |
| change          | `files: UploadFile[]`                  | 文件列表变化            |
| success         | `file: UploadFile`                     | 单文件上传成功          |
| error           | `{ file: UploadFile, error: unknown }` | 单文件上传失败          |
| remove          | `file: UploadFile`                     | 删除文件                |
| exceed          | `files: File[]`                        | 超出 maxCount 的部分    |
| reject          | `files: File[]`                        | accept 校验未通过的部分 |

| 插槽 | 说明           |
| ---- | -------------- |
| hint | 拖拽区附加提示 |

```vue
<Upload
  v-model:file-list="files"
  accept=".png,.jpg"
  multiple
  :max-count="5"
  :max-size="2 * 1024 * 1024"
  :uploader="uploadToServer"
  @error="onUploadError"
/>
```

---

## 六、导航与布局（navigation）

### Breadcrumb 面包屑

层级路径导航。

`BreadcrumbItem` 结构：`{ label: string; href?: string }`。

| Prop  | 类型               | 默认值 | 说明     |
| ----- | ------------------ | ------ | -------- |
| items | `BreadcrumbItem[]` | `[]`   | 路径列表 |

```vue
<Breadcrumb
  :items="[{ label: '首页', href: '/' }, { label: '订单', href: '/orders' }, { label: '详情' }]"
/>
```

### Menu 导航菜单

侧边 / 顶部导航，含分组展开与折叠模式。

`MenuItem` 结构：`{ key: string; label: string; disabled?: boolean; icon?: string; children?: MenuItem[] }`。

| Prop                | 类型         | 默认值  | 说明                           |
| ------------------- | ------------ | ------- | ------------------------------ |
| items               | `MenuItem[]` | `[]`    | 菜单数据（绑定 fetch 时可省略） |
| fetch               | `Fetch<MenuItem>` | -  | 远程菜单：挂载即请求，内置四态 |
| modelValue          | `string`     | -       | 选中项 key（v-model）          |
| collapsed           | `boolean`    | `false` | 折叠模式（仅图标，子菜单弹出） |
| defaultExpandedKeys | `string[]`   | `[]`    | 默认展开的分组 key             |

| 事件              | 参数             | 说明       |
| ----------------- | ---------------- | ---------- |
| update:modelValue | `key: string`    | 选中更新   |
| select            | `item: MenuItem` | 点击菜单项 |

```vue
<Menu v-model="route" :items="navItems" :default-expanded-keys="['system']" @select="go" />
```

### Anchor 锚点

页内锚点导航，滚动监听自动高亮。

`AnchorItem` 结构：`{ href: string; label: string }`。

| Prop           | 类型           | 默认值 | 说明                           |
| -------------- | -------------- | ------ | ------------------------------ |
| items          | `AnchorItem[]` | `[]`   | 锚点列表                       |
| active         | `string`       | -      | 受控激活锚点（v-model:active） |
| offset         | `number`       | `0`    | 命中判定的顶部偏移（px）       |
| scrollIntoView | `boolean`      | `true` | 点击时平滑滚动到目标           |

| 事件          | 参数               | 说明         |
| ------------- | ------------------ | ------------ |
| update:active | `href: string`     | 激活锚点更新 |
| change        | `href: string`     | 激活变化     |
| click         | `item: AnchorItem` | 点击锚点     |

```vue
<Anchor
  :items="[
    { href: '#basic', label: '基本信息' },
    { href: '#advance', label: '高级设置' },
  ]"
  :offset="64"
/>
```

### BackTop 回到顶部

长页面快速回顶。

| Prop             | 类型      | 默认值 | 说明                         |
| ---------------- | --------- | ------ | ---------------------------- |
| visible          | `boolean` | `true` | 是否启用                     |
| visibilityHeight | `number`  | `0`    | 滚动超过该高度（px）才出现   |
| right            | `number`  | `32`   | 距视口右侧（px）             |
| bottom           | `number`  | `32`   | 距视口底部（px）             |
| duration         | `number`  | `300`  | 回顶动画时长（ms），0 为瞬时 |

| 事件  | 参数 | 说明     |
| ----- | ---- | -------- |
| click | -    | 点击回顶 |

```vue
<BackTop :visibility-height="200" />
```

### Affix 固钉

滚动吸附定位。

| Prop      | 类型     | 默认值 | 说明                                         |
| --------- | -------- | ------ | -------------------------------------------- |
| top       | `number` | `0`    | 距视口顶部吸附距离（px）                     |
| left      | `number` | `0`    | 距视口左侧吸附距离（px）                     |
| offsetTop | `number` | -      | 滚动超过该偏移量后切换为 fixed（默认取 top） |
| zIndex    | `number` | `100`  | 层级                                         |

| 事件   | 参数             | 说明         |
| ------ | ---------------- | ------------ |
| change | `fixed: boolean` | 吸附状态变化 |

| 插槽    | 说明           |
| ------- | -------------- |
| default | 需要吸附的内容 |

```vue
<Affix :top="64"><Button type="primary">固定在顶部</Button></Affix>
```

### FloatButton 悬浮按钮

页面悬浮操作入口，可展开动作组。

`FloatAction` 结构：`{ key: string; label: string; disabled?: boolean }`。

| Prop      | 类型              | 默认值  | 说明                   |
| --------- | ----------------- | ------- | ---------------------- |
| actions   | `FloatAction[]`   | `[]`    | 展开的动作列表         |
| open      | `boolean`         | -       | 展开态（v-model:open） |
| placement | `'top' \| 'left'` | `'top'` | 展开方向               |

| 事件        | 参数            | 说明         |
| ----------- | --------------- | ------------ |
| update:open | `open: boolean` | 展开态更新   |
| select      | `key: string`   | 选中某个动作 |

```vue
<FloatButton
  :actions="[
    { key: 'edit', label: '编辑' },
    { key: 'share', label: '分享' },
  ]"
  @select="onAction"
/>
```

### DatePicker 日期选择器

单日期选择面板与快捷选项。

| Prop        | 类型             | 默认值                 | 说明                               |
| ----------- | ---------------- | ---------------------- | ---------------------------------- |
| modelValue  | `number \| null` | -                      | 选中日期（当月日序 1-31，v-model） |
| placeholder | `string`         | `'选择日期'`           | 占位文本                           |
| disabled    | `boolean`        | `false`                | 禁用                               |
| viewMonth   | `Date`           | `new Date(2026, 9, 1)` | 面板初始视角月份                   |
| shortcuts   | `DateShortcut[]` | `[]`                   | 快捷选项                           |

| 事件              | 参数            | 说明   |
| ----------------- | --------------- | ------ |
| update:modelValue | `value: number` | 值更新 |
| change            | `value: number` | 值变化 |

```vue
<DatePicker v-model="day" :shortcuts="todayShortcuts" />
```

### TimePicker 时间选择器

时间点选择，滚动列交互。

| Prop        | 类型             | 默认值       | 说明              |
| ----------- | ---------------- | ------------ | ----------------- |
| modelValue  | `string \| null` | -            | 时间值（v-model） |
| placeholder | `string`         | `'选择时间'` | 占位文本          |
| disabled    | `boolean`        | `false`      | 禁用              |
| hourStep    | `number`         | `1`          | 小时列步进        |
| minuteStep  | `number`         | `5`          | 分钟列步进        |
| useSeconds  | `boolean`        | `false`      | 展示秒列          |
| minTime     | `string`         | -            | 最早可选时间      |
| maxTime     | `string`         | -            | 最晚可选时间      |

| 事件              | 参数                    | 说明   |
| ----------------- | ----------------------- | ------ |
| update:modelValue | `value: string \| null` | 值更新 |
| change            | `value: string \| null` | 值变化 |

```vue
<TimePicker v-model="time" :minute-step="15" min-time="09:00" max-time="18:00" />
```

### Calendar 日历

日期面板与日程展示，支持范围选择。

`CalendarEvent` 结构：`{ date: string; label?: string }`（`date` 为 `yyyy-MM-dd`）。

| Prop           | 类型                                                       | 默认值  | 说明                             |
| -------------- | ---------------------------------------------------------- | ------- | -------------------------------- |
| modelValue     | `string \| Date \| null`                                   | -       | 选中日期（v-model）              |
| rangeValue     | `[string \| Date \| null, string \| Date \| null] \| null` | -       | 范围选择值（v-model:rangeValue） |
| range          | `boolean`                                                  | `false` | 范围选择模式                     |
| firstDayOfWeek | `0 \| 1`                                                   | `1`     | 每周第一天：0=周日，1=周一       |
| disabledDate   | `(date: Date) => boolean`                                  | -       | 禁用日期谓词                     |
| minDate        | `string \| Date`                                           | -       | 最小可选日期                     |
| maxDate        | `string \| Date`                                           | -       | 最大可选日期                     |
| events         | `CalendarEvent[]`                                          | `[]`    | 日程 / 事项标记                  |
| fetch          | `Fetch<CalendarEvent>`                                     | -       | 远程日程：自动以 `query.filters.range`（当前面板首尾日期）重取，切月自动加载 |

| 事件              | 参数                                                        | 说明         |
| ----------------- | ----------------------------------------------------------- | ------------ |
| update:modelValue | `value: string \| null`                                     | 日期更新     |
| update:rangeValue | `value: [string \| null, string \| null] \| null`           | 范围更新     |
| change            | `value: string \| [string \| null, string \| null] \| null` | 值变化       |
| panel-change      | `label: string`                                             | 面板视角切换 |

```vue
<Calendar v-model="date" :events="schedule" />
<Calendar v-model:range-value="range" range :disabled-date="isWeekend" />
```

### ColorPicker 颜色选择器

色板与透明度选择，支持预设色与 Hex 输入。

| Prop       | 类型       | 默认值      | 说明                   |
| ---------- | ---------- | ----------- | ---------------------- |
| modelValue | `string`   | `'#4f46e5'` | 颜色值（v-model，Hex） |
| presets    | `string[]` | 内置 10 色  | 预设色板               |
| disabled   | `boolean`  | `false`     | 禁用                   |
| showAlpha  | `boolean`  | `false`     | 显示透明度滑块         |

| 事件              | 参数            | 说明     |
| ----------------- | --------------- | -------- |
| update:modelValue | `color: string` | 颜色更新 |
| change            | `color: string` | 颜色变化 |

```vue
<ColorPicker v-model="themeColor" show-alpha :presets="brandColors" />
```

### Transfer 穿梭框

双栏数据搬移。

`TransferItem` 结构：`{ key: string; label: string; disabled?: boolean }`。

| Prop       | 类型               | 默认值                   | 说明                            |
| ---------- | ------------------ | ------------------------ | ------------------------------- |
| data       | `TransferItem[]`   | `[]`                     | 全部数据（绑定 fetch 时可省略） |
| fetch      | `Fetch<TransferItem>` | -                     | 远程候选：挂载即请求，左侧搜索以 `query.keyword`（防抖 300ms）重取，远程模式不本地过滤 |
| modelValue | `string[]`         | -                        | 右栏（已选）key 列表（v-model） |
| titles     | `[string, string]` | `['源列表', '目标列表']` | 两侧标题                        |
| searchable | `boolean`          | `false`                  | 两侧搜索过滤                    |

| 事件              | 参数                                           | 说明     |
| ----------------- | ---------------------------------------------- | -------- |
| update:modelValue | `keys: string[]`                               | 值更新   |
| change            | `keys: string[], direction: 'left' \| 'right'` | 搬移方向 |

```vue
<Transfer v-model="selected" :data="allUsers" searchable :titles="['可选', '已选']" />
```

### VirtualList 虚拟列表

超长列表的虚拟滚动，支持动态行高；绑定 `fetch` 后自动触底分页累积。

| Prop          | 类型                                      | 默认值 | 说明                       |
| ------------- | ----------------------------------------- | ------ | -------------------------- |
| items         | `T[]`                                     | `[]`   | 列表数据（绑定 fetch 时可省略） |
| fetch         | `Fetch<T>`                                | -      | 远程列表：自动注入 `pagination`（每页 20），触底加载下一页并累积，内置哨兵态与重试 |
| height        | `number`                                  | `240`  | 容器高度（px）             |
| itemHeight    | `number`                                  | `40`   | 单项高度（px）             |
| buffer        | `number`                                  | `2`    | 上下缓冲行数               |
| dynamicHeight | `(item: string, index: number) => number` | -      | 动态行高（按索引返回高度） |

```vue
<VirtualList :items="thousandRows" :height="320" :item-height="36" />
<VirtualList :items="rows" :dynamic-height="(row) => (row.length > 40 ? 64 : 36)" />
```

### Layout 布局

页面骨架，含侧栏折叠与响应式断点。

| Prop             | 类型                           | 默认值       | 说明                                |
| ---------------- | ------------------------------ | ------------ | ----------------------------------- |
| direction        | `'vertical' \| 'horizontal'`   | `'vertical'` | 布局主轴方向                        |
| collapsed        | `boolean`                      | -            | 受控侧栏折叠态（v-model:collapsed） |
| defaultCollapsed | `boolean`                      | `false`      | 非受控初始折叠态                    |
| breakpoint       | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`       | 低于该断点时自动折叠侧栏            |
| hasSider         | `boolean`                      | `false`      | 是否提供 sider 插槽区域             |

| 事件             | 参数                 | 说明       |
| ---------------- | -------------------- | ---------- |
| update:collapsed | `collapsed: boolean` | 折叠态更新 |
| collapse         | -                    | 折叠时     |
| expand           | -                    | 展开时     |

| 插槽    | 说明                                          |
| ------- | --------------------------------------------- |
| header  | 头部区，slot props：`{ collapsed, toggle }`   |
| sider   | 侧栏区，slot props：`{ collapsed, toggle }`   |
| default | 主内容区，slot props：`{ collapsed, toggle }` |
| footer  | 底部区                                        |

Expose：`collapsed` / `toggle()` / `collapse()` / `expand()`。

```vue
<Layout has-sider breakpoint="lg">
  <template #header>顶栏</template>
  <template #sider="{ collapsed }"><Menu :collapsed="collapsed" :items="nav" /></template>
  <main>内容</main>
  <template #footer>© 2026</template>
</Layout>
```

### Grid 栅格

响应式行列布局，按断点覆盖列数。

| Prop     | 类型                             | 默认值  | 说明                         |
| -------- | -------------------------------- | ------- | ---------------------------- |
| cols     | `1 \| 2 \| 3 \| 4`               | `2`     | 默认列数（可被断点列数覆盖） |
| sm       | `1 \| 2 \| 3 \| 4`               | -       | ≥640px 列数                  |
| md       | `1 \| 2 \| 3 \| 4`               | -       | ≥768px 列数                  |
| lg       | `1 \| 2 \| 3 \| 4`               | -       | ≥1024px 列数                 |
| xl       | `1 \| 2 \| 3 \| 4`               | -       | ≥1280px 列数                 |
| gap      | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'`  | 间距                         |
| centered | `boolean`                        | `false` | 内容居中（最大宽度约束）     |

| 插槽    | 说明     |
| ------- | -------- |
| default | 栅格子项 |

```vue
<Grid :cols="1" :md="2" :lg="4" gap="lg">
  <Card v-for="item in list" :key="item.id" :title="item.name" />
</Grid>
```

### Space 间距

子项间距容器。

| Prop      | 类型                         | 默认值         | 说明     |
| --------- | ---------------------------- | -------------- | -------- |
| direction | `'horizontal' \| 'vertical'` | `'horizontal'` | 排列方向 |
| size      | `'sm' \| 'md' \| 'lg'`       | `'md'`         | 间距尺寸 |
| wrap      | `boolean`                    | `false`        | 子项换行 |

| 插槽    | 说明       |
| ------- | ---------- |
| default | 排列的子项 |

```vue
<Space size="sm" wrap>
  <Button>保存</Button>
  <Button ghost>取消</Button>
</Space>
```

---

## 七、其他（extras）

### QRCode 二维码

二维码点阵渲染（结构对齐的演示矩阵，非可扫码真实编码）。

| Prop       | 类型                       | 默认值          | 说明                             |
| ---------- | -------------------------- | --------------- | -------------------------------- |
| value      | `string`                   | -               | 内容文本（必填）                 |
| size       | `number`                   | `21`            | 格子规模（奇数，保证定位角对齐） |
| level      | `'L' \| 'M' \| 'Q' \| 'H'` | `'M'`           | 容错等级（影响数据区填充密度）   |
| color      | `string`                   | `'#171717'`     | 前景色                           |
| background | `string`                   | `'transparent'` | 背景色                           |

```vue
<QRCode value="https://example.com/invite/42" :size="25" />
```

### Tour 漫游引导

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

### Watermark 水印

页面 / 容器水印，自动防篡改重建。

| Prop     | 类型     | 默认值                  | 说明                       |
| -------- | -------- | ----------------------- | -------------------------- |
| content  | `string` | -                       | 水印文字（必填）           |
| rotate   | `number` | `-22`                   | 旋转角度（deg）            |
| gap      | `number` | `96`                    | 平铺间隔（px）             |
| color    | `string` | `'rgba(23,23,23,0.16)'` | 水印颜色                   |
| fontSize | `number` | `14`                    | 字号（px）                 |
| image    | `string` | -                       | 水印图片地址（优先于文字） |
| zIndex   | `number` | `9`                     | 水印层级                   |

| 插槽    | 说明               |
| ------- | ------------------ |
| default | 被水印覆盖的内容区 |

```vue
<Watermark content="内部资料 · 张三">
  <div class="doc">受保护的正文内容</div>
</Watermark>
```

### CodeCard 代码卡片

演示插槽与示例源码展示卡片，内置代码高亮（明暗主题自适应），支持复制与展开/收起。

| Prop          | 类型      | 默认值  | 说明                                                          |
| ------------- | --------- | ------- | ------------------------------------------------------------- |
| title         | `string`  | `''`    | 卡片标题，不传则不渲染标题栏                                  |
| code          | `string`  | -       | 示例源码（必填，支持带公共缩进的模板字符串）                  |
| language      | `string`  | `'vue'` | 源码语言（vue / typescript / javascript / css / html / json） |
| defaultExpand | `boolean` | `false` | 初始是否展开代码                                              |

| 插槽    | 说明           |
| ------- | -------------- |
| default | 实时演示内容区 |

```vue
<script setup lang="ts">
const demoCode = `
  <Button type="primary">主要按钮</Button>
  <Button>次要按钮</Button>
`;
</script>

<template>
  <CodeCard title="按钮类型" :code="demoCode">
    <Button type="primary">主要按钮</Button>
    <Button>次要按钮</Button>
  </CodeCard>
</template>
```

> 高亮器懒加载且全局单例，未就绪时降级渲染纯文本；明暗主题下自动切换代码配色。

---

## 远程数据（fetch）

17 个资源型组件支持统一的 `fetch` 属性。开发者只绑定请求方法，组件内部自动完成
挂载即请求、交互重取、防抖、竞态处理与四态渲染。完整机制与类型定义见
[数据请求机制](./data-fetching.md)。

```ts
import type { Fetch } from '@cumquat/vue/components';

// 返回数组 → 普通列表；返回 { list, total } → 分页；返回其他 → 单值
const fetchUsers: Fetch<UserRow> = async (query) => {
  const res = await fetch(
    `/api/users?page=${query.pagination?.currentPage ?? 1}&q=${query.keyword ?? ''}`,
    { signal: query.signal },
  );
  if (!res.ok) throw new Error('请求失败');
  const body = await res.json();
  return { list: body.records, total: body.total };
};
```

各组件自动注入的查询片段：

| 组件 | `query` 片段 | 返回形态 |
| ---- | ------------ | -------- |
| Table | `pagination` / `sorter` / `filters` | 数组或 `{ list, total }` |
| Select / AutoComplete / Mention | `keyword`（300ms 防抖） | 数组 |
| Transfer | `keyword`（300ms 防抖） | 数组 |
| Tree / TreeSelect / Cascader | `filters.parentKey`（懒加载子级） | 数组 |
| VirtualList | `pagination`（触底加载下一页并累积） | 数组或 `{ list, total }` |
| Calendar | `filters.range: [首日, 末日]`（切月重取） | 数组 |
| Statistic | `filters` | 单值 |
| Descriptions / Timeline / Tabs / Collapse / Carousel / Menu | `filters` | 数组 |

分页表格：

```vue
<Table :columns="columns" :fetch="fetchUsers" pagination :page-size="20" />
```

远程搜索下拉：

```vue
<Select v-model="userId" :fetch="searchUsers" filterable placeholder="搜索用户" />
```

懒加载树（根节点请求不带 parentKey，子节点数据标记 `leaf` 避免空展开箭头）：

```ts
const fetchOrg: Fetch<OrgNode> = async ({ filters }) => {
  const res = await fetch(`/api/org?parent=${filters?.parentKey ?? ''}`);
  return res.json();
};
```

```vue
<Tree :fetch="fetchOrg" />
```

组件外也可通过 `useFetch` 消费同一份请求状态（`data` / `total` / `status` /
`error` / `refresh`），其 `fetch` 方法或返回对象都可直接绑给组件，详见
[组合函数 API](./composables.md)。

---

## 附：相关文档

- [组件清单与逻辑设计](./components.md)
- [组合函数 API](./composables.md)
- [数据请求机制](./data-fetching.md)
