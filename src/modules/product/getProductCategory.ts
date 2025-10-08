import type { Page } from 'playwright'
import { getReplaces } from '../../utils/getReplaces.js'

export async function getProductCategory(page: Page, selector: string, slice: string, replaces: string[]) {
  const sliceArr = slice.split('<|>').map(s => s.trim()).filter(Boolean)
  let productCategory = await page.$$eval(`${selector}`, els => els.map(el => el.textContent?.trim() || ''))

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
