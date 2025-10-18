import type { Page } from 'playwright'
import { log } from 'crawlee'

export async function getProductDesc(page: Page, selector: string) {
  try {
    const productDesc = await page.$eval(`${selector}`, el => el.innerHTML || '')
    return productDesc
  }
  catch {
    log.error(`无法找到简介选择器: ${selector}`)
    return ''
  }
}
