'use client'

import { useState, useEffect, useMemo } from 'react'
import { FiSearch, FiEye, FiEdit, FiTrash2, FiChevronLeft, FiChevronRight, FiAlertTriangle, FiSettings } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import ViewModal from './ViewModal'
import EditModal from './EditModal'

export default function DataTable({ refreshTrigger }) {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [error, setError] = useState(null)

  const ITEMS_PER_PAGE = 30

  useEffect(() => {
    loadData()
  }, [refreshTrigger])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId

      if (!sheetId) {
        setError('no_sheet')
        setLoading(false)
        return
      }

      const cachedData = storage.getMeterData()
      if (cachedData && refreshTrigger === 0) {
        processData(cachedData)
        setLoading(false)
        return
      }

      const rawData = await sheetsApi.readData(sheetId)
      processData(rawData)
    } catch (error) {
      console.error('Load Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const processData = (rawData) => {
    if (rawData.length <= 1) {
      setData([])
      setFilteredData([])
      return
    }

    const headers = rawData[0]
    const rows = rawData.slice(1).reverse().map((row, idx) => {
      const obj = { _rowIndex: rawData.length - idx - 1 }
      headers.forEach((header, i) => {
        obj[header] = row[i] || ''
      })
      return obj
    })

    setData(rows)
    setFilteredData(rows)
  }

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredData(data)
      setCurrentPage(1)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = data.filter(row => 
      ['acountNo', 'meterNo', 'slNo', 'kwhReading', 'padlockSealNo', 'CMO']
        .some(key => String(row[key]).toLowerCase().includes(searchLower))
    )

    setFilteredData(filtered)
    setCurrentPage(1)
  }, [searchTerm, data])

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredData.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredData, currentPage])

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)

  const handleDelete = async (row) => {
    if (!confirm(`Delete entry for Meter No: ${row.meterNo}?`)) return

    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      
      await sheetsApi.deleteRow(sheetId, row._rowIndex + 1)
      alert('Deleted successfully')
      loadData()
    } catch (error) {
      alert('Delete failed: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
        </div>
        <p className="mt-4 text-gray-600 font-medium">Loading data...</p>
      </div>
    )
  }

  if (error === 'no_sheet') {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl p-12 border-2 border-amber-200">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <FiAlertTriangle className="text-white" size={48} />
          </div>
          
          <h3 className="text-3xl font-bold text-gray-900 mb-3">
            Google Sheet Not Setup
          </h3>
          
          <p className="text-gray-700 mb-6 text-lg">
            আপনার Google Sheet এখনও কনফিগার করা হয়নি। <br/>
            ডাটা ম্যানেজ করার জন্য প্রথমে Sheet সেটআপ করুন।
          </p>

          <div className="bg-white rounded-xl p-6 shadow-md mb-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
              <span className="text-2xl">📋</span> How to Setup:
            </h4>
            <ol className="text-left text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>উপরে বামদিকে <FiSettings className="inline text-blue-600" /> Settings icon এ ক্লিক করুন</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>"Sheet Setup" ট্যাবে যান</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>আপনার Google Sheet URL পেস্ট করুন</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>"🚀 Setup Sheet" বাটনে ক্লিক করুন</span>
              </li>
            </ol>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:shadow-lg transform hover:-translate-y-1 transition-all inline-flex items-center gap-2"
          >
            <FiSettings size={20} />
            Open Settings
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">✕</span>
          </div>
          <div>
            <h3 className="text-red-900 font-bold text-lg">Error Loading Data</h3>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
      {/* Search Bar */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="🔍 Search by Account No, Meter No, Seal No, CMO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <p className="text-sm text-gray-600 mt-3 font-medium">
          📊 Showing <span className="text-blue-600 font-bold">{filteredData.length}</span> of <span className="font-bold">{data.length}</span> entries
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">SL No</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Date</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Account No</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Meter No</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">kWh Reading</th>
              <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
              <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold">{row.slNo}</td>
                <td className="px-6 py-4 text-sm">{row.date}</td>
                <td className="px-6 py-4 text-sm font-mono text-blue-600">{row.acountNo}</td>
                <td className="px-6 py-4 text-sm font-mono">{row.meterNo}</td>
                <td className="px-6 py-4 text-sm">{row.kwhReading}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${
                    row.status === 'Meter Room' ? 'bg-green-100 text-green-800' :
                    row.status === 'damage' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedRow(row)
                        setShowViewModal(true)
                      }}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-all hover:scale-110"
                      title="View"
                    >
                      <FiEye size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRow(row)
                        setShowEditModal(true)
                      }}
                      className="p-2 hover:bg-yellow-100 text-yellow-600 rounded-lg transition-all hover:scale-110"
                      title="Edit"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(row)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all hover:scale-110"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <p className="text-xl font-semibold">📭 No data found</p>
            <p className="text-sm mt-2">Try adjusting your search</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all"
          >
            <FiChevronLeft size={18} />
            Previous
          </button>

          <span className="text-sm font-semibold text-gray-700">
            Page <span className="text-blue-600">{currentPage}</span> of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-all"
          >
            Next
            <FiChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Modals */}
      {showViewModal && (
        <ViewModal
          data={selectedRow}
          onClose={() => setShowViewModal(false)}
        />
      )}

      {showEditModal && (
        <EditModal
          data={selectedRow}
          onClose={() => {
            setShowEditModal(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}