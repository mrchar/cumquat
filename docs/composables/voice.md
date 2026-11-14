---
title: 语音音量
---

# 语音音量

## useVoiceLevel

麦克风实时音量采集：启动后通过 `getUserMedia` 获取麦克风流，经分析节点按帧计算均方根音量，归一为 `0~1` 的 `level`。有声判定采用自适应噪声底追踪：无声期持续估计环境噪声底（自动适配设备与环境差异），帧音量超过底噪的信噪比阈值判定有声，回落到底噪附近判定无声——静音时 `level` 归零（条贴底静止），说话时起伏明显，「有无声音录入」由按钮动画本身承担提示。只负责采集与数值，不关心 UI 呈现；可与 VoiceButton 的 `level` 属性直接组合。

```ts
const { level, active, error, start, stop } = useVoiceLevel({
  gain: 4,
  snr: 2,
  smoothing: 0.35,
});

// 通常在按住时开启、松开时停止
await start();
stop();
```

| 成员    | 类型                 | 说明                                       |
| ------- | -------------------- | ------------------------------------------ |
| level   | `Ref<number>`        | 实时音量 0~1，未采集时恒为 0               |
| active  | `Ref<boolean>`       | 采集是否进行中                             |
| error   | `Ref<string \| null>` | 启动失败原因（不支持 / 权限拒绝等）        |
| start   | `() => Promise<void>` | 开始采集（重复调用幂等）                   |
| stop    | `() => void`          | 停止采集并释放麦克风                       |

选项：

- `gain`：音量增益，原始均方根通常偏小，默认 `4` 倍
- `snr`：有声判定的信噪比，帧均方根超过噪声底估计的该倍数视为说话，默认 `2`
- `smoothing`：平滑系数 `0~1`，越小曲线越平稳，默认 `0.35`

说明：

- 启动后约 0.5 秒为校准期：期间强制无声（条贴底），只沉淀底噪估计——按下瞬间可能正在说话，避免语音污染阈值
- 底噪估计下行瞬时跟随、上飘缓慢：校准结束后环境变吵或变静均能自动适配
- 有声期间冻结底噪估计，防止语音抬高底噪；退出判定带滞回（回落到底噪 1.2 倍以内），防止单帧抖动
- 归一映射取平方根（近似响度感知）：对说话等中小信号更敏感，起伏对比更明显
- 采集约束显式关闭 `autoGainControl`（动态增益会放大底噪导致无声时常动）、开启 `noiseSuppression`（抑制稳态底噪）
- 环境不支持或权限被拒绝时 `error` 给出原因，`level` 保持 0，调用方可据此降级为纯动画
- 组合函数作用域销毁时自动停止采集并释放麦克风，避免录音指示灯残留
- 配合组件使用见 [VoiceButton](/components/voice-button) 的 `level` 属性

## useVoiceButton

语音按钮手势状态机：按住说话、上滑取消、左右滑选中功能项。按下后指针被捕获，移出按钮仍持续追踪；松开时按当前手势区产出结果。

```ts
const { holding, gesture, activeAction, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } =
  useVoiceButton(() => actions, {
    cancelDistance: 48,
    actionDistance: 48,
    disabled: () => props.disabled,
    onPressStart: () => voice.start(),
    onRelease: ({ result, key }) => {
      if (result === 'confirm') commit();
      if (result === 'cancel') voice.stop();
      if (result === 'action') runAction(key);
    },
  });
```

```ts
function useVoiceButton(
  actions: () => VoiceButtonAction[] | undefined,
  options?: UseVoiceButtonOptions,
): UseVoiceButtonReturn;

interface VoiceButtonAction {
  key: string;
  label: string;
  /** 滑动方向：left 左滑选中 / right 右滑选中；缺省按序号左右交替 */
  direction?: 'left' | 'right';
}

type VoiceGesture = 'confirm' | 'cancel' | 'action';

interface VoiceReleasePayload {
  result: VoiceGesture;
  /** result 为 action 时携带选中的功能键 */
  key?: string;
}
```

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `cancelDistance` | `number` | `48` | 上滑取消的触发距离（px，位移向上量为负） |
| `actionDistance` | `number` | `48` | 左右滑选中功能的触发距离（px） |
| `disabled` | `() => boolean` | - | 返回 true 时忽略按下（禁用态） |
| `onPressStart` | `() => void` | - | 按下回调（可据此开始录音） |
| `onRelease` | `(payload: `[`VoiceReleasePayload`](/types/view/scenarios#voicereleasepayload)`) => void` | - | 松开回调；按住期间被系统打断按取消处理 |

| 返回成员 | 类型 | 说明 |
| --- | --- | --- |
| `holding` | `Ref<boolean>` | 是否处于按住状态 |
| `gesture` | `Ref<`[`VoiceGesture`](/types/view/scenarios#voicegesture)`>` | 当前手势区：`confirm` / `cancel` / `action` |
| `activeAction` | `Ref<`[`VoiceButtonAction`](/types/view/scenarios#voicebuttonaction)` \| undefined>` | 当前命中的左右滑功能项 |
| `onPointerDown` | `(event) => void` | 按下：开始按住、捕获指针、调用 `onPressStart` |
| `onPointerMove` | `(event) => void` | 移动：按位移更新手势区 |
| `onPointerUp` | `(event?) => void` | 松开：按当前手势区产出结果 |
| `onPointerCancel` | `() => void` | 系统打断（来电、手势冲突等）：按取消收尾 |

判定规则：纵向位移占优且上滑越过 `cancelDistance` 进入取消区；横向位移占优且越过 `actionDistance` 时按方向解析功能项；两轴独立判定，回到阈值内自动复位为确认区。`direction` 缺省时按功能项序号左右交替。
