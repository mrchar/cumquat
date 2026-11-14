import Cumquat from '@cumquat/components';

export default Cumquat;
export * from '@cumquat/core';
export * from '@cumquat/composables';
export * from '@cumquat/components';

// 兼容层：旧命名的错误归一 helper
export {
  extractAsyncFailure as extractActionFailure,
  extractAsyncFailure as extractSubscribeFailure,
  asyncErrorText as actionErrorText,
  asyncErrorText as subscribeErrorText,
} from '@cumquat/core';

// 兼容层：保留原有命名空间用法
export * as composables from '@cumquat/composables';
export * as components from '@cumquat/components';
