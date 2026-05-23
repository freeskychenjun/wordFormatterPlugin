import { validateRule } from '../config/rule-schema.js';

export function exportRuleToFile(rule) {
  const json = JSON.stringify(rule, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${rule.name || '排版规则'}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importRuleFromFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return reject(new Error('未选择文件'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const rule = JSON.parse(ev.target.result);
          const validation = validateRule(rule);
          if (!validation.valid) {
            reject(new Error(`规则格式错误: ${validation.errors.join('; ')}`));
            return;
          }
          resolve(rule);
        } catch (err) {
          reject(new Error('JSON 解析失败'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}
