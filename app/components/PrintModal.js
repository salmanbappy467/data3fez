'use client'

import { useState, useEffect } from 'react'
import { FiX, FiPrinter, FiDownload } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { DEFAULT_PRINT_SETTINGS } from '../lib/constants'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function PrintModal({ onClose }) {
  const [dataSheetNumbers, setDataSheetNumbers] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [printData, setPrintData] = useState([])
  const [activeColumns, setActiveColumns] = useState([])
  const [activeKeys, setActiveKeys] = useState([])
  const [showSerial, setShowSerial] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const [settings, setSettings] = useState(() => {
    const saved = storage.getPrintSettings()
    return saved || DEFAULT_PRINT_SETTINGS
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDataSheetNumbers()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const str = String(dateString).trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str
    try {
      const date = new Date(str)
      if (!isNaN(date)) {
        const dd = String(date.getDate()).padStart(2, '0')
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const yyyy = date.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      }
    } catch (e) { }
    return str.split('T')[0]
  }

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

      const filtered = allData.slice(1).filter(row => String(row[1] || '') === String(sheetNo))

      const itemIndex = headers.indexOf('item')
      const classIndex = headers.indexOf('class')

      const printColumnsKeys = Object.keys(settings.printColumns || {})
        .filter(k => k !== 'Print-serialnu' && k !== 'class')

      setActiveKeys(printColumnsKeys)
      setActiveColumns(printColumnsKeys.map(k => settings.printColumns[k]))

      const indices = printColumnsKeys.map(col => headers.indexOf(col))

      const processedData = filtered.map(row =>
        indices.map((idx, i) => {
          const colKey = printColumnsKeys[i]
          let val = row[idx] || '-'

          if (colKey.toLowerCase().includes('date')) {
            return formatDate(val)
          }

          if (colKey === 'item') {
            const itemVal = row[itemIndex] || ''
            const classVal = row[classIndex] || ''
            return `${itemVal}\n(${classVal})`
          }

          return val
        })
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
      setPrintData([])
    }
  }, [selectedSheet])

  const handlePrint = () => {
    if (!printData.length) {
      alert('No data to print')
      return
    }
    window.print()
  }

  // ✅ PDF Download Function Updated for Custom Size (295mm x 208mm)
  const handleDownloadPDF = async () => {
    if (!printData.length) return
    setDownloading(true)

    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [295, 208] // ✅ Custom Page Size
      })

      const pages = document.querySelectorAll('.print-modal-content .print-page')

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]

        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          logging: false
        })

        const imgData = canvas.toDataURL('image/png')

        // ✅ Dimensions matched exactly
        const imgWidth = 295
        const pageHeight = 208
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        if (i > 0) doc.addPage([295, 208]) // ✅ Add page with custom dimensions
        doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      }

      doc.save(`DataSheet_${selectedSheet}.pdf`)

    } catch (error) {
      console.error('PDF Generation Error:', error)
      alert('Failed to generate PDF')
    } finally {
      setDownloading(false)
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
    <>
      <div className="modal-backdrop print:hidden" onClick={onClose}>
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
            <h2 className="text-xl font-bold">Print Data Sheet</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={!printData.length || downloading}
                className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                title="Download PDF"
              >
                {downloading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  <FiDownload size={24} />
                )}
              </button>

              <button onClick={handlePrint} disabled={!printData.length} className="p-2 hover:bg-white/20 rounded-lg disabled:opacity-50 transition-colors" title="Print">
                <FiPrinter size={24} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto flex-1 bg-gray-50 print-modal-content">
            <div className="mb-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-6 items-end">
              <div className="w-full max-w-xs">
                <label className="block text-sm font-bold text-gray-700 mb-2">Select Data Sheet Number</label>
                <select value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- Select Data Sheet --</option>
                  {dataSheetNumbers.map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pb-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="assignSerial"
                  checked={showSerial}
                  onChange={(e) => setShowSerial(e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="assignSerial" className="font-semibold text-gray-700 cursor-pointer select-none">
                  Assign Serial Number
                </label>
              </div>
            </div>

            {printData.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4 bg-white overflow-x-auto shadow-sm">
                <PrintContent
                  data={printData}
                  columns={activeColumns}
                  keys={activeKeys}
                  settings={settings}
                  showSerial={showSerial}
                />
              </div>
            )}

            {printData.length === 0 && selectedSheet && (
              <div className="text-center py-10 text-gray-500">No data found</div>
            )}
          </div>
        </div>
      </div>

      {printData.length > 0 && (
        <div className="hidden print:block print-area-container">
          <PrintContent
            data={printData}
            columns={activeColumns}
            keys={activeKeys}
            settings={settings}
            showSerial={showSerial}
          />
        </div>
      )}
    </>
  )
}

function PrintContent({ data, columns, keys, settings, showSerial }) {
  // ✅ Height 208mm হওয়ায় রো সংখ্যা কমিয়ে ১৩ করা হয়েছে
  const ROWS_PER_PAGE = 13
  const pages = []

  for (let i = 0; i < data.length; i += ROWS_PER_PAGE) {
    pages.push(data.slice(i, i + ROWS_PER_PAGE))
  }

  const getColumnWidthStyle = (key) => {

    const widthMap = {
      'Print-serialnu': '47px',
      'padlockSealConditon': '65px',
      'sealInfo': '72px',
      'leadSealConditon': '60px',
      'glasscover': '60px',
      'testCliper': '65px',
      'acountNo': '75px',
      'meterNo': '95px',
      'kwhReading': '70px',
      'mF': '70px',
      'item': '55px',
      'padlockSealNo': '90px',
      'date': '80px',
      'remarks': 'auto'
    }
    return widthMap[key] || 'auto'
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          /* 1. Aggressively hide everything NO EXCEPTION except the print container */
          #non-print-content,
          .modal-backdrop,
          nav,
          header,
          main,
          footer,
          .fixed,
          button {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          
          /* 2. Reset containers to force top start */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            width: 295mm !important;
          }

          /* 3. The print container stays as a block in the flow */
          .print-area-container {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 295mm !important;
            margin: 0 !important;
            padding: 0 !important;
            visibility: visible !important;
            z-index: 99999 !important;
          }

          @page {
            size: 295mm 209mm; 
            margin: 0mm; 
          }

          .print-page {
            margin: 0 !important;
            padding: 5mm 5mm !important;
            box-sizing: border-box !important;
            height: 209mm !important; /* Extremely precise height */
            width: 295mm !important;
            overflow: hidden !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
          }

          .print-page:last-child {
            page-break-after: auto !important;
          }

          /* Keep text black */
          .print-page * {
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {pages.map((pageData, pageIdx) => (
        <div
          key={pageIdx}
          className="print-page bg-white"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            // Default styles for preview
            minHeight: '208mm',
            width: '295mm',
            padding: '4mm',
            margin: '0 auto 2rem auto',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)'
          }}
        >

          <div>
            <div className="text-center mb-4">
              <h3 className="font-normal uppercase text-[15px] leading-tight">{settings.zonalname}</h3>
              <h4 className="font-normal text-[15px] leading-tight">{settings.pbsname}</h4>
              <h2 className="font-bold mt-1 border-b-2 border-gray-800 inline-block pb-1 text-[15px]">
                {settings.title}
              </h2>
            </div>

            <table className="w-full border-collapse border border-gray-800 table-fixed">
              <thead>
                <tr className="bg-gray-100">

                  <th
                    className="border border-gray-800 p-1 text-center align-middle text-[13px] font-normal whitespace-pre-wrap leading-tight"
                    style={{ width: getColumnWidthStyle('Print-serialnu') }}
                  >
                    {(settings.printColumns?.['Print-serialnu'] || 'SL').replace(' ', '\n')}
                  </th>
                  {columns.map((label, idx) => {
                    const key = keys[idx]
                    const width = getColumnWidthStyle(key)
                    return (
                      <th
                        key={idx}
                        className="border border-gray-800 p-1 text-center align-middle font-normal text-[12px] break-words"
                        style={{ width: width }}
                      >
                        {label}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-800 px-1 py-1 text-center align-middle font-medium text-[12px]">
                      {showSerial ? (pageIdx * ROWS_PER_PAGE + idx + 1) : ''}
                    </td>
                    {row.map((cell, cellIdx) => {
                      const key = keys[cellIdx]

                      return (
                        <td
                          key={cellIdx}
                          className="border border-gray-800 px-1 py-1 text-center align-middle text-[11px] leading-tight break-words whitespace-normal"
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-4 gap-4">
              {[settings.fot1, settings.fot2, settings.fot3, settings.fot4].map((fot, i) => (
                <div key={i} className="text-center pt-8">
                  <p className="text-gray-900 border-t border-gray-800 pt-1 text-[12px]">{fot}</p>
                </div>
              ))}
            </div>
          </div>
          <br />
          <div className="absolute bottom-1 right-2 text-[7px] text-gray-500">

            Page {pageIdx + 1} of {pages.length}
          </div>
        </div>
      ))}
    </>
  )
}