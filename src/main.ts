import process from 'node:process'
import inquirer from 'inquirer'
import { getSitemapInputs } from './menus/getSitemap.js'
import { newTaskConfigFile } from './menus/newTaskConfigFile.js'
import { runTask } from './menus/selectTasksConfig.js'

async function main() {
  console.clear()
  console.log('请选择一个操作（使用数字选择）\n')
  const { action } = await inquirer.prompt([
    {
      type: 'rawlist',
      name: 'action',
      message: '你想要做什么？',
      choices: [
        '新建配置',
        '运行任务',
        '爬取sitemap',
        '退出程序',
      ],
    },

  ])
  console.log(action)
  if (action === '新建配置') {
    await newTaskConfigFile()
  }
  else if (action === '运行任务') {
    await runTask()
  }
  else if (action === '爬取sitemap') {
    await getSitemapInputs()
  }
  else if (action === '退出程序') {
    console.log('退出程序')
    process.exit(0)
  }
}
main()
