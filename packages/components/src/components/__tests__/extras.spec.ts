import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, resolveComponent } from 'vue';
import { Cumquat, Button, Watermark, Tour, QRCode, CodeCard } from '../../index';
import { getCodeHighlighter } from '../extras/codeHighlighter';

describe('Cumquat 全量安装', () => {
  it('app.use(Cumquat) 后 <c-button> 可解析', () => {
    const Host = defineComponent({
      render: () => h(resolveComponent('c-button')),
    });
    const wrapper = mount(Host, { global: { plugins: [Cumquat] } });
    expect(wrapper.find('.cumquat-button').exists()).toBe(true);
  });

  it('导出的组件可直接按需使用', () => {
    const wrapper = mount(Button, { props: { type: 'primary' } });
    expect(wrapper.classes()).toContain('cumquat-button');
  });
});

describe('Watermark', () => {
  it('平铺水印文字', () => {
    const wrapper = mount(Watermark, {
      props: { content: '机密文件' },
      slots: { default: '' },
    });
    expect(wrapper.find('.cumquat-watermark').exists()).toBe(true);
    expect(wrapper.findAll('.cumquat-watermark__item').length).toBeGreaterThan(0);
  });
});

describe('Tour', () => {
  const steps = [
    { key: '1', title: '第一步', content: '介绍 A' },
    { key: '2', title: '第二步', content: '介绍 B' },
  ];

  it('open 后显示引导卡，下一步切换步骤', async () => {
    const wrapper = mount(Tour, {
      props: { steps, open: true },
      global: { stubs: { teleport: true } },
    });
    expect(wrapper.find('.cumquat-tour__title').text()).toBe('第一步');
    await wrapper.find('.cumquat-tour__next').trigger('click');
    expect(wrapper.find('.cumquat-tour__title').text()).toBe('第二步');
    await wrapper.find('.cumquat-tour__next').trigger('click');
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });
});

describe('QRCode', () => {
  it('按 value 渲染网格', () => {
    const wrapper = mount(QRCode, { props: { value: 'https://cumquat.dev' } });
    expect(wrapper.findAll('.cumquat-qrcode__cell').length).toBeGreaterThan(0);
  });
});

describe('CodeCard', () => {
  it('渲染标题、演示插槽与工具栏，代码默认收起', () => {
    const wrapper = mount(CodeCard, {
      props: { title: '按钮类型', code: '<Button>确定</Button>' },
      slots: { default: '<button>确定</button>' },
    });
    expect(wrapper.find('.cumquat-code-card__title').text()).toBe('按钮类型');
    expect(wrapper.find('.cumquat-code-card__preview button').exists()).toBe(true);
    expect(wrapper.find('.cumquat-code-card__code').isVisible()).toBe(false);
    const actions = wrapper.findAll('.cumquat-code-card__action');
    expect(actions[0].text()).toBe('复制');
    expect(actions[1].text()).toBe('展开代码');
  });

  it('清理源码公共缩进，高亮就绪前降级渲染纯文本', () => {
    const wrapper = mount(CodeCard, {
      props: {
        code: '\n    <Button>确定</Button>\n    <Button>取消</Button>\n',
        defaultExpand: true,
      },
    });
    expect(wrapper.find('.cumquat-code-card__plain').text()).toBe(
      '<Button>确定</Button>\n<Button>取消</Button>',
    );
  });

  it('切换展开与收起代码', async () => {
    const wrapper = mount(CodeCard, { props: { code: '<Button />' } });
    const toggle = wrapper.findAll('.cumquat-code-card__action')[1];
    expect(toggle.attributes('aria-expanded')).toBe('false');
    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.cumquat-code-card__code').isVisible()).toBe(true);
  });

  it('editable：编辑后防抖回发最新代码，恢复按钮还原初始代码', async () => {
    vi.useFakeTimers();
    try {
      const wrapper = mount(CodeCard, {
        props: { code: '<Button>确定</Button>', editable: true },
      });
      // 非编辑态不显示恢复按钮
      expect(wrapper.text()).not.toContain('恢复');
      const editBtn = wrapper.findAll('.cumquat-code-card__action')[2];
      expect(editBtn.text()).toBe('编辑代码');
      await editBtn.trigger('click');
      const editor = wrapper.find('.cumquat-code-card__editor');
      expect(editor.exists()).toBe(true);
      await editor.setValue('<Button>修改后</Button>');
      // 防抖 300ms 后回发
      expect(wrapper.emitted('update:code')).toBeUndefined();
      vi.advanceTimersByTime(350);
      expect(wrapper.emitted('update:code')?.[0]).toEqual(['<Button>修改后</Button>']);
      // 修改后出现恢复按钮
      const resetBtn = wrapper.findAll('.cumquat-code-card__action').at(-1)!;
      expect(resetBtn.text()).toBe('恢复');
      await resetBtn.trigger('click');
      expect(wrapper.emitted('update:code')?.[1]).toEqual(['<Button>确定</Button>']);
      expect(wrapper.emitted('reset')).toHaveLength(1);
      expect(wrapper.find('.cumquat-code-card__editor').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('恢复');
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('codeHighlighter', () => {
  it('输出携带明暗双主题 CSS 变量的高亮 HTML', async () => {
    const highlighter = await getCodeHighlighter();
    const html = highlighter.codeToHtml('<Button type="primary" />', {
      lang: 'vue',
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    });
    expect(html).toContain('shiki');
    expect(html).toContain('--shiki-light');
    expect(html).toContain('--shiki-dark');
  });
});

describe('类型完整性', () => {
  it('宿主组件可以组合使用', () => {
    const Host = defineComponent({
      render() {
        return h('div', [h(QRCode, { value: 'x' }), h(Watermark, { content: 'w' })]);
      },
    });
    const wrapper = mount(Host);
    expect(wrapper.find('.cumquat-qrcode').exists()).toBe(true);
  });
});
