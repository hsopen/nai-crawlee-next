import type { Page } from 'playwright'
import { log } from 'crawlee'

export async function getProductDesc(page: Page, selectors: string[]) {
  try {
    for (const selector of selectors) {
      const elHandle = await page.$(selector)
      if (elHandle) {
        const productDesc = await elHandle.innerHTML()
        return productDesc || ''
      }
    }

    // 如果所有选择器都没匹配
    log.error(`无法找到简介选择器: ${selectors.join(', ')}`)
    return ''
  }
  catch (err) {
    log.error(`获取简介时出错: ${selectors.join(', ')}, 错误: ${err}`)
    return ''
  }
}
