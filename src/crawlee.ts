import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Configuration, Dataset, PlaywrightCrawler, ProxyConfiguration, RequestQueue } from 'crawlee'
import { v7 as uuidv7 } from 'uuid'
import { actionClick } from './modules/actionClick.js'
import { getProductAttValues } from './modules/product/getProductAttValues.js'
import { getProductCategory } from './modules/product/getProductCategory.js'
import { getProductDesc } from './modules/product/getProductDesc.js'
import { getProductName } from './modules/product/getProductName.js'
import { getProductPriceAndImages } from './modules/product/getProductPriceAndImages.js'
import { getUrlList } from './utils/getUrlList.js'
import { preCheckTaskConfig } from './utils/preCheckTaskConfig.js'

export async function createCrawlerInstance(configPath: string) {
  const taskConfig = preCheckTaskConfig(configPath)
  const requestQueue = await RequestQueue.open(`${taskConfig.name}`)

  let siteNum = 0
  let siteCount = 0
  let productsCount = 0

  let maxRequestsPerCrawl = taskConfig.config.maxRequestsPerCrawl
  if (taskConfig.config.test) {
    maxRequestsPerCrawl = 5
  }
  const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: [taskConfig.config.proxyConfiguration],
  })

  const config = new Configuration({
    persistStorage: true,
    persistStateIntervalMillis: 30_000,
    purgeOnStart: false,
    defaultDatasetId: `${taskConfig.name}`,
    defaultKeyValueStoreId: `${taskConfig.name}`,
    defaultRequestQueueId: `${taskConfig.name}`,
  })

  const crawler = new PlaywrightCrawler({
    requestQueue,
    proxyConfiguration,
    maxRequestsPerCrawl,
    maxConcurrency: taskConfig.config.maxConcurrency,
    minConcurrency: taskConfig.config.minConcurrency,
    navigationTimeoutSecs: taskConfig.config.navigationTimeoutSecs,
    maxRequestRetries: taskConfig.config.maxRequestRetries,
    headless: taskConfig.config.headless,
    requestHandlerTimeoutSecs: taskConfig.config.requestHandlerTimeoutSecs,
    async requestHandler({ request, page }) {
      const baseUrl = new URL(request.url).origin
      const cssBase = taskConfig.css.base

      // 统一赋值所有选择器变量
      const waitingTime = taskConfig.css.ext.waitingTime * 1000 || 0
      const nameSelector = cssBase.name.selector || ''
      const nameExtSelector = cssBase.name.extSelector || ''
      const descSelector = cssBase.description.selector || ''
      const categorySelector = cssBase.categorys.selector || ''
      const att1ValuesSelector = cssBase.att1Values.selector || ''
      const att2ValuesSelector = cssBase.att2Values.selector || ''
      const att3ValuesSelector = cssBase.att3Values.selector || ''
      const colorButtonsSelector = cssBase.colorButtons.selector || ''
      const imagesSelectors = Array.isArray(cssBase.images.selectors) ? cssBase.images.selectors.filter(Boolean) : []
      const pricesSelectors = Array.isArray(cssBase.prices.selectors) ? cssBase.prices.selectors.filter(Boolean) : []

      try {
        await actionClick(page, taskConfig.css.ext.startClick || [])
        // 获取产品名称
        await page.waitForTimeout(waitingTime) // 等待10秒，确保页面加载完成
        const productName = await getProductName(page, nameSelector, nameExtSelector)
        // 获取简介
        const productDesc = await getProductDesc(page, descSelector)
        // 获取分类
        const productCategory = await getProductCategory(page, categorySelector, cssBase.categorys.slice || '', cssBase.categorys.replaces || [])
        // 获取属性一Name
        const productAtt1Name = cssBase.att1Name.text
        const productAtt2Name = cssBase.att2Name.text
        const productAtt3Name = cssBase.att3Name.text
        // 获取属性一Values
        const productAtt1Values = await getProductAttValues(page, att1ValuesSelector, cssBase.att1Values.preClick || [], cssBase.att1Values.replaces || [], cssBase.att1Values.property || '')
        const productAtt2Values = await getProductAttValues(page, att2ValuesSelector, cssBase.att2Values.preClick || [], cssBase.att2Values.replaces || [], cssBase.att2Values.property || '')
        const productAtt3Values = await getProductAttValues(page, att3ValuesSelector, cssBase.att3Values.preClick || [], cssBase.att3Values.replaces || [], cssBase.att3Values.property || '')
        const { prices, images } = await getProductPriceAndImages(
          page,
          colorButtonsSelector,
          imagesSelectors,
          pricesSelectors,
          cssBase.images.replaces || [],
          cssBase.prices.replaces || [],
          productAtt2Values,
          productAtt3Values,
          baseUrl,
          cssBase.images.param,
          cssBase.prices.dpIsDot,
        )
        if (productName === '' || prices.length === 0 || productCategory === '' || images.length === 0) {
          return
        }
        const dataset = await Dataset.open(`${taskConfig.name}`)
        await dataset.pushData({
          'Type': 'variable',
          'SKU': uuidv7().replace(/-/g, '').toUpperCase(),
          'Name': productName,
          'Published': 1,
          'Is featured?': '',
          'Visibility in catalog': 'visible',
          'Short description': '',
          'Description': productDesc,
          'Date sale price starts': '',
          'Date sale price ends': '',
          'Tax status': 'taxable',
          'Tax class': '',
          'In stock?': 1,
          'Stock': '1000',
          'Backorders allowed?': 1,
          'Sold individually?': 0,
          'Weight (lbs)': '',
          'Length (in)': '',
          'Width (in)': '',
          'Height (in)': '',
          'Allow customer reviews?': 1,
          'Purchase note': '',
          'Sale price': '',
          'Regular price': prices[0],
          'Categories': productCategory,
          'Tags': '',
          'Shipping class': '',
          'Images': images.join(','),
          'Download limit': '',
          'Download expiry days': '',
          'Parent': '',
          'Grouped products': '',
          'Upsells': '',
          'Cross-sells': '',
          'External URL': '',
          'Button text': '',
          'Position': '',
          'Attribute 1 name': productAtt1Name,
          'Attribute 1 value(s)': productAtt1Values.join(','),
          'Attribute 1 visible': '1',
          'Attribute 1 global': '1',
          'Attribute 2 name': productAtt2Name,
          'Attribute 2 value(s)': productAtt2Values.join(','),
          'Attribute 2 visible': '1',
          'Attribute 2 global': '1',
          'Attribute 3 name': productAtt3Name,
          'Attribute 3 value(s)': productAtt3Values.join(','),
          'Attribute 3 visible': '',
          'Attribute 3 global': '',
          'zcp': prices.join(','),
          'Sub_sku': '',
          'Rec': 1,
          'URL': request.url,
        })

        // 统计代码
        productsCount++
        siteCount++
        const completion = siteNum > 0 ? (siteCount / siteNum) * 100 : 0
        console.log(
          `队列链接数: ${siteNum}, 已获取商品数: \x1B[32m${productsCount}\x1B[0m, 已访问链接数: \x1B[34m${siteCount}\x1B[0m, 完成度: \x1B[32m${completion.toFixed(2)}%\x1B[0m`,
        )
      }
      catch { }
    },
  }, config)

  const dataset = await Dataset.open(`${taskConfig.name}`)
  const urls = await getUrlList(taskConfig.sitemap.siteMapPath, taskConfig.sitemap.INCLUDE_KEYWORD, taskConfig.sitemap.EXCLUDE_KEYWORD)
  siteNum = urls.length
  await crawler.run(urls)
  // 先以英文名导出 CSV
  await dataset.exportToCSV(`${taskConfig.name}`)

  // 导出后重命名为 lang+currency+name.csv，避免中文
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const storageDir = path.resolve(__dirname, '../storage/key_value_stores/default')
  const srcCsv = path.join(storageDir, `${taskConfig.name}.csv`)
  const destCsv = path.join(storageDir, `${taskConfig.lang}${taskConfig.currency}${taskConfig.name}.csv`)
  try {
    await fs.rename(srcCsv, destCsv)
    console.log(`CSV已重命名为: ${destCsv}`)
  }
  catch (err) {
    console.error('CSV重命名失败:', err)
  }

  // 任务完成后处理配置文件
  if (!taskConfig.config.test) {
    const yamlPath = configPath
    const doneDir = path.join(path.dirname(path.dirname(yamlPath)), 'done')
    if (!(await fs.stat(doneDir).catch(() => false))) {
      await fs.mkdir(doneDir, { recursive: true })
    }
    // 读取原yaml内容
    let yamlContent = await fs.readFile(yamlPath, 'utf-8')
    // 写入endAt时间（本地时间格式）
    const now = new Date().toLocaleString()
    if (/^endAt\s*:/m.test(yamlContent)) {
      yamlContent = yamlContent.replace(/^endAt\s*:.*$/m, `endAt: ${now}`)
    }
    else {
      yamlContent = yamlContent.replace(/^(name\s*:\s*(?:\S.*)?)$/m, `$1\nendAt: ${now}`)
    }
    // 写入到done目录
    const destPath = path.join(doneDir, path.basename(yamlPath))
    await fs.writeFile(destPath, yamlContent, 'utf-8')
    // 删除原文件
    await fs.unlink(yamlPath)
    console.log(`已完成任务，配置文件已移动到: ${destPath}`)
  }
}
