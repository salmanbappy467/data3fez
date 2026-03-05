'use client'

import { useState, useEffect } from 'react'
import { FiX, FiPrinter } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { DEFAULT_PRINT_SETTINGS } from '../lib/constants'

export default function PrintModal({ onClose }) {
  const [dataSheetNumbers, setDataSheetNumbers] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [printData, setPrintData] = useState([])
  const [settings, setSettings] = useState(() => {
    const saved = storage.getPrintSettings()
    return saved || DEFAULT_PRINT_SETTINGS
  })
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
      // ✅ String এ কনভার্ট করা হয়েছে যাতে টাইপ মিসম্যাচ না হয়
      const uniqueSheets = [...new Set(
        data.slice(1).map(row => String(row[1] || '')).filter(Boolean)
      )]
      
      setDataSheetNumbers(uniqueSheets.sort())
    } catch (error) {
      alert('Failed to load data sheets: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadPrintData = async (sheetNo) => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      const allData = await sheetsApi.readData(sheetId)
      const headers = allData[0]
      
      // ✅ String(row[1]) ব্যবহার করে সিলেক্ট করা শীট নাম্বারের সাথে ম্যাচ করানো হলো
      const filtered = allData.slice(1).filter(row => String(row[1] || '') === String(sheetNo))
      const printColumns = Object.keys(settings.printColumns || {}).filter(k => k !== 'Print-serialnu')
      const indices = printColumns.map(col => headers.indexOf(col))
      
      const processedData = filtered.map(row => 
        indices.map(idx => row[idx] || '-')
      )
      
      setPrintData(processedData)
    } catch (error) {
      alert('Failed to load print data: ' + error.message)
    }
  }

  useEffect(() => {
    if (selectedSheet) {
      loadPrintData(selectedSheet)
    } else {
      setPrintData([]) // যদি কিছু সিলেক্ট না থাকে
    }
  }, [selectedSheet])

  const handlePrint = () => {
    if (!printData.length) {
      alert('No data to print')
      return
    }
    window.print()
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
    <>
      {/* Modal View */}
      <div className="modal-backdrop print:hidden" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
            <h2 className="text-xl font-bold">Print Data Sheet</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={!printData.length}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors"
                title="Print"
              >
                <FiPrinter size={24} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
            <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Data Sheet Number
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="">-- Select Data Sheet --</option>
                {dataSheetNumbers.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {printData.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-x-auto shadow-sm">
                <PrintContent data={printData} settings={settings} />
              </div>
            )}

            {printData.length === 0 && selectedSheet && (
              <div className="text-center py-12 text-gray-500 bg-white border border-gray-200 rounded-lg">
                No data found for this Data Sheet Number
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div className="hidden print:block print-area">
        <PrintContent data={printData} settings={settings} />
      </div>
    </>
  )
}

function PrintContent({ data, settings }) {
  // ✅ প্রতি পেজে ঠিক ১১টি করে ডাটা (Row) দেখানো হবে
  const ROWS_PER_PAGE = 11
  const pages = []
  
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE))
  }

  const columnLabels = Object.entries(settings.printColumns || {})
    .filter(([k]) => k !== 'Print-serialnu')
    .map(([_, label]) => label)

  return (
    <>
      {pages.map((pageData, pageIdx) => (
        // ✅ flex-col এবং minHeight: 100vh ব্যবহার করে হেডার ও ফুটার পেজে ফিক্সড করা হয়েছে
        <div key={pageIdx} className="print:flex print:flex-col print:h-screen print:p-8 bg-white mb-8" style={{ pageBreakAfter: 'always', minHeight: '100vh' }}>
          
          <div>
            {/* Header Section */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-bold uppercase">{settings.zonalname}</h3>
              <h4 className="text-base font-semibold">{settings.pbsname}</h4>
              <h2 className="text-xl font-bold mt-2 border-b-2 border-gray-800 inline-block pb-1">
                {settings.title}
              </h2>
            </div>

            {/* Data Table */}
            <table className="w-full border-collapse text-xs mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-2 border-gray-800 px-2 py-2 text-center w-12">
                    {settings.printColumns?.['Print-serialnu'] || 'SL'}
                  </th>
                  {columnLabels.map((label, idx) => (
                    <th key={idx} className="border-2 border-gray-800 px-2 py-2 text-left">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border-2 border-gray-800 px-2 py-2 text-center font-medium">
                      {pageIdx * ROWS_PER_PAGE + idx + 1}
                    </td>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border-2 border-gray-800 px-2 py-2 text-left">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Section - mt-auto ensures it stays at the bottom */}
          <div className="mt-auto pt-6 pb-2">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center border-t-2 border-gray-800 pt-2">
                <p className="font-semibold text-gray-900">{settings.fot1}</p>
              </div>
              <div className="text-center border-t-2 border-gray-800 pt-2">
                <p className="font-semibold text-gray-900">{settings.fot2}</p>
              </div>
              <div className="text-center border-t-2 border-gray-800 pt-2">
                <p className="font-semibold text-gray-900">{settings.fot3}</p>
              </div>
              <div className="text-center border-t-2 border-gray-800 pt-2">
                <p className="font-semibold text-gray-900">{settings.fot4}</p>
              </div>
            </div>

            {/* Page Number */}
            <div className="text-right text-xs text-gray-500 mt-4">
              Page {pageIdx + 1} of {pages.length}
            </div>
          </div>

        </div>
      ))}
    </>
  )
}