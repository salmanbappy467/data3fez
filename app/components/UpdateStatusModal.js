'use client'

import { useState, useEffect } from 'react'
import { FiX, FiRefreshCw } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { STATUS_OPTIONS } from '../lib/constants'

export default function UpdateStatusModal({ onClose }) {
  const [dataSheetNumbers, setDataSheetNumbers] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [formData, setFormData] = useState({
    status: '',
    sendMeterDate: '',
    reciveMeterDate: '',
    rebTestfull: '',
    rebtestData: '',
    testsubmitDate: '',
    googledriveLink: '',
  })
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDataSheetNumbers()
  }, [])

  const loadDataSheetNumbers = async () => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      
      if (!sheetId) {
        alert('Please setup Google Sheet first from Settings')
        onClose()
        return
      }

      const data = await sheetsApi.readData(sheetId)
      const uniqueSheets = [...new Set(
        data.slice(1).map(row => row[1]).filter(Boolean)
      )]
      
      setDataSheetNumbers(uniqueSheets.sort())
    } catch (error) {
      alert('Failed to load data sheets: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedSheet) {
      alert('Please select a Data Sheet Number')
      return
    }

    try {
      setUpdating(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      const allData = await sheetsApi.readData(sheetId)
      const headers = allData[0]

      // Find all rows with matching dataSheetNo
      const rowsToUpdate = allData
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row[1] === selectedSheet)

      if (rowsToUpdate.length === 0) {
        alert('No entries found for this Data Sheet Number')
        return
      }

      // Update each field for all matching rows
      for (const { index } of rowsToUpdate) {
        const rowNum = index + 1 // 1-based

        if (formData.status) {
          const statusCol = headers.indexOf('status') + 1
          await sheetsApi.updateCell(sheetId, rowNum, statusCol, formData.status)
        }

        if (formData.sendMeterDate) {
          const col = headers.indexOf('sendMeterDate') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.sendMeterDate)
        }

        if (formData.reciveMeterDate) {
          const col = headers.indexOf('reciveMeterDate') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.reciveMeterDate)
        }

        if (formData.rebTestfull) {
          const col = headers.indexOf('rebTestfull') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.rebTestfull)
        }

        if (formData.rebtestData) {
          const col = headers.indexOf('rebtestData') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.rebtestData)
        }

        if (formData.testsubmitDate) {
          const col = headers.indexOf('testsubmitDate') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.testsubmitDate)
        }

        if (formData.googledriveLink) {
          const col = headers.indexOf('googledriveLink') + 1
          await sheetsApi.updateCell(sheetId, rowNum, col, formData.googledriveLink)
        }
      }

      alert(`✅ Updated ${rowsToUpdate.length} entries successfully`)
      onClose()
    } catch (error) {
      alert('❌ Update failed: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="bg-white p-8 rounded-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-500 to-pink-600 text-white">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiRefreshCw size={28} />
            Update Status by Data Sheet
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <FiX size={28} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Select Data Sheet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📋 Select Data Sheet Number
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="">-- Select Data Sheet --</option>
                {dataSheetNumbers.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {selectedSheet && (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Don't change</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* Send Meter Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Send Meter Date</label>
                  <input
                    type="text"
                    value={formData.sendMeterDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendMeterDate: e.target.value }))}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Receive Meter Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Receive Meter Date</label>
                  <input
                    type="text"
                    value={formData.reciveMeterDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reciveMeterDate: e.target.value }))}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* REB Test Full */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">REB Test Full</label>
                  <input
                    type="text"
                    value={formData.rebTestfull}
                    onChange={(e) => setFormData(prev => ({ ...prev, rebTestfull: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* REB Test Data */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">REB Test Data</label>
                  <input
                    type="text"
                    value={formData.rebtestData}
                    onChange={(e) => setFormData(prev => ({ ...prev, rebtestData: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Test Submit Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Test Submit Date</label>
                  <input
                    type="text"
                    value={formData.testsubmitDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, testsubmitDate: e.target.value }))}
                    placeholder="dd/mm/yyyy"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Google Drive Link */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Google Drive Link</label>
                  <input
                    type="url"
                    value={formData.googledriveLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, googledriveLink: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpdate} 
            disabled={updating || !selectedSheet} 
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
          >
            {updating ? '🔄 Updating...' : '✅ Update All'}
          </button>
        </div>
      </div>
    </div>
  )
}