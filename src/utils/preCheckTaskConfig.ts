import type { TaskConfig } from '../types/taskConfig.types.js'
import { parseYamlFile } from './parserYaml.js'

export function preCheckTaskConfig(filePath: string): TaskConfig {
  const taskConfig = parseYamlFile(filePath)

  // 检查sitemap配置
  if (taskConfig.sitemap.siteMapPath.length === 0) {
    throw new Error('sitemap.siteMapPath不能为空，请检查配置文件')
  }
  if (!taskConfig.lang || !taskConfig.currency) {
    throw new Error('lang和currency不能为空，请检查配置文件')
  }

  // 检查最小选择器配置
  const cssBase = taskConfig.css.base
  if (cssBase.name.selector.trim() === '') {
    throw new Error('css.base.name.selector不能为空，请检查配置文件')
  }
  else if (cssBase.categorys.selector.trim() === '') {
    throw new Error('css.base.categorys.selector不能为空，请检查配置文件')
  }
  else if (cssBase.prices.selectors.length === 0 || cssBase.prices.selectors.every(s => s.trim() === '')) {
    throw new Error('css.base.prices.selectors不能为空，请检查配置文件')
  }
  else if (cssBase.images.selectors.length === 0 || cssBase.images.selectors.every(s => s.trim() === '')) {
    throw new Error('css.base.images.selectors不能为空，请检查配置文件')
  }
  else if (cssBase.categorys.slice.split('<|>').length >= 2) {
    throw new Error('css.base.categorys.slice 只能包含一个分隔符 <|>，请检查配置文件')
  }

  // 配置值检查
  if (typeof taskConfig.config.headless !== 'boolean') {
    throw new TypeError('config.headless 必须是布尔值，请检查配置文件')
  }
  else if (typeof taskConfig.config.maxConcurrency !== 'number' || taskConfig.config.maxConcurrency <= 0) {
    throw new TypeError('config.maxConcurrency 必须是大于0的数字，请检查配置文件')
  }
  else if (typeof taskConfig.config.minConcurrency !== 'number' || taskConfig.config.minConcurrency <= 0) {
    throw new TypeError('config.minConcurrency 必须是大于0的数字，请检查配置文件')
  }
  else if (typeof taskConfig.config.navigationTimeoutSecs !== 'number' || taskConfig.config.navigationTimeoutSecs <= 0) {
    throw new TypeError('config.navigationTimeoutSecs 必须是大于0的数字，请检查配置文件')
  }
  else if (typeof taskConfig.config.maxRequestRetries !== 'number' || taskConfig.config.maxRequestRetries < 0) {
    throw new TypeError('config.maxRequestRetries 必须是大于等于0的数字，请检查配置文件')
  }
  else if (typeof taskConfig.config.test !== 'boolean') {
    throw new TypeError('config.test 必须是布尔值，请检查配置文件')
  }
  else if (taskConfig.config.minConcurrency > taskConfig.config.maxConcurrency) {
    throw new TypeError('config.minConcurrency 不能大于 maxConcurrency，请检查配置文件')
  }
  else if (taskConfig.config.maxRequestsPerCrawl < 300) {
    throw new TypeError('config.maxRequestsPerCrawl 不能小于300，请检查配置文件')
  }

  return taskConfig
}
