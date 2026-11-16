import { describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import {
  ConfigProvider,
  Cumquat,
  Dialog,
  Drawer,
  Dropdown,
  Popover,
  Popconfirm,
  Tooltip,
} from '../../index';

function mountWithStub(
  component: Parameters<typeof mount>[0],
  options: Record<string, unknown> = {},
) {
  return mount(component, {
    global: { stubs: { teleport: true } },
    ...options,
  });
}

describe('Dialog', () => {
  it('open=false 时不渲染面板', () => {
    const wrapper = mountWithStub(Dialog, { props: { open: false } });
    expect(wrapper.find('.cumquat-dialog__panel').exists()).toBe(false);
  });

  it('open=true 渲染面板，点击遮罩关闭', async () => {
    const wrapper = mountWithStub(Dialog, { props: { open: true, title: '标题' } });
    expect(wrapper.find('.cumquat-dialog__panel').exists()).toBe(true);
    await wrapper.find('.cumquat-dialog__mask').trigger('click');
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  /* ---------------- action: 单函数（向后兼容） ---------------- */

  describe('action: 函数形态（向后兼容）', () => {
    it('渲染取消 + confirmText 按钮', () => {
      const action = vi.fn(async () => undefined);
      const wrapper = mountWithStub(Dialog, {
        props: { open: true, action },
      });
      const buttons = wrapper.findAll('button');
      // 取消 + 确认（primary 是 action 按钮）
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      expect(wrapper.text()).toContain('取消');
      expect(wrapper.text()).toContain('确认');
    });

    it('点击确认触发 action，成功后关闭', async () => {
      const action = vi.fn(async () => undefined);
      const wrapper = mountWithStub(Dialog, {
        props: { open: true, action },
      });
      // 找到非取消、非关闭的按钮（footer 中的 action 按钮，第二个 CqButton）
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      await footerButtons[1].trigger('click');
      expect(action).toHaveBeenCalled();
      await flushPromises();
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
    });

    it('action 执行中按钮 loading 且取消禁用', async () => {
      let resolve: () => void = () => {};
      const action = vi.fn(() => new Promise<void>((r) => (resolve = r)));
      const wrapper = mountWithStub(Dialog, {
        props: { open: true, action },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      const cancelBtn = footerButtons[0];
      const actionBtn = footerButtons[1];
      // 点击 action 按钮，触发 Dialog.handleAction → useActionState.run → pending=true
      await actionBtn.trigger('click');
      await nextTick();
      // 断言 action 已被调用
      expect(action).toHaveBeenCalled();
      // pending 期间点取消：handleCancel 被 anyPending 拦截
      await cancelBtn.trigger('click');
      expect(wrapper.emitted('cancel')).toBeUndefined();
      resolve();
      await flushPromises();
    });

    it('action reject 时不关闭并展示错误条', async () => {
      const err = new Error('boom');
      const action = vi.fn(async () => {
        throw err;
      });
      const wrapper = mountWithStub(Dialog, {
        props: { open: true, action },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      await footerButtons[1].trigger('click');
      await flushPromises();
      // 保持打开
      expect(wrapper.find('.cumquat-dialog__panel').exists()).toBe(true);
      // 错误条出现
      expect(wrapper.find('.cumquat-dialog__error').exists()).toBe(true);
      expect(wrapper.find('.cumquat-dialog__error').text()).toContain('boom');
      expect(wrapper.emitted('actionError')?.[0]).toEqual([err]);
    });
  });

  /* ---------------- action: 对象形态 ---------------- */

  describe('action: 对象形态', () => {
    it('使用自定义 label / type', () => {
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          action: { handler: vi.fn(async () => undefined), label: '保存', type: 'primary' },
        },
      });
      expect(wrapper.text()).toContain('保存');
    });

    it('closeOnFail: true 时失败也关闭', async () => {
      const action = vi.fn(async () => {
        throw new Error('xx');
      });
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          action: { handler: action, label: '立即执行', closeOnFail: true },
        },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      const actionBtn = footerButtons[1]; // 取消 + 动作按钮
      await actionBtn.trigger('click');
      await flushPromises();
      expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
    });

    it('errorText 覆盖动作失败文案', async () => {
      const action = vi.fn(async () => {
        throw new Error('boom');
      });
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          action: { handler: action, label: '执行', errorText: '自定义错误' },
        },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      await footerButtons[1].trigger('click');
      await flushPromises();
      expect(wrapper.find('.cumquat-dialog__error').text()).toContain('自定义错误');
    });
  });

  /* ---------------- actions: 多按钮数组 ---------------- */

  describe('actions: 多按钮数组', () => {
    it('渲染多个按钮，按数组顺序排列', () => {
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          actions: [
            { key: 'save', label: '保存', handler: vi.fn(async () => undefined) },
            { key: 'delete', label: '删除', handler: vi.fn(async () => undefined), type: 'danger' },
          ],
        },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      expect(footerButtons.length).toBe(3); // 取消 + 保存 + 删除
      expect(wrapper.text()).toContain('保存');
      expect(wrapper.text()).toContain('删除');
    });

    it('按钮失败时只展示自己的错误条，不影响其他按钮', async () => {
      const save = vi.fn(async () => {
        throw new Error('保存失败');
      });
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          actions: [
            { key: 'save', label: '保存', handler: save },
            { key: 'delete', label: '删除', handler: vi.fn(async () => undefined) },
          ],
        },
      });
      const cqButtons = wrapper.findAllComponents({ name: 'Button' });
      await cqButtons[1].trigger('click');
      await flushPromises();
      // save 失败：错误条出现 + 弹框保持打开
      expect(wrapper.find('.cumquat-dialog__error').text()).toContain('保存失败');
      expect(wrapper.find('.cumquat-dialog__panel').exists()).toBe(true);
      // save closeOnFail 默认 false → 失败后弹框保持，不触发关闭
      expect(save).toHaveBeenCalledTimes(1);
    });

    it('多按钮 actions 配置里的每个按钮各自独立 handler', async () => {
      const save = vi.fn(async () => undefined);
      const del = vi.fn(async () => undefined);
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          actions: [
            { key: 'save', label: '保存', handler: save },
            { key: 'delete', label: '删除', handler: del },
          ],
        },
      });
      const cqButtons = wrapper.findAllComponents({ name: 'Button' });
      // 直接点 del
      await cqButtons[2].trigger('click');
      await flushPromises();
      expect(del).toHaveBeenCalledTimes(1);
      expect(save).toHaveBeenCalledTimes(0);
    });

    it('actions 与 action 同时传入时 actions 优先', () => {
      const fnAction = vi.fn(async () => undefined);
      const objSave = vi.fn(async () => undefined);
      const wrapper = mountWithStub(Dialog, {
        props: {
          open: true,
          action: fnAction,
          actions: [{ key: 'save', label: '保存', handler: objSave }],
        },
      });
      const footerButtons = wrapper.findAll('.cumquat-dialog__footer button');
      expect(footerButtons.length).toBe(2); // 取消 + 保存
      expect(wrapper.text()).not.toContain('确认');
      expect(wrapper.text()).toContain('保存');
    });
  });
});

describe('Drawer', () => {
  it('open=true 渲染侧栏，关闭按钮可关闭', async () => {
    const wrapper = mountWithStub(Drawer, { props: { open: true, title: '抽屉' } });
    expect(wrapper.find('.cumquat-drawer__panel').exists()).toBe(true);
    await wrapper.find('.cumquat-drawer__close').trigger('click');
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
  });

  it('上下滑出可配置宽度与水平对齐，左右滑出可配置高度', () => {
    const bottom = mountWithStub(Drawer, {
      props: { open: true, direction: 'bottom', width: '50%', align: 'end' },
    });
    const bottomPanel = bottom.find('.cumquat-drawer__panel').element as HTMLElement;
    expect(bottomPanel.style.width).toBe('50%');
    expect(bottomPanel.style.height).toBe('24rem');
    expect(bottomPanel.style.left).toBe('auto');
    expect(bottomPanel.style.right).toBe('0px');
    // 非全宽：加悬浮圆角
    expect(bottomPanel.classList).toContain('cumquat-drawer__panel--detached');

    const side = mountWithStub(Drawer, {
      props: { open: true, direction: 'right', height: '30rem', align: 'start' },
    });
    const sidePanel = side.find('.cumquat-drawer__panel').element as HTMLElement;
    expect(sidePanel.style.width).toBe('24rem');
    expect(sidePanel.style.height).toBe('30rem');
    expect(sidePanel.style.top).toBe('0px');
    expect(sidePanel.style.bottom).toBe('auto');
    expect(sidePanel.classList).toContain('cumquat-drawer__panel--detached');

    // 铺满时保持直角
    const full = mountWithStub(Drawer, { props: { open: true, direction: 'bottom' } });
    expect(full.find('.cumquat-drawer__panel').classes()).not.toContain(
      'cumquat-drawer__panel--detached',
    );
  });
});

describe('浮层挂载配置', () => {
  it('app.use(Cumquat, config) 提供默认挂载点', async () => {
    const target = document.createElement('div');
    target.id = 'app-overlays';
    const host = document.createElement('div');
    document.body.append(target, host);
    const app = createApp(Dialog, { open: true });
    app.use(Cumquat, { overlay: { appendTo: '#app-overlays' } });
    app.mount(host);
    await nextTick();
    expect(target.querySelector('.cumquat-dialog__panel')).not.toBeNull();
    app.unmount();
    target.remove();
    host.remove();
  });

  it('嵌套 Provider 继承与覆盖并存，组件局部属性优先', async () => {
    for (const id of ['outer-overlays', 'inner-overlays', 'local-overlays']) {
      const target = document.createElement('div');
      target.id = id;
      document.body.appendChild(target);
    }
    const Host = defineComponent({
      components: { ConfigProvider, Dialog },
      template: `
        <ConfigProvider append-to="#outer-overlays">
          <Dialog :open="true" />
          <ConfigProvider append-to="#inner-overlays">
            <Dialog :open="true" />
          </ConfigProvider>
          <Dialog :open="true" append-to="#local-overlays" />
        </ConfigProvider>
      `,
    });
    const wrapper = mount(Host);
    await nextTick();
    expect(document.querySelectorAll('#outer-overlays .cumquat-dialog__panel')).toHaveLength(1);
    expect(document.querySelectorAll('#inner-overlays .cumquat-dialog__panel')).toHaveLength(1);
    expect(document.querySelectorAll('#local-overlays .cumquat-dialog__panel')).toHaveLength(1);
    wrapper.unmount();
    for (const id of ['outer-overlays', 'inner-overlays', 'local-overlays']) {
      document.getElementById(id)?.remove();
    }
  });

  it('appendTo 动态变化时 Drawer 迁移挂载目标', async () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);
    const wrapper = mount(Drawer, { props: { open: true, appendTo: first } });
    await nextTick();
    expect(first.querySelector('.cumquat-drawer__panel')).not.toBeNull();

    await wrapper.setProps({ appendTo: second });
    await nextTick();
    expect(first.querySelector('.cumquat-drawer__panel')).toBeNull();
    expect(second.querySelector('.cumquat-drawer__panel')).not.toBeNull();
    wrapper.unmount();
    first.remove();
    second.remove();
  });
});

describe('Dropdown', () => {
  it('点击触发器切换菜单', async () => {
    const wrapper = mount(Dropdown, {
      slots: { trigger: '<button>操作</button>', default: '<div>菜单项</div>' },
    });
    expect(wrapper.find('.cumquat-dropdown__menu').exists()).toBe(false);
    await wrapper.find('.cumquat-dropdown__trigger').trigger('click');
    expect(wrapper.find('.cumquat-dropdown__menu').exists()).toBe(true);
    await wrapper.find('.cumquat-dropdown__trigger').trigger('click');
    expect(wrapper.find('.cumquat-dropdown__menu').exists()).toBe(false);
  });
});

describe('Popover', () => {
  it('点击触发器显示气泡', async () => {
    const wrapper = mount(Popover, {
      props: { title: '提示' },
      slots: { trigger: '<button>i</button>' },
    });
    expect(wrapper.find('.cumquat-popover__content').exists()).toBe(false);
    await wrapper.find('.cumquat-popover__trigger').trigger('click');
    expect(wrapper.find('.cumquat-popover__content').exists()).toBe(true);
    expect(wrapper.find('.cumquat-popover__title').text()).toBe('提示');
  });
});

describe('Popconfirm', () => {
  it('确认按钮派发 confirm 并关闭', async () => {
    const wrapper = mount(Popconfirm, {
      slots: { trigger: '<button>删除</button>' },
    });
    await wrapper.find('.cumquat-popconfirm__trigger').trigger('click');
    expect(wrapper.find('.cumquat-popconfirm__content').exists()).toBe(true);
    await wrapper.find('.cumquat-popconfirm__ok').trigger('click');
    expect(wrapper.emitted('confirm')).toHaveLength(1);
    expect(wrapper.find('.cumquat-popconfirm__content').exists()).toBe(false);
  });

  it('取消按钮派发 cancel', async () => {
    const wrapper = mount(Popconfirm, { slots: { trigger: '<button>删除</button>' } });
    await wrapper.find('.cumquat-popconfirm__trigger').trigger('click');
    await wrapper.find('.cumquat-popconfirm__cancel').trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});

describe('Tooltip', () => {
  it('悬停显示、移出隐藏', async () => {
    const wrapper = mount(Tooltip, {
      props: { content: '提示文字' },
      slots: { default: '<span>目标</span>' },
    });
    expect(wrapper.find('.cumquat-tooltip__content').exists()).toBe(false);
    await wrapper.find('.cumquat-tooltip').trigger('mouseenter');
    expect(wrapper.find('.cumquat-tooltip__content').exists()).toBe(true);
    expect(wrapper.find('.cumquat-tooltip__content').text()).toBe('提示文字');
    await wrapper.find('.cumquat-tooltip').trigger('mouseleave');
    expect(wrapper.find('.cumquat-tooltip__content').exists()).toBe(false);
  });
});
