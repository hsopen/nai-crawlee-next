import type { Page } from 'playwright'

export async function getProductDesc(page: Page, selector: string) {
  try {
    const productDesc = await page.$eval(`${selector}`, el => el.innerHTML || '')
    return productDesc
  }
  catch {
    return ''
  }
}
