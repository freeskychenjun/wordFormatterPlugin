const ALIGNMENT_OPTIONS = ['left', 'center', 'right', 'both'];
const LINE_RULE_OPTIONS = ['exact', 'auto', 'atLeast'];

export function validateRule(rule) {
  const errors = [];

  if (!rule.name || typeof rule.name !== 'string') {
    errors.push('规则必须有名称(name)');
  }

  if (rule.pageSetup) {
    for (const key of ['marginTop', 'marginBottom', 'marginLeft', 'marginRight']) {
      if (rule.pageSetup[key] !== undefined && (rule.pageSetup[key] < 0 || rule.pageSetup[key] > 50)) {
        errors.push(`pageSetup.${key} 必须在 0~50 cm 之间`);
      }
    }
  }

  if (rule.styles) {
    for (const [key, style] of Object.entries(rule.styles)) {
      if (style.fontSize !== undefined && (style.fontSize < 5 || style.fontSize > 72)) {
        errors.push(`styles.${key}.fontSize 必须在 5~72 pt 之间`);
      }
      if (style.alignment && !ALIGNMENT_OPTIONS.includes(style.alignment)) {
        errors.push(`styles.${key}.alignment 必须是: ${ALIGNMENT_OPTIONS.join(', ')}`);
      }
      if (style.lineRule && !LINE_RULE_OPTIONS.includes(style.lineRule)) {
        errors.push(`styles.${key}.lineRule 必须是: ${LINE_RULE_OPTIONS.join(', ')}`);
      }
      if (style.spaceBefore !== undefined && style.spaceBefore < 0) {
        errors.push(`styles.${key}.spaceBefore 不能为负数`);
      }
      if (style.spaceAfter !== undefined && style.spaceAfter < 0) {
        errors.push(`styles.${key}.spaceAfter 不能为负数`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export { ALIGNMENT_OPTIONS, LINE_RULE_OPTIONS };
