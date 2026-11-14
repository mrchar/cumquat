import { createHighlighterCore } from 'shiki/core';
import type { HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import langCss from '@shikijs/langs/css';
import langHtml from '@shikijs/langs/html';
import langJs from '@shikijs/langs/javascript';
import langJson from '@shikijs/langs/json';
import langTs from '@shikijs/langs/typescript';
import langVue from '@shikijs/langs/vue';
import themeDark from '@shikijs/themes/github-dark';
import themeLight from '@shikijs/themes/github-light';

/** CodeCard 支持高亮的语言 */
export const CODE_CARD_LANGUAGES = ['vue', 'typescript', 'javascript', 'css', 'html', 'json'];

let highlighterPromise: Promise<HighlighterCore> | undefined;

/**
 * 懒加载单例高亮器。
 * 仅注册文档演示所需语言；使用 JS 正则引擎，避免宿主处理 WASM 资源。
 * 输出 github-light / github-dark 双主题 CSS 变量，由主题包按 cq-theme-* 选择。
 */
export function getCodeHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [themeLight, themeDark],
    langs: [langVue, langTs, langJs, langCss, langHtml, langJson],
    engine: createJavaScriptRegexEngine(),
  });
  return highlighterPromise;
}
