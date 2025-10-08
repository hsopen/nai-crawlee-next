import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import inquirer from 'inquirer'
import { tasksMenu } from './tasksMenu.js'

export async function runTask() {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const undoneDir = path.join(__dirname, '../../tasksConfig/undone')
  let files = []
  try {
    files = fs.readdirSync(undoneDir).filter(f => f.endsWith('.yaml'))
  }
  catch (err) {
    console.error('读取目录失败:', err)
    process.exit(1)
  }

  if (!files.length) {
    console.warn('没有可用的 YAML 文件。')
    process.exit(0)
  }

  const choices = files.map((file, idx) => ({
    name: `${idx + 1}. ${file}`,
    value: file,
  }))

  inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFile',
      message: '请选择一个 YAML 文件：',
      choices,
    },
  ]).then(async (answer) => {
    const filePath = path.join(undoneDir, answer.selectedFile)
    await tasksMenu(filePath)
  })
}
