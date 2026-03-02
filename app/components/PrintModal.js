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

  const loadPrintData = async (sheetNo) => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      const allData = await sheetsApi.readData(sheetId)
      const headers = allData[0]
      
      const filtered = allData.slice(1).filter(row => row[1] === sheetNo)
      const printColumns = Object.keys(settings.printColumns).filter(k => k !== 'Print-serialnu')
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
          className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
            <h2 className="text-xl font-bold">Print Data Sheet</h2>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                disabled={!printData.length}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50"
                title="Print"
              >
                <FiPrinter size={24} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Data Sheet Number
              </label>
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(e.target.value)}
                className="input-field max-w-xs"
              >
                <option value="">-- Select Data Sheet --</option>
                {dataSheetNumbers.map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

            {printData.length > 0 && (
              <div className="border rounded-lg p-4 bg-white overflow-x-auto">
                <PrintContent data={printData} settings={settings} />
              </div>
            )}

            {printData.length === 0 && selectedSheet && (
              <div className="text-center py-12 text-gray-500">
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
  const ROWS_PER_PAGE = 15
  const pages = []
  
  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE))
  }

  const columnLabels = Object.entries(settings.printColumns)
    .filter(([k]) => k !== 'Print-serialnu')
    .map(([_, label]) => label)

  return (
    <>
      {pages.map((pageData, pageIdx) => (
        <div key={pageIdx} className="mb-8 print:page-break-after-always">
          {/* Header Section */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold">{settings.zonalname}</h3>
            <h4 className="text-base">{settings.pbsname}</h4>
            <h2 className="text-xl font-bold mt-2">{settings.title}</h2>
          </div>

          {/* Data Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-600 px-2 py-2 text-center">
                  {settings.printColumns['Print-serialnu']}
                </th>
                {columnLabels.map((label, idx) => (
                  <th key={idx} className="border border-gray-600 px-2 py-2">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-600 px-2 py-2 text-center">
                    {pageIdx * ROWS_PER_PAGE + idx + 1}
                  </td>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="border border-gray-600 px-2 py-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Section */}
          <div className="grid grid-cols-4 gap-4 mt-8 text-sm">
            <div className="text-center border-t-2 border-gray-700 pt-2">
              <p className="font-semibold">{settings.fot1}</p>
            </div>
            <div className="text-center border-t-2 border-gray-700 pt-2">
              <p className="font-semibold">{settings.fot2}</p>
            </div>
            <div className="text-center border-t-2 border-gray-700 pt-2">
              <p className="font-semibold">{settings.fot3}</p>
            </div>
            <div className="text-center border-t-2 border-gray-700 pt-2">
              <p className="font-semibold">{settings.fot4}</p>
            </div>
          </div>

          {/* Page Number */}
          <div className="text-right text-xs text-gray-600 mt-4">
            Page {pageIdx + 1} of {pages.length}
          </div>
        </div>
      ))}
    </>
  )
}