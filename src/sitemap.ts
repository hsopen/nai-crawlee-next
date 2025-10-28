import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CheerioCrawler, Configuration, PlaywrightCrawler, ProxyConfiguration } from 'crawlee'

export async function crawlSitemap(
  homepage: string,
  isDynamic: boolean,
  onlySelector: string,
  maximumProductQuantity: number,
  maxThreads: number,
  proxy: number | string | string[] = 8800
) {
  const homepageUrlObj = new URL(homepage)
  const host = homepageUrlObj.host
  const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  const sitemapDir = path.join(projectRoot, 'sitemap')
  const sitemapFile = path.join(sitemapDir, `${host}_sitemap.xml`)
  const sitemapUrls: Set<string> = new Set()
  let proxyConfiguration: ProxyConfiguration | undefined
  let proxyUrls: string[] = []
  if (typeof proxy === 'number' && proxy !== 0) {
    proxyUrls = [`http://localhost:${proxy}`]
  } else if (typeof proxy === 'string' && proxy) {
    // 自动识别逗号分隔的字符串为数组
    if (proxy.includes(',')) {
      proxyUrls = proxy.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
    } else {
      proxyUrls = [proxy.trim().replace(/^"|"$/g, '')]
    }
  } else if (Array.isArray(proxy) && proxy.length > 0) {
    proxyUrls = proxy
  }
  if (proxyUrls.length > 0) {
    proxyConfiguration = new ProxyConfiguration({
      proxyUrls,
    })
  }

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
      ...(proxyConfiguration ? { proxyConfiguration } : {}),
      async requestHandler({ page, request }) {
        try {
          const count = await page.locator(onlySelector).count()
          if (count > 0) {
            const cleanUrl = request.url!.split('?')[0] as string
            const encodedUrl = encodeURI(cleanUrl)
            if (!sitemapUrls.has(encodedUrl)) {
              sitemapUrls.add(encodedUrl)
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
        const allowedExts = ['', '.html', '.htm']
        const excludeExts = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mp3', '.zip', '.rar']
        const getExt = (url: string) => {
          const pathname = new URL(url).pathname
          const lastDot = pathname.lastIndexOf('.')
          if (lastDot === -1)
            return ''
          return pathname.substring(lastDot).toLowerCase()
        }
        const modifiedLinks = links
          .map((href: string | undefined) => {
            if (!href)
              return null
            try {
              const absUrl = new URL(href, request.url).href.split('?')[0]
              if (absUrl && new URL(absUrl).host === host) {
                const ext = getExt(absUrl)
                if (
                  (allowedExts.includes(ext) || ext === '')
                  && !excludeExts.includes(ext)
                ) {
                  return absUrl
                }
              }
              return null
            }
            catch {
              return null
            }
          })
          .filter((url): url is string => url !== null)

        // 严格过滤不合规元素
        const newLinks = modifiedLinks
          .filter((url: unknown) =>
            typeof url === 'string'
            && url.length > 0
            && /^https?:\/\//.test(url)
            && !sitemapUrls.has(url),
          )
          .map(url => ({ url: encodeURI(url), uniqueKey: encodeURI(url) }))

        if (newLinks.length > 0) {
          try {
            await crawler.addRequests(newLinks)
          }
          catch (err) {
            console.error('addRequests error:', err, newLinks)
          }
        }
        if (sitemapUrls.size >= maximumProductQuantity) {
          crawler.stop()
        }
      },
    }, config)
  }
  else {
    crawler = new CheerioCrawler({
      maxConcurrency: maxThreads,
      ...(proxyConfiguration ? { proxyConfiguration } : {}),
      async requestHandler({ $, request }) {
        try {
          console.log('requestUrl', request.url)
          console.log('$', $.html().slice(0, 10)) // 打印部分 HTML 内容以调试
          const elements = $(onlySelector)
          if (elements.length > 0) {
            const cleanUrl = request.url!.split('?')[0] as string
            const encodedUrl = encodeURI(cleanUrl)
            if (!sitemapUrls.has(encodedUrl)) {
              sitemapUrls.add(encodedUrl)
              await writeXml()
            }
          }
        }
        catch {
          // 选择器超时，跳过添加此页面到 sitemap
        }
        const hrefs = $('a').map((i, el) => $(el).attr('href')).get()
        const validHrefs = hrefs.filter((href: string | undefined): href is string => href !== undefined)
        const allowedExts = ['', '.html', '.htm']
        const excludeExts = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico', '.css', '.js', '.woff', '.woff2', '.ttf', '.otf', '.eot', '.mp4', '.mp3', '.zip', '.rar']
        const getExt = (url: string) => {
          const pathname = new URL(url).pathname
          const lastDot = pathname.lastIndexOf('.')
          if (lastDot === -1)
            return ''
          return pathname.substring(lastDot).toLowerCase()
        }
        const modifiedUrls = validHrefs.map((href: string | undefined) => {
          if (!href)
            return null
          try {
            const absUrl = new URL(href, request.url).href.split('?')[0]
            if (absUrl && new URL(absUrl).host === host) {
              const ext = getExt(absUrl)
              if (
                (allowedExts.includes(ext) || ext === '')
                && !excludeExts.includes(ext)
              ) {
                return absUrl
              }
            }
            return null
          }
          catch {
            return null
          }
        })
  const links = modifiedUrls.filter((url): url is string => url !== null)

        // 严格过滤不合规元素
        const newLinks = links
          .filter((url: unknown) =>
            typeof url === 'string'
            && url.length > 0
            && /^https?:\/\//.test(url)
            && !sitemapUrls.has(encodeURI(url)),
          )
          .map(url => ({ url: encodeURI(url), uniqueKey: encodeURI(url) }))

        if (newLinks.length > 0) {
          try {
            await crawler.addRequests(newLinks)
          }
          catch (err) {
            console.error('addRequests error:', err, newLinks)
          }
        }
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
