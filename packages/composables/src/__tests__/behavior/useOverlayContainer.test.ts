import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { mount } from '@vue/test-utils';
import { useOverlayContainer } from '../../index';
import type { MountTarget } from '../../types';

function mountContainer(
  to?: MaybeRefOrGetter<MountTarget | undefined>,
  fallbackToBody = true,
) {
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

  it('getter 目标变化后重新解析', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    first.id = 'overlay-first';
    second.id = 'overlay-second';
    document.body.append(first, second);
    const target = ref('#overlay-first');
    const wrapper = mountContainer(() => target.value);
    expect(wrapper.vm.container).toBe(first);

    target.value = '#overlay-second';
    await nextTick();
    expect(wrapper.vm.container).toBe(second);
    wrapper.unmount();
    first.remove();
    second.remove();
  });

  it('SSR 渲染期间不解析 DOM', async () => {
    const app = createSSRApp(
      defineComponent({
        setup() {
          const { container } = useOverlayContainer({ to: () => '#overlay' });
          return () => h('div', String(container.value));
        },
      }),
    );
    await expect(renderToString(app)).resolves.toContain('<div></div>');
  });

  it('卸载后容器引用清空', () => {
    const wrapper = mountContainer();
    expect(wrapper.vm.container).toBe(document.body);
    wrapper.unmount();
    expect(wrapper.vm.container).toBeNull();
  });
});
