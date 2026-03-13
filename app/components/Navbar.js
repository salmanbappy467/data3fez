'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiLogOut, FiSettings } from 'react-icons/fi'
import { storage } from '../lib/storage'
import SyncStatus from './SyncStatus'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    setUser(storage.getUserData())
  }, [])

  const handleLogout = () => {
    storage.clearAll()
    window.location.href = '/'
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Title */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push('/')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              D
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 hidden sm:block">
              Data3fez
            </span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <SyncStatus />
            
            <button
              onClick={() => router.push('/settings')}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              title="Settings"
            >
              <FiSettings size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}