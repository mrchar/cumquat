import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { asyncErrorText, extractAsyncFailure } from '../result';

describe('extractAsyncFailure', () => {
  it('status 为 error 时导出错误，缺省用原结果', () => {
    const result = { status: 'error' as const };
    expect(extractAsyncFailure(result)).toEqual({ error: result });
  });

  it('携带 error 时导出 error', () => {
    const error = new Error('boom');
    expect(extractAsyncFailure({ error })).toEqual({ error });
  });

  it('成功结果与空值返回 null', () => {
    expect(extractAsyncFailure({ status: 'success', data: 1 })).toBeNull();
    expect(extractAsyncFailure(undefined)).toBeNull();
    expect(extractAsyncFailure(null)).toBeNull();
  });

  it('status 与 error 为 ref 或 getter 时同样解包判定', () => {
    const result = { status: ref('error' as const) };
    expect(extractAsyncFailure(result)).toEqual({ error: result });

    const error = new Error('boom');
    expect(extractAsyncFailure({ status: () => 'error' as const, error: () => error })).toEqual({
      error,
    });
  });
});

describe('asyncErrorText', () => {
  it('优先取 message', () => {
    expect(asyncErrorText({ message: '自定义文案', error: new Error('ignored') })).toBe(
      '自定义文案',
    );
  });

  it('递归读取嵌套 error', () => {
    expect(asyncErrorText({ error: '网络异常' })).toBe('网络异常');
  });

  it('支持字符串与 Error', () => {
    expect(asyncErrorText('失败')).toBe('失败');
    expect(asyncErrorText(new Error('失败'))).toBe('失败');
  });

  it('无法识别时使用回退文案', () => {
    expect(asyncErrorText(42)).toBe('操作失败');
    expect(asyncErrorText(undefined, '发送失败')).toBe('发送失败');
  });

  it('message / error 为 ref 或 getter 时同样解包', () => {
    expect(asyncErrorText(ref({ message: ref('引用文案') }))).toBe('引用文案');
    expect(asyncErrorText({ message: () => 'getter 文案' })).toBe('getter 文案');
    expect(asyncErrorText({ error: () => '嵌套异常' })).toBe('嵌套异常');
  });
});
