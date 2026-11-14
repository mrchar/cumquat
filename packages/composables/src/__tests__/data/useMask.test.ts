import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useMask } from '../../data/useMask';
import type { MaskRule } from '../../data/useMask';

describe('useMask', () => {
  it('对象按属性名遮罩：直接返回一次性结果，不修改原对象', () => {
    const source = { name: '甲', password: 'secret', age: 30 };
    const masked = useMask(source, 'password');
    expect(masked).toEqual({ name: '甲', age: 30 });
    expect(source.password).toBe('secret');
  });

  it('数组按属性名遮罩：移除每个成员的指定属性', () => {
    const list = [
      { id: 1, name: '甲', token: 'x' },
      { id: 2, name: '乙', token: 'y' },
    ];
    const masked = useMask(list, 'token');
    expect(masked).toEqual([
      { id: 1, name: '甲' },
      { id: 2, name: '乙' },
    ]);
  });

  it('数组按 { prop, value } 遮罩匹配成员', () => {
    const list = [
      { id: 1, role: 'admin' },
      { id: 2, role: 'user' },
      { id: 3, role: 'admin' },
    ];
    const masked = useMask(list, { prop: 'role', value: 'admin' });
    expect(masked).toEqual([{ id: 2, role: 'user' }]);
  });

  it('{ prop, value } 规则对对象无意义，原样返回', () => {
    const obj = { name: '甲', role: 'admin' };
    const masked = useMask(obj, { prop: 'role', value: 'admin' });
    expect(masked).toEqual(obj);
  });

  it('对象按函数遮罩匹配属性', () => {
    const obj = { name: '甲', password: 'secret', age: 30 };
    const masked = useMask(obj, (value) => typeof value === 'number');
    expect(masked).toEqual({ name: '甲', password: 'secret' });
  });

  it('数组按函数遮罩匹配成员', () => {
    const list = [1, 2, 3, 4, 5];
    const masked = useMask(list, (n) => (n as number) % 2 === 0);
    expect(masked).toEqual([1, 3, 5]);
  });

  it('多个规则叠加：依次应用', () => {
    const list = [
      { id: 1, token: 'x', hidden: false },
      { id: 2, token: 'y', hidden: true },
    ];
    const masked = useMask(list, 'token', { prop: 'hidden', value: true });
    expect(masked).toEqual([{ id: 1, hidden: false }]);
  });

  it('响应式联动：ref source 变化时计算结果更新', () => {
    const source = ref([
      { id: 1, hidden: false },
      { id: 2, hidden: true },
    ]);
    const masked = useMask(source, { prop: 'hidden', value: true });
    expect(masked.value).toEqual([{ id: 1, hidden: false }]);
    source.value.push({ id: 3, hidden: false });
    expect(masked.value).toEqual([
      { id: 1, hidden: false },
      { id: 3, hidden: false },
    ]);
  });

  it('响应式联动：getter source 返回计算结果', () => {
    const source = ref({ a: 1, b: 2 });
    const masked = useMask(() => source.value, 'a');
    expect(masked.value).toEqual({ b: 2 });
    source.value = { a: 3, b: 4 };
    expect(masked.value).toEqual({ b: 4 });
  });

  it('响应式联动：rule 变化时结果更新', () => {
    const source = ref({ a: 1, b: 2, c: 3 });
    const rule = ref<MaskRule>('a');
    const masked = useMask(source, rule);
    expect(masked.value).toEqual({ b: 2, c: 3 });
    rule.value = 'b';
    expect(masked.value).toEqual({ a: 1, c: 3 });
  });

  it('原始 source 只执行一次，不随 ref 规则变化', () => {
    const source = { a: 1, b: 2, c: 3 };
    const rule = ref<MaskRule>('a');
    const masked = useMask(source, rule);
    expect(masked).toEqual({ b: 2, c: 3 });
    rule.value = 'b';
    expect(masked).toEqual({ b: 2, c: 3 });
  });

  it('源为 null/undefined 原样返回', () => {
    const masked = useMask(null as unknown, 'x');
    expect(masked).toBeNull();
  });

  it('原始数据不可变', () => {
    const obj = { a: 1, b: 2 };
    useMask(obj, 'a');
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});
