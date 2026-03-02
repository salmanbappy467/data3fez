'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { pbsnetApi } from '../lib/api'
import { storage } from '../lib/storage'

export default function AuthGuard({ children }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const savedKey = storage.getApiKey()
    const cachedData = storage.getUserData()

    if (savedKey && cachedData) {
      // ✅ Check if first login
      if (storage.isFirstLogin()) {
        router.push('/settings')
        storage.clearFirstLogin()
      }
      setIsAuthenticated(true)
      setLoading(false)
    } else if (savedKey) {
      verifyKey(savedKey)
    } else {
      setLoading(false)
    }
  }, [router])

  const verifyKey = async (key) => {
    try {
      setLoading(true)
      setError('')
      const { data, isFirstLogin } = await pbsnetApi.authenticate(key)
      
      setIsAuthenticated(true)
      
      // ✅ First login redirect
      if (isFirstLogin) {
        setTimeout(() => {
          router.push('/settings')
          storage.clearFirstLogin()
        }, 500)
      }
    } catch (err) {
      setError('Invalid API Key or Network Error')
      storage.removeApiKey()
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!apiKey.startsWith('pbsnet-')) {
      setError('API Key must start with "pbsnet-"')
      return
    }
    await verifyKey(apiKey)
  }

  const handleLogout = () => {
    storage.removeApiKey()
    setIsAuthenticated(false)
    setApiKey('')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-4">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-blue-600 absolute top-0"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-2 border-blue-100">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-3xl">M</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Meter Management
            </h1>
            <p className="text-gray-600 mt-2">Enter your credentials to continue</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔑 PBSNet API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="pbsnet-xxxxx"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all">
              🚀 Login
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Secure authentication via PBSNet API
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}