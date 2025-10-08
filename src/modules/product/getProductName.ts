import type { Page } from 'playwright'

export async function getProductName(page: Page, selector: string, extSelector?: string) {
  let productName = await page.$eval(`${selector}`, el => el.textContent?.trim() || '')

  if (extSelector) {
    const extendedName = await page.$eval(`${extSelector}`, el => el.textContent?.trim() || '')
    productName = `${productName} - ${extendedName}`
  }

  // 清理其中的换行符和多余空格
  productName = productName.replace(/\s+/g, ' ').trim()

  return productName
}
