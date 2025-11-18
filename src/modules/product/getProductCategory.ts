import type { Page } from 'playwright'
import { log } from 'crawlee'
import { getReplaces } from '../../utils/getReplaces.js'

export async function getProductCategory(page: Page, selectors: string[], slice: string, replaces: string[]) {
  const sliceArr = slice.split('<|>').map(s => s.trim()).filter(Boolean)

  // 尝试每个选择器，直到找到有结果的选择器
  for (const selector of selectors) {
    try {
      let productCategory = await page.$$eval(`${selector}`, els => els.map(el => el.textContent?.trim() || ''))

      // 过滤掉空值
      productCategory = productCategory.filter(category => category !== '')

      if (productCategory.length > 0) {
        if (sliceArr.length === 1) {
          productCategory = productCategory.slice(Number(sliceArr[0]))
        }
        else if (sliceArr.length === 2) {
          productCategory = productCategory.slice(Number(sliceArr[0]), Number(sliceArr[1]))
        }

        productCategory = getReplaces(productCategory, replaces)
        productCategory = [...new Set(productCategory)] // 去重
        return productCategory.join('>')
      }
    }
    catch {
      // 选择器未命中，继续下一个
    }
  }

  // 如果所有选择器都没匹配
  log.error(`无法找到分类选择器: ${selectors.join(', ')}`)
  return ''
}
