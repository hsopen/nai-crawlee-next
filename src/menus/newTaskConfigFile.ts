import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import inquirer from 'inquirer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function newTaskConfigFile() {
  const { taskConfigName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'taskConfigName',
      message: '配置文件名（支持 URL 或域名）：',
      validate: (input: string) => {
        const trimmed = input.trim()
        if (!trimmed)
          return '配置文件名不能为空'
        const urlPattern = /^(?:https?:\/\/)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\/.*)?$/
        if (!urlPattern.test(trimmed))
          return '请输入有效的 URL 或域名'
        return true
      },
      filter: (input: string) => {
        const trimmed = input.trim()
        const urlPattern = /^(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\/.*)?$/
        const match = trimmed.match(urlPattern)
        if (match) {
          return match[1]
        }
        return trimmed
      },
    },
  ])

  // 使用 __dirname 作为根目录
  const srcPath = path.join(__dirname, '../../tasksConfig/tamplate.yaml')
  const destDir = path.join(__dirname, '../../tasksConfig/undone')
  const destPath = path.join(destDir, `${taskConfigName}.yaml`)

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const yamlContent = fs.readFileSync(srcPath, 'utf8')
  // 替换 name 字段和 createAt 字段为单行格式，保留注释
  let newYamlContent = yamlContent
    .replace(/^name\s*:.*([\r\n]+[\s\S]*?)?(?=^\w|$)/m, `name: ${taskConfigName}\n`)
  const now = new Date().toLocaleString()
  if (/^createAt\s*:/m.test(newYamlContent)) {
    newYamlContent = newYamlContent.replace(/^createAt\s*:.*([\r\n]+[\s\S]*?)?(?=^\w|$)/m, `createAt: ${now}\n`)
  }
  else {
    // 如果没有createAt字段，则插入到name字段后面
    newYamlContent = newYamlContent.replace(/^(name:.*)$/m, `$1\ncreateAt: ${now}`)
  }
  fs.writeFileSync(destPath, newYamlContent, 'utf8')
}
