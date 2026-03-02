'use client'

import { useRouter } from 'next/navigation'
import { FiSettings, FiLogOut } from 'react-icons/fi'
import { storage } from '../lib/storage'

export default function Navbar() {
  const router = useRouter()
  const userData = storage.getUserData()

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      storage.removeApiKey()
      window.location.reload()
    }
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-30 border-b-2 border-blue-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Meter Management
              </h1>
              <p className="text-xs text-gray-600">Data Management System</p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {userData && (
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {userData.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-600">
                  {userData.designation || 'PBS User'}
                </p>
              </div>
            )}

            <button
              onClick={() => router.push('/settings')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all font-medium"
              title="Settings"
            >
              <FiSettings size={20} />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all font-medium"
              title="Logout"
            >
              <FiLogOut size={20} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}