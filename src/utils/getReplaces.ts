/**
 * 批量替换字符串数组中的内容
 * @param arr 待处理的字符串数组
 * @param replaces 替换规则数组，如 ['123<|>asd', 'qwe<|>456']
 * @returns 替换后的字符串数组
 */
export function getReplaces(arr: string[], replaces: string[]): string[] {
  // 解析替换规则
  const rules = replaces
    .map((item) => {
      const [from, to] = item.split('<|>')
      // 只处理from和to都为字符串且不为空的规则
      if (typeof from === 'string' && typeof to === 'string' && from !== '') {
        return { from, to }
      }
      return null
    })
    .filter(Boolean) as { from: string, to: string }[]

  return arr.map((str) => {
    let result = str
    for (const rule of rules) {
      result = result.replaceAll(rule.from, rule.to ?? '')
    }
    return result
  })
}
