import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import { useMask } from '../../data/useMask';

describe('useMask', () => {
  it('对象按属性名遮罩：移除指定属性，不修改原对象', () => {
    const source = { name: 'Alice', password: 'secret', age: 30 };
    const { masked } = useMask(source, 'password');
    expect(masked.value).toEqual({ name: 'Alice', age: 30 });
    expect(source.password).toBe('secret');
  });

  it('数组按属性名遮罩：移除每个成员的指定属性', () => {
    const list = [
      { id: 1, name: 'A', token: 'x' },
      { id: 2, name: 'B', token: 'y' },
    ];
    const { masked } = useMask(list, 'token');
    expect(masked.value).toEqual([
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]);
  });

  it('数组按 { prop, value } 遮罩匹配成员', () => {
    const list = [
      { id: 1, role: 'admin' },
      { id: 2, role: 'user' },
      { id: 3, role: 'admin' },
    ];
    const { masked } = useMask(list, { prop: 'role', value: 'admin' });
    expect(masked.value).toEqual([{ id: 2, role: 'user' }]);
  });

  it('{ prop, value } 规则对对象无意义，原样返回', () => {
    const obj = { name: 'Alice', role: 'admin' };
    const { masked } = useMask(obj, { prop: 'role', value: 'admin' });
    expect(masked.value).toEqual(obj);
  });

  it('对象按函数遮罩匹配属性', () => {
    const obj = { name: 'Alice', password: 'secret', age: 30 };
    const { masked } = useMask(obj, (value) => typeof value === 'number');
    expect(masked.value).toEqual({ name: 'Alice', password: 'secret' });
  });

  it('数组按函数遮罩匹配成员', () => {
    const list = [1, 2, 3, 4, 5];
    const { masked } = useMask(list, (n) => (n as number) % 2 === 0);
    expect(masked.value).toEqual([1, 3, 5]);
  });

  it('多个规则叠加：依次应用', () => {
    const list = [
      { id: 1, token: 'x', hidden: false },
      { id: 2, token: 'y', hidden: true },
    ];
    const { masked } = useMask(list, 'token', { prop: 'hidden', value: true });
    expect(masked.value).toEqual([{ id: 1, hidden: false }]);
  });

  it('响应式联动：source 变化时结果更新', () => {
    const source = ref([
      { id: 1, hidden: false },
      { id: 2, hidden: true },
    ]);
    const { masked } = useMask(source, { prop: 'hidden', value: true });
    expect(masked.value).toEqual([{ id: 1, hidden: false }]);
    source.value.push({ id: 3, hidden: false });
    expect(masked.value).toEqual([
      { id: 1, hidden: false },
      { id: 3, hidden: false },
    ]);
  });

  it('响应式联动：rule 变化时结果更新', () => {
    const source = ref({ a: 1, b: 2, c: 3 });
    const rule = ref<string>('a');
    const { masked } = useMask(source, rule);
    expect(masked.value).toEqual({ b: 2, c: 3 });
    rule.value = 'b';
    expect(masked.value).toEqual({ a: 1, c: 3 });
  });

  it('源为 null/undefined 原样返回', () => {
    const { masked } = useMask(null as unknown, 'x');
    expect(masked.value).toBeNull();
  });

  it('原始数据不可变', () => {
    const obj = { a: 1, b: 2 };
    useMask(obj, 'a');
    expect(obj).toEqual({ a: 1, b: 2 });
  });
});
