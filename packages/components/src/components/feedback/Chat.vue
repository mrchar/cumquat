<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useChat } from '@cumquat/composables';
import type { ChatMessage, Fetch, SubscribeHandler } from '@cumquat/composables';
import Button from '../basic/Button.vue';
import Input from '../basic/Input.vue';

/**
 * 聊天框：消息流 + 底部固定输入区。
 *
 * 三大协议各司其职：fetch 加载历史消息（向上翻页，结果前插）、
 * subscribe 订阅最新消息（追加去重，自己消息回显自动收敛）、
 * action 发送消息（乐观上屏，失败保留气泡可重试）。
 */
const props = withDefaults(
  defineProps<{
    /** 历史消息加载：注入分页查询，currentPage 递增表示更早一页 */
    fetch?: Fetch<ChatMessage[]>;
    /** 新消息订阅：推送单条或数组，返回响应式数据时持续更新 */
    subscribe?: SubscribeHandler<ChatMessage[] | ChatMessage>;
    /** 发送动作：入参为消息内容，抛错或返回 error 结果即发送失败 */
    action?: (content: string) => Promise<unknown>;
    /** 历史分页每页条数 */
    pageSize?: number;
    /** 输入框占位文案 */
    placeholder?: string;
    /** 禁用整窗交互 */
    disabled?: boolean;
    /** 窗体高度 */
    height?: string;
    /** 顶部加载更早消息按钮文案 */
    olderText?: string;
  }>(),
  {
    fetch: undefined,
    subscribe: undefined,
    action: undefined,
    pageSize: 20,
    placeholder: '输入消息，回车发送',
    disabled: false,
    height: '22rem',
    olderText: '加载更早消息',
  },
);

const emit = defineEmits<{
  /** 消息发送成功，参数为落位的本地消息（回显后将被服务端消息收敛） */
  send: [message: ChatMessage];
  /** 发送失败，参数为错误文案 */
  error: [message: string];
}>();

const chat = useChat({
  fetch: props.fetch,
  subscribe: props.subscribe,
  send: props.action,
  pageSize: props.pageSize,
});
const { messages, sending, loadingOlder, hasMore, sendError, historyError } = chat;

const draft = ref('');
const bodyRef = ref<HTMLElement>();
const atBottom = ref(true);

async function doSend() {
  const text = draft.value;
  if (!text.trim() || props.disabled || sending.value) return;
  const sent = await chat.send(text);
  if (sent) {
    draft.value = '';
    emit('send', sent);
  } else if (sendError.value) {
    emit('error', sendError.value);
  }
}

function onScroll() {
  const el = bodyRef.value;
  if (!el) return;
  atBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  if (el.scrollTop <= 0 && hasMore.value && !loadingOlder.value) void loadOlder();
}

/** 向上加载更早消息，加载后保持视口停驻在原有消息处 */
async function loadOlder() {
  const el = bodyRef.value;
  const before = el ? { height: el.scrollHeight, top: el.scrollTop } : null;
  await chat.loadOlder();
  await nextTick();
  if (el && before) el.scrollTop = el.scrollHeight - before.height + before.top;
}

// 新消息追加时：贴近底部则跟随滚动，自己发送的消息强制回底
watch(
  () => messages.value.length,
  async () => {
    const last = messages.value[messages.value.length - 1];
    if (!last || (!atBottom.value && !last.self)) return;
    await nextTick();
    const el = bodyRef.value;
    if (el) el.scrollTop = el.scrollHeight;
  },
);

function formatTime(time?: number): string {
  if (!time) return '';
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

defineExpose({ chat });
</script>

<template>
  <div class="cumquat-chat" :class="disabled ? 'cumquat-chat--disabled' : ''" :style="{ height }">
    <div ref="bodyRef" class="cumquat-chat__body" @scroll="onScroll">
      <div class="cumquat-chat__older">
        <Button
          v-if="hasMore"
          size="sm"
          type="ghost"
          class="cumquat-chat__older-btn"
          :disabled="loadingOlder"
          :loading="loadingOlder"
          @click="loadOlder"
        >
          {{ loadingOlder ? '加载中…' : olderText }}
        </Button>
        <span v-else-if="messages.length" class="cumquat-chat__older-end">没有更早的消息了</span>
      </div>
      <div v-if="!messages.length && !loadingOlder" class="cumquat-chat__empty">暂无消息</div>
      <div
        v-for="message in messages"
        :key="message.id"
        class="cumquat-chat__row"
        :class="message.self ? 'cumquat-chat__row--self' : ''"
      >
        <slot name="message" :message="message" :retry="() => chat.retry(message)">
          <div
            class="cumquat-chat__bubble"
            :class="{
              'cumquat-chat__bubble--self': message.self,
              'cumquat-chat__bubble--sending': message.status === 'sending',
              'cumquat-chat__bubble--failed': message.status === 'failed',
            }"
          >
            <div v-if="message.sender || message.time" class="cumquat-chat__meta">
              <span v-if="message.sender" class="cumquat-chat__sender">{{ message.sender }}</span>
              <span v-if="message.time" class="cumquat-chat__time">{{
                formatTime(message.time)
              }}</span>
            </div>
            <p class="cumquat-chat__content">{{ message.content }}</p>
            <button
              v-if="message.status === 'failed'"
              type="button"
              class="cumquat-chat__retry"
              @click="chat.retry(message)"
            >
              发送失败，点击重试
            </button>
          </div>
        </slot>
      </div>
    </div>
    <div v-if="historyError" class="cumquat-chat__alert">
      <span>历史加载失败</span>
      <Button size="sm" type="ghost" class="cumquat-chat__alert-retry" @click="loadOlder">重试</Button>
    </div>
    <div v-if="sendError" class="cumquat-chat__alert">发送失败：{{ sendError }}</div>
    <form class="cumquat-chat__footer" @submit.prevent="doSend">
      <Input v-model="draft" :placeholder="placeholder" :disabled="disabled" />
      <Button type="primary" native-type="submit" :disabled="disabled || sending || !draft.trim()">
        发送
      </Button>
    </form>
  </div>
</template>
