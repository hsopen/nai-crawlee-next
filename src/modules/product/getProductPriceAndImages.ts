import type { Page } from 'playwright'
import { getReplaces } from '../../utils/getReplaces.js'

export async function getProductPriceAndImages(
  page: Page,
  colorButtons: string,
  imageSelectors: string[],
  priceSelectors: string[],
  imagesReplaces: string[],
  pricesReplaces: string[],
  att2Values: string[],
  att3Values: string[],
  baseUrl: string,
  imageParam: boolean,
  dpIsDot: boolean,
  imageProperty: string,
) {
  let prices: string[] = []
  let images: string[] = []
  if (colorButtons) {
    const att1Buttons = await page.$$(colorButtons)

    // 如果有 att2Values/att3Values 参数可用，则如下：
    const att2Set = att2Values.length > 0 ? att2Values : ['']
    const att3Set = att3Values.length > 0 ? att3Values : ['']

    if (att1Buttons.length === 1) {
      const price = await getFirstValue(page, priceSelectors, 'prices')
      const imageSrcs = await getFirstValue(page, imageSelectors, 'images', imageProperty)
      prices.push(...price)
      images.push(...imageSrcs)
    }
    else {
      for (let i = 0; i < att1Buttons.length; i++) {
        const button = att1Buttons[i]
        if (!button) {
          continue
        }

        await button.click()
        await page.waitForTimeout(1000)

        let price: string[] = []
        try {
          price = await getFirstValue(page, priceSelectors, 'prices')
        }
        catch {
          price = []
        }

        let imageSrcs: string[] = []
        try {
          imageSrcs = await getFirstValue(page, imageSelectors, 'images', imageProperty)
        }
        catch {
          imageSrcs = []
        }

        const uniqueImages = [...new Set(imageSrcs)]
        images.push(...uniqueImages)

        const comboCount = (att2Set.length > 0 ? att2Set.length : 1) * (att3Set.length > 0 ? att3Set.length : 1)

        for (let i = 0; i < comboCount; i++) {
          prices.push(...price)
        }
      }
    }
  }
  else {
    prices = await getFirstValue(page, priceSelectors, 'prices')
    images = await getFirstValue(page, imageSelectors, 'images', imageProperty)
  }

  images = [...new Set(images)]

  if ([...new Set(prices)].length === 1) {
    prices = [prices[0]!]
  }

  // 补全图片链接并过滤掉 base64 图片
  images = images
    .map((img) => {
      // 过滤掉空值和 base64 图片（data:image/ 开头）
      if (!img || /^data:image\//i.test(img))
        return ''
      // 1. 已经是绝对链接（http/https 开头）
      if (/^https?:\/\//.test(img))
        return img
      // 2. 协议相对链接（//photopea.com/xxx）
      if (/^\/\//.test(img)) {
        return `https:${img}`
      }
      // 3. 以 /as/xxx 开头的相对路径，拼接 baseUrl.origin
      if (/^\/as\//.test(img)) {
        try {
          const urlObj = new URL(baseUrl)
          return urlObj.origin + img
        }
        catch {
          return img
        }
      }
      // 4. 以 /域名/xxx 开头（如 /footwearetc.com/xxx），补全为 https:
      if (/^\/[\w.-]+\.[a-z]{2,}\//i.test(img)) {
        return `https:${img}`
      }
      // 5. 其他 / 开头的相对路径，拼接 baseUrl.origin
      if (img.startsWith('/')) {
        try {
          const urlObj = new URL(baseUrl)
          return urlObj.origin + img
        }
        catch {
          return img
        }
      }
      // 6. 其他情况，按原逻辑补全（baseUrl.origin + path + img）
      try {
        const urlObj = new URL(baseUrl)
        let path = urlObj.pathname
        if (!path.endsWith('/'))
          path = path.replace(/\/[^/]*$/, '/')
        return urlObj.origin + path + img
      }
      catch {
        return img
      }
    })
    // 过滤掉 map 过程中产生的空字符串
    .filter(img => !!img)

  // 处理图片链接参数
  if (!imageParam) {
    // 移除图片链接中的参数
    images = images.map(img => img.split('?')[0]!)
  }

  // 处理价格中的点号和逗号
  if (dpIsDot) {
    // 只保留数字和点号，去除逗号等其他字符
    prices = prices.map(price => price.replace(/[^0-9.]/g, ''))
  }
  else {
    // 将点号替换为逗号作为小数分隔符（仅替换最后一个点号）
    prices = prices.map((price) => {
      price = price.replace(',', '.')
      return price
    })
  }

  // 处理价格中多个点号，只保留最后一个点号
  prices = prices.map((price) => {
    const dotCount = (price.match(/\./g) || []).length
    if (dotCount <= 1)
      return price
    // 只保留最后一个点号
    const lastDot = price.lastIndexOf('.')
    // 移除所有点号
    const num = price.replace(/\./g, '')
    // 在最后一个点号位置插入点号
    return `${num.slice(0, lastDot - (dotCount - 1))}.${num.slice(lastDot - (dotCount - 1))}`
  })

  images = getReplaces(images, imagesReplaces)
  prices = getReplaces(prices, pricesReplaces)

  return { prices, images }
}

/**
 * 依次尝试选择器数组，返回第一个获取到的所有元素内容（数组）
 * @param page Playwright Page
 * @param selectors 选择器数组
 * @returns 第一个获取到的内容数组，没有则返回空数组
 */
export async function getFirstValue(page: Page, selectors: string[], type: 'prices' | 'images', imageProperty?: string): Promise<string[]> {
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i]
    if (!selector) {
      continue
    }

    try {
      let values: string[] = []
      if (type === 'images') {
        const property = imageProperty || 'src'
        values = await page.$$eval(selector, (els, prop) => els.map(el => el.getAttribute(prop) || ''), property)
      }
      else {
        values = await page.$$eval(selector, els => els.map(el => el.textContent?.trim() || ''))
        // 只保留数字、点号和逗号
        values = values.map(v => v.replace(/[^\d.,]/g, ''))
      }

      // 过滤掉undefined和空字符串
      values = values.filter(v => v !== undefined && v !== '')

      if (values.length > 0) {
        return values
      }
    }
    catch {
      // 选择器未命中，继续下一个
    }
  }

  return []
}
