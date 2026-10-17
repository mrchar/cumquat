import * as Library from '@cumquat/components';
import DefaultTheme from 'vitepress/theme';
import LiveDemo from './components/LiveDemo.vue';
import './custom.css';

function isComponentDefinition(value) {
  if (typeof value !== 'object' || value === null) return false;
  return 'render' in value || 'setup' in value;
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // 组件库具名导出全局注册：markdown 正文中的示例标签可直接渲染
    for (const [name, value] of Object.entries(Library)) {
      if (isComponentDefinition(value)) app.component(name, value);
    }
    // 演示容器（运行时编译模板 + scope 注入）
    app.component('LiveDemo', LiveDemo);
  },
};
