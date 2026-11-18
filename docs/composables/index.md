---
title: 组合函数总览
---

# 组合函数

组合函数是 Cumquat 的 Headless 逻辑层：只负责状态机、行为与派生数据，不输出任何 DOM、类名与样式。组件就是「组合函数 + 语义 class」的渲染壳；宿主也可以脱离组件独立使用这些函数。

## 导入

组合函数与组件、类型统一从主包 `@mrchar/cumquat` 扁平导出：

```ts
import { usePagination, type FetchHandler } from '@mrchar/cumquat';

// 手写一个 FetchHandler 资源工厂，即可直接绑定组件 fetch 属性：
// 工厂创建自带 status/data/execute/abort 的资源对象，取消逻辑由你决定
const fetchUsers: FetchHandler<UserRow> = () => createUserResource();
```

仅依赖 Vue 运行时，无 CSS、无浏览器强依赖，支持 tree-shaking。

## 分层

```
L2  领域模型   useForm / useResources / useDateGrid / useModal / usePagination ...
L1  行为原语   useFloating / useDismiss / useAsyncState / useActionState ...
L0  工具原语   useEventListener / useControllableModel / useId ...
```

上层可依赖下层，下层禁止反向依赖。

## 通用约定

- **受控 / 非受控统一**：对外暴露的值都支持 `modelValue + update:modelValue` 受控写法，不传则内部自持；`v-model` 永远是纯同步的
- **SSR 安全**：`window / document / navigator` 访问全部惰性化，置于生命周期钩子内
- **清理自动**：事件监听、定时器、观察器随组件卸载自动释放
- **完整类型**：全部 TypeScript，公共契约见[类型参考](/types/quickstart)

## 目录

### 数据

- [数据请求](/composables/fetch)：FetchHandler 资源工厂（FetchResult：execute / abort）/ useFetchResource
- [数据订阅](/composables/subscribe)：手写 SubscribeHandler / useSubscribeResource / useAsyncState
- [资源池 useResources](/composables/resources)：useResources / parseOpenApi / createFetchAdapter / ResourceHttpError
- [视图转换器](/composables/schema-view)：createView / defaultView / componentOf / helpOf / optionsOf
- [分页 usePagination](/composables/pagination)
- [聊天消息 useChat](/composables/chat)：useChat
- [数据遮罩 useMask](/composables/mask)：useMask

### 表单

- [表单模型](/composables/form)：useForm / useFormField / useCheckableGroup / useSelectModel / useTreeModel / useAsyncSuggest
- [数据校验](/composables/validation)：createValidator / useValidator
- [日期时间模型](/composables/date)：useDateGrid / useDateModel / useTimeModel

### 反馈与浮层

- [消息服务](/composables/message)：createMessage / message / createNotification / notification / useLoadingService / useToastQueue
- [消息盒子](/composables/notification-center)：useNotificationCenter（异步推送、未读计数、已读/删除）
- [浮层模型](/composables/overlay)：useModal / usePopoverModel / useFloating / useOpen / useDismiss / useHoverIntent
- [聊天输入 useChatInput](/composables/chat-input)

### 基础

- [受控与动作](/composables/control)：useControllableModel / useToggle / useActionState / useActionValue / useId
- [DOM 与浏览器](/composables/dom)：事件、观察器、滚动、媒体查询、定时器、剪贴板、拖拽
- [焦点与键盘](/composables/focus)：useFocusTrap / useFocusReturn / useRovingFocus / useTypeahead / useListboxNavigation
- [语音音量 useVoiceLevel](/composables/voice)：useVoiceLevel / useVoiceButton
- [协议辅助函数](/composables/internals)：normalizeFetchResult / isPagedResult / extractAsyncFailure / asyncErrorText
