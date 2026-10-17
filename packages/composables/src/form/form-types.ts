/**
 * 表单领域共享类型。
 */

/** 校验规则：返回 true 通过，返回字符串作为错误信息；支持异步 */
export type FormRule<T = unknown> = (
  value: T,
  values: Record<string, unknown>,
) => string | true | Promise<string | true>;

/** 必填规则的简写配置（由组件内构造为 FormRule） */
export interface FieldRuleConfig<T = unknown> {
  required?: boolean;
  message?: string;
  validator?: FormRule<T>;
  trigger?: 'change' | 'blur' | 'submit';
}

export type FormRules<T extends Record<string, unknown>> = Partial<
  Record<keyof T, Array<FormRule> | FormRule>
>;

/** 将单条或数组规则统一为数组 */
export function normalizeRules(rule: Array<FormRule> | FormRule | undefined): FormRule[] {
  if (!rule) return [];
  return Array.isArray(rule) ? rule : [rule];
}

/** 顺序执行规则，遇到首个失败即返回错误信息；全部通过返回 undefined */
export async function runRules(
  value: unknown,
  values: Record<string, unknown>,
  rules: FormRule[],
): Promise<string | undefined> {
  for (const rule of rules) {
    // 同步抛错归一化为错误信息
    const result = await Promise.resolve()
      .then(() => rule(value, values))
      .catch((err: unknown) => (err instanceof Error ? err.message : String(err)));
    if (result !== true) return result;
  }
  return undefined;
}
