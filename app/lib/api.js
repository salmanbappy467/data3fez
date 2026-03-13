import { API_ENDPOINTS, HEADER_COLUMNS } from './constants'
import { storage } from './storage'
import dbCache from './indexedDB'

const broadcast = (event) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(event))
  }
}

// Google Script Load Balancer has been removed as we are now using the official Google Sheets API.

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

export const sheetsApi = {
  getColLetter(colIndex) {
    let letter = '';
    while (colIndex >= 0) {
      letter = String.fromCharCode((colIndex % 26) + 65) + letter;
      colIndex = Math.floor(colIndex / 26) - 1;
    }
    return letter;
  },

  async makeRequest(payload) {
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      if (result.status === 'error') throw new Error(result.message)
      return result
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
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
    
    // ✅ ফিক্স: rowIndex - 1 করা হয়েছে যাতে সঠিক রো আপডেট হয়
    if (typeof window !== 'undefined') {
      try {
        const currentData = await dbCache.get(sheetId)
        if (currentData) {
          const arrayIndex = rowIndex - 1; 
          
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
            broadcast('data-change') 
          }
        }
      } catch (e) {
        console.error('Optimistic update failed', e)
      }
    }

    // ✅ নতুন ফিক্স: অনেকগুলো এপিআই কলের বদলে একটি কলের মাধ্যমে পুরো রো আপডেট করা
    let finalRowData = { ...rowData };

    // যদি ডেটা অসম্পূর্ণ থাকে তবে ক্যাশ থেকে বর্তমান ডেটা নিয়ে আসা
    if (typeof window !== 'undefined') {
      try {
        const currentData = await dbCache.get(sheetId);
        const arrayIndex = rowIndex - 1;
        if (currentData && currentData[arrayIndex]) {
          const cachedRow = {};
          HEADER_COLUMNS.forEach((key, idx) => {
            cachedRow[key] = currentData[arrayIndex][idx];
          });
          finalRowData = { ...cachedRow, ...rowData };
        }
      } catch (e) {
        console.error('Failed to get cached data for merge', e);
      }
    }

    const rowValues = HEADER_COLUMNS.map(key => finalRowData[key] || '');

    try {
       await this.makeRequest({
         sheetId,
         action: 'updateRow',
         sheetName,
         data: {
           row: rowIndex,
           values: rowValues
         }
       })
       broadcast('sync-success')
    } catch (err) {
       broadcast('sync-error')
       console.error(err)
    }
  },

  async batchUpdate(sheetId, updates, sheetName = 'data3fez') {
    broadcast('sync-start')
    try {
      const result = await this.makeRequest({
        sheetId,
        action: 'batchUpdate',
        sheetName,
        data: { updates }
      })
      broadcast('sync-success')
      return result
    } catch (error) {
      broadcast('sync-error')
      console.error('Batch Update Error:', error)
      broadcast('sync-error')
      throw error
    }
  },

  async updateCell(sheetId, row, col, value, sheetName = 'data3fez') {
    return this.makeRequest({ sheetId, action: 'update', sheetName, row, col, value })
  },

  async deleteRow(sheetId, row, sheetName = 'data3fez') {
    if (!row || isNaN(row)) throw new Error('Invalid row index');
    
    broadcast('sync-start')
    try {
      // ✅ Optimistic Local Update
      if (typeof window !== 'undefined') {
        const currentData = await dbCache.get(sheetId)
        if (currentData && Array.isArray(currentData)) {
          const arrayIndex = parseInt(row) - 1; 
          if (arrayIndex > 0 && arrayIndex < currentData.length) {
            const newData = [...currentData]
            newData.splice(arrayIndex, 1)
            await dbCache.set(sheetId, newData)
            broadcast('data-change')
          }
        }
      }

      // ✅ API Call with both 'row' and 'rowIndex' for safety
      const result = await this.makeRequest({ 
        sheetId, 
        action: 'delete', 
        sheetName, 
        row: parseInt(row),
        rowIndex: parseInt(row) 
      })

      broadcast('sync-success')
      return result
    } catch (error) {
      console.error('Delete Row Error:', error)
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
          const data = await this.readData(sheetId, 'data3fez', true) 
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