import { ref } from 'vue';
import type { Ref } from 'vue';
import { isClient } from '../internal/dom';
import { useTimeoutFn } from './useTimeoutFn';

export interface UseClipboardOptions {
  /** 复制成功后 copied 状态保持时长，默认 1500ms */
  copiedDuration?: number;
  /** 是否在非安全上下文降级使用 execCommand，默认 true */
  legacy?: boolean;
}

export interface UseClipboardReturn {
  copied: Ref<boolean>;
  error: Ref<unknown>;
  copy: (text: string) => Promise<boolean>;
}

/**
 * 复制文本到剪贴板，自动派生短暂的成功反馈；
 * 不支持 Clipboard API 时降级为隐藏 textarea + execCommand。
 *
 * @internal 消费组件：Typography；宿主可独立使用
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { copiedDuration = 1500, legacy = true } = options;
  const copied = ref(false);
  const error = ref<unknown>(null);
  const timer = useTimeoutFn(() => {
    copied.value = false;
  });

  const legacyCopy = (text: string): boolean => {
    if (!isClient) return false;
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy');
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const copy = async (text: string): Promise<boolean> => {
    error.value = null;
    let succeeded = false;
    try {
      if (isClient && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          succeeded = true;
        } catch (apiErr) {
          // 权限拒绝 / 非安全上下文：尝试 execCommand 降级
          if (legacy && legacyCopy(text)) {
            succeeded = true;
          } else {
            throw apiErr;
          }
        }
      } else if (legacy) {
        if (!legacyCopy(text)) throw new Error('clipboard unavailable');
        succeeded = true;
      } else {
        throw new Error('clipboard unavailable');
      }
    } catch (err) {
      error.value = err;
      copied.value = false;
      return false;
    }
    if (succeeded) {
      copied.value = true;
      timer.start(copiedDuration);
    }
    return succeeded;
  };

  return { copied, error, copy };
}
