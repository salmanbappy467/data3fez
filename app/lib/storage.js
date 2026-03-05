export const storage = {
  saveApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pbsnet_api_key', key)
    }
  },

  getApiKey: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pbsnet_api_key')
    }
    return null
  },

  removeApiKey: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pbsnet_api_key')
      localStorage.removeItem('user_data_cache')
      localStorage.removeItem('first_login')
    }
  },

  // First login flag
  isFirstLogin: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('first_login') === 'true'
    }
    return false
  },

  clearFirstLogin: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('first_login')
    }
  },

  setItem: (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value)
    }
  },

  // Rest remains same...
  saveUserData: (data) => {
    if (typeof window !== 'undefined') {
      const cacheData = { data, timestamp: Date.now() }
      localStorage.setItem('user_data_cache', JSON.stringify(cacheData))
    }
  },

  getUserData: () => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('user_data_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const ONE_HOUR = 60 * 60 * 1000
        if (Date.now() - timestamp < ONE_HOUR) {
          return data
        }
      }
    }
    return null
  },

  saveMeterData: (data) => {
    if (typeof window !== 'undefined') {
      const cacheData = { data, timestamp: Date.now() }
      sessionStorage.setItem('meter_data_cache', JSON.stringify(cacheData))
    }
  },

  getMeterData: () => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('meter_data_cache')
      if (cached) {
        const { data, timestamp } = JSON.parse(cached)
        const THIRTY_MINUTES = 30 * 60 * 1000
        if (Date.now() - timestamp < THIRTY_MINUTES) {
          return data
        }
      }
    }
    return null
  },

  clearMeterCache: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('meter_data_cache')
    }
  },

  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear() 
    }
  },

  savePrintSettings: (settings) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('print_settings', JSON.stringify(settings))
    }
  },

  getPrintSettings: () => {
    if (typeof window !== 'undefined') {
      const settings = localStorage.getItem('print_settings')
      return settings ? JSON.parse(settings) : null
    }
    return null
  }
}