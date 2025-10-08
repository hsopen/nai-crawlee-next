import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CheerioCrawler, Configuration, PlaywrightCrawler } from 'crawlee'

export async function crawlSitemap(homepage: string, isDynamic: boolean, onlySelector: string, maximumProductQuantity: number, maxThreads: number) {
  const host = new URL(homepage).host
  const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  const sitemapDir = path.join(projectRoot, 'sitemap')
  const sitemapFile = path.join(sitemapDir, `${host}_sitemap.xml`)
  const sitemapUrls: Set<string> = new Set()

  // 尝试读取现有 sitemap
  try {
    await fs.mkdir(sitemapDir, { recursive: true })
    const existingXml = await fs.readFile(sitemapFile, 'utf-8')
    const locMatches = existingXml.match(/<loc>(.*?)<\/loc>/g)
    if (locMatches) {
      locMatches.forEach((match) => {
        const url = match.replace(/<\/?loc>/g, '')
        sitemapUrls.add(url)
      })
    }
  }
  catch {
    // 文件不存在，忽略
  }

  const config = new Configuration({
    persistStorage: true,
    persistStateIntervalMillis: 30_000,
    purgeOnStart: false,
    defaultDatasetId: `${host}_sitemap`,
    defaultKeyValueStoreId: `${host}_sitemap`,
    defaultRequestQueueId: `${host}_sitemap`,
  })

  let crawler: CheerioCrawler | PlaywrightCrawler

  if (isDynamic) {
    // 使用 PlaywrightCrawler for dynamic pages
    crawler = new PlaywrightCrawler({
      maxConcurrency: maxThreads,
      async requestHandler({ page, request }) {
        try {
          const count = await page.locator(onlySelector).count()
          if (count > 0) {
            const cleanUrl = request.url!.split('?')[0] as string
            if (!sitemapUrls.has(cleanUrl)) {
              sitemapUrls.add(cleanUrl)
              await writeXml()
            }
          }
        }
        catch {
          // 选择器超时，跳过添加此页面到 sitemap
        }
        const links = await page.locator('a').evaluateAll(els =>
          els.map(el => (el as HTMLAnchorElement).href).filter(href => href),
        )
        const modifiedLinks = links
          .map((href: string) => {
            try {
              return new URL(href, request.url).href.split('?')[0]
            }
            catch {
              return null
            }
          })
          .filter((url): url is string => url !== null)
        await crawler.addRequests(modifiedLinks.map((url: string) => ({ url, uniqueKey: url })))
        if (sitemapUrls.size >= maximumProductQuantity) {
          crawler.stop()
        }
      },
    }, config)
  }
  else {
    crawler = new CheerioCrawler({
      maxConcurrency: maxThreads,
      async requestHandler({ $, request }) {
        try {
          const elements = $(onlySelector)
          if (elements.length > 0) {
            const cleanUrl = request.url!.split('?')[0] as string
            if (!sitemapUrls.has(cleanUrl)) {
              sitemapUrls.add(cleanUrl)
              await writeXml()
            }
          }
        }
        catch {
          // 选择器超时，跳过添加此页面到 sitemap
        }
        const hrefs = $('a').map((i, el) => $(el).attr('href')).get()
        const validHrefs = hrefs.filter((href: string | undefined): href is string => href !== undefined)
        const modifiedUrls = validHrefs.map((href: string) => {
          try {
            return new URL(href, request.url).href.split('?')[0]
          }
          catch {
            return null
          }
        })
        const links = modifiedUrls.filter((url): url is string => url !== null)
        await crawler.addRequests(links.map((url: string) => ({ url, uniqueKey: url })))
        if (sitemapUrls.size >= maximumProductQuantity) {
          crawler.stop()
        }
      },
    }, config)
  }

  async function writeXml() {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(sitemapUrls).map(url => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`
    await fs.writeFile(sitemapFile, xml, 'utf-8')
  }

  await crawler.run([homepage])
}
