import { API_ENDPOINTS, HEADER_COLUMNS } from './constants'
import { storage } from './storage'
import dbCache from './indexedDB'

// Load Balancer for Google Scripts
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
      
      if (failures < 3) {
        return script
      }
      
      attempts++
    }
    
    this.failedAttempts.clear()
    return this.scripts[0]
  }

  recordFailure(script) {
    const current = this.failedAttempts.get(script) || 0
    this.failedAttempts.set(script, current + 1)
    
    setTimeout(() => {
      this.failedAttempts.delete(script)
    }, 5 * 60 * 1000)
  }

  recordSuccess(script) {
    this.failedAttempts.delete(script)
  }
}

const loadBalancer = new GoogleScriptLoadBalancer()

// PBSNet Admin API Integration
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

// Google Sheets API with Load Balancing
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
        
        if (result.status === 'error') {
          throw new Error(result.message)
        }
        
        loadBalancer.recordSuccess(scriptUrl)
        return result
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error)
        loadBalancer.recordFailure(scriptUrl)
        lastError = error
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
        }
      }
    }
    
    throw lastError
  },

  async readData(sheetId, sheetName = 'data3fez', useCache = true) {
    try {
      // ✅ Try IndexedDB cache first (browser এর মধ্যে)
      if (useCache && typeof window !== 'undefined') {
        const cachedData = await dbCache.get(sheetId)
        if (cachedData) {
          console.log('✅ Data loaded from IndexedDB cache')
          return cachedData
        }
      }
      
      // Fetch from Google Sheets
      console.log('📡 Fetching from Google Sheets...')
      const result = await this.makeRequest({
        sheetId,
        action: 'read',
        sheetName
      })
      
      const data = result.data || []
      
      // ✅ Cache in IndexedDB (background, browser এ)
      if (data.length > 0 && typeof window !== 'undefined') {
        dbCache.set(sheetId, data).catch(console.error)
        console.log('💾 Data cached in IndexedDB')
      }
      
      return data
    } catch (error) {
      console.error('Read Error:', error)
      throw error
    }
  },

  async addRow(sheetId, data, sheetName = 'data3fez') {
    try {
      const result = await this.makeRequest({
        sheetId,
        action: 'add',
        sheetName,
        data
      })
      
      // ✅ Clear IndexedDB cache
      if (typeof window !== 'undefined') {
        await dbCache.delete(sheetId)
        console.log('🗑️ Cache cleared from IndexedDB')
      }
      storage.clearMeterCache()
      
      return result
    } catch (error) {
      console.error('Add Error:', error)
      throw error
    }
  },

  async updateCell(sheetId, row, col, value, sheetName = 'data3fez') {
    try {
      const result = await this.makeRequest({
        sheetId,
        action: 'update',
        sheetName,
        row,
        col,
        value
      })
      
      // ✅ Clear IndexedDB cache
      if (typeof window !== 'undefined') {
        await dbCache.delete(sheetId)
      }
      storage.clearMeterCache()
      
      return result
    } catch (error) {
      console.error('Update Error:', error)
      throw error
    }
  },

  async deleteRow(sheetId, row, sheetName = 'data3fez') {
    try {
      const result = await this.makeRequest({
        sheetId,
        action: 'delete',
        sheetName,
        row
      })
      
      // ✅ Clear IndexedDB cache
      if (typeof window !== 'undefined') {
        await dbCache.delete(sheetId)
      }
      storage.clearMeterCache()
      
      return result
    } catch (error) {
      console.error('Delete Error:', error)
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
          const data = await this.readData(sheetId, 'data3fez', false)
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

  // ✅ IndexedDB Statistics (Settings page এ দেখাবে)
  async getCacheStats() {
    if (typeof window === 'undefined') return null
    return await dbCache.getStats()
  },

  // ✅ Clear all cache
  async clearAllCache() {
    if (typeof window === 'undefined') return
    await dbCache.clear()
    storage.clearMeterCache()
    console.log('🗑️ All cache cleared')
  }
}