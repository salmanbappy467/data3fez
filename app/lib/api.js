import { API_ENDPOINTS, HEADER_COLUMNS } from './constants'
import { storage } from './storage'
import dbCache from './indexedDB'

// Helper to broadcast events
const broadcast = (event) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(event))
  }
}

// Load Balancer Class
class GoogleScriptLoadBalancer {
  constructor() {
    this.scripts = [
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_1,
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_2,
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_3,
    ].filter(Boolean)
    
    this.currentIndex = 0
    this.failedAttempts = new Map()
  }

  getNextScript() {
    let attempts = 0
    while (attempts < this.scripts.length) {
      const script = this.scripts[this.currentIndex]
      const failures = this.failedAttempts.get(script) || 0
      this.currentIndex = (this.currentIndex + 1) % this.scripts.length
      if (failures < 3) return script
      attempts++
    }
    this.failedAttempts.clear()
    return this.scripts[0]
  }

  recordFailure(script) {
    const current = this.failedAttempts.get(script) || 0
    this.failedAttempts.set(script, current + 1)
    setTimeout(() => this.failedAttempts.delete(script), 5 * 60 * 1000)
  }

  recordSuccess(script) {
    this.failedAttempts.delete(script)
  }
}

const loadBalancer = new GoogleScriptLoadBalancer()

// ✅ PBSNet Admin API Integration (Restored)
export const pbsnetApi = {
  async authenticate(apiKey) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PBSNET_ADMIN_URL}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_PBSNET_ADMIN_SECRET
        },
        body: JSON.stringify({
          target_user_key: apiKey,
          subclass: 'data3fez'
        })
      })

      if (!response.ok) throw new Error('Authentication failed')
      
      const data = await response.json()
      storage.saveApiKey(apiKey)
      storage.saveUserData(data)
      
      const isFirstLogin = !data?.app_json?.data3fez?.sheetId
      if (isFirstLogin) {
        storage.setItem('first_login', 'true')
      }
      
      return { data, isFirstLogin }
    } catch (error) {
      console.error('Auth Error:', error)
      throw error
    }
  },

  async updateData(apiKey, subclass, data) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_PBSNET_ADMIN_URL}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_PBSNET_ADMIN_SECRET
        },
        body: JSON.stringify({
          target_user_key: apiKey,
          subclass,
          data
        })
      })

      if (!response.ok) throw new Error('Update failed')
      return await response.json()
    } catch (error) {
      console.error('Update Error:', error)
      throw error
    }
  }
}

// ✅ Google Sheets API
export const sheetsApi = {
  async makeRequest(payload, maxRetries = 3) {
    let lastError = null
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const scriptUrl = loadBalancer.getNextScript()
      try {
        const response = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, scriptUrl })
        })
        const result = await response.json()
        if (result.status === 'error') throw new Error(result.message)
        loadBalancer.recordSuccess(scriptUrl)
        return result
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error)
        loadBalancer.recordFailure(scriptUrl)
        lastError = error
        if (attempt < maxRetries - 1) await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)))
      }
    }
    throw lastError
  },

  async readData(sheetId, sheetName = 'data3fez', forceSync = false) {
    try {
      if (!forceSync && typeof window !== 'undefined') {
        const cachedData = await dbCache.get(sheetId)
        if (cachedData) return cachedData
      }
      
      broadcast('sync-start')
      const result = await this.makeRequest({ sheetId, action: 'read', sheetName })
      const data = result.data || []
      
      if (data.length > 0 && typeof window !== 'undefined') {
        await dbCache.set(sheetId, data)
      }

      broadcast('sync-success')
      broadcast('data-change') 
      return data
    } catch (error) {
      broadcast('sync-error')
      throw error
    }
  },

  async addRow(sheetId, data, sheetName = 'data3fez') {
    broadcast('sync-start')
    try {
      if (typeof window !== 'undefined') {
        const currentData = (await dbCache.get(sheetId)) || []
        await dbCache.set(sheetId, [...currentData, data])
        broadcast('data-change')
      }
      const result = await this.makeRequest({ sheetId, action: 'add', sheetName, data })
      broadcast('sync-success')
      return result
    } catch (error) {
      broadcast('sync-error')
      throw error
    }
  },

  async updateRow(sheetId, rowIndex, rowData, sheetName = 'data3fez') {
    broadcast('sync-start')
    
    // ১. লোকাল ডাটাবেস আপডেট (Optimistic)
    if (typeof window !== 'undefined') {
      try {
        const currentData = await dbCache.get(sheetId)
        if (currentData) {
          const arrayIndex = rowIndex - 2; 
          
          if (arrayIndex >= 0 && currentData[arrayIndex]) {
            const updatedRow = [...currentData[arrayIndex]]
            
            Object.keys(rowData).forEach((key) => {
               const colIndex = HEADER_COLUMNS.indexOf(key)
               if (colIndex !== -1) {
                 updatedRow[colIndex] = rowData[key]
               }
            })
            
            currentData[arrayIndex] = updatedRow
            await dbCache.set(sheetId, currentData)
            console.log('⚡ Optimistic Row Update Success')
            broadcast('data-change') 
          }
        }
      } catch (e) {
        console.error('Optimistic update failed', e)
      }
    }

    // ২. ব্যাকগ্রাউন্ডে Google Sheet আপডেট
    const updates = []
    Object.keys(rowData).forEach((key) => {
      const colIndex = HEADER_COLUMNS.indexOf(key)
      if (colIndex !== -1) {
        updates.push(this.makeRequest({
          sheetId,
          action: 'update',
          sheetName,
          row: rowIndex, 
          col: colIndex + 1, 
          value: rowData[key]
        }))
      }
    })
    
    try {
       await Promise.all(updates)
       broadcast('sync-success')
    } catch (err) {
       broadcast('sync-error')
       console.error(err)
    }
  },

  async updateCell(sheetId, row, col, value, sheetName = 'data3fez') {
    return this.makeRequest({ sheetId, action: 'update', sheetName, row, col, value })
  },

  async deleteRow(sheetId, row, sheetName = 'data3fez') {
    broadcast('sync-start')
    try {
      // Optimistic Delete
      if (typeof window !== 'undefined') {
        const currentData = (await dbCache.get(sheetId)) || []
        const arrayIndex = row - 2; 
        if (arrayIndex >= 0) {
          const newData = [...currentData]
          newData.splice(arrayIndex, 1)
          await dbCache.set(sheetId, newData)
          broadcast('data-change')
        }
      }
      const result = await this.makeRequest({ sheetId, action: 'delete', sheetName, row })
      broadcast('sync-success')
      return result
    } catch (error) {
      broadcast('sync-error')
      throw error
    }
  },

  extractSheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/)
    return match ? match[1] : null
  },

  async validateAndSetupSheet(sheetUrl) {
    const sheetId = this.extractSheetId(sheetUrl)
    if (!sheetId) throw new Error('Invalid Google Sheet URL')

    try {
      await this.addRow(sheetId, HEADER_COLUMNS, 'data3fez')
      return sheetId
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        try {
          const data = await this.readData(sheetId, 'data3fez', true) // force fetch
          if (data.length === 0 || data[0][0] !== 'slNo') {
            for (let i = 0; i < HEADER_COLUMNS.length; i++) {
              await this.updateCell(sheetId, 1, i + 1, HEADER_COLUMNS[i], 'data3fez')
            }
          }
          return sheetId
        } catch (readError) {
          throw new Error(`Sheet validation failed: ${readError.message}`)
        }
      }
      throw error
    }
  },

  async getCacheStats() {
    if (typeof window === 'undefined') return null
    return await dbCache.getStats()
  },

  async clearAllCache() {
    if (typeof window === 'undefined') return
    await dbCache.clear()
    storage.clearMeterCache()
    console.log('🗑️ All cache cleared')
  }
}