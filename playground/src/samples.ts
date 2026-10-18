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

export const samples: Sample[] = [
  ...basicSamples,
  ...formSamples,
  ...overlaySamples,
  ...dataSamples,
  ...feedbackSamples,
  ...navSamples,
  ...miscSamples,
];
