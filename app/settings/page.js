'use client'

import { useState, useEffect } from 'react'
import { FiArrowLeft, FiSave, FiHome, FiSettings as FiSettingsIcon, FiPrinter, FiLogOut } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { pbsnetApi, sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { DEFAULT_PRINT_SETTINGS } from '../lib/constants'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('sheet')
  const [sheetUrl, setSheetUrl] = useState('')
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = storage.getPrintSettings()
    return saved || DEFAULT_PRINT_SETTINGS
  })
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState(null)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    const cached = storage.getUserData()
    setUserData(cached)
    setApiKey(storage.getApiKey())
    
    if (cached?.app_json?.data3fez?.sheetId) {
      setSheetUrl(`https://docs.google.com/spreadsheets/d/${cached.app_json.data3fez.sheetId}`)
    }

    // ✅ Sync Print Settings from API if available
    const apiPrintSettings = cached?.app_json?.data3fez?.printSettings
    if (apiPrintSettings) {
      setPrintSettings(apiPrintSettings)
      storage.savePrintSettings(apiPrintSettings)
    }
  }, [])

  const handleLogout = () => {
    storage.clearAll()
    window.location.href = '/'
  }

  const handleSheetSetup = async () => {
    try {
      setSaving(true)
      const sheetId = await sheetsApi.validateAndSetupSheet(sheetUrl)
      
      const apiKey = storage.getApiKey()
      await pbsnetApi.updateData(apiKey, 'data3fez', { sheetId })
      
      const updatedUserData = {
        ...userData,
        app_json: {
          ...userData?.app_json,
          data3fez: {
            ...userData?.app_json?.data3fez,
            sheetId
          }
        }
      }
      storage.saveUserData(updatedUserData)
      setUserData(updatedUserData)
      
      alert('✅ Google Sheet setup successfully!')
    } catch (error) {
      alert('❌ Setup failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePrintSettingsSave = async () => {
    try {
      setSaving(true)
      
      // ১. সেভ লোকাল
      storage.savePrintSettings(printSettings)
      
      // ২. সেভ টু এপিআই (সার্ভারে)
      const apiKey = storage.getApiKey()
      const currentAppJson = userData?.app_json?.data3fez || {}
      
      const updatedAppJson = {
        ...currentAppJson,
        printSettings
      }

      await pbsnetApi.updateData(apiKey, 'data3fez', updatedAppJson)
      
      // ৩. আপডেট লোকাল ইউজার ডেটা অবজেক্ট
      const updatedUserData = {
        ...userData,
        app_json: {
          ...userData?.app_json,
          data3fez: updatedAppJson
        }
      }
      storage.saveUserData(updatedUserData)
      setUserData(updatedUserData)

      alert('✅ Print settings synced and saved to server!')
    } catch (error) {
      alert('❌ Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleColumnLabelChange = (key, value) => {
    setPrintSettings(prev => ({
      ...prev,
      printColumns: {
        ...prev.printColumns,
        [key]: value
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FiArrowLeft size={24} />
              <span className="font-medium">Back to Home</span>
            </button>
            
            <div className="flex items-center gap-3">
              <FiSettingsIcon size={28} className="text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-[72px] z-10">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            <TabButton
              active={activeTab === 'sheet'}
              onClick={() => setActiveTab('sheet')}
              icon={<FiSettingsIcon size={20} />}
              label="Sheet Setup"
            />
            <TabButton
              active={activeTab === 'print'}
              onClick={() => setActiveTab('print')}
              icon={<FiPrinter size={20} />}
              label="Print Config"
            />
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* SHEET SETUP TAB */}
          {activeTab === 'sheet' && (
            <div className="space-y-6 animate-fade-in">
              {/* User Identity Info Card */}
              <div className="bg-white rounded-2xl shadow-sm p-4 border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                    <span className="font-bold text-xl uppercase">{userData?.username?.charAt(0) || 'U'}</span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Authenticated User</p>
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">{userData?.username || 'User'}</h4>
                      <button 
                        onClick={handleLogout}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-all flex items-center gap-1.5"
                        title="Logout from session"
                      >
                        <FiLogOut size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">PBSNet API Key</p>
                  <code className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {apiKey ? `${apiKey.substring(0, 15)}...` : 'N/A'}
                  </code>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">
                    📊 Google Sheet Configuration
                  </h3>
                  {userData?.app_json?.data3fez?.sheetId ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-bold border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-bold border border-amber-200">
                      Disconnected
                    </span>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Google Sheet URL
                    </label>
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="url"
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base bg-white"
                      />
                      <button
                        onClick={handleSheetSetup}
                        disabled={saving || !sheetUrl}
                        className={`md:w-48 font-bold py-3 px-6 rounded-xl shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base flex items-center justify-center gap-2 ${
                          userData?.app_json?.data3fez?.sheetId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        }`}
                      >
                        {saving ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : userData?.app_json?.data3fez?.sheetId ? (
                          '🔄 Change Sheet'
                        ) : (
                          '🚀 Setup Sheet'
                        )}
                      </button>
                    </div>
                    {userData?.app_json?.data3fez?.sheetId && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Currently working with:</span>
                        <a 
                          href={sheetUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          View Open Sheet ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 border-l-4 ${
                userData?.app_json?.data3fez?.sheetId 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'bg-amber-50 border-amber-500'
              }`}>
                <h4 className={`font-bold mb-3 text-lg ${
                  userData?.app_json?.data3fez?.sheetId ? 'text-blue-900' : 'text-amber-900'
                }`}>
                  {userData?.app_json?.data3fez?.sheetId ? '📋 Connected Insights:' : '⚠️ Setup Required:'}
                </h4>
                <ul className={`text-base space-y-2 ${
                  userData?.app_json?.data3fez?.sheetId ? 'text-blue-800' : 'text-amber-800'
                }`}>
                  {userData?.app_json?.data3fez?.sheetId ? (
                    <>
                      <li>✓ Sync is active for "data3fez" tab</li>
                      <li>✓ Backup is running on background</li>
                      <li>✓ Local cache is enabled</li>
                    </>
                  ) : (
                    <>
                      <li>✓ Sheet must be publicly accessible</li>
                      <li>✓ Tab "data3fez" will be auto-created</li>
                      <li>✓ Headers will be added automatically</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {/* PRINT SETUP TAB */}
          {activeTab === 'print' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Settings */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  📄 Page Header
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ModernInput
                    label="Zone Name"
                    value={printSettings.zonalname}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, zonalname: v }))}
                    placeholder="e.g., Dhaka Zone"
                  />
                  <ModernInput
                    label="PBS Name"
                    value={printSettings.pbsname}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, pbsname: v }))}
                    placeholder="e.g., Dhaka PBS-1"
                  />
                  <div className="md:col-span-2">
                    <ModernInput
                      label="Title"
                      value={printSettings.title}
                      onChange={(v) => setPrintSettings(prev => ({ ...prev, title: v }))}
                      placeholder="e.g., Meter Data Sheet"
                    />
                  </div>
                </div>
              </div>

              {/* Footer Settings */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  🔖 Page Footer
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <ModernInput
                    label="Footer 1"
                    value={printSettings.fot1}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, fot1: v }))}
                  />
                  <ModernInput
                    label="Footer 2"
                    value={printSettings.fot2}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, fot2: v }))}
                  />
                  <ModernInput
                    label="Footer 3"
                    value={printSettings.fot3}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, fot3: v }))}
                  />
                  <ModernInput
                    label="Footer 4"
                    value={printSettings.fot4}
                    onChange={(v) => setPrintSettings(prev => ({ ...prev, fot4: v }))}
                  />
                </div>
              </div>

              {/* Column Labels */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  📊 Table Column Labels
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(printSettings.printColumns).map(([key, label]) => (
                    <ModernInput
                      key={key}
                      label={key}
                      value={label}
                      onChange={(v) => handleColumnLabelChange(key, v)}
                    />
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <button
                onClick={handlePrintSettingsSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg"
              >
                <FiSave size={24} />
                {saving ? 'Saving...' : 'Save Print Settings'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============= Helper Components =============

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-4 text-base font-semibold flex items-center gap-2 transition-all border-b-4 ${
        active
          ? 'border-blue-600 text-blue-600 bg-blue-50'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
      <p className="text-base font-bold text-gray-900">{value || '-'}</p>
    </div>
  )
}

function ModernInput({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      />
    </div>
  )
}