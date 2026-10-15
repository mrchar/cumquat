import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { Dialog, Drawer, Dropdown, Popover, Popconfirm, Tooltip } from '../../index';

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
});

describe('Drawer', () => {
  it('open=true 渲染侧栏，关闭按钮可关闭', async () => {
    const wrapper = mountWithStub(Drawer, { props: { open: true, title: '抽屉' } });
    expect(wrapper.find('.cumquat-drawer__panel').exists()).toBe(true);
    await wrapper.find('.cumquat-drawer__close').trigger('click');
    expect(wrapper.emitted('update:open')?.[0]).toEqual([false]);
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
