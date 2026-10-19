import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { ActionResult, SubscribeHandler } from '../types';
import { actionErrorText, extractActionFailure } from '../behavior/useActionState';
import type { Fetch } from './fetch';
import { useSubscribe } from './useSubscribe';

/* ------------------------------------------------------------------ */
/* useChat：聊天消息模型                                                */
/* ------------------------------------------------------------------ */

/**
 * 聊天消息：id 是唯一锚点——历史与推送按 id 去重，
 * 本地乐观消息以 __local_ 前缀临时占位，被服务端回显替换。
 */
export interface ChatMessage {
  /** 消息唯一标识 */
  id: string | number;
  /** 发送者展示名 */
  sender?: string;
  /** 消息内容 */
  content: string;
  /** 发送时间戳（毫秒） */
  time?: number;
  /** 是否自己发送：决定气泡方向 */
  self?: boolean;
  /** 发送状态：本地消息的中间态，服务端消息可缺省 */
  status?: 'sending' | 'sent' | 'failed';
}

export interface UseChatOptions {
  /** 历史消息加载：注入分页查询，currentPage 递增表示更早一页；返回数组或 { list, total } */
  fetch?: Fetch<ChatMessage[]>;
  /** 新消息订阅：推送单条或数组；返回响应式数据时持续更新（经 useSubscribe 消费） */
  subscribe?: SubscribeHandler<ChatMessage[] | ChatMessage>;
  /** 发送动作：入参为消息内容，抛错或返回 error 结果即发送失败 */
  send?: (content: string) => Promise<ActionResult | void>;
  /** 历史分页每页条数，默认 20 */
  pageSize?: number;
}

export interface UseChatReturn {
  /** 展示消息列表（含本地乐观消息），新消息追加在末尾 */
  messages: Ref<ChatMessage[]>;
  /** 发送中 */
  sending: Ref<boolean>;
  /** 加载更早历史中 */
  loadingOlder: Ref<boolean>;
  /** 是否还有更早的历史 */
  hasMore: Ref<boolean>;
  /** 最近一次发送失败文案 */
  sendError: Ref<string | undefined>;
  /** 历史加载失败文案 */
  historyError: Ref<string | undefined>;
  /** 发送消息：乐观上屏，成功返回落位消息，失败返回 undefined（消息保留为 failed 可重试） */
  send: (content: string) => Promise<ChatMessage | undefined>;
  /** 重试失败消息：移除原消息并按原内容重新发送 */
  retry: (message: ChatMessage) => Promise<ChatMessage | undefined>;
  /** 加载更早一页历史：结果前插去重 */
  loadOlder: () => Promise<void>;
}

const LOCAL_PREFIX = '__local_';

/**
 * 聊天消息模型：fetch 管历史（向上翻页前插）、subscribe 管新消息（追加去重）、
 * send 管发送（乐观上屏 + 失败保留重试）。
 *
 * @internal 消费组件：Chat
 */
export function useChat(options: UseChatOptions): UseChatReturn {
  const pageSize = options.pageSize ?? 20;
  const messages = ref<ChatMessage[]>([]) as Ref<ChatMessage[]>;
  const sending = ref(false);
  const loadingOlder = ref(false);
  const hasMore = ref(false);
  const sendError = ref<string | undefined>(undefined);
  const historyError = ref<string | undefined>(undefined);

  let page = 0;
  let historyCount = 0;
  let seq = 0;

  const isLocal = (message: ChatMessage) => String(message.id).startsWith(LOCAL_PREFIX);

  /* 订阅推送：经 useSubscribe 消费，推送数据（单条或数组）追加进列表 */
  const subscription = useSubscribe<ChatMessage[] | ChatMessage>(options.subscribe);
  watch(
    subscription.data,
    (incoming) => {
      if (incoming !== undefined && incoming !== null) pushIncoming(incoming);
    },
    { deep: true },
  );

  function pushIncoming(incoming: ChatMessage[] | ChatMessage) {
    const list = Array.isArray(incoming) ? incoming : [incoming];
    for (const message of list) {
      if (!message || message.id === undefined || message.id === null) continue;
      // 自己消息的回显：以服务端消息替换同内容的本地已发送消息，收敛为服务端 id
      if (message.self) {
        const localIndex = messages.value.findIndex(
          (item) => isLocal(item) && item.status === 'sent' && item.content === message.content,
        );
        if (localIndex >= 0) {
          messages.value.splice(localIndex, 1, message);
          continue;
        }
      }
      // 与历史 / 已推送消息按 id 去重
      if (messages.value.some((item) => item.id === message.id)) continue;
      messages.value.push(message);
    }
  }

  function prepend(batch: ChatMessage[]) {
    const older = batch.filter(
      (message) => message && message.id !== undefined && message.id !== null && !messages.value.some((item) => item.id === message.id),
    );
    if (older.length) messages.value.unshift(...older);
  }

  async function loadOlder(): Promise<void> {
    if (!options.fetch || loadingOlder.value) return;
    loadingOlder.value = true;
    historyError.value = undefined;
    try {
      page += 1;
      const result = await options.fetch({ pagination: { currentPage: page, pageSize } });
      if (Array.isArray(result)) {
        prepend(result);
        historyCount += result.length;
        hasMore.value = result.length >= pageSize;
      } else if (result && Array.isArray((result as { list?: ChatMessage[] }).list)) {
        const { list, total } = result as { list: ChatMessage[]; total?: number };
        prepend(list);
        historyCount += list.length;
        hasMore.value = typeof total === 'number' ? historyCount < total : list.length >= pageSize;
      } else {
        hasMore.value = false;
      }
    } catch (err) {
      // 页码回退，下次重取同一页
      page -= 1;
      historyError.value = err instanceof Error ? err.message : String(err);
    } finally {
      loadingOlder.value = false;
    }
  }

  async function send(content: string): Promise<ChatMessage | undefined> {
    const text = content.trim();
    if (!text || !options.send || sending.value) return undefined;
    sendError.value = undefined;
    sending.value = true;
    messages.value.push({
      id: `${LOCAL_PREFIX}${++seq}`,
      content: text,
      self: true,
      time: Date.now(),
      status: 'sending',
    });
    // 取响应式代理，状态迁移需经代理触发
    const temp = messages.value[messages.value.length - 1];
    try {
      const result = await options.send(text);
      const failure = extractActionFailure(result);
      if (failure) {
        temp.status = 'failed';
        sendError.value = actionErrorText(failure.error, '发送失败');
        return undefined;
      }
      temp.status = 'sent';
      return temp;
    } catch (err) {
      temp.status = 'failed';
      sendError.value = actionErrorText(err, '发送失败');
      return undefined;
    } finally {
      sending.value = false;
    }
  }

  async function retry(message: ChatMessage): Promise<ChatMessage | undefined> {
    if (!options.send || !isLocal(message)) return undefined;
    const index = messages.value.findIndex((item) => item.id === message.id);
    if (index >= 0) messages.value.splice(index, 1);
    return send(message.content);
  }

  // 初始加载最新一页历史（延迟调用，与 fetch / subscribe 惯例一致，兼容 effectScope 测试）
  if (options.fetch) queueMicrotask(() => void loadOlder());

  return { messages, sending, loadingOlder, hasMore, sendError, historyError, send, retry, loadOlder };
}
