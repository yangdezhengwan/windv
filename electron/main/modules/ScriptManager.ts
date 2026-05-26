import log from 'electron-log'
import { getDatabase } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface Script {
  id: string
  category_id: string
  keywords: string[]
  responses: string[]
  intent_type: string
  priority: number
  ai_enabled: boolean
  random_enabled: boolean
  match_mode: string
  remark: string
  is_active: number
  hit_count: number
  created_at: string
  updated_at: string
}

export class ScriptManager {
  private static instance: ScriptManager

  public static getInstance(): ScriptManager {
    if (!ScriptManager.instance) {
      ScriptManager.instance = new ScriptManager()
    }
    return ScriptManager.instance
  }

  /**
   * 获取所有话术
   */
  getAll(categoryId?: string, intentType?: string): Script[] {
    const db = getDatabase()
    let query = 'SELECT * FROM script WHERE is_active = 1'
    const params: any[] = []

    if (categoryId) {
      query += ' AND category_id = ?'
      params.push(categoryId)
    }
    if (intentType) {
      query += ' AND intent_type = ?'
      params.push(intentType)
    }

    query += ' ORDER BY priority DESC, created_at DESC'
    const scripts = db.prepare(query).all(...params) as any[]

    return scripts.map(s => ({
      ...s,
      keywords: JSON.parse(s.keywords),
      responses: JSON.parse(s.responses),
      ai_enabled: Boolean(s.ai_enabled),
      random_enabled: Boolean(s.random_enabled)
    }))
  }

  /**
   * 根据 ID 获取话术
   */
  getById(id: string): Script | null {
    const db = getDatabase()
    const script = db.prepare('SELECT * FROM script WHERE id = ? AND is_active = 1').get(id) as any

    if (!script) return null

    return {
      ...script,
      keywords: JSON.parse(script.keywords),
      responses: JSON.parse(script.responses),
      ai_enabled: Boolean(script.ai_enabled),
      random_enabled: Boolean(script.random_enabled)
    }
  }

  /**
   * 创建话术
   */
  create(data: Partial<Script>): Script {
    const db = getDatabase()
    const id = uuidv4()

    db.prepare(`
      INSERT INTO script (id, category_id, keywords, responses, intent_type, priority, ai_enabled, random_enabled, match_mode, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.category_id || '',
      JSON.stringify(data.keywords || []),
      JSON.stringify(data.responses || []),
      data.intent_type || 'chat',
      data.priority || 0,
      data.ai_enabled ? 1 : 0,
      data.random_enabled !== false ? 1 : 0,
      data.match_mode || 'keyword',
      data.remark || ''
    )

    log.info(`话术创建成功: ${id}`)
    return this.getById(id)!
  }

  /**
   * 更新话术
   */
  update(id: string, data: Partial<Script>): boolean {
    const db = getDatabase()
    const updates: string[] = []
    const values: any[] = []

    if (data.category_id !== undefined) {
      updates.push('category_id = ?')
      values.push(data.category_id)
    }
    if (data.keywords !== undefined) {
      updates.push('keywords = ?')
      values.push(JSON.stringify(data.keywords))
    }
    if (data.responses !== undefined) {
      updates.push('responses = ?')
      values.push(JSON.stringify(data.responses))
    }
    if (data.intent_type !== undefined) {
      updates.push('intent_type = ?')
      values.push(data.intent_type)
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?')
      values.push(data.priority)
    }
    if (data.ai_enabled !== undefined) {
      updates.push('ai_enabled = ?')
      values.push(data.ai_enabled ? 1 : 0)
    }
    if (data.random_enabled !== undefined) {
      updates.push('random_enabled = ?')
      values.push(data.random_enabled ? 1 : 0)
    }
    if (data.match_mode !== undefined) {
      updates.push('match_mode = ?')
      values.push(data.match_mode)
    }
    if (data.remark !== undefined) {
      updates.push('remark = ?')
      values.push(data.remark)
    }

    if (updates.length === 0) return false

    updates.push("updated_at = datetime('now')")
    values.push(id)

    const result = db.prepare(`UPDATE script SET ${updates.join(', ')} WHERE id = ?`).run(...values)
    
    if (result.changes > 0) {
      log.info(`话术更新成功: ${id}`)
      return true
    }
    return false
  }

  /**
   * 删除话术（软删除）
   */
  delete(id: string): boolean {
    const db = getDatabase()
    const result = db.prepare('UPDATE script SET is_active = 0 WHERE id = ?').run(id)
    
    if (result.changes > 0) {
      log.info(`话术删除成功: ${id}`)
      return true
    }
    return false
  }

  /**
   * 增加话术命中次数
   */
  incrementHitCount(id: string): void {
    const db = getDatabase()
    db.prepare('UPDATE script SET hit_count = hit_count + 1 WHERE id = ?').run(id)
  }

  /**
   * 批量导入话术
   */
  importMany(scripts: Partial<Script>[]): number {
    const db = getDatabase()
    let count = 0

    const insert = db.prepare(`
      INSERT OR REPLACE INTO script (id, category_id, keywords, responses, intent_type, priority, ai_enabled, random_enabled, match_mode, remark, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `)

    const insertMany = db.transaction((items: Partial<Script>[]) => {
      for (const item of items) {
        insert.run(
          item.id || uuidv4(),
          item.category_id || '',
          JSON.stringify(item.keywords || []),
          JSON.stringify(item.responses || []),
          item.intent_type || 'chat',
          item.priority || 0,
          item.ai_enabled ? 1 : 0,
          item.random_enabled !== false ? 1 : 0,
          item.match_mode || 'keyword',
          item.remark || ''
        )
        count++
      }
    })

    insertMany(scripts)
    log.info(`批量导入话术: ${count} 条`)
    return count
  }

  /**
   * 获取话术模板
   */
  getTemplate(): any[] {
    return [
      { category_id: '', keywords: [], responses: [], intent_type: 'chat', priority: 1 },
    ]
  }
}
