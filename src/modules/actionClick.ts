import type { Page } from 'playwright'

export async function actionClick(page: Page, preClick: string[]) {
  try {
    // 过滤掉空的选择器
    preClick = preClick.filter(selector => selector && selector.trim() !== '')

    // 依次点击每个选择器
    for (const selector of preClick) {
      const element = await page.$(selector)
      if (element) {
        await element.click()
        await page.waitForTimeout(2000) // 等待2秒以确保内容加载
      }
    }
  }
  catch {}
}
