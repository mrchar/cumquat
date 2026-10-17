import { computed, reactive, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { provideForm } from '../behavior/useFormContext';
import type { FormContext, FormFieldController } from '../behavior/useFormContext';
import { normalizeRules, runRules } from './form-types';
import type { FormRules } from './form-types';

export interface UseFormOptions<T extends Record<string, unknown>> {
  /** 受控整表值 */
  modelValue?: MaybeRefOrGetter<T>;
  /** 非受控初始值 */
  defaultValue?: T;
  /** 字段规则（也可由各 useFormField 传入，按字段名合并） */
  rules?: MaybeRefOrGetter<FormRules<T>>;
  disabled?: boolean;
  labelPosition?: 'left' | 'right' | 'top';
  /** 值变化回调（受控时即 update:modelValue） */
  onChange?: (values: T) => void;
  /** 校验通过后的提交回调 */
  onSubmit?: (values: T) => void | Promise<void>;
  /** 校验失败回调 */
  onInvalid?: (errors: Record<string, string | undefined>) => void;
}

export interface UseFormReturn<T extends Record<string, unknown>> {
  values: T;
  errors: Record<string, string | undefined>;
  touched: Record<string, boolean>;
  valid: ReturnType<typeof computed<boolean>>;
  dirty: ReturnType<typeof computed<boolean>>;
  registerField: (name: string | number, controller: FormFieldController) => () => void;
  validateField: (name: string | number) => Promise<string | true>;
  validate: () => Promise<boolean>;
  clearValidate: (name?: string | number) => void;
  setFieldValue: (name: string | number, value: unknown) => void;
  resetField: (name: string | number) => void;
  reset: () => void;
  submit: () => Promise<void>;
  context: FormContext;
}

/**
 * 无头表单模型：字段注册/注销、整表聚合值、同步/异步规则校验、
 * 提交、重置与脏检查。组件只负责布局与错误提示渲染。
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T> = {},
): UseFormReturn<T> {
  const {
    modelValue,
    defaultValue,
    rules = {} as FormRules<T>,
    disabled = false,
    labelPosition,
    onChange,
    onSubmit,
    onInvalid,
  } = options;

  const initialSnapshot = () =>
    ({ ...(toValue(modelValue) ?? defaultValue ?? ({} as T)) }) as Record<string, unknown>;

  const values = reactive({
    ...initialSnapshot(),
  }) as T;

  const errors = reactive<Record<string, string | undefined>>({});
  const touched = reactive<Record<string, boolean>>({});
  const fields = new Map<string, FormFieldController>();
  const submitting = ref(false);

  const currentRules = () => toValue(rules);

  const setFieldValue = (name: string | number, value: unknown) => {
    const key = String(name);
    values[key as keyof T] = value as T[keyof T];
  };

  const registerField = (name: string | number, controller: FormFieldController) => {
    const key = String(name);
    fields.set(key, controller);
    if (!(key in values) && controller.getValue) {
      setFieldValue(key, controller.getValue());
    }
    return () => {
      fields.delete(key);
    };
  };

  const validateField = async (name: string | number): Promise<string | true> => {
    const key = String(name);
    let error: string | undefined;
    // 已注册字段：由字段自身合并表单规则与字段规则后校验
    const controller = fields.get(key);
    if (controller) {
      const result = await controller.validate();
      error = result === true ? undefined : result;
    } else {
      const formRules = normalizeRules(currentRules()[key as keyof T] as never);
      error = await runRules(values[key], values, formRules);
    }
    errors[key] = error;
    return error ?? true;
  };

  const validate = async (): Promise<boolean> => {
    const names = new Set<string>([...fields.keys(), ...Object.keys(currentRules())]);
    const results = await Promise.all(
      Array.from(names).map(async (name) => [name, await validateField(name)] as const),
    );
    const valid = results.every(([, result]) => result === true);
    return valid;
  };

  const clearValidate = (name?: string | number) => {
    if (name === undefined) {
      Object.keys(errors).forEach((key) => delete errors[key]);
    } else {
      delete errors[String(name)];
    }
  };

  const resetField = (name: string | number) => {
    const key = String(name);
    if (key in initialSnapshot()) setFieldValue(key, initialSnapshot()[key]);
    delete errors[key];
    delete touched[key];
    fields.get(key)?.reset();
  };

  const reset = () => {
    const snapshot = initialSnapshot();
    Object.keys(values).forEach((key) => {
      if (!(key in snapshot)) delete (values as Record<string, unknown>)[key];
    });
    Object.assign(values, snapshot);
    Array.from(fields.values()).forEach((field) => field.reset());
    Object.keys(errors).forEach((key) => delete errors[key]);
    Object.keys(touched).forEach((key) => delete touched[key]);
  };

  const submit = async () => {
    if (submitting.value) return;
    const valid = await validate();
    if (!valid) {
      onInvalid?.({ ...errors });
      return;
    }
    submitting.value = true;
    try {
      await onSubmit?.({ ...values });
    } finally {
      submitting.value = false;
    }
  };

  // 值变化时回发（受控表单由宿主保存新值）
  watch(
    values,
    (next) => {
      onChange?.({ ...next } as T);
    },
    { deep: true },
  );

  const validState = computed(() => Object.values(errors).every((error) => error === undefined));
  const dirty = computed(() => JSON.stringify(values) !== JSON.stringify(initialSnapshot()));

  const context: FormContext = {
    values: values as Record<string, unknown>,
    errors,
    registerField,
    getFieldRules: (name) => currentRules()[String(name) as keyof T],
    submit,
    reset,
    setFieldValue,
    disabled,
    labelPosition,
  };

  provideForm(context);

  return {
    values,
    errors,
    touched,
    valid: validState,
    dirty,
    registerField,
    validateField,
    validate,
    clearValidate,
    setFieldValue,
    resetField,
    reset,
    submit,
    context,
  };
}
