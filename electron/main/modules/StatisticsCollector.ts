import { app } from 'electron'
import { join } from 'path'
import ExcelJS from 'exceljs'
import log from 'electron-log'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database'
import { IntentType } from '../ai/IntentClassifier'
import dayjs from 'dayjs'

export interface RealtimeStats {
  roomId: string
  todayDanmakuCount: number
  todayReplyCount: number
  replySuccessRate: number
  todayOrderCount: number
  todayOrderAmount: number
  topIntents: { type: string; count: number }[]
  onlineDuration: number
  lastActivity: Date
}

interface StatsCache {
  danmakuCount: number
  replyCount: number
  replySuccessCount: number
  orderCount: number
  orderAmount: number
  intentCounts: Map<string, number>
  startTime: Date
  lastUpdate: Date
}

export class StatisticsCollector {
  private static instance: StatisticsCollector
  private cache: Map<string, StatsCache> = new Map()
  private flushInterval: NodeJS.Timeout | null = null
  private FLUSH_INTERVAL_MS = 5 * 60 * 1000 // 5分钟

  private constructor() {
    // 启动定时刷盘
    this.flushInterval = setInterval(() => {
      this.flushToDatabase()
    }, this.FLUSH_INTERVAL_MS)

    log.info('StatisticsCollector 初始化完成')
  }

  public static getInstance(): StatisticsCollector {
    if (!StatisticsCollector.instance) {
      StatisticsCollector.instance = new StatisticsCollector()
    }
    return StatisticsCollector.instance
  }

  /**
   * 初始化房间统计
   */
  private initRoomStats(roomId: string): StatsCache {
    return {
      danmakuCount: 0,
      replyCount: 0,
      replySuccessCount: 0,
      orderCount: 0,
      orderAmount: 0,
      intentCounts: new Map(),
      startTime: new Date(),
      lastUpdate: new Date()
    }
  }

  /**
   * 获取或创建房间统计缓存
   */
  private getRoomStats(roomId: string): StatsCache {
    if (!this.cache.has(roomId)) {
      this.cache.set(roomId, this.initRoomStats(roomId))
    }
    return this.cache.get(roomId)!
  }

  /**
   * 记录弹幕
   */
  recordDanmaku(roomId: string, intent: IntentType): void {
    const stats = this.getRoomStats(roomId)
    stats.danmakuCount++
    
    if (intent !== IntentType.UNKNOWN) {
      const count = stats.intentCounts.get(intent) || 0
      stats.intentCounts.set(intent, count + 1)
    }
    
    stats.lastUpdate = new Date()
  }

  /**
   * 记录回复
   */
  recordReply(roomId: string, success: boolean): void {
    const stats = this.getRoomStats(roomId)
    stats.replyCount++
    if (success) {
      stats.replySuccessCount++
    }
    stats.lastUpdate = new Date()
  }

  /**
   * 记录订单
   */
  recordOrder(roomId: string, amount: number, status: string): void {
    const stats = this.getRoomStats(roomId)
    stats.orderCount++
    stats.orderAmount += amount
    stats.lastUpdate = new Date()
  }

  /**
   * 获取实时统计
   */
  getRealtimeStats(roomId: string): RealtimeStats {
    const stats = this.getRoomStats(roomId)
    const replyRate = stats.replyCount > 0 
      ? Math.round((stats.replySuccessCount / stats.replyCount) * 100) 
      : 0

    // 转换为数组并排序
    const topIntents = Array.from(stats.intentCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      roomId,
      todayDanmakuCount: stats.danmakuCount,
      todayReplyCount: stats.replyCount,
      replySuccessRate: replyRate,
      todayOrderCount: stats.orderCount,
      todayOrderAmount: stats.orderAmount,
      topIntents,
      onlineDuration: Math.floor((Date.now() - stats.startTime.getTime()) / 1000),
      lastActivity: stats.lastUpdate
    }
  }

  /**
   * 获取指定时间范围的统计数据
   */
  getHistoryStats(roomId: string, startDate: string, endDate: string): any[] {
    const db = getDatabase()
    
    let query = 'SELECT * FROM statistics WHERE date >= ? AND date <= ?'
    const params: any[] = [startDate, endDate]

    if (roomId) {
      query += ' AND room_id = ?'
      params.push(roomId)
    }

    query += ' ORDER BY date DESC'
    return db.prepare(query).all(...params)
  }

  /**
   * 刷盘到数据库
   */
  private flushToDatabase(): void {
    const db = getDatabase()
    const today = dayjs().format('YYYY-MM-DD')

    for (const [roomId, stats] of this.cache) {
      if (stats.danmakuCount === 0 && stats.replyCount === 0 && stats.orderCount === 0) {
        continue
      }

      try {
        // 检查是否存在今日统计
        const existing = db.prepare(
          'SELECT id FROM statistics WHERE room_id = ? AND date = ?'
        ).get(roomId, today) as { id: string } | undefined

        if (existing) {
          // 更新
          db.prepare(`
            UPDATE statistics SET
              danmaku_count = danmaku_count + ?,
              reply_count = reply_count + ?,
              reply_success_count = reply_success_count + ?,
              order_new_count = order_new_count + ?,
              top_intents = ?,
              updated_at = datetime('now')
            WHERE id = ?
          `).run(
            stats.danmakuCount,
            stats.replyCount,
            stats.replySuccessCount,
            stats.orderCount,
            JSON.stringify(stats.intentCounts),
            existing.id
          )
        } else {
          // 新增
          db.prepare(`
            INSERT INTO statistics (id, room_id, date, danmaku_count, reply_count, reply_success_count, order_new_count, top_intents)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuidv4(),
            roomId,
            today,
            stats.danmakuCount,
            stats.replyCount,
            stats.replySuccessCount,
            stats.orderCount,
            JSON.stringify(Object.fromEntries(stats.intentCounts))
          )
        }

        // 重置计数器（保留累计数据）
        stats.danmakuCount = 0
        stats.replyCount = 0
        stats.replySuccessCount = 0
        stats.orderCount = 0
        stats.orderAmount = 0
        stats.intentCounts.clear()

      } catch (error) {
        log.error(`刷盘失败 (房间 ${roomId}):`, error)
      }
    }

    log.info('统计数据已刷盘')
  }

  /**
   * 导出 Excel
   */
  async exportToExcel(roomId: string, startDate?: string, endDate?: string): Promise<string> {
    const db = getDatabase()
    const defaultStart = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
    const defaultEnd = dayjs().format('YYYY-MM-DD')

    // 查询数据
    let query = 'SELECT * FROM statistics WHERE date >= ? AND date <= ?'
    const params: any[] = [startDate || defaultStart, endDate || defaultEnd]

    if (roomId) {
      query += ' AND room_id = ?'
      params.push(roomId)
    }

    query += ' ORDER BY date DESC'
    const stats = db.prepare(query).all(...params) as any[]

    // 获取房间名称
    let roomName = '所有房间'
    if (roomId) {
      const room = db.prepare('SELECT name FROM room WHERE id = ?').get(roomId) as { name: string } | undefined
      if (room) roomName = room.name
    }

    // 创建工作簿
    const workbook = new ExcelJS.Workbook()
    workbook.creator = '无人直播助手'
    workbook.created = new Date()

    // Sheet 1: 每日统计
    const dailySheet = workbook.addWorksheet('每日统计')
    dailySheet.columns = [
      { header: '日期', key: 'date', width: 12 },
      { header: '弹幕数', key: 'danmaku_count', width: 10 },
      { header: '回复数', key: 'reply_count', width: 10 },
      { header: '回复成功率', key: 'reply_rate', width: 12 },
      { header: '新订单数', key: 'order_new_count', width: 10 },
      { header: '屏蔽数', key: 'block_count', width: 10 },
    ]

    // 添加数据
    stats.forEach(s => {
      const replyRate = s.reply_count > 0 
        ? Math.round((s.reply_success_count / s.reply_count) * 100) + '%' 
        : '0%'
      
      dailySheet.addRow({
        date: s.date,
        danmaku_count: s.danmaku_count,
        reply_count: s.reply_count,
        reply_rate: replyRate,
        order_new_count: s.order_new_count,
        block_count: s.block_count || 0
      })
    })

    // 添加汇总行
    const totalDanmaku = stats.reduce((sum, s) => sum + s.danmaku_count, 0)
    const totalReply = stats.reduce((sum, s) => sum + s.reply_count, 0)
    const totalSuccess = stats.reduce((sum, s) => sum + s.reply_success_count, 0)
    const totalOrder = stats.reduce((sum, s) => sum + s.order_new_count, 0)
    const totalReplyRate = totalReply > 0 ? Math.round((totalSuccess / totalReply) * 100) + '%' : '0%'

    dailySheet.addRow({
      date: '汇总',
      danmaku_count: totalDanmaku,
      reply_count: totalReply,
      reply_rate: totalReplyRate,
      order_new_count: totalOrder,
      block_count: stats.reduce((sum, s) => sum + (s.block_count || 0), 0)
    })

    // Sheet 2: 弹幕日志
    const logSheet = workbook.addWorksheet('弹幕日志')
    const logs = db.prepare(`
      SELECT d.*, r.name as room_name 
      FROM danmaku_log d 
      LEFT JOIN room r ON d.room_id = r.id 
      WHERE DATE(d.created_at) BETWEEN ? AND ?
      ORDER BY d.created_at DESC
      LIMIT 1000
    `).all(startDate || defaultStart, endDate || defaultEnd) as any[]

    logSheet.columns = [
      { header: '时间', key: 'created_at', width: 20 },
      { header: '直播间', key: 'room_name', width: 15 },
      { header: '弹幕内容', key: 'content', width: 40 },
      { header: '发送者', key: 'sender_nickname', width: 15 },
      { header: '意图类型', key: 'intent_type', width: 12 },
      { header: '是否回复', key: 'response_sent', width: 10 },
    ]

    logs.forEach(log => {
      logSheet.addRow({
        created_at: log.created_at,
        room_name: log.room_name || '未知',
        content: log.content,
        sender_nickname: log.sender_nickname,
        intent_type: log.intent_type || 'unknown',
        response_sent: log.response_sent ? '是' : '否'
      })
    })

    // 保存文件
    const fileName = `直播数据报表_${roomName}_${defaultStart}_${defaultEnd}.xlsx`
    const userDataPath = app.getPath('userData')
    const filePath = join(userDataPath, 'exports', fileName)

    // 确保目录存在
    const fs = require('fs')
    const dir = join(userDataPath, 'exports')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    await workbook.xlsx.writeFile(filePath)
    log.info(`数据导出成功: ${filePath}`)

    return filePath
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    // 最后刷盘
    this.flushToDatabase()
  }
}
