/**
 * @cumquat/composables
 * Headless 组合函数库：只负责状态机、行为与派生数据，不输出任何 DOM 结构。
 * 仅依赖 vue 运行时，无 CSS、无组件、无浏览器强依赖。
 */

// 公共类型契约
export type {
  AsyncStateLike,
  ActionLike,
  ControlledProps,
  AsyncFn,
  Placement,
  Strategy,
} from './types';

// L0 工具原语
export { useId } from './core/useId';
export { useControllableModel, createControllableModel } from './core/useControllableModel';
export type {
  ControllableModelOptions,
  ControllableModelReturn,
} from './core/useControllableModel';
export { useToggle } from './core/useToggle';
export type { ToggleReturn } from './core/useToggle';
export { useEventListener } from './core/useEventListener';
export { useResizeObserver } from './core/useResizeObserver';
export type { ElementSize, UseResizeObserverReturn } from './core/useResizeObserver';
export { useIntersectionObserver } from './core/useIntersectionObserver';
export type {
  UseIntersectionObserverOptions,
  UseIntersectionObserverReturn,
} from './core/useIntersectionObserver';
export { useTimeoutFn } from './core/useTimeoutFn';
export type { UseTimeoutFnReturn } from './core/useTimeoutFn';
export { useIntervalFn } from './core/useIntervalFn';
export type { UseIntervalFnOptions, UseIntervalFnReturn } from './core/useIntervalFn';
export { useMediaQuery } from './core/useMediaQuery';
export { useScroll } from './core/useScroll';
export type { ScrollDirection, ScrollPosition, UseScrollOptions } from './core/useScroll';
export { useScrollLock } from './core/useScrollLock';
export type { ScrollLockReturn } from './core/useScrollLock';
export { useScrollIntoView } from './core/useScrollIntoView';
export type { ScrollIntoViewOptions } from './core/useScrollIntoView';
export { useClickOutside } from './core/useClickOutside';
export type { UseClickOutsideOptions } from './core/useClickOutside';
export { useFocusTrap } from './core/useFocusTrap';
export type { UseFocusTrapOptions, UseFocusTrapReturn } from './core/useFocusTrap';
export { useFocusReturn } from './core/useFocusReturn';
export type { FocusReturnOptions, FocusReturnReturn } from './core/useFocusReturn';
export { useRovingFocus } from './core/useRovingFocus';
export type { RovingFocusOptions, RovingFocusReturn } from './core/useRovingFocus';
export { useTypeahead } from './core/useTypeahead';
export type { TypeaheadOptions, TypeaheadReturn } from './core/useTypeahead';
export { useDraggable } from './core/useDraggable';
export type {
  DraggablePosition,
  UseDraggableOptions,
  UseDraggableReturn,
} from './core/useDraggable';
export { useClipboard } from './core/useClipboard';
export type { UseClipboardOptions, UseClipboardReturn } from './core/useClipboard';
export { useTransitionVisible } from './core/useTransitionVisible';
export type { TransitionVisibleReturn } from './core/useTransitionVisible';
export { useZIndex, resetGlobalZIndex } from './core/useZIndex';
export type { ZIndexReturn } from './core/useZIndex';

// L1 行为原语
export { useOpen } from './behavior/useOpen';
export type { UseOpenOptions, UseOpenReturn } from './behavior/useOpen';
export { useDismiss } from './behavior/useDismiss';
export type { DismissReason, UseDismissOptions } from './behavior/useDismiss';
export { useFloating } from './behavior/useFloating';
export type { UseFloatingOptions, UseFloatingReturn } from './behavior/useFloating';
export { useHoverIntent } from './behavior/useHoverIntent';
export type { HoverIntentOptions, HoverIntentReturn } from './behavior/useHoverIntent';
export { useListboxNavigation } from './behavior/useListboxNavigation';
export type {
  ListboxNavigationOptions,
  ListboxNavigationReturn,
} from './behavior/useListboxNavigation';
export { useAsyncState } from './behavior/useAsyncState';
export type { UseAsyncStateOptions, UseAsyncStateReturn } from './behavior/useAsyncState';
export { useActionState } from './behavior/useActionState';
export type { UseActionStateOptions, UseActionStateReturn } from './behavior/useActionState';
export { useToastQueue } from './behavior/useToastQueue';
export type {
  PushToastOptions,
  ToastItem,
  ToastType,
  UseToastQueueOptions,
  UseToastQueueReturn,
} from './behavior/useToastQueue';
export { useOverlayContainer } from './behavior/useOverlayContainer';
export type { OverlayContainerOptions } from './behavior/useOverlayContainer';
export {
  provideForm,
  injectForm,
  provideFormField,
  injectFormField,
} from './behavior/useFormContext';
export type { FormContext, FormFieldContext, FormFieldController } from './behavior/useFormContext';

// L2 表单与输入
export { useForm } from './form/useForm';
export type { UseFormOptions, UseFormReturn } from './form/useForm';
export { useFormField } from './form/useFormField';
export type { UseFormFieldOptions, UseFormFieldReturn } from './form/useFormField';
export { useCheckableGroup } from './form/useCheckableGroup';
export type { CheckableGroupOptions, CheckableGroupReturn } from './form/useCheckableGroup';
export { useSelectModel } from './form/useSelectModel';
export type {
  SelectOption,
  UseSelectModelOptions,
  UseSelectModelReturn,
} from './form/useSelectModel';
export { useTreeModel } from './form/useTreeModel';
export type {
  TreeFieldNames,
  TreeFlatNode,
  UseTreeModelOptions,
  UseTreeModelReturn,
} from './form/useTreeModel';
export { useAsyncSuggest } from './form/useAsyncSuggest';
export type {
  SuggestStatus,
  UseAsyncSuggestOptions,
  UseAsyncSuggestReturn,
} from './form/useAsyncSuggest';
export { useDateGrid } from './form/useDateGrid';
export type {
  DateCell,
  DatePanelType,
  LabeledCell,
  MarkedDateCell,
  UseDateGridOptions,
  UseDateGridReturn,
} from './form/useDateGrid';
export { useDateModel } from './form/useDateModel';
export type {
  DateGranularity,
  DateShortcut,
  UseDateModelOptions,
  UseDateModelReturn,
} from './form/useDateModel';
export { useTimeModel } from './form/useTimeModel';
export type { TimeColumnItem, UseTimeModelOptions, UseTimeModelReturn } from './form/useTimeModel';
export type { FieldRuleConfig, FormRule, FormRules } from './form/form-types';

// L2 浮层与反馈
export { useModal } from './overlay/useModal';
export type { UseModalOptions, UseModalReturn } from './overlay/useModal';
export { usePopoverModel } from './overlay/usePopoverModel';
export type {
  PopoverTrigger,
  PopoverTriggerProps,
  UsePopoverModelOptions,
  UsePopoverModelReturn,
} from './overlay/usePopoverModel';
export { createMessage, message } from './overlay/createMessage';
export type { MessageApi, MessageOptions } from './overlay/createMessage';
export { createNotification, notification } from './overlay/createNotification';
export type {
  NotificationApi,
  NotificationEntry,
  NotificationMeta,
} from './overlay/createNotification';
export { useLoadingService, createLoadingService } from './overlay/useLoadingService';
export type { LoadingService } from './overlay/useLoadingService';

// L2 数据展示
export { usePagination } from './data/usePagination';
export type {
  PaginationPageItem,
  UsePaginationOptions,
  UsePaginationReturn,
} from './data/usePagination';
export {
  useFetch,
  useFetchResource,
  createFetchController,
  normalizeFetchResult,
  isPagedResult,
  isUseFetchReturn,
  FETCH_RESOURCE,
} from './data/fetch';
export type {
  Fetch,
  FetchLike,
  FetchPagination,
  FetchQuery,
  FetchSorter,
  FetchResult,
  PagedResult,
  NormalizedFetch,
  FetchController,
  UseFetchReturn,
  UseFetchResourceOptions,
  FetchResource,
} from './data/fetch';

// L2 媒体
export { useImageState } from './media/useImageState';
export type {
  ImageLoadStatus,
  UseImageStateOptions,
  UseImageStateReturn,
} from './media/useImageState';
