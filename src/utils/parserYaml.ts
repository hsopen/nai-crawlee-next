import type { TaskConfig } from '../types/taskConfig.types.js'
import * as fs from 'node:fs'
import YAML from 'yaml'

export function parseYamlFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  let data: TaskConfig
  try {
    data = YAML.parse(content)
  }
  catch (err) {
    console.error('YAML 文件格式错误:', err)
    throw new Error(`YAML 文件格式错误: ${err}`)
  }
  return data
}
