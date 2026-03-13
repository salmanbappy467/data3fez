// IndexedDB Wrapper - MongoDB এর মত কাজ করবে browser এ

class IndexedDBCache {
  constructor() {
    this.dbName = 'MeterManagementDB'
    this.version = 1
    this.storeName = 'sheetCache'
    this.db = null
  }

  async init() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object store if doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'sheetId' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async get(sheetId) {
    try {
      await this.init()
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.get(sheetId)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          
          if (!result) {
            resolve(null)
            return
          }

          // ❌ আগের ৩০ মিনিটের অটো-ডিলিট লজিক বাদ দেওয়া হয়েছে
          // এখন ডাটা সরাসরি রিটার্ন করবে, পুরনো হলেও
          resolve(result.data)
        }
      })
    } catch (error) {
      console.error('IndexedDB Get Error:', error)
      return null
    }
  }

  async set(sheetId, data) {
    try {
      await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)
        
        const record = {
          sheetId,
          data,
          timestamp: Date.now(),
          dataSize: JSON.stringify(data).length
        }

        const request = objectStore.put(record)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (error) {
      console.error('IndexedDB Set Error:', error)
      return false
    }
  }

  async delete(sheetId) {
    try {
      await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.delete(sheetId)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (error) {
      console.error('IndexedDB Delete Error:', error)
      return false
    }
  }

  async clear() {
    try {
      await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.clear()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch (error) {
      console.error('IndexedDB Clear Error:', error)
      return false
    }
  }

  async getAllKeys() {
    try {
      await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.getAllKeys()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    } catch (error) {
      console.error('IndexedDB GetAllKeys Error:', error)
      return []
    }
  }

  async getStats() {
    try {
      await this.init()

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.getAll()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const records = request.result
          const totalSize = records.reduce((sum, r) => sum + (r.dataSize || 0), 0)
          const oldestTimestamp = Math.min(...records.map(r => r.timestamp))

          resolve({
            totalRecords: records.length,
            totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB',
            oldestCache: new Date(oldestTimestamp).toLocaleString()
          })
        }
      })
    } catch (error) {
      console.error('IndexedDB Stats Error:', error)
      return { totalRecords: 0, totalSize: '0 MB', oldestCache: 'N/A' }
    }
  }
}

// Singleton instance
const dbCache = new IndexedDBCache()

export default dbCache