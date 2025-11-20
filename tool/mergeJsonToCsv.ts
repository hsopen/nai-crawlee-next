#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import * as csv from 'fast-csv'

/**
 * 合并JSON文件为CSV的工具
 * @param inputDir 输入文件夹路径
 */
async function mergeJsonToCsv(inputDir: string): Promise<void> {
  // 使用输入文件夹的名字作为输出文件名
  const folderName = path.basename(inputDir)
  const outputFileName = `${folderName}.csv`
  try {
    // 检查输入目录是否存在
    if (!fs.existsSync(inputDir)) {
      throw new Error(`输入目录不存在: ${inputDir}`)
    }

    // 读取目录中的所有文件
    const files = fs.readdirSync(inputDir)

    // 过滤出JSON文件
    const jsonFiles = files.filter(file =>
      file.endsWith('.json') && fs.statSync(path.join(inputDir, file)).isFile(),
    )

    if (jsonFiles.length === 0) {
      console.log(`在目录 ${inputDir} 中没有找到JSON文件`)
      return
    }

    console.log(`找到 ${jsonFiles.length} 个JSON文件`)

    // 存储所有JSON数据
    const allData: any[] = []
    const allKeys = new Set<string>()

    // 读取所有JSON文件并收集所有可能的键
    for (const file of jsonFiles) {
      try {
        const filePath = path.join(inputDir, file)
        const fileContent = fs.readFileSync(filePath, 'utf-8')
        const jsonData = JSON.parse(fileContent)

        // 处理不同的JSON结构
        let dataToAdd: any[] = []

        if (Array.isArray(jsonData)) {
          dataToAdd = jsonData
        }
        else if (typeof jsonData === 'object') {
          dataToAdd = [jsonData]
        }
        else {
          console.warn(`文件 ${file} 包含的不是对象或数组，跳过`)
          continue
        }

        // 添加数据并收集所有键
        dataToAdd.forEach((item) => {
          if (typeof item === 'object' && item !== null) {
            allData.push(item)
            Object.keys(item).forEach(key => allKeys.add(key))
          }
        })

        console.log(`已处理文件: ${file}`)
      }
      catch (error) {
        console.error(`处理文件 ${file} 时出错:`, error)
      }
    }

    if (allData.length === 0) {
      console.log('没有找到有效的JSON数据')
      return
    }

    console.log(`总共找到 ${allData.length} 条数据记录`)

    // 创建CSV写入流
    const outputPath = path.resolve(outputFileName)
    const csvStream = csv.format({ headers: true })
    const writeStream = fs.createWriteStream(outputPath, { encoding: 'utf-8' })

    // 将CSV流连接到文件写入流
    csvStream.pipe(writeStream)

    // 写入数据
    for (const item of allData) {
      csvStream.write(item)
    }

    // 结束写入
    csvStream.end()

    // 等待写入完成
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve())
      writeStream.on('error', reject)
    })

    console.log(`成功合并 ${jsonFiles.length} 个JSON文件到 ${outputFileName}`)
    console.log(`输出文件路径: ${outputPath}`)
  }
  catch (error) {
    console.error('合并JSON文件时出错:', error)
    process.exit(1)
  }
}

// 从命令行参数获取输入目录
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('=== JSON合并为CSV工具 ===')
  console.log('')
  console.log('使用方法:')
  console.log('  tsx tool/mergeJsonToCsv.ts <输入文件夹路径>')
  console.log('')
  console.log('示例:')
  console.log('  tsx tool/mergeJsonToCsv.ts ./data')
  console.log('')
  console.log('说明:')
  console.log('  - 工具会扫描指定文件夹中的所有JSON文件')
  console.log('  - 合并所有JSON数据到一个CSV文件中')
  console.log('  - 输出的CSV文件名与输入文件夹名称相同')
  console.log('  - CSV文件将保存在项目根目录')
  console.log('')
  process.exit(1)
}

const inputDirectory = args[0]

// 执行合并
if (inputDirectory) {
  console.log(`开始处理文件夹: ${inputDirectory}`)
  mergeJsonToCsv(inputDirectory)
}
else {
  console.log('错误: 未提供输入目录路径')
  process.exit(1)
}
