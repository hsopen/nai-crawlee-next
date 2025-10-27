import inquirer from 'inquirer'
import { crawlSitemap } from '../sitemap.js'

export async function getSitemapInputs() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'homepage',
      message: '需要爬取的网站首页（字符串类型，要求是一个带有协议的网址）:',
      validate: (input) => {
        const urlPattern = /^https?:\/\/.+/
        return urlPattern.test(input) || '请输入一个有效的带有协议的网址，例如 https://example.com'
      },
    },
    {
      type: 'confirm',
      name: 'isDynamic',
      message: '页面是否为动态渲染（是/否）:',
      default: false,
    },
    {
      type: 'input',
      name: 'onlySelector',
      message: '需要爬取的选择器（字符串类型）:',
      validate: (input) => {
        return input.length > 0 || '请输入一个有效的选择器'
      },
    },
    {
      type: 'number',
      name: 'maximumProductQuantity',
      message: '需要爬取的最大商品数量（数值类型）:',
      validate: (input) => {
        if (typeof input !== 'number')
          return '请输入一个正整数'
        return input > 0 || '请输入一个正整数'
      },
    },
    {
      type: 'input',
      name: 'maximumProductQuantity',
      message: '需要爬取的最大商品数量（数值类型）:',
    },
    {
      type: 'number',
      name: 'maxThreads',
      message: '期望最大线程（数值类型）:',
      validate: (input) => {
        if (typeof input !== 'number')
          return '请输入一个正整数'
        return input > 0 || '请输入一个正整数'
      },
    },
    {
      type: 'number',
      name: 'proxyPort',
      message: '代理服务器端口（数值类型）:',
      validate: (input) => {
        if (typeof input !== 'number')
          return '请输入一个正整数'
        return input > 0 || '请输入一个正整数'
      },
      default: 8800,
    },
  ])

  await crawlSitemap(answers.homepage, answers.isDynamic, answers.onlySelector, answers.maximumProductQuantity, answers.maxThreads, answers.proxyPort)
}
