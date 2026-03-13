'use client'

import { useState, useEffect } from 'react'
import { FiEye, FiSearch, FiX } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { HEADER_COLUMNS } from '../lib/constants'

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

  // ✅ ডেট থেকে পুরোপুরি টাইম বাদ দিয়ে শুধু dd/mm/yyyy দেখানোর লজিক
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const str = String(dateString).trim()

    // যদি আগে থেকেই dd/mm/yyyy থাকে
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

    // Fallback: T এর আগের অংশ নেওয়া
    return str.split('T')[0]
  }

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  if (loading) return <div className="text-center py-10">Loading data...</div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b bg-white">
        <div className="relative group">
          <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${searchTerm ? 'text-blue-500' : 'text-gray-400'}`}>
            <FiSearch size={18} />
          </div>
          <input
            type="text"
            placeholder="Search anything (Meter, Account, Date, Status)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-11 pr-10 py-3 border-2 border-gray-100 rounded-2xl leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 sm:text-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-red-500 transition-colors"
              title="Clear search"
            >
              <FiX size={20} />
            </button>
          )}
        </div>

        {searchTerm && (
          <div className="mt-2.5 flex items-center gap-2 px-1 animate-fade-in">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
               Found {filteredData.length} {filteredData.length === 1 ? 'Record' : 'Records'}
            </p>
          </div>
        )}
      </div>

      <div className="overflow-x-auto hidden md:block">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium border-b uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-4 py-3">SL</th>
              <th className="px-4 py-3 text-blue-600">Data Sheet No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Account No</th>
              <th className="px-4 py-3">Meter No</th>
              <th className="px-4 py-3 text-green-600">kWh Reading</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{row.slNo}</td>
                <td className="px-4 py-3 font-bold text-blue-600 bg-blue-50/30 whitespace-nowrap">{row.dataSheetNo}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(row.date)}</td>
                <td className="px-4 py-3 text-gray-600">{row.acountNo}</td>
                <td className="px-4 py-3 text-gray-600 font-mono whitespace-nowrap">{row.meterNo}</td>
                <td className="px-4 py-3 font-bold text-green-600">{row.kwhReading}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'Meter Room' ? 'bg-blue-100 text-blue-700' :
                      row.status === 'HQ office' ? 'bg-indigo-100 text-indigo-700' :
                        row.status === 'damage' ? 'bg-red-100 text-red-700' :
                          row.status === 'OK' || row.status === 'Compleated' ? 'bg-green-100 text-green-700' :
                            'bg-yellow-100 text-yellow-700'
                    }`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      onClick={() => onView(row)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-xs whitespace-nowrap"
                    >
                      <FiEye size={14} /> Full View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-100">
        {filteredData.map((row) => (
          <div key={row.id} className="p-4 active:bg-gray-50 transition-colors" onClick={() => onView(row)}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">#{row.slNo}</span>
                <h3 className="text-sm font-bold text-gray-900">{row.dataSheetNo}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Meter Room' ? 'bg-blue-100 text-blue-700' :
                    row.status === 'HQ office' ? 'bg-indigo-100 text-indigo-700' :
                      row.status === 'damage' ? 'bg-red-100 text-red-700' :
                        row.status === 'OK' || row.status === 'Compleated' ? 'bg-green-100 text-green-700' :
                          'bg-yellow-100 text-yellow-700'
                  }`}>
                  {row.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-3 text-xs text-gray-500">
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Meter No</p>
                <p className="font-mono font-medium text-gray-700">{row.meterNo}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Date</p>
                <p className="font-medium text-gray-700">{formatDate(row.date)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Account No</p>
                <p className="font-medium text-gray-700">{row.acountNo}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase">kWh Reading</p>
                <p className="font-bold text-green-600">{row.kwhReading}</p>
              </div>
            </div>

            <button className="w-full mt-3 flex items-center justify-center gap-1 py-2 bg-gray-50 text-blue-600 rounded-lg font-bold text-[10px] uppercase tracking-wider">
              <FiEye size={12} /> View Details
            </button>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="px-4 py-8 text-center text-gray-400 text-sm">
          No entries found
        </div>
      )}
    </div>
  )
}