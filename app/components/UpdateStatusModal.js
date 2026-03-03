'use client'

import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { STATUS_OPTIONS } from '../lib/constants'

export default function UpdateStatusModal({ onClose }) {
  const [dataSheetNumbers, setDataSheetNumbers] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [updateData, setUpdateData] = useState({
    sendMeterDate: '',
    reciveMeterDate: '',
    rebTestfull: '',
    rebtestData: '',
    testsubmitDate: '',
    googledriveLink: '',
    status: ''
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
        alert('Please setup Google Sheet first')
        onClose()
        return
      }

      const data = await sheetsApi.readData(sheetId)
      const uniqueSheets = [...new Set(
        data.slice(1)
          .map(row => row[1]) // dataSheetNo is column 1
          .filter(Boolean)
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

      // Load all data
      const allData = await sheetsApi.readData(sheetId)
      const headers = allData[0]
      
      // Find indices
      const dataSheetNoIndex = headers.indexOf('dataSheetNo')
      const sendMeterDateIndex = headers.indexOf('sendMeterDate')
      const reciveMeterDateIndex = headers.indexOf('reciveMeterDate')
      const rebTestfullIndex = headers.indexOf('rebTestfull')
      const rebtestDataIndex = headers.indexOf('rebtestData')
      const testsubmitDateIndex = headers.indexOf('testsubmitDate')
      const googledriveLinkIndex = headers.indexOf('googledriveLink')
      const statusIndex = headers.indexOf('status')

      let updatedCount = 0

      // Update matching rows
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][dataSheetNoIndex] === selectedSheet) {
          if (updateData.sendMeterDate) {
            await sheetsApi.updateCell(sheetId, i + 1, sendMeterDateIndex + 1, updateData.sendMeterDate)
          }
          if (updateData.reciveMeterDate) {
            await sheetsApi.updateCell(sheetId, i + 1, reciveMeterDateIndex + 1, updateData.reciveMeterDate)
          }
          if (updateData.rebTestfull) {
            await sheetsApi.updateCell(sheetId, i + 1, rebTestfullIndex + 1, updateData.rebTestfull)
          }
          if (updateData.rebtestData) {
            await sheetsApi.updateCell(sheetId, i + 1, rebtestDataIndex + 1, updateData.rebtestData)
          }
          if (updateData.testsubmitDate) {
            await sheetsApi.updateCell(sheetId, i + 1, testsubmitDateIndex + 1, updateData.testsubmitDate)
          }
          if (updateData.googledriveLink) {
            await sheetsApi.updateCell(sheetId, i + 1, googledriveLinkIndex + 1, updateData.googledriveLink)
          }
          if (updateData.status) {
            await sheetsApi.updateCell(sheetId, i + 1, statusIndex + 1, updateData.status)
          }
          updatedCount++
        }
      }

      alert(`Updated ${updatedCount} rows successfully`)
      onClose()
    } catch (error) {
      alert('Update failed: ' + error.message)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="bg-white p-8 rounded-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <h2 className="text-xl font-bold">Update Status by Data Sheet</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Data Sheet Number
            </label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="input-field"
            >
              <option value="">-- Select --</option>
              {dataSheetNumbers.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Send Meter Date
              </label>
              <input
                type="date"
                value={updateData.sendMeterDate}
                onChange={(e) => setUpdateData(prev => ({ ...prev, sendMeterDate: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Receive Meter Date
              </label>
              <input
                type="date"
                value={updateData.reciveMeterDate}
                onChange={(e) => setUpdateData(prev => ({ ...prev, reciveMeterDate: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                REB Test Full
              </label>
              <input
                type="text"
                value={updateData.rebTestfull}
                onChange={(e) => setUpdateData(prev => ({ ...prev, rebTestfull: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                REB Test Data
              </label>
              <input
                type="text"
                value={updateData.rebtestData}
                onChange={(e) => setUpdateData(prev => ({ ...prev, rebtestData: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Submit Date
              </label>
              <input
                type="date"
                value={updateData.testsubmitDate}
                onChange={(e) => setUpdateData(prev => ({ ...prev, testsubmitDate: e.target.value }))}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={updateData.status}
                onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="">-- No Change --</option>
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Drive Link
              </label>
              <input
                type="url"
                value={updateData.googledriveLink}
                onChange={(e) => setUpdateData(prev => ({ ...prev, googledriveLink: e.target.value }))}
                placeholder="https://drive.google.com/..."
                className="input-field"
              />
            </div>
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating || !selectedSheet}
            className="btn-primary disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update All'}
          </button>
        </div>
      </div>
    </div>
  )
}