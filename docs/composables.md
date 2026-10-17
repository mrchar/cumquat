---
title: 组合函数
---

# 组合函数库（Composables）设计文档

> 基于 `components-list.md` 的组件清单，梳理组件库需要沉淀为公共能力的交互逻辑。
> 其中**被两个及以上组件复用的逻辑**、以及**宿主可脱离组件独立使用的逻辑**，统一沉淀为
> Headless 组合函数包 `@cumquat/composables`；只服务单一组件的逻辑不抽取为组合函数，
> 直接在对应组件的 `<script setup>` 中按需内联实现（逐组件清单见 components-list.md）。
> 本文档先于编码，作为组合函数库的建设蓝图与验收范围。

## 1. 目标与定位

- **逻辑与渲染彻底分离**：组合函数只负责状态机、行为与派生数据，不输出任何 DOM 结构、类名与样式；
  `.vue` 组件退化为"调用组合函数 + 绑定语义 class/事件"的渲染壳。
- **一份逻辑多处复用**：同一行为（如浮层定位、列表键盘导航）只实现一次，
  Select、Dropdown、DatePicker、ColorPicker 等组件共享同一份逻辑。
- **独立成包**：新增 `packages/composables`（`@cumquat/composables`），仅依赖 Vue 运行时，
  无 CSS、无组件、无浏览器强依赖，可独立安装、独立测试、按需 tree-shaking。
- **可脱离组件使用**：宿主应用可以只使用组合函数（如命令式 Message、滚动监听、剪贴板），
  不引入任何默认渲染代码。
- **单组件逻辑直接内联**：与单一组件强绑定的逻辑（如二维码点阵生成、上传队列、各类专属模型）
  不进入公共包，也不另建组合函数文件，直接在该组件的 `<script setup>` 中按需要实现；
  逐组件的内联逻辑清单登记在 [components-list.md](./components-list.md)。

## 2. 设计原则

1. **Headless**：函数内部不出现 Tailwind 类名、不读写 class 属性；DOM 引用通过入参注入。
2. **受控 / 非受控统一**：凡对外暴露的值都支持 `modelValue + update:modelValue` 受控写法，
   也支持不传时内部自持初始值；`v-model` 永远是纯同步的，异步状态走独立可选契约。
3. **数据与动作双契约**：
   - 数据型逻辑消费 `AsyncStateLike<T>`（`status / data / error / isStale? / retry?`），
     函数本身**不发起任何网络请求**，只做状态编排；
   - 动作型逻辑消费 `ActionLike`（一个返回 Promise 的函数），自动派生 `pending / disabled`。
4. **SSR 安全**：所有 `window / document / navigator` 访问惰性化并置于生命周期钩子内，
   模块顶层不得触碰浏览器对象。
5. **响应式连动**：优先以 computed/watch 表达派生状态与触发式更新，状态变化自动级联
   （如分页变化 → 触发 change 事件 → 外层重新拉取数据）。
6. **完整类型**：全部 TypeScript 编写，对外暴露的状态与方法均有显式类型，泛型贯穿
   选项型、树型模型。
7. **可测试性**：每个组合函数配套单元测试，纯逻辑部分不依赖真实 DOM 事件即可验证状态转移。

## 3. 准入标准与内联边界

### 3.1 进入 `@cumquat/composables` 的条件（满足其一）

1. **跨组件复用**：被两个及以上不同组件消费（如 `useFloating` 服务十余个浮层类组件）；
2. **宿主可独立使用**：即使库内只有一个组件消费，但宿主应用存在脱离该组件直接调用的合理场景
   （如 `useClipboard`、`useScroll`、`createMessage` 等命令式服务与通用原语）。

### 3.2 不满足准入条件的逻辑：直接在组件内联实现

与单一组件强绑定、只会在一类组件内使用的逻辑，**不抽取为组合函数**，直接在该组件
`.vue` 的 `<script setup>` 中按需实现：

- 不新建组件私有 `useXxx.ts` 文件；状态、计算与事件处理直接写在组件内；
- 无响应式行为的纯计算（如二维码点阵、Badge 计数上限、色彩互转）可写为组件内普通函数；
- 组件内联逻辑同样复用公共包原语，不重复实现底层行为（如 Slider 的拖拽复用 `useDraggable`）；
- 内联逻辑随组件测试一并验证，不单独维护测试文件；
- 每个组件需要内联的具体逻辑，逐组件登记在 [components-list.md](./components-list.md) 的"组件逻辑清单"。

### 3.3 初版评审后剔除的候选项

| 原候选                                                            | 剔除原因                                                      | 落地方式                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ----------------------------------- |
| `useInputModel`                                                   | 仅 Input 使用（trim/字数/IME/清空）                           | Input 组件内联实现                  |
| `useNumberInput`                                                  | 仅 InputNumber 使用                                           | InputNumber 组件内联实现            |
| `useCascaderModel`                                                | 仅 Cascader 使用                                              | Cascader 组件内联实现               |
| `useMention`                                                      | 仅 Mention 使用                                               | Mention 组件内联实现                |
| `useSlider`                                                       | 仅 Slider 使用（拖拽几何复用 `useDraggable`）                 | Slider 组件内联实现                 |
| `useRate`                                                         | 仅 Rate 使用                                                  | Rate 组件内联实现                   |
| `useColorModel`                                                   | 仅 ColorPicker 使用（色彩空间互转）                           | ColorPicker 组件内联实现            |
| `useUpload`                                                       | 仅 Upload 使用（队列/校验/进度）                              | Upload 组件内联实现                 |
| `usePopconfirmModel`                                              | 仅 Popconfirm 使用                                            | Popconfirm 组件内联实现             |
| `useTable*` 系列                                                  | 仅 Table 使用，拆 5 个公共函数属过度设计                      | Table 组件内集中内联编排            |
| `useTabsModel` 等                                                 | Tabs/Collapse/Steps/Carousel/Transfer/Progress 均为单组件专属 | 各自组件内联实现                    |
| `useCountUp/Countdown/Ellipsis/EditableText/VirtualList/QRMatrix` | 单组件专属                                                    | 各自组件内联实现                    |
| `useMenuModel/Scrollspy/Affix/BackTop/Tour/ImageViewer/Watermark` | 单组件专属                                                    | 各自组件内联实现                    |
| `useElementSize`                                                  | 仅 Slider/ColorPicker 需要轨道几何                            | 并入 `useDraggable`                 |
| `useMutationObserver`                                             | 仅 Watermark 防篡改需要                                       | Watermark 组件内直接调用原生 API    |
| `useRafLoop`                                                      | 仅 Statistic 数字滚动需要                                     | Statistic 组件内联实现              |
| `useBreakpoint`                                                   | 断点取值是项目/主题层语义，不属 Headless 库                   | 宿主基于 `useMediaQuery` 自行封装   |
| `usePrevious/useLatest/useStateScope`                             | 内部小工具/测试手段，不构成公共 API                           | 需要时作为包内 `internal/` 私有实现 |

> 以上逻辑并非不实现，而是在对应组件改造时直接内联落地，逐项描述见 components-list.md。

## 4. 分层结构

组合函数按依赖方向自下而上分三层，上层可依赖下层，下层禁止反向依赖：

```
L2  领域模型层   跨组件复用的 headless 模型（useForm / useDateGrid / useModal / usePagination ...）
L1  行为原语层   跨组件共享的交互行为（useFloating / useDismiss / useListboxNavigation ...）
L0  工具原语层   与业务无关的基础能力（useEventListener / useControllableModel / useId ...）
```

目录结构（按实际函数增量建目录，不预留空目录）：

```
packages/composables/
  src/
    core/          # L0：工具原语
    behavior/      # L1：行为原语
    form/          # L2：表单与输入
    overlay/       # L2：浮层与反馈服务
    data/          # L2：数据展示（usePagination）
    media/         # L2：媒体（useImageState）
    internal/      # 包内共享但不对外导出的小工具
    index.ts       # 统一出口
```

## 5. 公共类型契约

```ts
/** 异步数据状态：数据型组件/组合函数唯一依赖的数据契约 */
interface AsyncStateLike<T> {
  status: 'pending' | 'success' | 'error';
  data: T;
  error?: unknown;
  isStale?: boolean;
  retry?: () => void;
}

/** 动作：动作型组件传入的异步操作，自动派生 pending/disabled */
type ActionLike = (...args: any[]) => Promise<unknown> | unknown;

/** 受控值的标准入参形态 */
interface ControlledProps<T> {
  modelValue?: T;
  defaultValue?: T;
  'onUpdate:modelValue'?: (value: T) => void;
}
```

## 6. L0 工具原语

| 组合函数                         | 职责                                   | 关键输出                           | 主要消费方与入包依据                              |
| -------------------------------- | -------------------------------------- | ---------------------------------- | ------------------------------------------------- |
| `useId`                          | SSR 安全的组件内唯一标识生成           | `uid`                              | FormItem、Tooltip 等全部 aria 关联组件            |
| `useControllableModel`           | 受控/非受控统一封装，同步回写          | `value, setValue`                  | 所有带 v-model 的模型                             |
| `useToggle`                      | 布尔状态及取反                         | `value, toggle, setTrue, setFalse` | Switch、FloatButton、Layout                       |
| `useEventListener`               | 绑定/自动卸载 DOM 事件，支持目标响应式 | 无（副作用）                       | 浮层、滚动、键盘等行为原语的公共底座              |
| `useResizeObserver`              | 元素尺寸监听                           | `width, height`                    | useFloating；Watermark/VirtualList 等组件内联复用 |
| `useIntersectionObserver`        | 元素进出视口                           | `isIntersecting`                   | useImageState 懒加载；宿主可独立使用              |
| `useTimeoutFn` / `useIntervalFn` | 可立即停止/重启的定时器                | `pause, resume`                    | useToastQueue、Carousel 自动播放；宿主可独立使用  |
| `useMediaQuery`                  | 媒体查询订阅                           | `matches`                          | Layout、Grid；断点语义由宿主定义                  |
| `useScroll`                      | 目标元素/窗口滚动位置与方向            | `x, y, direction`                  | Affix/Anchor/BackTop 组件内联复用；宿主可用       |
| `useScrollLock`                  | 打开浮层时锁定背景滚动                 | `lock, unlock`                     | useModal、下拉浮层                                |
| `useScrollIntoView`              | 平滑滚动元素至可视区                   | `scrollIntoView`                   | Tour、Anchor、Tabs 三个组件复用                   |
| `useClickOutside`                | 点击元素外部检测                       | 无（回调）                         | useDismiss、各选择器                              |
| `useFocusTrap`                   | 焦点陷阱（Tab 循环、初始焦点）         | `trap, release`                    | useModal                                          |
| `useFocusReturn`                 | 关闭浮层后焦点归还                     | 无（自动）                         | useModal、usePopoverModel                         |
| `useRovingFocus`                 | 列表内 roving-tabindex 焦点管理        | `activeIndex, onKeydown`           | Select、Menu、Tabs、Segmented、Tree               |
| `useTypeahead`                   | 键盘输入匹配选项（按字符跳转）         | `search, reset`                    | Select、Menu、Tree                                |
| `useDraggable`                   | 指针拖拽，含元素几何测量与边界钳制     | `x, y, ratio, dragging`            | Slider、ColorPicker                               |
| `useClipboard`                   | 复制文本与成功反馈                     | `copy, copied`                     | 宿主可独立使用；Typography 复用                   |
| `useTransitionVisible`           | 进出场过渡的挂载状态机                 | `rendered, visible, onAfterLeave`  | 所有带 Transition 的浮层                          |
| `useZIndex`                      | 全局浮层层级递增与回收                 | `currentZIndex`                    | Dialog/Drawer/Popover/Message/Notification        |

## 7. L1 行为原语

| 组合函数               | 职责                                                                               | 关键输出                                      | 主要消费方                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `useOpen`              | 开合状态（受控可选）+ 延迟关闭                                                     | `isOpen, open, close, toggle`                 | Dialog、Drawer、Popover、Dropdown、各选择器、FloatButton                                                                         |
| `useDismiss`           | ESC、外部点击、滚动失焦的统一关闭编排                                              | 无（注册副作用）                              | 全部浮层                                                                                                                         |
| `useFloating`          | 锚点浮层定位引擎：placement、自动翻转、移位、边距、箭头坐标、滚动/尺寸变化自动更新 | `floatingRefs, placement, arrowStyle, update` | Tooltip、Popover、Dropdown、Select、Cascader、DatePicker、TimePicker、ColorPicker、TreeSelect、AutoComplete、Mention、Popconfirm |
| `useHoverIntent`       | 悬停触发的开合延迟（防抖动）                                                       | `onMouseEnter, onMouseLeave`                  | Tooltip、Dropdown(hover)、Menu                                                                                                   |
| `useListboxNavigation` | 选项列表键盘导航：上下移动、Home/End、回车选中、禁用项跳过、循环                   | `activeIndex, move, select`                   | Select、Dropdown、Menu、Cascader、AutoComplete、Mention、Segmented、TreeSelect、TimePicker                                       |
| `useAsyncState`        | 包装外部异步数据为 `AsyncStateLike`，提供重试与 stale 标记                         | `state, run, retry`                           | 远程 Select/AutoComplete/Mention、Table 内联编排；宿主可独立使用                                                                 |
| `useActionState`       | 消费 `ActionLike`，执行期间派生 pending/disabled，错误归一                         | `pending, disabled, run, error`               | Button、Switch、Popconfirm、Upload、Form 提交                                                                                    |
| `useToastQueue`        | 命令式浮层队列：堆叠定位、去重、自动关闭、悬停暂停、手动销毁                       | `push, remove, clear, items`                  | Message、Notification                                                                                                            |
| `useOverlayContainer`  | Teleport 目标容器的 SSR 安全解析                                                   | `container`                                   | 全部 Teleport 浮层                                                                                                               |
| `useFormContext`       | 表单上下文的 provide/inject 注册中心                                               | `provideForm, injectFormField`                | Form / FormItem 及全部表单控件                                                                                                   |

## 8. L2 领域模型（仅收录跨组件复用项）

### 8.1 表单与输入（form/）

| 组合函数            | 职责                                                              | 入包依据 / 消费组件                 |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------- |
| `useForm`           | 字段注册/注销、整表值、规则校验（同步/异步）、提交、重置、脏检查  | Form；宿主可做无头表单              |
| `useFormField`      | 单字段值/校验信息/touched、blur/change、aria 注入、表单上下文联动 | FormItem 及**所有表单控件**         |
| `useCheckableGroup` | 成组勾选值管理（多选数组 / 单选互斥）、全选与半选推导             | CheckboxGroup、RadioGroup           |
| `useSelectModel`    | 单选/多选值、标签回显、本地过滤、清除、空态                       | Select、TreeSelect                  |
| `useTreeModel`      | 树形数据：展开集合、勾选集合、半选传播、扁平化可见节点            | Tree、TreeSelect                    |
| `useAsyncSuggest`   | 输入防抖 → 调用异步建议源 → loading/空态管理                      | AutoComplete、Mention               |
| `useDateGrid`       | 日历网格纯计算：月首偏移、当月天数、范围/禁用标记、多面板         | DatePicker、Calendar                |
| `useDateModel`      | 日期值模型：解析/格式化、粒度（日/月/年）、范围选择、快捷选项     | DatePicker、Calendar                |
| `useTimeModel`      | 时/分/秒列选择、步进、范围限制、确认回写                          | TimePicker、DatePicker 日期时间模式 |

### 8.2 浮层与反馈（overlay/）

| 组合函数             | 职责                                                              | 入包依据 / 消费组件            |
| -------------------- | ----------------------------------------------------------------- | ------------------------------ |
| `useModal`           | 模态开合编排：useOpen + 锁定滚动 + 焦点陷阱/归还 + ESC + 层级     | Dialog、Drawer                 |
| `usePopoverModel`    | 触发方式（click/hover/focus/manual）+ 定位 + 关闭策略的组合编排   | Popover、Dropdown、Tooltip     |
| `createMessage`      | 基于 toast 队列的命令式 API（success/error/warning/info/loading） | 命令式服务，宿主可直接函数调用 |
| `createNotification` | 角落方向堆叠、标题/描述/动作数据的命令式 API                      | 命令式服务，宿主可直接函数调用 |
| `useLoadingService`  | 局部/全屏加载的计数式服务（多请求合并）                           | 命令式服务，宿主可直接函数调用 |

### 8.3 数据展示（data/）

| 组合函数             | 职责                                                      | 入包依据 / 消费组件                          |
| -------------------- | --------------------------------------------------------- | -------------------------------------------- |
| `usePagination`      | 当前页/页大小、总页数、页码与省略号序列、跳页、页大小变更 | Pagination；Table 内联复用；宿主列表可独立用 |
| `useFetch`           | 宿主侧统一资源请求：状态机、竞态后到为准、stale、刷新     | 17 个 fetch 型组件的请求源；宿主可独立用      |
| `useFetchResource`   | 组件内部资源机制：挂载即请求、查询片段自动重取、防抖、合并 | 所有 fetch 型组件内部共用                    |
| `createFetchController` | 纯工厂：请求序号竞态控制 + AbortController + 四态状态机 | 上述两个钩子的底层，也可单独用于测试/自定义   |

#### 8.3.1 统一数据请求

完整设计见 [data-fetching.md](./data-fetching.md)。最小用法：

```ts
import { useFetch } from '@cumquat/composables';
import type { Fetch } from '@cumquat/composables';

interface UserRow {
  id: number;
  name: string;
}

// 宿主侧：创建一次，状态可在组件外消费，也可直接把 fetchUsers 绑给组件
const { state, data, total, status, loading, error, isStale, refresh } =
  useFetch<UserRow>((query) => fetchUsersApi(query));
```

`useFetch(fetcher)` 返回：

| 成员      | 说明                                                                 |
| --------- | -------------------------------------------------------------------- |
| `fetch`   | `(query?) => Promise<FetchResult<T>>`，可直接绑给组件的 `fetch` 属性 |
| `state`   | `ComputedRef<AsyncStateLike>`，四态（pending/error/success）+ retry  |
| `data`    | 归一化后的负载：数组 / 分页 list / 单值                              |
| `total`   | 分页总数；普通数组为数据条数；单值为 0                               |
| `status` / `loading` / `error` / `isStale` | 状态便捷访问                |
| `refresh` | 以最近查询重发；传入 query 时浅合并覆盖                              |

组件作者使用 `useFetchResource`：

```ts
const { enabled, state, total, loading, error, refresh } = useFetchResource<Row[]>(
  () => props.fetch, // 必须传 ref/getter，裸函数会被 toValue 当 getter 调用
  {
    getQuery: () => ({ pagination: { currentPage, pageSize }, sorter, filters }),
    initialData: [],
    debounce: 300,                       // 关键词类组件使用
    merge: (previous, next, query) => …, // 累积分页 / 树懒加载挂载子级
  },
);
```

行为约束：

- 首次绑定在微任务执行（避开 setup 中 `getQuery` 引用后置初始化状态的 TDZ），
  查询监听器在首次绑定时才完成依赖收集；
- 请求序号保证后到为准，旧请求通过 `AbortController` 取消；
- 重取期间保留旧数据并标 `isStale`，失败渲染错误态且 `retry` 重放最近一次查询；
- `merge` 模式下仅当 `pagination.currentPage <= 1` 时重置数据，
  无分页片段的懒加载查询不重置，由 merge 依据 `filters.parentKey` 挂回子树。

### 8.4 媒体（media/）

| 组合函数        | 职责                                 | 入包依据 / 消费组件 |
| --------------- | ------------------------------------ | ------------------- |
| `useImageState` | 图片加载中/成功/失败状态、懒加载触发 | Image、Avatar       |

## 9. 组件 → 公共组合函数映射总表

覆盖 [components-list.md](./components-list.md) 全部组件；每个组件"组件内联实现"的具体逻辑以
components-list.md 的"组件逻辑清单"为准，本表只标注公共包函数的消费关系。

- 有 `use*`：该组件消费的 `@cumquat/composables` 公开组合函数；
- "—"：纯展示组件，不消费公共组合函数（至多内部用到 `useId` 等通用能力）。

### P0 · 极高频

| 组件       | 复用的公共组合函数                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Button     | `useActionState`、`useId`                                                                                                    |
| Icon       | —                                                                                                                            |
| Input      | `useFormField`                                                                                                               |
| Select     | `useFloating`、`useOpen`、`useDismiss`、`useListboxNavigation`、`useSelectModel`、`useAsyncState`、`useFetchResource`、`useFormField`            |
| Form       | `useForm`、`useFormContext`                                                                                                  |
| Table      | `usePagination`、`useAsyncState`、`useFetchResource`（排序/筛选/展开/选择的编排与 change 参数组装在组件内联）                                    |
| Dialog     | `useModal`（内含 `useOpen`+`useDismiss`+`useScrollLock`+`useFocusTrap`+`useFocusReturn`+`useZIndex`+`useTransitionVisible`） |
| Pagination | `usePagination`                                                                                                              |
| Message    | `createMessage`（底座 `useToastQueue`）                                                                                      |
| Tooltip    | `useFloating`、`useHoverIntent`、`useOpen`、`useTransitionVisible`                                                           |

### P1 · 高频

| 组件         | 复用的公共组合函数                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Checkbox     | `useCheckableGroup`、`useFormField`                                                                     |
| Radio        | `useCheckableGroup`、`useFormField`                                                                     |
| Switch       | `useToggle`、`useActionState`、`useFormField`                                                           |
| DatePicker   | `useDateGrid`、`useDateModel`、`useTimeModel`（日期时间模式）、`useFloating`、`useOpen`、`useFormField` |
| TimePicker   | `useTimeModel`、`useFloating`、`useListboxNavigation`                                                   |
| Tabs         | `useRovingFocus`、`useFetchResource`                                                                                        |
| Dropdown     | `usePopoverModel`、`useFloating`、`useListboxNavigation`                                                |
| Menu         | `useRovingFocus`、`useTypeahead`、`useFetchResource`                                                                        |
| Drawer       | `useModal`                                                                                              |
| Popover      | `usePopoverModel`、`useFloating`                                                                        |
| Card         | —                                                                                                       |
| Tag          | `useControllableModel`                                                                                  |
| Alert        | `useControllableModel`                                                                                  |
| Notification | `createNotification`（底座 `useToastQueue`）、`useZIndex`                                               |
| Loading      | `useLoadingService`                                                                                     |
| Upload       | `useActionState`                                                                                        |
| Popconfirm   | `usePopoverModel`、`useActionState`                                                                     |

### P2 · 中频

| 组件         | 复用的公共组合函数                                                      |
| ------------ | ----------------------------------------------------------------------- |
| InputNumber  | `useFormField`                                                          |
| Cascader     | `useFloating`、`useListboxNavigation`、`useFetchResource`                                   |
| Tree         | `useTreeModel`、`useRovingFocus`、`useTypeahead`、`useFetchResource`                        |
| TreeSelect   | `useTreeModel`、`useSelectModel`、`useFloating`、`useListboxNavigation`、`useFetchResource` |
| AutoComplete | `useAsyncSuggest`、`useFloating`、`useListboxNavigation`                |
| Breadcrumb   | —                                                                       |
| Steps        | —（步骤状态在组件内联实现）                                             |
| Progress     | —（钳制与状态在组件内联实现）                                           |
| Avatar       | `useImageState`                                                         |
| Badge        | —（计数上限为组件内纯函数）                                             |
| Skeleton     | —                                                                       |
| Empty        | —                                                                       |
| Result       | —                                                                       |
| Collapse     | `useFetchResource`（展开集合与手风琴模式在组件内联实现）                     |
| Descriptions | `useFetchResource`                                                                       |
| Layout       | `useToggle`、`useMediaQuery`                                            |
| Grid         | `useMediaQuery`                                                         |
| Space        | —                                                                       |

### P3 · 低频

| 组件       | 复用的公共组合函数                         |
| ---------- | ------------------------------------------ |
| Slider     | `useDraggable`                             |
| Rate       | —（星级交互在组件内联实现）                |
| Transfer   | `useFetchResource`（双栏搬移在组件内联实现）                |
| Timeline   | `useFetchResource`                                          |
| Carousel   | `useIntervalFn`、`useFetchResource`                            |
| Image      | `useImageState`、`useIntersectionObserver` |
| Affix      | `useScroll`                                |
| Anchor     | `useScroll`、`useScrollIntoView`           |
| BackTop    | `useScroll`                                |
| Statistic  | `useFetchResource`（滚动动画与倒计时在组件内联实现）        |
| Typography | `useClipboard`、`useResizeObserver`        |

### P4 · 特定场景

| 组件        | 复用的公共组合函数                                       |
| ----------- | -------------------------------------------------------- |
| Calendar    | `useDateGrid`、`useDateModel`、`useFetchResource`                            |
| ColorPicker | `useDraggable`、`useFloating`                            |
| QRCode      | —（点阵生成为组件内纯函数）                              |
| Watermark   | `useResizeObserver`（防篡改直接用原生 MutationObserver） |
| Tour        | `useScrollIntoView`、`useZIndex`                         |
| Mention     | `useAsyncSuggest`、`useFloating`                                         |
| Segmented   | `useListboxNavigation`、`useControllableModel`           |
| VirtualList | `useResizeObserver`、`useFetchResource`                                      |
| FloatButton | `useToggle`、`useOpen`                                   |

## 10. 建设优先级

与组件 P0–P4 对齐，按依赖自底向上分批交付；每批只建设公共组合函数及其单测，
随后改造消费组件——组件改造时，其专属逻辑直接在 `<script setup>` 内联实现，
不产生组合函数文件（具体清单见 components-list.md）。

1. **第一批（支撑 P0，公共包 28 个）**
   - L0：`useId`、`useControllableModel`、`useEventListener`、`useResizeObserver`、
     `useClickOutside`、`useScrollLock`、`useFocusTrap`、`useFocusReturn`、
     `useTransitionVisible`、`useZIndex`、`useTimeoutFn`；
   - L1：`useOpen`、`useDismiss`、`useFloating`、`useHoverIntent`、`useRovingFocus`、
     `useListboxNavigation`、`useAsyncState`、`useActionState`、`useToastQueue`、
     `useOverlayContainer`、`useFormContext`；
   - L2：`useForm`、`useFormField`、`useSelectModel`、`usePagination`、`useModal`、
     `createMessage`。
2. **第二批（支撑 P1，公共包 8 个）**
   `useToggle`、`useCheckableGroup`、`useDateGrid`、`useDateModel`、`useTimeModel`、
   `usePopoverModel`、`createNotification`、`useLoadingService`。
3. **第三批（支撑 P2/P3，公共包 11 个）**
   `useTreeModel`、`useAsyncSuggest`、`useTypeahead`、`useDraggable`、`useMediaQuery`、
   `useScroll`、`useScrollIntoView`、`useIntersectionObserver`、`useIntervalFn`、
   `useImageState`、`useClipboard`。
4. **第四批（支撑 P4，公共包 0 个新增）**
   P4 组件全部依赖前三批原语，无新增公共组合函数。

> 准入复核结论：公共包共 47 个对外组合函数（L0 21 + L1 10 + L2 16）；
> 各组件的专属逻辑不进入公共 API，在组件改造时直接内联实现。

## 11. 实现与验收约定

- **形态**：`@cumquat/composables`，仅依赖 `vue`；入口统一导出、支持 tree-shaking；
  `internal/` 下的辅助实现不经过入口导出。
- **命名**：一律 `use` 前缀；返回"响应式状态 + 动作方法"的对象；布尔动作用
  `open/close/toggle` 等动词，避免与状态同名。
- **测试**：每个公共函数配套 `*.test.ts`，覆盖：初始状态、状态转移、受控/非受控、
  边界与禁用分支、监听器/定时器的清理、SSR 安全（模拟无 window 环境）；
  组件内联逻辑不单独建测试文件，随组件测试一并覆盖。
- **组件改造顺序**：公共组合函数完成并单测通过后，对应 `.vue` 组件改为消费组合函数，
  组件专属逻辑直接在 `<script setup>` 内联实现；模板仅保留语义 class 与事件绑定，
  现有组件测试不允许回归。
- **文档同步**：每个组合函数在源码顶部以 TSDoc 注释说明用途、参数、返回与消费组件；
  本文档与 components-list.md 的清单随实现进度勾选更新。
