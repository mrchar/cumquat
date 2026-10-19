import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { useChat } from '../../index';
import type { ChatMessage } from '../../index';
import { flushTimers, withScope } from '../helpers';

const tick = () => flushTimers(0);

const msg = (id: string | number, content: string, extra: Partial<ChatMessage> = {}): ChatMessage => ({
  id,
  content,
  time: 1_700_000_000_000,
  ...extra,
});

describe('useChat：历史加载（fetch）', () => {
  it('初始加载最新一页并按 total 判定 hasMore', async () => {
    const fetch = vi.fn(async () => ({
      list: [msg(1, '早'), msg(2, '晚')],
      total: 5,
    }));
    const chat = withScope(() => useChat({ fetch }));
    expect(fetch).toHaveBeenCalledTimes(0);
    await tick();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith({ pagination: { currentPage: 1, pageSize: 20 } });
    expect(chat.messages.value.map((m) => m.id)).toEqual([1, 2]);
    expect(chat.hasMore.value).toBe(true);
  });

  it('loadOlder 递增页码、结果前插并按 id 去重', async () => {
    const fetch = vi
      .fn<() => Promise<{ list: ChatMessage[]; total: number }>>()
      .mockResolvedValueOnce({ list: [msg(2, '晚'), msg(3, '更晚')], total: 3 })
      .mockResolvedValueOnce({ list: [msg(1, '早'), msg(2, '晚')], total: 3 });
    const chat = withScope(() => useChat({ fetch }));
    await tick();
    await chat.loadOlder();
    expect(fetch).toHaveBeenLastCalledWith({ pagination: { currentPage: 2, pageSize: 20 } });
    expect(chat.messages.value.map((m) => m.id)).toEqual([1, 2, 3]);
    // 1 + 2 条历史 = total，取尽
    expect(chat.hasMore.value).toBe(false);
  });

  it('数组返回且凑满一页时 hasMore 为真', async () => {
    const fetch = vi.fn(async () => [msg(1, 'a'), msg(2, 'b')]);
    const chat = withScope(() => useChat({ fetch, pageSize: 2 }));
    await tick();
    expect(chat.hasMore.value).toBe(true);
  });

  it('历史加载失败回退页码并暴露错误，重试可恢复', async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('网络断了'))
      .mockResolvedValueOnce({ list: [msg(1, '早')], total: 1 });
    const chat = withScope(() => useChat({ fetch }));
    await tick();
    expect(chat.historyError.value).toBe('网络断了');
    await chat.loadOlder();
    expect(fetch).toHaveBeenLastCalledWith({ pagination: { currentPage: 1, pageSize: 20 } });
    expect(chat.historyError.value).toBeUndefined();
    expect(chat.messages.value).toHaveLength(1);
  });
});

describe('useChat：订阅推送（subscribe）', () => {
  it('推送追加新消息并按 id 去重', async () => {
    // 订阅源是响应式数组，模拟响应式 store 的持续推送
    const source = reactive<ChatMessage[]>([]);
    const chat = withScope(() =>
      useChat({
        subscribe: async () => ({ status: 'success', data: source }),
      }),
    );
    await tick();
    source.push(msg(10, '你好'));
    await tick();
    source.push(msg(10, '你好'), msg(11, '在吗'));
    await tick();
    expect(chat.messages.value.map((m) => m.id)).toEqual([10, 11]);
  });

  it('自己消息的回显替换同内容的本地已发送消息', async () => {
    const send = vi.fn(async () => undefined);
    const source = reactive<ChatMessage[]>([]);
    const chat = withScope(() =>
      useChat({ subscribe: async () => ({ status: 'success', data: source }), send }),
    );
    await tick();
    const sent = await chat.send('hello');
    expect(sent?.status).toBe('sent');
    expect(chat.messages.value).toHaveLength(1);
    const localId = chat.messages.value[0]!.id;
    // 服务端回显：self + 同内容 + 服务端 id
    source.push(msg('srv-1', 'hello', { self: true }));
    await tick();
    expect(chat.messages.value).toHaveLength(1);
    expect(chat.messages.value[0]!.id).toBe('srv-1');
    expect(localId).not.toBe('srv-1');
  });
});

describe('useChat：发送（send）', () => {
  it('乐观上屏：sending → sent，成功返回落位消息', async () => {
    const states: Array<string | undefined> = [];
    const send = vi.fn(async () => {
      states.push(chat.messages.value[chat.messages.value.length - 1]?.status);
    });
    const chat = withScope(() => useChat({ send }));
    const sent = await chat.send('  hi  ');
    expect(send).toHaveBeenCalledWith('hi');
    expect(states).toEqual(['sending']);
    expect(sent?.status).toBe('sent');
    expect(chat.messages.value[0]!.content).toBe('hi');
    expect(chat.messages.value[0]!.self).toBe(true);
    expect(chat.sending.value).toBe(false);
  });

  it('抛错保留 failed 气泡与错误文案，可重试', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('超时'))
      .mockResolvedValueOnce(undefined);
    const chat = withScope(() => useChat({ send }));
    const failed = await chat.send('hi');
    expect(failed).toBeUndefined();
    expect(chat.messages.value[0]!.status).toBe('failed');
    expect(chat.sendError.value).toBe('超时');
    const retried = await chat.retry(chat.messages.value[0]!);
    expect(retried?.status).toBe('sent');
    expect(send).toHaveBeenCalledTimes(2);
    expect(chat.messages.value).toHaveLength(1);
  });

  it('action 结果携带错误视为失败', async () => {
    const chat = withScope(() => useChat({ send: async () => ({ status: 'error', error: '被禁言' }) }));
    await chat.send('hi');
    expect(chat.messages.value[0]!.status).toBe('failed');
    expect(chat.sendError.value).toBe('被禁言');
  });

  it('空内容与空档期不发送', async () => {
    const send = vi.fn(async () => undefined);
    const chat = withScope(() => useChat({ send }));
    expect(await chat.send('   ')).toBeUndefined();
    chat.sending.value = true;
    expect(await chat.send('hi')).toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });

  it('重试仅对本地消息生效', async () => {
    const send = vi.fn(async () => undefined);
    const chat = withScope(() => useChat({ send }));
    expect(await chat.retry(msg(99, 'x'))).toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
