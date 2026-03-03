'use client'

import { useState, useEffect } from 'react'
import { FiArrowLeft, FiSave, FiHome, FiSettings as FiSettingsIcon, FiPrinter } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import { pbsnetApi, sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { DEFAULT_PRINT_SETTINGS } from '../lib/constants'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('home')
  const [sheetUrl, setSheetUrl] = useState('')
  const [printSettings, setPrintSettings] = useState(() => {
    const saved = storage.getPrintSettings()
    return saved || DEFAULT_PRINT_SETTINGS
  })
  const [saving, setSaving] = useState(false)
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    const cached = storage.getUserData()
    setUserData(cached)
    
    if (cached?.app_json?.data3fez?.sheetId) {
      setSheetUrl(`https://docs.google.com/spreadsheets/d/${cached.app_json.data3fez.sheetId}`)
    }
  }, [])

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
      
      storage.savePrintSettings(printSettings)
      
      const apiKey = storage.getApiKey()
      const currentData = userData?.app_json?.data3fez || {}
      
      await pbsnetApi.updateData(apiKey, 'data3fez', {
        ...currentData,
        printSettings
      })
      
      alert('✅ Print settings saved successfully!')
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
              active={activeTab === 'home'}
              onClick={() => setActiveTab('home')}
              icon={<FiHome size={20} />}
              label="Profile"
            />
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
          {/* HOME TAB */}
          {activeTab === 'home' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  User Information
                </h3>
                
                {userData && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <InfoCard label="Full Name" value={userData.full_name} />
                    <InfoCard label="Username" value={userData.username} />
                    <InfoCard label="Designation" value={userData.designation} />
                    <InfoCard label="Office" value={userData.office} />
                    <InfoCard label="PBS" value={userData.pbs} />
                    <InfoCard label="Email" value={userData.email} />
                    <InfoCard label="Mobile" value={userData.mobile} />
                    <div className={`md:col-span-2 rounded-xl p-6 border-2 ${
                      userData?.app_json?.data3fez?.sheetId 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-amber-50 border-amber-300'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                          userData?.app_json?.data3fez?.sheetId 
                            ? 'bg-green-500 text-white' 
                            : 'bg-amber-500 text-white'
                        }`}>
                          {userData?.app_json?.data3fez?.sheetId ? '✓' : '!'}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900">Sheet Connection Status</h4>
                          <p className="text-gray-700">
                            {userData?.app_json?.data3fez?.sheetId 
                              ? '✅ Connected & Ready to Use' 
                              : '❌ Not Connected - Please Setup'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SHEET SETUP TAB */}
          {activeTab === 'sheet' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  📊 Google Sheet Configuration
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-3">
                      Sheet URL
                    </label>
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      ℹ️ Paste your Google Sheet URL here
                    </p>
                  </div>

                  <button
                    onClick={handleSheetSetup}
                    disabled={saving || !sheetUrl}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Setting up...
                      </span>
                    ) : (
                      '🚀 Setup Sheet'
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
                <h4 className="font-bold text-blue-900 mb-3 text-lg">📋 Important Notes:</h4>
                <ul className="text-base text-blue-800 space-y-2">
                  <li>✓ Sheet must be publicly accessible</li>
                  <li>✓ Tab "data3fez" will be auto-created</li>
                  <li>✓ Headers will be added automatically</li>
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