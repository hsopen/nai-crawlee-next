import * as fs from 'node:fs'
import { Sitemap } from 'crawlee'
import { XMLParser } from 'fast-xml-parser'

export async function getUrlList(sitemapPath: string[], includeKeywords: string[], excludeKeywords: string[]) {
  // 判断类型是否一致
  const isUrl = (str: string) => /^https?:\/\//.test(str)
  const allAreUrls = sitemapPath.every(isUrl)
  const allAreLocal = sitemapPath.every(p => !isUrl(p))
  if (!(allAreUrls || allAreLocal)) {
    throw new Error('类型不一致：数组中既有 http(s) 链接也有本地路径')
  }
  // 先过滤掉数组中的空字符串
  sitemapPath = sitemapPath.filter(p => p && p.trim() !== '')
  includeKeywords = includeKeywords.filter(kw => kw && kw.trim() !== '')
  excludeKeywords = excludeKeywords.filter(kw => kw && kw.trim() !== '')

  if (sitemapPath.length === 0) {
    throw new Error('sitemapPath 不能为空，请检查配置文件')
  }

  const shouldFilter = includeKeywords.length > 0 && excludeKeywords.length > 0

  if (allAreUrls) {
    const sitemap = await Sitemap.load(sitemapPath)
    console.log(`${sitemapPath}`)
    const urls = sitemap.urls
    if (shouldFilter) {
      const filteredUrls = urls.filter((url) => {
        const include = includeKeywords.every(kw => url.includes(kw))
        const exclude = excludeKeywords.every(kw => !url.includes(kw))
        return include && exclude
      })
      console.log(`全部URL 数量: ${urls.length}, 过滤后数量: ${filteredUrls.length}`)
      return filteredUrls
    }
    else {
      console.log(`全部URL 数量: ${urls.length}, 未使用过滤条件`)
      return urls
    }
  }
  // 全是本地路径，支持本地 sitemap.xml 文件解析
  const urls: string[] = []
  const parser = new XMLParser()
  for (const filePath of sitemapPath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (filePath.endsWith('.xml')) {
      // 解析 sitemap.xml
      const xml = parser.parse(content)
      if (xml.urlset && xml.urlset.url) {
        for (const urlObj of Array.isArray(xml.urlset.url) ? xml.urlset.url : [xml.urlset.url]) {
          if (urlObj.loc)
            urls.push(urlObj.loc)
        }
      }
    }
    else {
      urls.push(...content.split(/\r?\n/).filter(line => line.trim()))
    }
  }
  // 本地路径也做关键词过滤
  if (shouldFilter) {
    const filteredUrls = urls.filter((url) => {
      const include = includeKeywords.every(kw => url.includes(kw))
      const exclude = excludeKeywords.every(kw => !url.includes(kw))
      return include && exclude
    })
    console.log(`全部URL 数量: ${urls.length}, 过滤后数量: ${filteredUrls.length}`)
    return filteredUrls
  }
  else {
    console.log(`全部URL 数量: ${urls.length}, 未使用过滤条件`)
    return urls
  }
}
