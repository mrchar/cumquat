import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useVoiceLevel } from '../../index';
import { withScope } from '../helpers';

/**
 * jsdom 无媒体设备与音频上下文，统一以桩件模拟：
 * - navigator.mediaDevices.getUserMedia 返回可断言 stop 的假流
 * - AudioContext 产出恒定幅度的分析器（默认 0.5：RMS=0.5，经平方根增益映射封顶为 1）
 * - requestAnimationFrame 收集回调，由测试手动逐帧驱动
 */

/** 分析器恒定幅度：测试按用例改写以模拟静音 / 说话 */
let analyserFill = 0.5;

class FakeAnalyser {
  fftSize = 512;
  getFloatTimeDomainData(arr: Float32Array) {
    arr.fill(analyserFill);
  }
}

/** 收集被创建的实例：stub 后组合函数内部 new 的对象与外部引用需要对账 */
const createdContexts: FakeAudioContext[] = [];

class FakeAudioContext {
  state = 'running';
  destination = {};
  closed = false;
  constructor() {
    createdContexts.push(this);
  }
  createAnalyser() {
    return new FakeAnalyser();
  }
  createMediaStreamSource() {
    return { connect: () => {} };
  }
  async close() {
    // 与真实 AudioContext 一致：调用即进入 closed，返回的 Promise 仅表示资源释放完成
    this.closed = true;
    this.state = 'closed';
  }
}

describe('useVoiceLevel', () => {
  let rafCbs: FrameRequestCallback[];
  let trackStop: ReturnType<typeof vi.fn>;
  let getUserMedia: ReturnType<typeof vi.fn>;

  const runFrame = () => {
    const cbs = [...rafCbs];
    rafCbs = [];
    cbs.forEach((cb) => cb(0));
  };

  beforeEach(() => {
    rafCbs = [];
    analyserFill = 0.5;
    trackStop = vi.fn();
    getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: trackStop }] });
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia },
      configurable: true,
    });
    createdContexts.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCbs.push(cb);
      return rafCbs.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {
      rafCbs = [];
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('环境不支持时 start 置 error 且不请求权限', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true });
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    expect(ctx.error.value).toBe('当前环境不支持麦克风采集');
    expect(ctx.active.value).toBe(false);
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('权限拒绝时反馈错误文案', async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    expect(ctx.error.value).toBe('麦克风权限被拒绝');
    expect(ctx.active.value).toBe(false);
  });

  /** 校准期 30 帧内只沉淀底噪不判定有声：跑满校准期 + 若干判定帧 */
  const runCalibrated = () => {
    for (let i = 0; i < 35; i += 1) runFrame();
  };

  it('静音时自适应底噪归零，无声条静止', async () => {
    // 底噪 RMS=0.01：校准后进入有声需超过 2 倍，0.01 恒小于阈值
    analyserFill = 0.01;
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runCalibrated();
    expect(ctx.level.value).toBe(0);
  });

  it('高底噪环境自适应归零，不被固定门限误判', async () => {
    // 底噪 RMS=0.05 超过任何合理固定门限：自适应后进入有声需超过 0.1
    analyserFill = 0.05;
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runCalibrated();
    expect(ctx.level.value).toBe(0);
  });

  it('首帧被语音污染时校准期仍能沉淀到真实底噪', async () => {
    // 按下瞬间正在说话：首帧 RMS=0.5，校准期内回落到底噪 0.01
    analyserFill = 0.5;
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runFrame();
    analyserFill = 0.01;
    runCalibrated();
    expect(ctx.level.value).toBe(0);
    // 底噪 0.01 的 2 倍即触发有声，不会残留被污染的高阈值
    analyserFill = 0.03;
    runFrame();
    expect(ctx.level.value).toBeGreaterThan(0);
  });

  it('说话时越过信噪比阈值，音量随响度起伏', async () => {
    // 先以底噪校准，再模拟说话：RMS=0.5 远超底噪 0.01 的 2 倍
    analyserFill = 0.01;
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runCalibrated();
    analyserFill = 0.5;
    // 第一帧：平方根映射 sqrt(0.5)*4 封顶为 1，平滑系数 0.35 → level=0.35
    runFrame();
    expect(ctx.level.value).toBeCloseTo(0.35, 5);
    // 第二帧继续向 1 收敛
    runFrame();
    expect(ctx.level.value).toBeGreaterThan(0.35);
  });

  it('说话结束回落到噪声底以内，level 平滑归零', async () => {
    // 底噪 0.05 校准 → 说话 0.3 → 回到底噪 0.05：低于退出阈值 0.06 判无声
    analyserFill = 0.05;
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runCalibrated();
    analyserFill = 0.3;
    runFrame();
    expect(ctx.level.value).toBeGreaterThan(0.3);
    analyserFill = 0.05;
    for (let i = 0; i < 12; i += 1) runFrame();
    expect(ctx.level.value).toBeLessThan(0.01);
  });

  it('stop 释放音轨与音频上下文并复位状态', async () => {
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    runFrame();
    ctx.stop();
    expect(trackStop).toHaveBeenCalled();
    expect(createdContexts[0]?.closed).toBe(true);
    expect(ctx.active.value).toBe(false);
    expect(ctx.level.value).toBe(0);
    // 停止后不再采样
    const framesBefore = rafCbs.length;
    runFrame();
    expect(rafCbs.length).toBe(framesBefore);
  });

  it('重复 start 幂等', async () => {
    const ctx = withScope(() => useVoiceLevel());
    await ctx.start();
    await ctx.start();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
  });
});
