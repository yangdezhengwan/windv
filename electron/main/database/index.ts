import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import log from 'electron-log'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('数据库未初始化')
  }
  return db
}

/**
 * 初始化数据库
 */
export async function initDatabase(): Promise<void> {
  const userDataPath = app.getPath('userData')
  const dbPath = join(userDataPath, 'windv.db')
  
  log.info(`初始化数据库: ${dbPath}`)

  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // 执行建表
  createTables()

  // 初始化默认数据
  initDefaultData()

  log.info('数据库初始化完成')
}

/**
 * 创建所有表
 */
function createTables(): void {
  const database = getDatabase()

  // 话术分类表
  database.exec(`
    CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'qa',
      icon TEXT,
      color TEXT,
      order_index INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 话术配置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS script (
      id TEXT PRIMARY KEY,
      category_id TEXT,
      keywords TEXT NOT NULL,
      responses TEXT NOT NULL,
      intent_type TEXT DEFAULT 'chat',
      priority INTEGER DEFAULT 0,
      ai_enabled INTEGER DEFAULT 0,
      random_enabled INTEGER DEFAULT 1,
      match_mode TEXT DEFAULT 'keyword',
      remark TEXT,
      is_active INTEGER DEFAULT 1,
      hit_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL
    )
  `)

  // 直播间配置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS room (
      id TEXT PRIMARY KEY,
      platform_code TEXT NOT NULL,
      name TEXT NOT NULL,
      url TEXT,
      window_title TEXT,
      process_name TEXT,
      status TEXT DEFAULT 'offline',
      config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      last_seen_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 弹幕日志表
  database.exec(`
    CREATE TABLE IF NOT EXISTS danmaku_log (
      id TEXT PRIMARY KEY,
      room_id TEXT,
      content TEXT NOT NULL,
      sender_id TEXT,
      sender_nickname TEXT,
      intent_type TEXT,
      matched_script_id TEXT,
      response_sent INTEGER DEFAULT 0,
      response_content TEXT,
      is_blocked INTEGER DEFAULT 0,
      block_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL
    )
  `)

  // 订单日志表
  database.exec(`
    CREATE TABLE IF NOT EXISTS order_log (
      id TEXT PRIMARY KEY,
      room_id TEXT,
      order_no TEXT,
      amount REAL,
      status TEXT,
      nickname_masked TEXT,
      announce_count INTEGER DEFAULT 0,
      last_announced_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE SET NULL
    )
  `)

  // 统计数据表
  database.exec(`
    CREATE TABLE IF NOT EXISTS statistics (
      id TEXT PRIMARY KEY,
      room_id TEXT,
      date TEXT NOT NULL,
      danmaku_count INTEGER DEFAULT 0,
      reply_count INTEGER DEFAULT 0,
      reply_success_count INTEGER DEFAULT 0,
      order_new_count INTEGER DEFAULT 0,
      order_paid_count INTEGER DEFAULT 0,
      block_count INTEGER DEFAULT 0,
      top_intents TEXT DEFAULT '[]',
      hourly_stats TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(room_id, date)
    )
  `)

  // 系统设置表
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 违禁词表
  database.exec(`
    CREATE TABLE IF NOT EXISTS sensitive_word (
      id TEXT PRIMARY KEY,
      word TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'ad',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_danmaku_room_time ON danmaku_log(room_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_danmaku_intent ON danmaku_log(intent_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_order_room_time ON order_log(room_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_script_intent ON script(intent_type, is_active);
    CREATE INDEX IF NOT EXISTS idx_statistics_room_date ON statistics(room_id, date DESC);
  `)

  log.info('数据库表创建完成')
}

/**
 * 初始化默认数据
 */
function initDefaultData(): void {
  const database = getDatabase()

  // 检查是否已有分类
  const categoryCount = database.prepare('SELECT COUNT(*) as count FROM category').get() as { count: number }
  
  if (categoryCount.count === 0) {
    log.info('初始化默认分类...')
    
    const insertCategory = database.prepare(`
      INSERT INTO category (id, name, type, icon, color, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const categories = [
      { id: 'cat_chat', name: '日常互动', type: 'qa', icon: 'ChatDotRound', color: '#409EFF', order: 1 },
      { id: 'cat_price', name: '价格咨询', type: 'qa', icon: 'Money', color: '#67C23A', order: 2 },
      { id: 'cat_logistics', name: '物流咨询', type: 'qa', icon: 'Vehicle', color: '#E6A23C', order: 3 },
      { id: 'cat_aftersale', name: '售后咨询', type: 'qa', icon: 'Service', color: '#F56C6C', order: 4 },
      { id: 'cat_size', name: '尺码咨询', type: 'qa', icon: '尺码', color: '#909399', order: 5 },
      { id: 'cat_discount', name: '优惠咨询', type: 'qa', icon: 'Ticket', color: '#9C27B0', order: 6 },
      { id: 'cat_timing', name: '定时播报', type: 'timing', icon: 'Timer', color: '#00BCD4', order: 7 },
    ]

    categories.forEach(cat => {
      insertCategory.run(cat.id, cat.name, cat.type, cat.icon, cat.color, cat.order)
    })
  }

  // 检查是否已有默认话术
  const scriptCount = database.prepare('SELECT COUNT(*) as count FROM script').get() as { count: number }
  
  if (scriptCount.count === 0) {
    log.info('初始化默认话术...')
    
    const insertScript = database.prepare(`
      INSERT INTO script (id, category_id, keywords, responses, intent_type, priority)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const defaultScripts = [
      {
        id: 'script_welcome',
        category_id: 'cat_chat',
        keywords: JSON.stringify(['欢迎', '你好', 'hi', 'hello']),
        responses: JSON.stringify([
          '欢迎来到直播间，主播随时为您服务~',
          'Hello！有任何问题随时问我哦',
          '欢迎欢迎，点击关注不迷路~'
        ]),
        intent_type: 'chat',
        priority: 1
      },
      {
        id: 'script_like',
        category_id: 'cat_chat',
        keywords: JSON.stringify(['666', '棒', '厉害', '牛', '赞']),
        responses: JSON.stringify([
          '感谢支持！点击关注不迷路~',
          '谢谢宝宝的支持，爱你哦~',
          '觉得不错的话点个赞吧！'
        ]),
        intent_type: 'chat',
        priority: 1
      },
      {
        id: 'script_price_1',
        category_id: 'cat_price',
        keywords: JSON.stringify(['多少钱', '价格', '多少米', '多少块', '报价']),
        responses: JSON.stringify([
          '这款直播间专属价[价格]，喜欢的宝宝可以下单哦~',
          '亲，我们这款[价格]，现在下单还有优惠呢'
        ]),
        intent_type: 'price',
        priority: 10
      },
      {
        id: 'script_logistics_1',
        category_id: 'cat_logistics',
        keywords: JSON.stringify(['发货', '几天到', '多久到', '物流', '快递']),
        responses: JSON.stringify([
          '亲，我们48小时内发货，快递[快递公司]，[到达时间]天左右到哦~',
          '一般是[到达时间]天左右到货，偏远地区会稍慢一点~'
        ]),
        intent_type: 'logistics',
        priority: 10
      },
      {
        id: 'script_aftersale_1',
        category_id: 'cat_aftersale',
        keywords: JSON.stringify(['退货', '退款', '换货', '售后', '坏了']),
        responses: JSON.stringify([
          '亲，支持7天无理由退换货，收到货有任何问题随时联系我们哦~',
          '放心购买！我们提供完善的售后服务，有问题随时找客服~'
        ]),
        intent_type: 'aftersale',
        priority: 10
      },
      {
        id: 'script_size_1',
        category_id: 'cat_size',
        keywords: JSON.stringify(['尺码', '大小', 'S', 'M', 'L', 'XL', 'XXL', '合适']),
        responses: JSON.stringify([
          '亲可以根据尺码表选择，一般建议按平时尺码购买哦~',
          '这款偏大/偏小一点点，建议拍大/小一码~'
        ]),
        intent_type: 'size',
        priority: 10
      },
      {
        id: 'script_discount_1',
        category_id: 'cat_discount',
        keywords: JSON.stringify(['优惠', '便宜', '折扣', '红包', '优惠券', '满减']),
        responses: JSON.stringify([
          '我们直播间有专属优惠券，下单时记得领取哦~',
          '现在活动期间有满[金额]减[金额]的优惠，不要错过啦！'
        ]),
        intent_type: 'discount',
        priority: 10
      },
    ]

    defaultScripts.forEach(script => {
      insertScript.run(script.id, script.category_id, script.keywords, script.responses, script.intent_type, script.priority)
    })
  }

  // 初始化默认设置
  const settingsCount = database.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  
  if (settingsCount.count === 0) {
    log.info('初始化默认设置...')
    
    const insertSetting = database.prepare(`
      INSERT INTO settings (key, value, description)
      VALUES (?, ?, ?)
    `)

    const defaultSettings = [
      { key: 'min_delay', value: '1000', description: '最小回复延迟(毫秒)' },
      { key: 'max_delay', value: '3000', description: '最大回复延迟(毫秒)' },
      { key: 'max_per_minute', value: '20', description: '每分钟最大回复数' },
      { key: 'timing_interval', value: '300', description: '定时播报间隔(秒)' },
      { key: 'sensitive_filter_enabled', value: 'true', description: '违禁词过滤开关' },
      { key: 'random_delay_enabled', value: 'true', description: '随机延迟开关' },
      { key: 'auto_start_enabled', value: 'false', description: '开机自启开关' },
      { key: 'minimize_to_tray', value: 'true', description: '最小化到托盘' },
    ]

    defaultSettings.forEach(setting => {
      insertSetting.run(setting.key, setting.value, setting.description)
    })
  }

  // 初始化违禁词
  const wordCount = database.prepare('SELECT COUNT(*) as count FROM sensitive_word').get() as { count: number }
  
  if (wordCount.count === 0) {
    log.info('初始化违禁词库...')
    
    const insertWord = database.prepare(`
      INSERT INTO sensitive_word (id, word, type)
      VALUES (?, ?, ?)
    `)

    const defaultWords = [
      '微信', '加我', '私聊', 'QQ', '群号', '主页',
      '二维码', 'vx', 'VX', 'QQ号'
    ]

    defaultWords.forEach((word, index) => {
      insertWord.run(`word_${index}`, word, 'ad')
    })
  }
}

/**
 * 获取设置值
 */
export function getSettings(key: string): string | null {
  try {
    const database = getDatabase()
    const row = database.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  } catch (error) {
    console.error('获取设置失败:', error)
    return null
  }
}

/**
 * 设置设置值
 */
export function setSettings(key: string, value: string): boolean {
  try {
    const database = getDatabase()
    database.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value)
    return true
  } catch (error) {
    console.error('保存设置失败:', error)
    return false
  }
}
/**
 * 关闭数据库
 */
export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    log.info('数据库已关闭')
  }
}
