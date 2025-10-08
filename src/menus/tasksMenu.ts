import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import inquirer from 'inquirer'
import { createCrawlerInstance } from '../crawlee.js'

export async function tasksMenu(configPath: string) {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '请选择操作：',
      choices: [
        { name: '运行任务', value: 'run' },
        { name: '清理 storage', value: 'clean' },
      ],
    },
  ])

  if (action === 'run') {
    await createCrawlerInstance(configPath)
  }
  else if (action === 'clean') {
    // 根据 configPath 获取文件名（去除.yaml后缀）
    const fileName = path.basename(configPath, '.yaml')
    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const storageRoot = path.resolve(__dirname, '../../storage')
    const targets = [
      path.join(storageRoot, 'datasets', fileName),
      path.join(storageRoot, 'key_value_stores', 'default', fileName),
      path.join(storageRoot, 'request_queues', fileName),
    ]
    let cleaned = false
    for (const target of targets) {
      if (fs.existsSync(target)) {
        fs.rmSync(target, { recursive: true, force: true })
        console.log(`已清理: ${target}`)
        cleaned = true
      }
      else {
        console.log(`未找到: ${target}`)
      }
    }
    if (!cleaned) {
      console.log('未找到任何可清理的目录或文件')
    }
  }
}
