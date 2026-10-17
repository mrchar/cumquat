import { describe, expect, it, vi } from 'vitest';
import { useControllableModel } from '../../index';

describe('useControllableModel', () => {
  it('非受控：内部自持并回发变更', () => {
    const onChange = vi.fn();
    const { value } = useControllableModel<string>({
      defaultValue: 'a',
      onChange,
    });
    expect(value.value).toBe('a');
    value.value = 'b';
    expect(value.value).toBe('b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('受控：读外部值，写入不修改内部状态只回发事件', () => {
    const onChange = vi.fn();
    const { value } = useControllableModel<string>({
      modelValue: 'x',
      onChange,
    });
    expect(value.value).toBe('x');
    value.value = 'y';
    expect(value.value).toBe('x');
    expect(onChange).toHaveBeenCalledWith('y');
  });

  it('相同值不重复回发', () => {
    const onChange = vi.fn();
    const { value, setValue } = useControllableModel<number>({
      defaultValue: 1,
      onChange,
    });
    setValue(1);
    expect(onChange).not.toHaveBeenCalled();
    value.value = 2;
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
