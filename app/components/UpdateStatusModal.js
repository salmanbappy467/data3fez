'use client'

import { useState, useEffect } from 'react'
import { FiX, FiCheckCircle } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import {
  STATUS_OPTIONS,
  MF_OPTIONS,
  CLASS_OPTIONS,
  ITEM_OPTIONS,
  REMARKS_OPTIONS,
  CONDITION_OPTIONS,
  HEADER_COLUMNS
} from '../lib/constants'
import dbCache from '../lib/indexedDB'

export default function UpdateStatusModal({ onClose }) {
  const [dataSheetNumbers, setDataSheetNumbers] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [targetColumn, setTargetColumn] = useState('status')
  const [updateValue, setUpdateValue] = useState('')
  const [customValue, setCustomValue] = useState('')

  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)

  // কলাম লিস্ট যা আপডেট করা যাবে
  const UPDATEABLE_COLUMNS = [
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    { key: 'sendMeterDate', label: 'Send Meter Date', type: 'date' },
    { key: 'reciveMeterDate', label: 'Receive Meter Date', type: 'date' },
    { key: 'testsubmitDate', label: 'Test Submit Date', type: 'date' },
    { key: 'reIsudate', label: 'Re-Issue Date', type: 'date' },
    { key: 'googledriveLink', label: 'Google Drive Link', type: 'url' }
  ]

  useEffect(() => {
    loadDataSheetNumbers()
  }, [])

  const loadDataSheetNumbers = async () => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      if (!sheetId) return

      // লোকাল ক্যাশ থেকে ডেটাশিট নম্বরগুলো নেওয়া হচ্ছে (ফাস্ট লোড)
      const data = await sheetsApi.readData(sheetId)
      if (data && data.length > 1) {
        const uniqueSheets = [...new Set(
          data.slice(1).map(row => String(row[1] || '')).filter(Boolean)
        )]
        setDataSheetNumbers(uniqueSheets.sort())
      }
    } catch (error) {
      console.error('Load Sheets Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedSheet || !updateValue) {
      alert('Please select all required fields')
      return
    }

    try {
      setUpdating(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId

      // ১. লেটেস্ট লোকাল ডেটা নেওয়া
      const allData = await dbCache.get(sheetId)
      if (!allData) throw new Error('Local data not found. Please refresh table.')

      const headers = HEADER_COLUMNS // Constants থেকে নেওয়া হচ্ছে নিশ্চিত করার জন্য
      const dataSheetNoIndex = headers.indexOf('dataSheetNo')
      const targetColIndex = headers.indexOf(targetColumn)

      if (dataSheetNoIndex === -1 || targetColIndex === -1) {
        throw new Error('Column indexing failed')
      }

      // তারিখ ফরম্যাট করা (যদি তারিখ হয়)
      const finalValue = (updateValue === 'other' && customValue) ? customValue : updateValue
      const isDateField = UPDATEABLE_COLUMNS.find(c => c.key === targetColumn)?.type === 'date'

      const formatValue = (v) => {
        if (isDateField && v.includes('-')) {
          const [y, m, d] = v.split('-')
          return `${d}/${m}/${y}`
        }
        return v
      }

      const formattedFinalValue = formatValue(finalValue)

      // ২. লোকাল আপডেট (তৎক্ষণাৎ পরিবর্তন)
      const newData = [...allData]
      const googleUpdates = []
      let updatedCount = 0

      const colLetter = sheetsApi.getColLetter(targetColIndex)

      for (let i = 1; i < newData.length; i++) {
        if (String(newData[i][dataSheetNoIndex] || '') === String(selectedSheet)) {
          const updatedRow = [...newData[i]]
          updatedRow[targetColIndex] = formattedFinalValue
          newData[i] = updatedRow
          updatedCount++

          // ৩. ব্যাকগ্রাউন্ড সিঙ্কের জন্য ডেটা জমা করা
          googleUpdates.push({
            range: `${colLetter}${i + 1}`,
            values: [[formattedFinalValue]]
          })
        }
      }

      if (updatedCount > 0) {
        // সেভ টু IndexedDB
        await dbCache.set(sheetId, newData)
        // টেবিল সিগন্যাল পাঠানো
        window.dispatchEvent(new Event('data-change'))

        // ৪. ব্যাকগ্রাউন্ডে গুগল শিটে তথ্য পাঠানো (একক কল)
        sheetsApi.batchUpdate(sheetId, googleUpdates)
          .then(() => {
            console.log(`Sync success for ${updatedCount} rows via Batch Update`)
            // সাকসেস হলে একবার ব্যাকগ্রাউন্ডে রিফ্রেশ করা যেতে পারে
            sheetsApi.readData(sheetId, 'data3fez', true).catch(() => { })
          })
          .catch(err => {
            console.error('Background Sync Error:', err)
            window.dispatchEvent(new Event('sync-error'))
          })

        onClose()
      } else {
        alert('No matching rows found')
        setUpdating(false)
      }

    } catch (error) {
      alert('Update Error: ' + error.message)
      setUpdating(false)
    }
  }

  const currentColumnInfo = UPDATEABLE_COLUMNS.find(c => c.key === targetColumn)

  if (loading) {
    return (
      <div className="modal-backdrop">
        <div className="bg-white p-6 rounded-xl shadow-xl flex items-center gap-3">
          <div className="animate-spin h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full"></div>
          <p className="font-bold text-gray-700">Loading Data Sheets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto my-10 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            🚀 Advanced Bulk Update
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* ১. ডেটাশিট সিলেকশন */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 ml-1">১. সিলেক্ট ডেটাশিট নম্বর</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="bulk-update-field"
            >
              <option value="">-- Choose Data Sheet --</option>
              {dataSheetNumbers.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>

          {/* ২. কলাম সিলেকশন */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 ml-1">২. কোনটি আপডেট করবেন?</label>
            <select
              value={targetColumn}
              onChange={(e) => {
                setTargetColumn(e.target.value)
                setUpdateValue('')
                setCustomValue('')
              }}
              className="bulk-update-field border-indigo-200"
            >
              {UPDATEABLE_COLUMNS.map(col => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
          </div>

          {/* ৩. ভ্যালু ইনপুট */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-xl border-2 border-dashed border-gray-200">
            <label className="text-sm font-bold text-indigo-800 ml-1">৩. নতুন তথ্য লিখুন</label>

            {currentColumnInfo?.type === 'select' ? (
              <>
                <select
                  value={updateValue}
                  onChange={(e) => setUpdateValue(e.target.value)}
                  className="bulk-update-field bg-white"
                >
                  <option value="">-- Select Option --</option>
                  {currentColumnInfo.options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {updateValue === 'other' && currentColumnInfo.hasOther && (
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Enter manual info..."
                    className="bulk-update-field mt-2 bg-white border-blue-400"
                  />
                )}
              </>
            ) : (
              <input
                type={currentColumnInfo?.type || 'text'}
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                className="bulk-update-field bg-white"
                placeholder={`Enter new ${currentColumnInfo?.label}`}
              />
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex flex-col gap-3 rounded-b-2xl">
          <button
            onClick={handleUpdate}
            disabled={updating || !selectedSheet || !updateValue}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {updating ? (
              <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              <FiCheckCircle size={22} className="group-hover:scale-110 transition-transform" />
            )}
            {updating ? 'Processing...' : 'Update & Sync in Background'}
          </button>
          <p className="text-[10px] text-center text-gray-400">
            * এটি তৎক্ষণাৎ টেবিলে আপডেট হবে এবং গুগল শিটে ব্যাকগ্রাউন্ডে সেভ হবে।
          </p>
        </div>
      </div>

      <style jsx>{`
        .bulk-update-field {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #f1f5f9;
          border-radius: 12px;
          outline: none;
          font-weight: 500;
          transition: all 0.2s;
        }
        .bulk-update-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 4px #6366f110;
        }
      `}</style>
    </div>
  )
}