import * as fs from 'node:fs'
import * as path from 'node:path'
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

  const shouldFilter = includeKeywords.length > 0 || excludeKeywords.length > 0

  if (allAreUrls) {
    // 先展开传入的 sitemapPath 本身（可能包含 [start:end] 模式），避免把模式当成真实 URL 去请求
    const expandedSitemapPaths = expandRanges(sitemapPath)
    console.log(`请求的 sitemap paths: ${expandedSitemapPaths}`)
    const sitemap = await Sitemap.load(expandedSitemapPaths)
    const urls = sitemap.urls
    // 展开范围模式（例如 https://...-[0:42] 或 https://...-[05:42]）
    const expandedUrls = expandRanges(urls)
    if (shouldFilter) {
      const filteredUrls = expandedUrls.filter((url) => {
        const include = includeKeywords.length === 0 || includeKeywords.every(kw => url.includes(kw))
        const exclude = excludeKeywords.length === 0 || excludeKeywords.every(kw => !url.includes(kw))
        return include && exclude
      })
      console.log(`全部URL 数量: ${expandedUrls.length}, 过滤后数量: ${filteredUrls.length}`)
      return filteredUrls
    }
    else {
      console.log(`全部URL 数量: ${expandedUrls.length}, 未使用过滤条件`)
      return expandedUrls
    }
  }
  // 全是本地路径，支持本地 sitemap.xml 文件解析
  // 如果传入的是文件夹路径，展开为该文件夹内的所有 .xml 文件（递归）
  function collectLocalFiles(pathsArr: string[]): string[] {
    const out: string[] = []
    function walkDir(dir: string) {
      for (const name of fs.readdirSync(dir)) {
        const fp = path.join(dir, name)
        const stat = fs.statSync(fp)
        if (stat.isDirectory()) {
          walkDir(fp)
        }
        else if (stat.isFile() && fp.toLowerCase().endsWith('.xml')) {
          out.push(fp)
        }
      }
    }

    for (const p of pathsArr) {
      if (!p)
        continue
      if (!fs.existsSync(p))
        continue
      const stat = fs.statSync(p)
      if (stat.isDirectory()) {
        walkDir(p)
      }
      else {
        out.push(p)
      }
    }

    return out
  }

  const urls: string[] = []
  const parser = new XMLParser()
  // 把可能的目录展开为具体文件路径
  const expandedFilePaths = collectLocalFiles(sitemapPath)
  if (expandedFilePaths.length === 0) {
    // 如果没有找到任何文件，保守地尝试按原始路径逐个读取（保持向后兼容）
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
  }
  else {
    for (const filePath of expandedFilePaths) {
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
  }
  // 在本地路径解析后也展开范围模式
  const expandedLocal = expandRanges(urls)
  // 本地路径也做关键词过滤
  if (shouldFilter) {
    const filteredUrls = expandedLocal.filter((url) => {
      const include = includeKeywords.length === 0 || includeKeywords.every(kw => url.includes(kw))
      const exclude = excludeKeywords.length === 0 || excludeKeywords.every(kw => !url.includes(kw))
      return include && exclude
    })
    console.log(`全部URL 数量: ${expandedLocal.length}, 过滤后数量: ${filteredUrls.length}`)
    return filteredUrls
  }
  else {
    console.log(`全部URL 数量: ${expandedLocal.length}, 未使用过滤条件`)
    return expandedLocal
  }
}

// 展开范围模式 [start:end]，支持前导零
function expandRanges(urls: string[]): string[] {
  const rangeRe = /\[(\d+):(\d+)\]/g
  const results: string[] = []

  for (const url of urls) {
    // 找到所有匹配的范围，如果没有则直接添加
    const matches = [...url.matchAll(rangeRe)]
    if (matches.length === 0) {
      results.push(url)
      continue
    }

    // 我们需要对多个范围做笛卡尔展开
    const parts: Array<string[]> = []
    let lastIndex = 0
    // 使用替换的方式把固定文本和占位符分开
    const tokens: string[] = []
    for (const m of matches) {
      const idx = m.index ?? 0
      tokens.push(url.slice(lastIndex, idx))
      const startStr = m[1]
      const endStr = m[2]
      if (startStr === undefined || endStr === undefined) {
        // 如果捕获组缺失，则作为原始文本处理
        tokens.push(url.slice(idx, idx + (m[0]?.length ?? 0)))
        lastIndex = idx + (m[0]?.length ?? 0)
        continue
      }
      const width = Math.max(startStr.length, endStr.length)
      const start = Number.parseInt(startStr, 10)
      const end = Number.parseInt(endStr, 10)
      const seq: string[] = []
      const step = start <= end ? 1 : -1
      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        const s = i.toString().padStart(width, '0')
        seq.push(s)
      }
      parts.push(seq)
      tokens.push('__RANGE_PLACEHOLDER__')
      lastIndex = idx + m[0].length
    }
    tokens.push(url.slice(lastIndex))

    // 现在对 parts 做笛卡尔积
    const combos: string[][] = [[]]
    for (const part of parts) {
      const newCombos: string[][] = []
      for (const c of combos) {
        for (const val of part) {
          newCombos.push([...c, val])
        }
      }
      combos.splice(0, combos.length, ...newCombos)
    }

    for (const combo of combos) {
      let built = ''
      let rIdx = 0
      for (const t of tokens) {
        if (t === '__RANGE_PLACEHOLDER__') {
          built += combo[rIdx++]
        }
        else {
          built += t
        }
      }
      results.push(built)
    }
  }

  return results
}
