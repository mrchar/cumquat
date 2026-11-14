import { toValue } from 'vue';

import type { AsyncResult } from './status';

/** 归一处理器返回值：resolve 值导出错误（status 为 error 或携带 error）时返回失败信息，否则 null */
export function extractAsyncFailure(result: unknown): { error: unknown } | null {
  if (result !== null && typeof result === 'object') {
    const candidate = result as AsyncResult;
    const status = toValue(candidate.status);
    const error = toValue(candidate.error);
    if (status === 'error' || error != null) {
      return { error: error ?? result };
    }
  }
  return null;
}

/** 把异步错误归一为可展示文案：优先 message，其次 error 字符串 / Error.message，最后回退文案 */
export function asyncErrorText(error: unknown, fallback = '操作失败'): string {
  const resolved = toValue(error);
  if (resolved && typeof resolved === 'object') {
    const candidate = resolved as AsyncResult;
    const message = toValue(candidate.message);
    if (typeof message === 'string' && message) return message;
    const nested = toValue(candidate.error);
    if (nested != null) return asyncErrorText(nested, fallback);
  }
  if (typeof resolved === 'string' && resolved) return resolved;
  if (resolved instanceof Error && resolved.message) return resolved.message;
  return fallback;
}
