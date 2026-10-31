import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import { useChatInput } from '../../index';
import type { ChatInputAttachment, VoiceRecognizer } from '../../index';
import { withScope } from '../helpers';

/**
 * 语音识别器以桩件模拟：转录与音量由测试手动写入，
 * 启停调用记录在 calls 中供会话语义断言。
 */
function createRecognizer() {
  const transcript = ref('');
  const level = ref(0);
  const calls = { start: 0, stop: 0, reset: 0 };
  const recognizer: VoiceRecognizer = {
    transcript,
    level,
    reset: () => {
      calls.reset += 1;
      transcript.value = '';
    },
    start: async () => {
      calls.start += 1;
    },
    stop: async () => {
      calls.stop += 1;
    },
  };
  return { recognizer, transcript, level, calls };
}

/** 连续冲刷微任务队列（action 链路解析） */
const flushMicrotasks = async () => {
  for (let i = 0; i < 6; i += 1) await Promise.resolve();
};

const makeFile = (name: string, type: string) => new File(['x'], name, { type });

describe('useChatInput', () => {
  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      value: vi.fn(() => 'blob:preview'),
      configurable: true,
    });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true });
  });

  afterEach(() => {
    Reflect.deleteProperty(URL, 'createObjectURL');
    Reflect.deleteProperty(URL, 'revokeObjectURL');
    vi.useRealTimers();
  });

  it('非受控时文本内部自持并回发 update', () => {
    const updates: string[] = [];
    const ctx = withScope(() => useChatInput({ emitUpdate: (v) => updates.push(v) }));
    ctx.draft.value = '你好';
    expect(ctx.draft.value).toBe('你好');
    expect(updates).toEqual(['你好']);
  });

  it('受控时读写穿透外部状态', () => {
    const outer = ref('');
    const updates: string[] = [];
    const ctx = withScope(() =>
      useChatInput({
        modelValue: () => outer.value,
        emitUpdate: (v) => {
          outer.value = v;
          updates.push(v);
        },
      }),
    );
    expect(ctx.draft.value).toBe('');
    ctx.draft.value = '写入';
    expect(outer.value).toBe('写入');
    outer.value = '外部';
    expect(ctx.draft.value).toBe('外部');
    expect(updates).toEqual(['写入']);
  });

  it('pickFiles 生成附件：图片带缩略图，移除时回收预览地址', () => {
    const emitted: ChatInputAttachment[][] = [];
    const ctx = withScope(() => useChatInput({ emitAttachments: (v) => emitted.push(v) }));
    ctx.pickFiles([makeFile('a.png', 'image/png'), makeFile('b.txt', 'text/plain')]);
    expect(ctx.attachments.value).toHaveLength(2);
    expect(ctx.attachments.value[0]?.previewUrl).toBe('blob:preview');
    expect(ctx.attachments.value[1]?.previewUrl).toBeUndefined();
    expect(emitted).toHaveLength(1);
    ctx.removeAttachment(ctx.attachments.value[0]!.id);
    expect(ctx.attachments.value).toHaveLength(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('长按输入框进入录音：识别器重置并启动，松手后转录写入输入框且不发送', async () => {
    vi.useFakeTimers();
    const { recognizer, transcript, calls } = createRecognizer();
    const sends: unknown[] = [];
    const ctx = withScope(() =>
      useChatInput({ voice: () => recognizer, emitSend: (p) => sends.push(p) }),
    );
    ctx.onFieldPointerDown({ clientX: 100, clientY: 100 });
    vi.advanceTimersByTime(300);
    expect(ctx.recording.value).toBe(true);
    expect(calls.reset).toBe(1);
    expect(calls.start).toBe(1);
    transcript.value = '语音转出的文字';
    await ctx.onFieldPointerUp();
    expect(ctx.recording.value).toBe(false);
    expect(ctx.draft.value).toBe('语音转出的文字');
    expect(sends).toHaveLength(0);
  });

  it('长按时已有文本的追加以空格连接', async () => {
    vi.useFakeTimers();
    const { recognizer, transcript } = createRecognizer();
    const ctx = withScope(() => useChatInput({ voice: () => recognizer }));
    ctx.draft.value = '已有';
    ctx.onFieldPointerDown({ clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(300);
    transcript.value = '追加';
    await ctx.onFieldPointerUp();
    expect(ctx.draft.value).toBe('已有 追加');
  });

  it('长按期间上滑取消：转录丢弃', async () => {
    vi.useFakeTimers();
    const { recognizer, transcript, calls } = createRecognizer();
    const ctx = withScope(() => useChatInput({ voice: () => recognizer }));
    ctx.onFieldPointerDown({ clientX: 100, clientY: 100 });
    vi.advanceTimersByTime(300);
    transcript.value = '不该写入';
    ctx.onFieldPointerMove({ clientX: 100, clientY: 40 });
    expect(ctx.sessionGesture.value).toBe('cancel');
    await ctx.onFieldPointerUp();
    expect(ctx.draft.value).toBe('');
    expect(calls.stop).toBe(1);
  });

  it('阈值内松手视为轻点，不进入录音', () => {
    vi.useFakeTimers();
    const { recognizer, calls } = createRecognizer();
    const ctx = withScope(() => useChatInput({ voice: () => recognizer }));
    ctx.onFieldPointerDown({ clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(100);
    void ctx.onFieldPointerUp();
    expect(ctx.recording.value).toBe(false);
    expect(calls.start).toBe(0);
  });

  it('输入框左滑越过阈值切换纯语音模式', () => {
    const ctx = withScope(() => useChatInput());
    ctx.onFieldPointerDown({ clientX: 100, clientY: 100 });
    ctx.onFieldPointerMove({ clientX: 40, clientY: 100 });
    expect(ctx.mode.value).toBe('voice');
    void ctx.onFieldPointerUp();
    expect(ctx.mode.value).toBe('voice');
  });

  it('语音键松手确认：转录并入草稿立即发送，成功后清空并回发载荷', async () => {
    const { recognizer, transcript } = createRecognizer();
    const action = vi.fn(async () => undefined);
    const sends: unknown[] = [];
    const ctx = withScope(() =>
      useChatInput({
        voice: () => recognizer,
        action,
        emitSend: (p) => sends.push(p),
      }),
    );
    ctx.pickFiles([makeFile('a.png', 'image/png')]);
    // 发送会清空附件，先快照发送时刻的附件列表用于断言载荷
    const attachmentsSnapshot = [...ctx.attachments.value];
    await ctx.startVoiceSession();
    transcript.value = '发送这段话';
    await ctx.handleVoiceRelease({ result: 'confirm' });
    expect(action).toHaveBeenCalledWith({
      text: '发送这段话',
      attachments: attachmentsSnapshot,
    });
    expect(sends).toHaveLength(1);
    expect(ctx.draft.value).toBe('');
    expect(ctx.attachments.value).toHaveLength(0);
  });

  it('语音键上滑取消：不发送且转录丢弃', async () => {
    const { recognizer, transcript, calls } = createRecognizer();
    const action = vi.fn(async () => undefined);
    const ctx = withScope(() => useChatInput({ voice: () => recognizer, action }));
    await ctx.startVoiceSession();
    transcript.value = '取消的话';
    await ctx.handleVoiceRelease({ result: 'cancel' });
    expect(ctx.draft.value).toBe('');
    expect(action).not.toHaveBeenCalled();
    expect(calls.stop).toBe(1);
  });

  it('语音发送失败：错误文案归一，转录保留在输入框可重试', async () => {
    const { recognizer, transcript } = createRecognizer();
    const action = vi.fn(async () => {
      throw new Error('网络异常');
    });
    const ctx = withScope(() => useChatInput({ voice: () => recognizer, action }));
    await ctx.startVoiceSession();
    transcript.value = '失败的话';
    await ctx.handleVoiceRelease({ result: 'confirm' });
    await flushMicrotasks();
    expect(ctx.sendError.value).toBe('网络异常');
    expect(ctx.draft.value).toBe('失败的话');
  });

  it('全宽语音键右滑恢复文本模式，转录丢弃', async () => {
    const { recognizer, transcript } = createRecognizer();
    const ctx = withScope(() => useChatInput({ voice: () => recognizer }));
    ctx.setMode('voice');
    await ctx.startVoiceSession();
    transcript.value = '不发送';
    await ctx.handleVoiceRelease({ result: 'action', key: 'restore' });
    expect(ctx.mode.value).toBe('text');
    expect(ctx.draft.value).toBe('');
    expect(ctx.recording.value).toBe(false);
  });

  it('无 action 时 send 本地直接成功', async () => {
    const sends: unknown[] = [];
    const ctx = withScope(() => useChatInput({ emitSend: (p) => sends.push(p) }));
    ctx.draft.value = '本地消息';
    await ctx.send();
    expect(sends).toHaveLength(1);
    expect(ctx.draft.value).toBe('');
  });

  it('action 成功清空草稿，失败保留并展示错误', async () => {
    const action = vi
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error('发送失败'))
      .mockResolvedValueOnce(undefined);
    const ctx = withScope(() => useChatInput({ action }));
    ctx.draft.value = '你好';
    await ctx.send();
    await flushMicrotasks();
    expect(ctx.sendError.value).toBe('发送失败');
    expect(ctx.draft.value).toBe('你好');
    await ctx.send();
    await flushMicrotasks();
    expect(ctx.draft.value).toBe('');
    expect(ctx.sendError.value).toBeNull();
  });

  it('仅附件也可发送', async () => {
    const action = vi.fn(async () => undefined);
    const ctx = withScope(() => useChatInput({ action }));
    ctx.pickFiles([makeFile('a.png', 'image/png')]);
    expect(ctx.sendDisabled.value).toBe(false);
    await ctx.send();
    await flushMicrotasks();
    expect(action).toHaveBeenCalledTimes(1);
    expect(ctx.attachments.value).toHaveLength(0);
  });

  it('禁用时不响应手势', () => {
    vi.useFakeTimers();
    const { recognizer, calls } = createRecognizer();
    const ctx = withScope(() =>
      useChatInput({ voice: () => recognizer, disabled: () => true }),
    );
    ctx.onFieldPointerDown({ clientX: 0, clientY: 0 });
    vi.advanceTimersByTime(400);
    expect(ctx.recording.value).toBe(false);
    ctx.onFieldPointerMove({ clientX: -100, clientY: 0 });
    expect(ctx.mode.value).toBe('text');
    expect(calls.start).toBe(0);
  });

  it('未注入识别器时语音入口不可用', () => {
    const ctx = withScope(() => useChatInput());
    expect(ctx.hasVoice.value).toBe(false);
    void ctx.startVoiceSession();
    expect(ctx.recording.value).toBe(false);
  });

  it('liveText 仅在录音中透出转录', async () => {
    const { recognizer, transcript } = createRecognizer();
    const ctx = withScope(() => useChatInput({ voice: () => recognizer }));
    transcript.value = '预备文字';
    expect(ctx.liveText.value).toBe('');
    await ctx.startVoiceSession();
    // 会话开始前 reset 清空上一轮转录，转录由识别器在会话期间写入
    expect(ctx.liveText.value).toBe('');
    transcript.value = '会话中的转录';
    expect(ctx.liveText.value).toBe('会话中的转录');
    await ctx.handleVoiceRelease({ result: 'cancel' });
    expect(ctx.liveText.value).toBe('');
  });

  it('scope 销毁后回收未使用的预览地址', () => {
    const ctx = withScope(() => useChatInput());
    ctx.pickFiles([makeFile('a.png', 'image/png')]);
    ctx.$stop();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
