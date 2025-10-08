import type { Page } from 'playwright'

/**
 *
 * @param page 页面对象
 * @param selectors 选择器数组
 * @returns 无
 */
export async function replicesClick(page: Page, selectors: string[]) {
  if (selectors.length === 0) {
    return
  }
  for (const selector of selectors) {
    const elements = await page.$$(selector)
    for (const element of elements) {
      await element.click()
      await page.waitForTimeout(5000)
    }
  }
}
