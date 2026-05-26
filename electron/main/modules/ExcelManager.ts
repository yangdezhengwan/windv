import { dialog } from 'electron'
import ExcelJS from 'exceljs'
import log from 'electron-log'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface ScriptTemplate {
  category_name: string
  keywords: string
  responses: string
  intent_type: string
  priority: number
  remark: string
}

export class ExcelManager {
  private static instance: ExcelManager

  public static getInstance(): ExcelManager {
    if (!ExcelManager.instance) {
      ExcelManager.instance = new ExcelManager()
    }
    return ExcelManager.instance
  }

  /**
   * 导出台话术到 Excel
   */
  async exportScripts(): Promise<string> {
    try {
      const db = getDatabase()
      
      // 查询所有话术（包含分类名称）
      const scripts = db.prepare(`
        SELECT s.*, c.name as category_name, c.type as category_type
        FROM script s
        LEFT JOIN category c ON s.category_id = c.id
        WHERE s.is_active = 1
        ORDER BY c.order_index, s.priority DESC
      `).all() as any[]

      // 创建工作簿
      const workbook = new ExcelJS.Workbook()
      workbook.creator = '无人直播助手'
      workbook.created = new Date()

      // Sheet 1: 话术列表
      const scriptSheet = workbook.addWorksheet('话术列表')
      scriptSheet.columns = [
        { header: '分类', key: 'category', width: 15 },
        { header: '意图类型', key: 'intent', width: 12 },
        { header: '关键词', key: 'keywords', width: 30 },
        { header: '回复内容', key: 'responses', width: 50 },
        { header: '优先级', key: 'priority', width: 10 },
        { header: '命中次数', key: 'hit_count', width: 10 },
        { header: '备注', key: 'remark', width: 20 }
      ]

      // 添加数据
      for (const script of scripts) {
        scriptSheet.addRow({
          category: script.category_name || '未分类',
          intent: this.getIntentLabel(script.intent_type),
          keywords: JSON.parse(script.keywords || '[]').join(', '),
          responses: JSON.parse(script.responses || '[]').join('\n'),
          priority: script.priority,
          hit_count: script.hit_count,
          remark: script.remark || ''
        })
      }

      // 设置表头样式
      scriptSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      scriptSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF409EFF' }
      }

      // Sheet 2: 导入模板
      const templateSheet = workbook.addWorksheet('导入模板')
      templateSheet.columns = [
        { header: '分类名称', key: 'category', width: 15 },
        { header: '意图类型(chat/price/logistics/aftersale/size/discount)', key: 'intent', width: 20 },
        { header: '关键词(逗号分隔)', key: 'keywords', width: 30 },
        { header: '回复内容(支持多条,用|分隔)', key: 'responses', width: 50 },
        { header: '优先级(数字)', key: 'priority', width: 12 },
        { header: '备注', key: 'remark', width: 20 }
      ]

      // 添加示例数据
      templateSheet.addRow({
        category: '价格咨询',
        intent: 'price',
        keywords: '多少钱,价格,多少米',
        responses: '亲，这款直播间专属价99元|现在下单还有优惠哦~',
        priority: 10,
        remark: '示例数据'
      })

      // 设置表头样式
      templateSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      templateSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF67C23A' }
      }

      // 显示保存对话框
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: `话术库导出_${new Date().toISOString().slice(0, 10)}.xlsx`,
        filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
      })

      if (!filePath) {
        throw new Error('用户取消保存')
      }

      await workbook.xlsx.writeFile(filePath)
      log.info(`话术库已导出: ${filePath}`)
      
      return filePath
    } catch (error) {
      log.error('导出Excel失败:', error)
      throw error
    }
  }

  /**
   * 从 Excel 导入话术
   */
  async importScripts(filePath: string): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const db = getDatabase()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)

      // 读取第一个工作表
      const worksheet = workbook.getWorksheet(1)
      if (!worksheet) {
        throw new Error('Excel文件为空或格式不正确')
      }

      let success = 0
      let failed = 0
      const errors: string[] = []

      // 从第2行开始读取（第1行是表头）
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i)
        
        try {
          const categoryName = row.getCell(1).value?.toString() || '未分类'
          const intentType = row.getCell(2).value?.toString() || 'chat'
          const keywordsStr = row.getCell(3).value?.toString() || ''
          const responsesStr = row.getCell(4).value?.toString() || ''
          const priority = parseInt(row.getCell(5).value?.toString() || '0')
          const remark = row.getCell(6).value?.toString() || ''

          if (!keywordsStr || !responsesStr) {
            errors.push(`第${i}行: 关键词或回复内容为空`)
            failed++
            continue
          }

          // 查找或创建分类
          let categoryId = db.prepare('SELECT id FROM category WHERE name = ? AND is_active = 1').get(categoryName) as { id: string } | undefined
          
          if (!categoryId) {
            // 创建新分类
            const newId = uuidv4()
            db.prepare(`
              INSERT INTO category (id, name, type, icon, color, order_index)
              VALUES (?, ?, 'qa', 'ChatDotRound', '#409EFF', 999)
            `).run(newId, categoryName)
            categoryId = { id: newId }
          }

          // 解析关键词和回复
          const keywords = keywordsStr.split(/[,，]/).map(k => k.trim()).filter(k => k)
          const responses = responsesStr.split(/[|｜]/).map(r => r.trim()).filter(r => r)

          // 插入话术
          const scriptId = uuidv4()
          db.prepare(`
            INSERT INTO script (id, category_id, keywords, responses, intent_type, priority, remark, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          `).run(
            scriptId,
            categoryId.id,
            JSON.stringify(keywords),
            JSON.stringify(responses),
            intentType,
            priority,
            remark
          )

          success++
        } catch (error: any) {
          errors.push(`第${i}行: ${error.message}`)
          failed++
        }
      }

      log.info(`Excel导入完成: 成功${success}条, 失败${failed}条`)
      return { success, failed, errors }
    } catch (error) {
      log.error('导入Excel失败:', error)
      throw error
    }
  }

  /**
   * 获取导入模板
   */
  async getTemplateFile(): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook()
      const templateSheet = workbook.addWorksheet('话术导入模板')
      
      templateSheet.columns = [
        { header: '分类名称', key: 'category', width: 15 },
        { header: '意图类型(chat/price/logistics/aftersale/size/discount)', key: 'intent', width: 20 },
        { header: '关键词(逗号分隔)', key: 'keywords', width: 30 },
        { header: '回复内容(支持多条,用|分隔)', key: 'responses', width: 50 },
        { header: '优先级(数字)', key: 'priority', width: 12 },
        { header: '备注', key: 'remark', width: 20 }
      ]

      // 添加示例数据
      templateSheet.addRow({
        category: '价格咨询',
        intent: 'price',
        keywords: '多少钱,价格,多少米',
        responses: '亲，这款直播间专属价99元|现在下单还有优惠哦~',
        priority: 10,
        remark: '示例数据，可删除'
      })

      templateSheet.addRow({
        category: '物流咨询',
        intent: 'logistics',
        keywords: '发货,几天到,快递',
        responses: '亲，我们48小时内发货，一般3-5天到货~',
        priority: 10,
        remark: ''
      })

      // 设置表头样式
      templateSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
      templateSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF409EFF' }
      }

      const { filePath } = await dialog.showSaveDialog({
        defaultPath: '话术导入模板.xlsx',
        filters: [{ name: 'Excel 文件', extensions: ['xlsx'] }]
      })

      if (!filePath) {
        throw new Error('用户取消保存')
      }

      await workbook.xlsx.writeFile(filePath)
      return filePath
    } catch (error) {
      log.error('生成模板失败:', error)
      throw error
    }
  }

  /**
   * 意图类型转中文
   */
  private getIntentLabel(intent: string): string {
    const labels: Record<string, string> = {
      chat: '日常互动',
      price: '价格咨询',
      logistics: '物流咨询',
      aftersale: '售后咨询',
      size: '尺码咨询',
      discount: '优惠咨询'
    }
    return labels[intent] || intent
  }
}
