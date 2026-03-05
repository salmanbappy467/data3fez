'use client'

import { useState, useEffect } from 'react'
import { FiEye, FiSearch } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { HEADER_COLUMNS } from '../lib/constants'
import { format, parseISO } from 'date-fns'

export default function DataTable({ refreshTrigger, onView }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchData()
  }, [refreshTrigger])

  const fetchData = async () => {
    try {
      setLoading(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      if (!sheetId) {
        setLoading(false)
        return
      }

      const rows = await sheetsApi.readData(sheetId)
      
      const formattedData = rows.slice(1).map((row, index) => {
        const obj = { id: index, rawRowIndex: index + 2 }
        HEADER_COLUMNS.forEach((col, i) => {
          obj[col] = row[i] || ''
        })
        return obj
      }).reverse()

      setData(formattedData)
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    try {
        if (dateString.includes('T')) {
            return format(parseISO(dateString), 'dd/MM/yyyy')
        }
        return dateString;
    } catch (e) {
        return dateString
    }
  }

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) return <div className="text-center py-10">Loading data...</div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2 bg-gray-50/50">
        <FiSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Search by any field..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent outline-none w-full text-sm"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b">
            <tr>
              <th className="px-4 py-3">SL</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Account No</th>
              <th className="px-4 py-3">Meter No</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{row.slNo}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(row.date)}</td>
                <td className="px-4 py-3 text-gray-600">{row.acountNo}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{row.meterNo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    row.status === 'Meter Room' ? 'bg-blue-100 text-blue-700' :
                    row.status === 'Installed' ? 'bg-green-100 text-green-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button 
                      onClick={() => onView(row)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs"
                    >
                      <FiEye size={14} /> Full View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {/* 🔽 নিচের এই অংশটিতে আগে ভুল ছিল, এখন ঠিক করা হয়েছে */}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                  No entries found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}