import type { Page } from 'playwright'

export async function getProductDesc(page: Page, selector: string) {
  const productDesc = await page.$eval(`${selector}`, el => el.innerHTML || '')
  return productDesc
}
