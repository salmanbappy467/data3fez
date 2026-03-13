'use client'

import { useState, useEffect } from 'react'
import { FiWifi, FiWifiOff, FiRefreshCw } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'

export default function SyncStatus() {
  const [status, setStatus] = useState('idle') // idle, syncing, success, error

  useEffect(() => {
    // ইভেন্ট লিসেনার যোগ করা (api.js থেকে সিগন্যাল পাবে)
    const handleSyncStart = () => setStatus('syncing')
    const handleSyncSuccess = () => {
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000) // ৩ সেকেন্ড পর আবার নরমাল হবে
    }
    const handleSyncError = () => setStatus('error')

    window.addEventListener('sync-start', handleSyncStart)
    window.addEventListener('sync-success', handleSyncSuccess)
    window.addEventListener('sync-error', handleSyncError)

    return () => {
      window.removeEventListener('sync-start', handleSyncStart)
      window.removeEventListener('sync-success', handleSyncSuccess)
      window.removeEventListener('sync-error', handleSyncError)
    }
  }, [])

  const handleForceSync = async () => {
    const userData = storage.getUserData()
    const sheetId = userData?.app_json?.data3fez?.sheetId
    
    if (!sheetId) return

    try {
      // Force Sync কল করা হচ্ছে
      await sheetsApi.readData(sheetId, 'data3fez', true)
    } catch (error) {
      console.error('Force sync failed', error)
    }
  }

  const getIcon = () => {
    switch (status) {
      case 'syncing':
        return <FiRefreshCw className="animate-spin text-yellow-500" />
      case 'error':
        return <FiWifiOff className="text-red-500" />
      case 'success':
        return <FiWifi className="text-green-500" />
      default:
        return <FiWifi className="text-gray-400 hover:text-blue-500" />
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'syncing': return 'Syncing...'
      case 'error': return 'Sync Failed'
      case 'success': return 'Synced'
      default: return 'Online'
    }
  }

  return (
    <button
      onClick={handleForceSync}
      disabled={status === 'syncing'}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm hover:bg-gray-50 transition-all text-sm font-medium"
      title="Click to Force Sync"
    >
      {getIcon()}
      <span className={`hidden sm:inline ${
        status === 'error' ? 'text-red-600' : 
        status === 'success' ? 'text-green-600' : 
        status === 'syncing' ? 'text-yellow-600' : 'text-gray-600'
      }`}>
        {getStatusText()}
      </span>
    </button>
  )
}