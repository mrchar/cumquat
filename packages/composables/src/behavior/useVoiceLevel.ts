import { onScopeDispose, ref, type Ref } from 'vue';

/**
 * 麦克风音量采集：启动后通过 getUserMedia 拿到麦克风流，
 * 经 AnalyserNode 按 rAF 节奏计算实时均方根音量，归一为 0~1 的 level。
 *
 * 有声判定采用自适应噪声底追踪（工业 VAD 标准做法）：
 * - 启动后约 0.5s 校准期：下行瞬时跟随沉淀底噪估计，期间强制无声——按下瞬间可能
 *   正在说话，单帧校准会被语音污染导致阈值高企
 * - 无声期持续追踪噪声底（下行瞬时跟随、上飘缓慢），自动适配设备与环境差异
 * - 帧 RMS 超过噪声底估计的 snr 倍判定有声，回落到 1.2 倍以内判定无声（滞回防抖）
 * - 有声期间冻结底噪估计，防止语音抬高底噪
 * 静音时 level 归零（条贴底静止），有声时经平方根响度映射输出（起伏明显），
 * 「有无声音录入」直接由按钮动画本身承担提示职责。
 *
 * 采集约束显式关闭 autoGainControl：AGC 会动态抬高增益放大底噪，
 * 导致无声时也常动；开启 noiseSuppression 抑制稳态底噪。
 *
 * 只负责采集与数值，不关心 UI 呈现；权限拒绝或环境不支持时
 * 通过 error 反馈，level 保持 0，调用方可据此降级为纯动画。
 */

export interface UseVoiceLevelOptions {
  /** 音量增益：原始 RMS 通常偏小，默认 4 倍 */
  gain?: number;
  /** 有声判定的信噪比：帧 RMS 超过噪声底估计的该倍数视为说话，默认 2 */
  snr?: number;
  /** 平滑系数 0~1：越小曲线越平稳，默认 0.35 */
  smoothing?: number;
}

export interface UseVoiceLevelReturn {
  /** 实时音量 0~1（未采集时恒为 0） */
  level: Ref<number>;
  /** 采集是否进行中 */
  active: Ref<boolean>;
  /** 启动失败原因（不支持 / 权限拒绝等），成功启动后清空 */
  error: Ref<string | null>;
  /** 开始采集（重复调用幂等） */
  start: () => Promise<void>;
  /** 停止采集并释放麦克风 */
  stop: () => void;
}

/** 单帧均方根音量：timeDomain 数据为 -1~1 的波形采样 */
function rmsOf(data: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i += 1) sum += data[i] * data[i];
  return Math.sqrt(sum / data.length);
}

export function useVoiceLevel(options: UseVoiceLevelOptions = {}): UseVoiceLevelReturn {
  const gain = options.gain ?? 4;
  const snr = options.snr ?? 2;
  const smoothing = options.smoothing ?? 0.35;

  const level = ref(0);
  const active = ref(false);
  const error = ref<string | null>(null);

  let stream: MediaStream | null = null;
  let context: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let frame = 0;
  /** 分析器数据缓冲：fftSize 决定长度，start 时按实例分配 */
  let buffer: Float32Array | null = null;

  /** 自适应噪声底估计与有声状态 */
  let noiseFloor = 0;
  let calibrated = false;
  /** 校准剩余帧数：约 0.5s，期间只沉淀底噪不判定有声 */
  let calibrateLeft = 0;
  let voiced = false;

  const stop = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    analyser = null;
    buffer = null;
    if (context && context.state !== 'closed') void context.close();
    context = null;
    active.value = false;
    level.value = 0;
    noiseFloor = 0;
    calibrated = false;
    calibrateLeft = 0;
    voiced = false;
  };

  const tick = () => {
    if (!analyser || !buffer) return;
    analyser.getFloatTimeDomainData(buffer);
    const rms = rmsOf(buffer);
    // 首帧以当前音量作为底噪初值；校准期下行瞬时跟随沉淀到真实底噪——
    // 按下瞬间可能正在说话，单帧校准会被语音污染导致阈值高企、说话无响应
    if (!calibrated) {
      noiseFloor = rms;
      calibrated = true;
      calibrateLeft = 30;
    } else if (calibrateLeft > 0) {
      calibrateLeft -= 1;
      if (rms < noiseFloor) noiseFloor = rms;
    } else if (!voiced) {
      // 无声期追踪底噪：下行瞬时跟随、上飘缓慢（每帧 2%）；有声期冻结防止语音抬高底噪
      noiseFloor = rms < noiseFloor ? rms : noiseFloor + (rms - noiseFloor) * 0.02;
    }
    // 有声滞回：超过底噪 snr 倍进入有声，回落到 1.2 倍以内退出，防止单帧抖动；
    // 绝对下限仅防数字静音误触发，需低于关 AGC 后低电平麦克风的语音幅值
    const enter = Math.max(noiseFloor * snr, 0.002);
    const exit = Math.max(noiseFloor * 1.2, 0.001);
    if (calibrateLeft <= 0) {
      if (!voiced && rms >= enter) voiced = true;
      else if (voiced && rms < exit) voiced = false;
    }
    // 静音归零：无声时条贴底静止；有声经平方根响度映射（近似响度感知，中小信号更敏感）
    const target = voiced ? Math.min(1, Math.sqrt(rms) * gain) : 0;
    level.value = level.value + (target - level.value) * smoothing;
    frame = requestAnimationFrame(tick);
  };

  const start = async () => {
    if (active.value) return;
    error.value = null;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      error.value = '当前环境不支持麦克风采集';
      return;
    }
    try {
      // 关闭 AGC：动态增益会放大底噪导致无声时常动；开启 NS 抑制稳态底噪
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { noiseSuppression: true, autoGainControl: false, echoCancellation: true },
      });
    } catch (err) {
      error.value =
        err instanceof Error && err.name === 'NotAllowedError'
          ? '麦克风权限被拒绝'
          : `麦克风启动失败：${err instanceof Error ? err.message : String(err)}`;
      return;
    }
    context = new AudioContext();
    analyser = context.createAnalyser();
    analyser.fftSize = 512;
    // 仅 source → analyser：不连 destination，避免麦克风声音外放
    context.createMediaStreamSource(stream).connect(analyser);
    buffer = new Float32Array(analyser.fftSize);
    active.value = true;
    frame = requestAnimationFrame(tick);
  };

  // 组件作用域销毁时自动释放麦克风，避免录音指示灯残留
  onScopeDispose(stop);

  return { level, active, error, start, stop };
}
