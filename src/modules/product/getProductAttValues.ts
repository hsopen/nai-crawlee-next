import type { Page } from 'playwright'
import { getReplaces } from '../../utils/getReplaces.js'
import { actionClick } from '../actionClick.js'

export async function getProductAttValues(page: Page, selector: string, preClick: string[], replaces: string[], property: string) {
  if (!selector || selector.trim() === '') {
    return []
  }
  await actionClick(page, preClick)

  let productAttValues: string[]
  if (!property) {
    productAttValues = await page.$$eval(`${selector}`, els => els.map(el => el.textContent?.trim() || ''))
  }
  else {
    productAttValues = await page.$$eval(`${selector}`, (els, prop) => els.map(el => (el as HTMLElement).getAttribute(prop) || ''), property)
  }
  // 处理替换规则
  productAttValues = getReplaces(productAttValues, replaces)
  return productAttValues || []
}
