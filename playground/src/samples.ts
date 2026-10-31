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

/** 按组件类型分组的菜单结构 */
export const sampleGroups: SampleGroup[] = [
  { key: 'basic', title: '基础组件', samples: basicSamples },
  { key: 'form', title: '表单输入', samples: formSamples },
  { key: 'overlay', title: '浮动层', samples: overlaySamples },
  { key: 'data', title: '数据展示', samples: dataSamples },
  { key: 'feedback', title: '反馈', samples: feedbackSamples },
  { key: 'nav', title: '导航与布局', samples: navSamples },
  { key: 'misc', title: '其他', samples: miscSamples },
];

export const samples: Sample[] = sampleGroups.flatMap((group) => group.samples);
