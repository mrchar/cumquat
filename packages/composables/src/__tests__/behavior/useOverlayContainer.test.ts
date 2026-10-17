import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { useOverlayContainer } from '../../index';

function mountContainer(to?: string | HTMLElement, fallbackToBody = true) {
  const TestComponent = defineComponent({
    setup() {
      const { container } = useOverlayContainer({ to, fallbackToBody });
      return { container };
    },
    render: () => h('div'),
  });
  return mount(TestComponent);
}

describe('useOverlayContainer', () => {
  it('默认目标为 body', () => {
    const wrapper = mountContainer();
    expect(wrapper.vm.container).toBe(document.body);
  });

  it('选择器命中时使用该元素', () => {
    const portal = document.createElement('div');
    portal.id = 'portal-target';
    document.body.appendChild(portal);
    const wrapper = mountContainer('#portal-target');
    expect(wrapper.vm.container).toBe(portal);
    portal.remove();
  });

  it('选择器未命中回退 body，可关闭回退', () => {
    const fallback = mountContainer('#not-exists');
    expect(fallback.vm.container).toBe(document.body);

    const strict = mountContainer('#not-exists', false);
    expect(strict.vm.container).toBeNull();
  });

  it('直接传入元素作为目标', () => {
    const el = document.createElement('section');
    const wrapper = mountContainer(el);
    expect(wrapper.vm.container).toBe(el);
  });

  it('卸载后容器引用清空', () => {
    const wrapper = mountContainer();
    expect(wrapper.vm.container).toBe(document.body);
    wrapper.unmount();
    expect(wrapper.vm.container).toBeNull();
  });
});
