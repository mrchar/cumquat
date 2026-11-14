import { basicSamples } from './samples/basic';
import { formSamples } from './samples/form';
import { overlaySamples } from './samples/overlay';
import { dataSamples } from './samples/data';
import { feedbackSamples } from './samples/feedback';
import { navSamples } from './samples/nav';
import { miscSamples } from './samples/misc';

/** 沙盒预置片段：每个片段自包含，需要状态的通过 scope 工厂按需创建 */
export interface Sample {
  key: string;
  title: string;
  code: string;
  scope?: () => Record<string, unknown>;
}

export interface SampleGroup {
  key: string;
  title: string;
  samples: Sample[];
}

const allSamples = [
  ...basicSamples,
  ...formSamples,
  ...overlaySamples,
  ...dataSamples,
  ...feedbackSamples,
  ...navSamples,
  ...miscSamples,
];

const byKey = new Map(allSamples.map((sample) => [sample.key, sample]));

/** 按组件目录分类取片段：与 packages/components/src/components 的分层一致 */
const pick = (keys: string[]): Sample[] =>
  keys.flatMap((key) => {
    const sample = byKey.get(key);
    return sample ? [sample] : [];
  });

/** 菜单结构与组件实现目录（通用 / 布局 / 导航 / 数据输入 / 数据展示 / 反馈 / 场景 / 其他）对齐 */
export const sampleGroups: SampleGroup[] = [
  {
    key: 'general',
    title: '通用',
    samples: pick(['button', 'icon', 'typography']),
  },
  {
    key: 'layout',
    title: '布局',
    samples: pick(['divider', 'grid', 'layout', 'space']),
  },
  {
    key: 'navigation',
    title: '导航',
    samples: pick([
      'anchor',
      'back-top',
      'breadcrumb',
      'dropdown',
      'menu',
      'pagination',
      'steps',
      'tabs',
    ]),
  },
  {
    key: 'data-entry',
    title: '数据输入',
    samples: pick([
      'auto-complete',
      'cascader',
      'checkbox',
      'color-picker',
      'date-picker',
      'form',
      'form-item',
      'input',
      'input-number',
      'mention',
      'radio',
      'radio-group',
      'rate',
      'select',
      'segmented',
      'slider',
      'switch',
      'time-picker',
      'transfer',
      'tree-select',
      'upload',
    ]),
  },
  {
    key: 'data-display',
    title: '数据展示',
    samples: pick([
      'avatar',
      'badge',
      'calendar',
      'card',
      'carousel',
      'collapse',
      'descriptions',
      'empty',
      'image',
      'list',
      'popover',
      'qrcode',
      'statistic',
      'table',
      'tag',
      'timeline',
      'tooltip',
      'tree',
      'virtual-list',
    ]),
  },
  {
    key: 'feedback',
    title: '反馈',
    samples: pick([
      'alert',
      'dialog',
      'drawer',
      'loading',
      'message',
      'message-container',
      'notification',
      'notification-container',
      'popconfirm',
      'progress',
      'result',
      'skeleton',
    ]),
  },
  {
    key: 'scenarios',
    title: '场景组件',
    samples: pick(['chat', 'chat-input', 'voice-button']),
  },
  {
    key: 'other',
    title: '其他',
    samples: pick(['affix', 'float-button', 'tour', 'watermark']),
  },
  {
    key: 'internal',
    title: '文档工具',
    samples: pick(['code-card', 'live-demo']),
  },
];

export const samples: Sample[] = sampleGroups.flatMap((group) => group.samples);
