---
title: 类型参考 · 类型总览
---

# 类型总览

契约按“公共类型 → 数据模型 → 视图实现”单向依赖组织，下层不认识上层：

| 层次 | 页面 | 解决的问题 |
| --- | --- | --- |
| 基础层 | [核心类型](/types/basics/core) | `@cumquat/core` 的运行时契约：统一状态、三种处理函数与受控基础 |
| 基础层 | [公共组合类型](/types/basics/common) | 组合函数层的异步快照、数据组合函数返回与命令式反馈服务 |
| 基础层 | [浮层与视图基础](/types/basics/overlay) | 浮层方位、定位参数、挂载目标与应用级全局配置 |
| 模型层 | [数据模型与表单](/types/model/form) | Schema 三层定义、自定义规则、校验结果、文案与表单上下文 |
| 模型层 | [资源池类型](/types/model/resources) | 协议归一、元数据解析、资源表、客户端与请求适配 |
| 模型层 | [视图投影与竞选](/types/model/rendering) | Schema 到字段视图的投影契约，以及 Cell / Field 渲染器竞选 |
| 视图层 | [导航组件](/types/view/navigation) · [数据展示组件](/types/view/data-display) · [数据输入组件](/types/view/data-entry) | 按组件分类罗列各组件 props / 事件携带的数据形状 |
| 视图层 | [反馈组件](/types/view/feedback) · [场景组件](/types/view/scenarios) · [其他组件](/types/view/other) | 同上，覆盖反馈、场景与未归类组件 |

## 两条主线

- **状态自持主线**：`Status` / `AsyncResult`（[核心类型](/types/basics/core)）→ `Snapshot`（[公共组合类型](/types/basics/common)）→ 各组件内部的同形状态；fetch 由宿主手写为 `FetchHandler` 资源工厂（产出带 `execute / abort` 的 `FetchResult` 对象），subscribe 由宿主手写为 `SubscribeHandler`，不另造返回类型。
- **元数据导出主线**：`Schema` / `Rule`（[数据模型与表单](/types/model/form)）→ `View` / `Converter` / `CellRenderer`（[视图投影与竞选](/types/model/rendering)）→ 组件上的 `columns` / `properties` 等具体类型（视图层各页）。

资源池（[资源池类型](/types/model/resources)）是两条主线的交汇点：一份资源定义同时导出请求方法与视图元数据。

## 阅读顺序

- 第一次接触：先读[快速开始](/types/quickstart)与[设计理念](/types/philosophy)，再回到本页按表格顺序向下。
- 查具体类型：直接在下方“类型索引”按名称定位，每个名字都带锚点直达定义。
- 查组件入参：组件文档中的类型引用均链接到本章节对应锚点，可反向跳转。

## 类型索引

### 基础层

**[核心类型](/types/basics/core)**：[`Status`](/types/basics/core#status)、[`AsyncResult`](/types/basics/core#asyncresult)、[`FetchHandler`](/types/basics/core#fetchhandler)、[`FetchQuery`](/types/basics/core#fetchquery)、[`FetchQueryPagination`](/types/basics/core#fetchquerypagination)、[`FetchSorter`](/types/basics/core#fetchsorter)、[`FetchResult`](/types/basics/core#fetchresult)、[`FetchData`](/types/basics/core#fetchdata)、[`FetchResponsePagination`](/types/basics/core#fetchresponsepagination)、[`PagedResult`](/types/basics/core#pagedresult)、[`ActionHandler`](/types/basics/core#actionhandler)、[`ActionResult`](/types/basics/core#actionresult)、[`SubscribeHandler`](/types/basics/core#subscribehandler)、[`SubscribeResult`](/types/basics/core#subscriberesult)。

**[公共组合类型](/types/basics/common)**：[`ControlledProps`](/types/basics/common#controlledprops)、[`Snapshot`](/types/basics/common#snapshot)、[`MessageApi`](/types/basics/common#messageapi)、[`NotificationApi`](/types/basics/common#notificationapi)。

**[浮层与视图基础](/types/basics/overlay)**：[`Placement`](/types/basics/overlay#placement)、[`Strategy`](/types/basics/overlay#strategy)、[`MountTarget`](/types/basics/overlay#mounttarget)、[`UseFloatingOptions`](/types/basics/overlay#usefloatingoptions)、[`CumquatConfig`](/types/basics/overlay#cumquatconfig)。

### 模型层

**[数据模型与表单](/types/model/form)**：[`Kind`](/types/model/form#kind)、[`Meta`](/types/model/form#layers)、[`Type`](/types/model/form#layers)、[`Constraint`](/types/model/form#layers)、[`Schema`](/types/model/form#schema)、[`Model`](/types/model/form#schema)、[`Rule`](/types/model/form#rule)、[`CheckRule`](/types/model/form#checkrule)、[`Rules`](/types/model/form#rules)、[`ValidationResult`](/types/model/form#validationresult)、[`Validator`](/types/model/form#validator)、[`RuleKind`](/types/model/form#rulekind)、[`MessageContext`](/types/model/form#messagecontext)、[`MessageTemplate`](/types/model/form#messagetemplate)、[`MessageTemplates`](/types/model/form#messagetemplates)、[`Validation`](/types/model/form#validation)、[`FormRule`](/types/model/form#formrule)、[`FormRules`](/types/model/form#formrules)、[`FormContext`](/types/model/form#formcontext)、[`FormFieldContext`](/types/model/form#formfieldcontext)、[`FormFieldController`](/types/model/form#formfieldcontroller)。

**[资源池类型](/types/model/resources)**：[`ResourceMethod`](/types/model/resources#resourcemethod)、[`ResourceOperation`](/types/model/resources#resourceoperation)、[`QueryNames`](/types/model/resources#querynames)、[`ListResponseMapping`](/types/model/resources#listresponsemapping)、[`Option`](/types/model/resources#option)、[`ResourceColumn`](/types/model/resources#resourcecolumn)、[`Resource`](/types/model/resources#resource)、[`Registry`](/types/model/resources#registry)、[`MetadataParser`](/types/model/resources#metadataparser)、[`ResourceRequest`](/types/model/resources#resourcerequest)、[`RequestAdapter`](/types/model/resources#requestadapter)、[`UseResourcesOptions`](/types/model/resources#useresourcesoptions)、[`ResourceClient`](/types/model/resources#resourceclient)、[`ResourcePool`](/types/model/resources#resourcepool)。

**[视图投影与竞选](/types/model/rendering)**：[`Hint`](/types/model/rendering#hint)、[`Scope`](/types/model/rendering#hint)、[`View`](/types/model/rendering#view)、[`Context`](/types/model/rendering#converter)、[`Converter`](/types/model/rendering#converter)、[`CellColumn`](/types/model/rendering#cellcolumn)、[`CellRenderer`](/types/model/rendering#cellrenderer)、[`FieldContext`](/types/model/rendering#fieldcontext)、[`FieldRenderer`](/types/model/rendering#fieldrenderer)。

### 视图层

**[导航组件](/types/view/navigation)**：[`AnchorItem`](/types/view/navigation#anchoritem)、[`BreadcrumbItem`](/types/view/navigation#breadcrumbitem)、[`DropdownItem`](/types/view/navigation#dropdownitem)、[`MenuItem`](/types/view/navigation#menuitem)、[`StepItem`](/types/view/navigation#stepitem)、[`TabItem`](/types/view/navigation#tabitem)、[`PopoverTrigger`](/types/view/navigation#popovertrigger)、[`PaginationPageItem`](/types/view/navigation#paginationpageitem)。

**[数据展示组件](/types/view/data-display)**：[`CalendarEvent`](/types/view/data-display#calendarevent)、[`CollapseItem`](/types/view/data-display#collapseitem)、[`DescriptionProperty`](/types/view/data-display#descriptionproperty)、[`StatisticValue`](/types/view/data-display#statisticvalue)、[`TableColumn`](/types/view/data-display#tablecolumn)、[`TableAction`](/types/view/data-display#tableaction)、[`TimelineItem`](/types/view/data-display#timelineitem)。

**[数据输入组件](/types/view/data-entry)**：[`CascaderOption`](/types/view/data-entry#cascaderoption)、[`SegmentedOption`](/types/view/data-entry#segmentedoption)、[`SelectOption`](/types/view/data-entry#selectoption)、[`SliderMark`](/types/view/data-entry#slidermark)、[`TransferItem`](/types/view/data-entry#transferitem)、[`TreeNode`](/types/view/data-entry#treenode)、[`TreeSelectNode`](/types/view/data-entry#treeselectnode)、[`UploadFile`](/types/view/data-entry#uploadfile)。

**[反馈组件](/types/view/feedback)**：[`DialogAction`](/types/view/feedback#dialogaction)、[`TourStep`](/types/view/feedback#tourstep)。

**[场景组件](/types/view/scenarios)**：[`ChatMessage`](/types/view/scenarios#chatmessage)、[`ChatInputAttachment`](/types/view/scenarios#chatinputattachment)、[`ChatInputPayload`](/types/view/scenarios#chatinputpayload)、[`ChatInputMode`](/types/view/scenarios#chatinputmode)、[`VoiceRecognizer`](/types/view/scenarios#voicerecognizer)、[`VoiceGesture`](/types/view/scenarios#voicegesture)、[`VoiceButtonAction`](/types/view/scenarios#voicebuttonaction)、[`VoiceReleasePayload`](/types/view/scenarios#voicereleasepayload)。

**[其他组件](/types/view/other)**：[`FloatAction`](/types/view/other#floataction)。
