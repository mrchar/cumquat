import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, resolveComponent } from 'vue';
import { Cumquat, Button, Watermark, Tour, QRCode } from '../../index';

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
