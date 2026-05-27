/**
 * 增强型数据统计管理器
 * 增加高频问题分析、时段分析、转化漏斗等高级功能
 */

import { getDatabase } from '../database'
import log from 'electron-log'
import dayjs from 'dayjs'
import ExcelJS from 'exceljs'

export interface HighFrequencyQuestion {
  question: string
  count: number
  lastSeen: Date
  intentType: string
  suggestedAnswers?: string[]
  trending: boolean
}

export interface TimeSlotStats {
  hour: number  // 0-23
  danmakuCount: number
  replyCount: number
  orderCount: number
  replyRate: number
}

export interface ConversionFunnel {
  step: string
  count: number
  rate: number
  dropReason?: string
}

export interface DailyTrend {
  date: string
  danmakuCount: number
  replyCount: number
  replyRate: number
  orderCount: number
  orderAmount: number
  conversionRate: number  // 订单转化率
}

export interface DeviceTypeStats {
  deviceType: string
  count: number
  percentage: number
}

export interface UserBehaviorStats {
  newUsers: number
  returningUsers: number
  avgSessionDuration: number
  peakHours: number[]
}

export class AdvancedStatsCollector {
  private static instance: AdvancedStatsCollector
  
  private constructor() {
    log.info('AdvancedStatsCollector 初始化完成')
  }

  static getInstance(): AdvancedStatsCollector {
    if (!AdvancedStatsCollector.instance) {
      AdvancedStatsCollector.instance = new AdvancedStatsCollector()
    }
    return AdvancedStatsCollector.instance
  }

  /**
   * 分析高频问题
   */
  analyzeHighFrequencyQuestions(roomId?: string, days: number = 7): HighFrequencyQuestion[] {
    try {
      const db = getDatabase()
      const db_end = new Date()
      const db_start = dayjs(db_end).subtract(days, 'day').toDate()
      
      let query = `
        SELECT 
          content as question,
          COUNT(*) as count,
          MAX(created_at) as last_seen,
          intent_type,
          GROUP_CONCAT(suggested_answer, '|') as suggested_answers
        FROM danmaku_log
        WHERE created_at >= ? AND created_at <= ?
      `
      const params: any[] = [db_start.toISOString(), db_end.toISOString()]
      
      if (roomId) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }
      
      query += `
        GROUP BY content
        HAVING count >= 3
        ORDER BY count DESC
      `
      
      const rows = db.prepare(query).all(...params) as any[]
      
      return rows.map(row => ({
        question: row.question,
        count: row.count,
        lastSeen: new Date(row.last_seen),
        intentType: row.intent_type || 'unknown',
        suggestedAnswers: row.suggested_answers ? row.suggested_answers.split('|').filter(Boolean) : undefined,
        trending: row.count >= 10, // 10+ 次标记为趋势
      }))
    } catch (error) {
      log.error('分析高频问题失败:', error)
      return []
    }
  }

  /**
   * 分析时段分布
   */
  analyzeTimeSlots(roomId?: string, days: number = 7): TimeSlotStats[] {
    try {
      const db = getDatabase()
      const db_end = new Date()
      const db_start = dayjs(db_end).subtract(days, 'day').toDate()
      
      let query = `
        SELECT 
          CAST(strftime('%H', created_at) AS INTEGER) as hour,
          COUNT(*) as danmaku_count,
          SUM(CASE WHEN reply_count > 0 THEN 1 ELSE 0 END) as reply_count
        FROM statistics
        WHERE date >= ? AND date <= ?
      `
      const params: any[] = [
        db_start.toISOString().split('T')[0],
        db_end.toISOString().split('T')[0]
      ]
      
      if (roomId) {
        query += ' AND room_id = ?'
        params.push(roomId)
      }
      
      query += ' GROUP BY hour ORDER BY hour'
      
      const rows = db.prepare(query).all(...params) as any[]
      
      // 填充缺失的小时
      const stats: TimeSlotStats[] = []
      for (let i = 0; i < 24; i++) {
        const found = rows.find(r => r.hour === i)
        stats.push({
          hour: i,
          danmakuCount: found?.danmaku_count || 0,
          replyCount: found?.reply_count || 0,
          orderCount: 0, // 需要统计订单
          replyRate: found?.danmaku_count > 0 
            ? Math.round(found.reply_count / found.danmaku_count * 100) 
            : 0,
        })
      }
      
      return stats
    } catch (error) {
      log.error('分析时段分布失败:', error)
      return []
    }
  }

  /**
   * 分析转化漏斗
   */
  analyzeConversionFunnel(roomId?: string, days: number = 7): ConversionFunnel[] {
    try {
      const db = getDatabase()
      const db_end = new Date()
      const db_start = dayjs(db_end).subtract(days, 'day').toDate()
      
      // 弹幕总数
      const danmakuResult = db.prepare(`
        SELECT COUNT(*) as total FROM danmaku_log
        WHERE created_at >= ? AND created_at <= ?
      `).get(db_start.toISOString(), db_end.toISOString()) as { total: number }
      
      // 回复数
      const replyResult = db.prepare(`
        SELECT COUNT(DISTINCT content) as total FROM danmaku_log
        WHERE created_at >= ? AND created_at <= ? AND reply_count > 0
      `).get(db_start.toISOString(), db_end.toISOString()) as { total: number }
      
      // 订单数
      const orderResult = db.prepare(`
        SELECT COUNT(*) as total FROM order_log
        WHERE created_at >= ? AND created_at <= ?
      `).get(db_start.toISOString(), db_end.toISOString()) as { total: number }
      
      // 付款订单数
      const paidResult = db.prepare(`
        SELECT COUNT(*) as total FROM order_log
        WHERE created_at >= ? AND created_at <= ? AND status = 'paid'
      `).get(db_start.toISOString(), db_end.toISOString()) as { total: number }
      
      const total = danmakuResult.total || 1
      
      const funnel: ConversionFunnel[] = [
        {
          step: '用户进入',
          count: total,
          rate: 100,
        },
        {
          step: '发起弹幕',
          count: total,
          rate: 100,
        },
        {
          step: '系统回复',
          count: replyResult.total,
          rate: replyResult.total / total * 100,
          dropReason: '未触发回复',
        },
        {
          step: '创建订单',
          count: orderResult.total,
          rate: orderResult.total / replyResult.total * 100,
          dropReason: '未创建订单',
        },
        {
          step: '完成付款',
          count: paidResult.total,
          rate: paidResult.total / orderResult.total * 100,
          dropReason: '未完成付款',
        },
      ]
      
      // 计算每个步骤的流失率
      for (let i = 1; i < funnel.length; i++) {
        const drop = funnel[i-1].count - funnel[i].count
        funnel[i].dropReason = drop > 0 ? `${drop}人流失` : undefined
      }
      
      return funnel
    } catch (error) {
      log.error('分析转化漏斗失败:', error)
      return []
    }
  }

  /**
   * 生成日报表
   */
  async generateDailyReport(roomId?: string): Promise<{
    date: string
    summary: any
    topQuestions: HighFrequencyQuestion[]
    hourlyStats: TimeSlotStats[]
    funnel: ConversionFunnel[]
  }> {
    try {
      const today = dayjs().format('YYYY-MM-DD')
      
      return {
        date: today,
        summary: {
          danmakuCount: await this.getTodayDanmakuCount(roomId),
          replyCount: await this.getTodayReplyCount(roomId),
          replyRate: 0,
          orderCount: await this.getTodayOrderCount(roomId),
        },
        topQuestions: this.analyzeHighFrequencyQuestions(roomId, 1),
        hourlyStats: this.analyzeTimeSlots(roomId, 1),
        funnel: this.analyzeConversionFunnel(roomId, 1),
      }
    } catch (error) {
      log.error('生成日报表失败:', error)
      throw error
    }
  }

  /**
   * 获取今日弹幕数
   */
  private async getTodayDanmakuCount(roomId?: string): Promise<number> {
    const db = getDatabase()
    const today = dayjs().format('YYYY-MM-DD')
    let query = 'SELECT COUNT(*) as count FROM danmaku_log WHERE date = ?'
    const params: any[] = [today]
    
    if (roomId) {
      query += ' AND room_id = ?'
      params.push(roomId)
    }
    
    const result = db.prepare(query).get(...params) as { count: number }
    return result.count
  }

  /**
   * 获取今日回复数
   */
  private async getTodayReplyCount(roomId?: string): Promise<number> {
    const db = getDatabase()
    const today = dayjs().format('YYYY-MM-DD')
    let query = 'SELECT SUM(reply_count) as total FROM danmaku_log WHERE date = ?'
    const params: any[] = [today]
    
    if (roomId) {
      query += ' AND room_id = ?'
      params.push(roomId)
    }
    
    const result = db.prepare(query).get(...params) as { total: number }
    return result.total || 0
  }

  /**
   * 获取今日订单数
   */
  private async getTodayOrderCount(roomId?: string): Promise<number> {
    const db = getDatabase()
    const today = dayjs().format('YYYY-MM-DD')
    let query = 'SELECT COUNT(*) as count FROM order_log WHERE date = ?'
    const params: any[] = [today]
    
    if (roomId) {
      query += ' AND room_id = ?'
      params.push(roomId)
    }
    
    const result = db.prepare(query).get(...params) as { count: number }
    return result.count
  }

  /**
   * 导出高级报表
   */
  async exportAdvancedReport(roomId?: string, startDate?: string, endDate?: string, outputPath?: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('数据报表')
      
      // 添加标题
      worksheet.addRow(['小狐狸 - 数据分析报告'])
      worksheet.addRow([''])
      worksheet.addRow(['生成时间:', new Date().toLocaleString('zh-CN')])
      worksheet.addRow([''])
      
      // 导出高频问题
      worksheet.addRow(['=== 高频问题分析 ==='])
      const hfQuestions = this.analyzeHighFrequencyQuestions(roomId, 30)
      worksheet.addRow(['排名', '问题内容', '出现次数', '最后出现时间', '意图类型', '趋势'])
      
      hfQuestions.forEach((q, index) => {
        worksheet.addRow([
          index + 1,
          q.question,
          q.count,
          dayjs(q.lastSeen).format('MM-DD HH:mm'),
          q.intentType,
          q.trending ? '🔥 趋势' : '',
        ])
      })
      
      worksheet.addRow([''])
      
      // 导出时段分布
      worksheet.addRow(['=== 时段分析 ==='])
      const timeSlots = this.analyzeTimeSlots(roomId, 7)
      worksheet.addRow(['时段', '弹幕数', '回复数', '回复率'])
      
      const peakHour = timeSlots.reduce((max, current) => 
        current.danmakuCount > max.danmakuCount ? current : max
      )
      
      timeSlots.forEach((slot, index) => {
        const isPeak = slot.hour === peakHour.hour
        worksheet.addRow([
          `${slot.hour}:00`,
          slot.danmakuCount,
          slot.replyCount,
          `${slot.replyRate}%`,
          isPeak ? '⭐ 高峰时段' : '',
        ])
      })
      
      worksheet.addRow([''])
      
      // 导出转化漏斗
      worksheet.addRow(['=== 转化漏斗 ==='])
      const funnel = this.analyzeConversionFunnel(roomId, 7)
      worksheet.addRow(['步骤', '人数', '转化率', '流失原因'])
      
      funnel.forEach((step) => {
        worksheet.addRow([
          step.step,
          step.count,
          `${step.rate.toFixed(1)}%`,
          step.dropReason || '',
        ])
      })
      
      // 设置列宽
      worksheet.columns.forEach((column, index) => {
        column.width = 20
      })
      
      // 导出文件
      const timestamp = dayjs().format('YYYYMMDD_HHmmss')
      const defaultPath = `/tmp/windv_report_${timestamp}.xlsx`
      const filePath = outputPath || defaultPath
      
      await workbook.xlsx.writeFile(filePath)
      
      log.info(`高级报表已导出: ${filePath}`)
      return filePath
    } catch (error) {
      log.error('导出高级报表失败:', error)
      throw error
    }
  }
}

module.exports = { AdvancedStatsCollector }