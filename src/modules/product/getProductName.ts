import type { Page } from 'playwright'
import { log } from 'crawlee'

export async function getProductName(page: Page, selectors: string[], extSelector?: string, property?: string) {
  // 尝试每个选择器，直到找到有结果的选择器
  for (const selector of selectors) {
    try {
      let productName = ''
      const prop = property || 'textContent'

      if (prop === 'textContent') {
        productName = await page.$eval(`${selector}`, el => el.textContent?.trim() || '')
      }
      else {
        productName = await page.$eval(`${selector}`, el => el.getAttribute(prop) || '')
      }

      if (productName) {
        if (extSelector) {
          const extendedName = await page.$eval(`${extSelector}`, el => el.textContent?.trim() || '')
          productName = `${productName} - ${extendedName}`
        }

        // 清理其中的换行符和多余空格
        productName = productName.replace(/\s+/g, ' ').trim()

        return productName
      }
    }
    catch {
      // 选择器未命中，继续下一个
    }
  }

  // 如果所有选择器都没匹配
  log.error(`无法找到产品名选择器: ${selectors.join(', ')}`)
  return ''
}
