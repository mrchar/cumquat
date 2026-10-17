# Vue 组件库常见组件清单

> 按典型业务项目中的使用频率从高到低分组，用于评估组件库的建设优先级。

## P0 · 极高频

几乎所有页面都会用到，构成组件库的最小可用集合。

| 组件             | 说明                                             |
| ---------------- | ------------------------------------------------ |
| Button 按钮      | 触发操作，支持多种语义类型、尺寸、加载与禁用状态 |
| Icon 图标        | 内联图标渲染，是其他组件的基础依赖               |
| Input 输入框     | 单行/多行文本输入，支持前后缀、清除、字数统计    |
| Select 选择器    | 下拉单选/多选，支持搜索、分组、远程加载          |
| Form 表单        | 字段容器与校验编排，含 FormItem                  |
| Table 表格       | 数据列表展示，含排序、筛选、分页、展开、选择     |
| Dialog 对话框    | 模态弹层，承载确认、表单等临时交互（Modal）      |
| Pagination 分页  | 页码导航，与表格/列表联动                        |
| Message 全局提示 | 轻量反馈浮层，命令式调用                         |
| Tooltip 文字提示 | 悬停提示，辅助说明                               |

## P1 · 高频

多数业务页面的常规构件。

| 组件                  | 说明                              |
| --------------------- | --------------------------------- |
| Checkbox 复选框       | 多选及全选逻辑，含 CheckboxGroup  |
| Radio 单选框          | 单选互斥，含 RadioGroup、按钮形态 |
| Switch 开关           | 布尔状态切换                      |
| DatePicker 日期选择器 | 单日期/范围/日期时间选择          |
| TimePicker 时间选择器 | 时间点/时间段选择                 |
| Tabs 标签页           | 平级内容切换                      |
| Dropdown 下拉菜单     | 悬停/点击触发的操作菜单           |
| Menu 导航菜单         | 侧边/顶部导航，含折叠与分组       |
| Drawer 抽屉           | 侧边滑出面板                      |
| Popover 气泡卡片      | 悬停/点击触发的轻量浮层           |
| Card 卡片             | 内容分块容器                      |
| Tag 标签              | 状态标记与分类，可关闭            |
| Alert 警告提示        | 页面内的静态反馈条                |
| Notification 通知     | 角落弹出的主动通知，命令式调用    |
| Loading 加载          | 局部/全屏加载指示（Spin）         |
| Upload 上传           | 文件选择、拖拽上传、列表管理      |
| Popconfirm 气泡确认   | 轻量二次确认                      |

## P2 · 中频

常见但可按需引入。

| 组件                   | 说明                                               |
| ---------------------- | -------------------------------------------------- |
| InputNumber 数字输入框 | 步进、范围限制的数字输入                           |
| Cascader 级联选择      | 多级联动选择                                       |
| Tree 树形控件          | 层级数据展示与勾选                                 |
| TreeSelect 树选择      | 树形结构的选择器                                   |
| AutoComplete 自动完成  | 输入联想补全                                       |
| Breadcrumb 面包屑      | 层级路径导航                                       |
| Steps 步骤条           | 分步流程引导                                       |
| Progress 进度条        | 线形/环形进度展示                                  |
| Avatar 头像            | 用户/实体头像，含头像组                            |
| Badge 徽标             | 角标计数与状态点                                   |
| Skeleton 骨架屏        | 加载占位结构                                       |
| Empty 空状态           | 无数据占位                                         |
| Result 结果页          | 操作结果反馈页                                     |
| Collapse 折叠面板      | 内容分节展开收起                                   |
| Descriptions 描述列表  | 只读字段的规整展示                                 |
| Layout 布局            | 页面骨架，含 Grid 行列、Space 间距、Divider 分割线 |

## P3 · 低频

特定交互或展示场景使用。

| 组件               | 说明                             |
| ------------------ | -------------------------------- |
| Slider 滑块        | 区间数值选择                     |
| Rate 评分          | 星级评分展示与输入               |
| Transfer 穿梭框    | 双栏数据搬移                     |
| Timeline 时间线    | 时间轴信息流                     |
| Carousel 走马灯    | 轮播内容                         |
| Image 图片         | 图片加载占位与预览放大           |
| Affix 固钉         | 滚动吸附定位                     |
| Anchor 锚点        | 页内锚点导航                     |
| BackTop 回到顶部   | 长页面快速回顶                   |
| Statistic 统计数值 | 指标数值展示，含倒计时           |
| Typography 排版    | 标题/段落/文本的省略、复制、编辑 |

## P4 · 特定场景

少数产品形态需要，通常最后建设或不提供。

| 组件                   | 说明               |
| ---------------------- | ------------------ |
| Calendar 日历          | 日期面板与日程展示 |
| ColorPicker 颜色选择器 | 色板与透明度选择   |
| CodeCard 代码卡片      | 演示与源码高亮展示 |
| QRCode 二维码          | 二维码生成渲染     |
| Watermark 水印         | 页面/容器水印      |
| Tour 漫游引导          | 分步新手引导       |
| Mention 提及           | 输入中的 @ 成员    |
| Segmented 分段控制器   | 紧凑的选项切换     |
| VirtualList 虚拟列表   | 超长列表的虚拟滚动 |
| FloatButton 悬浮按钮   | 页面悬浮操作入口   |

## 组件逻辑清单

> 每个组件需要实现的逻辑分两类：
>
> - **内联逻辑**：仅该组件使用、与组件强绑定的逻辑，直接在组件 `<script setup>` 中按需实现，
>   不抽取为组合函数、不另建 `useXxx` 文件；其中无响应式行为的纯计算可写为组件内普通函数。
> - **复用组合函数**：跨组件复用或宿主可脱离组件独立使用的逻辑，统一来自 `@cumquat/composables`
>   （完整清单见 [composables.md](./composables.md)）。
>
> 标注"纯展示"的组件没有专属逻辑，模板直接渲染插槽与语义结构。

### P0 · 极高频

- **Button 按钮**
  - 内联逻辑：无；`loading/disabled` 完全由外部动作派生
  - 复用组合函数：`useActionState`、`useId`
- **Icon 图标**：纯展示（内联渲染图标内容）
- **Input 输入框**
  - 内联逻辑：前后缀与清除按钮的显隐及清空交互、字数统计与长度限制、`trim` 处理、
    输入法组合（IME）期间不触发值更新、多行模式适配、校验状态展示
  - 复用组合函数：`useFormField`
- **Select 选择器**
  - 内联逻辑：选中项标签回显、多选标签的展示与移除、分组选项组织、加载/空态渲染、
    下拉面板与触发器的结构编排
  - 复用组合函数：`useFloating`、`useOpen`、`useDismiss`、`useListboxNavigation`、
    `useSelectModel`、`useAsyncState`、`useFormField`
- **Form 表单**
  - 内联逻辑：无核心专属逻辑（字段注册、校验编排、提交/重置、脏检查全部由组合函数承担，
    组件只做布局与校验提示渲染）
  - 复用组合函数：`useForm`、`useFormContext`
- **Table 表格**
  - 内联逻辑：排序/筛选/分页/展开/选择五类状态的集中编排与统一 `change` 事件参数组装、
    当前页全选与跨页选中汇总、表头筛选 UI、展开行渲染、远程数据四态（加载/错误/空/stale）呈现；
    组件自身不发请求，由外层响应式参数驱动
  - 复用组合函数：`usePagination`、`useAsyncState`
- **Dialog 对话框**
  - 内联逻辑：遮罩点击关闭策略、标题/底部插槽结构、进出场过渡绑定
  - 复用组合函数：`useModal`（内部组合 `useOpen`/`useDismiss`/`useScrollLock`/
    `useFocusTrap`/`useFocusReturn`/`useZIndex`/`useTransitionVisible`）
- **Pagination 分页**
  - 内联逻辑：页码与省略号序列的按钮渲染、每页条数选择器、跳页输入框交互
  - 复用组合函数：`usePagination`
- **Message 全局提示**
  - 内联逻辑：消息项的图标、内容与关闭按钮渲染
  - 复用组合函数：`createMessage`（底座 `useToastQueue`）
- **Tooltip 文字提示**
  - 内联逻辑：触发插槽包裹、内容层渲染与进出场绑定
  - 复用组合函数：`useFloating`、`useHoverIntent`、`useOpen`、`useTransitionVisible`

### P1 · 高频

- **Checkbox 复选框**
  - 内联逻辑：勾选/未选/半选三态展示、全选框 `indeterminate` 呈现
  - 复用组合函数：`useCheckableGroup`、`useFormField`
- **Radio 单选框**
  - 内联逻辑：无（选中互斥由成组逻辑承担，按钮形态由主题样式承担）
  - 复用组合函数：`useCheckableGroup`、`useFormField`
- **Switch 开关**
  - 内联逻辑：无
  - 复用组合函数：`useToggle`、`useActionState`、`useFormField`
- **DatePicker 日期选择器**
  - 内联逻辑：输入框日期回显、范围选择的起止输入、日历面板切换、快捷选项按钮、
    日期时间模式下的时间区编排
  - 复用组合函数：`useDateGrid`、`useDateModel`、`useFloating`、`useOpen`、`useFormField`
    （日期时间模式另用 `useTimeModel`）
- **TimePicker 时间选择器**
  - 内联逻辑：时/分/秒滚动列渲染、确认/取消按钮编排、范围起止输入
  - 复用组合函数：`useTimeModel`、`useFloating`、`useListboxNavigation`
- **Tabs 标签页**
  - 内联逻辑：激活项受控值维护、页签增减、左右键切换的索引编排、内容面板懒渲染、
    溢出页签收纳（可选）
  - 复用组合函数：`useRovingFocus`
- **Dropdown 下拉菜单**
  - 内联逻辑：菜单项/分隔线/禁用项数据渲染、触发插槽与菜单结构
  - 复用组合函数：`usePopoverModel`、`useFloating`、`useListboxNavigation`
- **Menu 导航菜单**
  - 内联逻辑：选中项维护、分组展开集合、折叠模式数据、层级缩进与弹出子菜单编排
  - 复用组合函数：`useRovingFocus`、`useTypeahead`
- **Drawer 抽屉**
  - 内联逻辑：方向与尺寸、遮罩、进出场过渡绑定
  - 复用组合函数：`useModal`
- **Popover 气泡卡片**
  - 内联逻辑：标题/内容/操作区插槽结构
  - 复用组合函数：`usePopoverModel`、`useFloating`
- **Card 卡片**：纯展示（内容分块容器，hover 反馈由主题样式承担）
- **Tag 标签**
  - 内联逻辑：关闭按钮点击与受控可见性
  - 复用组合函数：`useControllableModel`
- **Alert 警告提示**
  - 内联逻辑：关闭按钮点击与受控可见性
  - 复用组合函数：`useControllableModel`
- **Notification 通知**
  - 内联逻辑：通知项标题/描述/动作插槽渲染、关闭交互
  - 复用组合函数：`createNotification`（底座 `useToastQueue`）、`useZIndex`
- **Loading 加载**
  - 内联逻辑：局部容器与全屏两种挂载形态、指示文案渲染
  - 复用组合函数：`useLoadingService`
- **Upload 上传**
  - 内联逻辑：隐藏文件选择框触发、`accept`/数量/大小校验、拖拽放入的高亮态、
    文件队列与上传进度、成功/失败列表渲染、删除与重试
  - 复用组合函数：`useActionState`
- **Popconfirm 气泡确认**
  - 内联逻辑：确认/取消按钮编排、确认动作执行期间按钮态联动、气泡内容渲染
  - 复用组合函数：`usePopoverModel`、`useActionState`

### P2 · 中频

- **InputNumber 数字输入框**
  - 内联逻辑：步进按钮、长按连续步进、`min/max/step/precision` 钳制、精度修正、
    空值处理、直接键入的合法性过滤
  - 复用组合函数：`useFormField`
- **Cascader 级联选择**
  - 内联逻辑：多列面板状态、选中路径维护、任意级选择、回显路径反查、展开列联动
  - 复用组合函数：`useFloating`、`useListboxNavigation`
- **Tree 树形控件**
  - 内联逻辑：展开集合、勾选集合、半选向上向下传播、可见节点扁平化、节点缩进与连接线渲染
  - 复用组合函数：`useTreeModel`、`useRovingFocus`、`useTypeahead`
- **TreeSelect 树选择**
  - 内联逻辑：树选择器的标签回显、搜索词透传、下拉面板结构
  - 复用组合函数：`useTreeModel`、`useSelectModel`、`useFloating`、`useListboxNavigation`
- **AutoComplete 自动完成**
  - 内联逻辑：建议项高亮与自定义模板、触发时机控制
  - 复用组合函数：`useAsyncSuggest`、`useFloating`、`useListboxNavigation`
- **Breadcrumb 面包屑**：纯展示
- **Steps 步骤条**
  - 内联逻辑：当前步维护、`next/prev`、每步 `done/active/error` 状态推导、点击跳转
- **Progress 进度条**
  - 内联逻辑：百分比钳制、状态（正常/成功/异常/进行中）推导、线形/环形结构渲染、过渡动画值
- **Avatar 头像**
  - 内联逻辑：文本首字回退、图片加载失败回退、头像组叠放
  - 复用组合函数：`useImageState`
- **Badge 徽标**
  - 内联逻辑：计数上限（99+）处理、状态点与自定义角标展示（组件内纯函数）
- **Skeleton 骨架屏**：纯展示
- **Empty 空状态**：纯展示
- **Result 结果页**：纯展示
- **Collapse 折叠面板**
  - 内联逻辑：展开键集合、单开（手风琴）模式、内容高度自适应过渡
- **Descriptions 描述列表**：纯展示
- **Layout 布局**
  - 内联逻辑：侧栏折叠状态、布局区块编排
  - 复用组合函数：`useToggle`、`useMediaQuery`
- **Grid 栅格**
  - 内联逻辑：按断点的响应式列配置计算
  - 复用组合函数：`useMediaQuery`
- **Space 间距**：纯展示（间距由样式承担）

### P3 · 低频

- **Slider 滑块**
  - 内联逻辑：单点/区间值、轨道点击定位、单/双指针拖拽、键盘步进、刻度与禁用区间标记
  - 复用组合函数：`useDraggable`
- **Rate 评分**
  - 内联逻辑：星级值、悬停预览、半星选择、只读态、键盘调节
- **Transfer 穿梭框**
  - 内联逻辑：左右栏数据派生、勾选汇总、单向/批量搬移、两侧搜索过滤
- **Timeline 时间线**：纯展示
- **Carousel 走马灯**
  - 内联逻辑：当前索引、循环切换、自动播放启停、悬停暂停、指示器与箭头编排
  - 复用组合函数：`useIntervalFn`
- **Image 图片**
  - 内联逻辑：预览开合、缩放/旋转/翻转、拖拽平移、键盘与滚轮操作、占位与失败兜底
  - 复用组合函数：`useImageState`、`useIntersectionObserver`
- **Affix 固钉**
  - 内联逻辑：固定阈值判定、占位元素尺寸、固定坐标
  - 复用组合函数：`useScroll`
- **Anchor 锚点**
  - 内联逻辑：各 section 命中判定、active 更新、点击导航编排
  - 复用组合函数：`useScroll`、`useScrollIntoView`
- **BackTop 回到顶部**
  - 内联逻辑：可见阈值、回到顶部动作
  - 复用组合函数：`useScroll`
- **Statistic 统计数值**
  - 内联逻辑：数值滚动动画（缓动/时长/千分位）、倒计时格式化（天/时/分/秒）、到期回调
- **Typography 排版**
  - 内联逻辑：单行/多行文本溢出检测、中间截断（路径类）、文本编辑态的提交/取消、
    失焦与回车确认
  - 复用组合函数：`useClipboard`、`useResizeObserver`

### P4 · 特定场景

- **Calendar 日历**
  - 内联逻辑：多面板切换、范围/禁用/日程标记渲染、面板内选中交互
  - 复用组合函数：`useDateGrid`、`useDateModel`
- **ColorPicker 颜色选择器**
  - 内联逻辑：HSV/RGB/Hex/Alpha 互转、色相/明度面板取色、预设色、字符串合法性校验、
    透明度滑条
  - 复用组合函数：`useDraggable`、`useFloating`
- **CodeCard 代码卡片**
  - 内联逻辑：示例源码公共缩进清理、代码高亮 HTML 异步生成（未就绪时纯文本降级）
  - 复用组合函数：`useToggle`、`useClipboard`
- **QRCode 二维码**
  - 内联逻辑：文本 → 点阵矩阵生成（容错等级，组件内纯函数）与矩阵渲染
- **Watermark 水印**
  - 内联逻辑：文字/图像水印的 canvas 绘制、容器尺寸自适应、节点被删除或篡改时自动重建
    （直接使用原生 MutationObserver）
  - 复用组合函数：`useResizeObserver`
- **Tour 漫游引导**
  - 内联逻辑：步骤序列推进、目标元素位置矩形测量、高亮挖空遮罩、完成/跳过
  - 复用组合函数：`useScrollIntoView`、`useZIndex`
- **Mention 提及**
  - 内联逻辑：触发符（@）识别、激活区间维护、候选项定位与插入、键盘选择后的光标处理
  - 复用组合函数：`useAsyncSuggest`、`useFloating`
- **Segmented 分段控制器**
  - 内联逻辑：无（选项渲染与选中样式由模板/主题承担）
  - 复用组合函数：`useListboxNavigation`、`useControllableModel`
- **VirtualList 虚拟列表**
  - 内联逻辑：可视区间计算、总高度与偏移、buffer、固定/动态行高、滚动到指定索引
  - 复用组合函数：`useResizeObserver`
- **FloatButton 悬浮按钮**
  - 内联逻辑：动作组展开/收起的编排
  - 复用组合函数：`useToggle`、`useOpen`
