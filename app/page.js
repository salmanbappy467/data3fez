'use client'

import { useState, useEffect } from 'react'
import AuthGuard from './components/AuthGuard'
import Navbar from './components/Navbar'
import DataTable from './components/DataTable'
import AddEntryModal from './components/AddEntryModal'
import UpdateStatusModal from './components/UpdateStatusModal'
import PrintModal from './components/PrintModal'
import ViewModal from './components/ViewModal'
import EditModal from './components/EditModal'
import { FiPlus, FiRefreshCw, FiPrinter } from 'react-icons/fi'
import { sheetsApi } from './lib/api'
import { storage } from './lib/storage'

export default function HomePage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  
  const [viewData, setViewData] = useState(null)
  const [editData, setEditData] = useState(null)
  
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Auto Sync Logic (10 mins)
  useEffect(() => {
    const SYNC_INTERVAL = 10 * 60 * 1000; 
    const autoSync = async () => {
      const userData = storage.getUserData();
      const sheetId = userData?.app_json?.data3fez?.sheetId;
      if (sheetId) {
        await sheetsApi.readData(sheetId, 'data3fez', true).catch(console.error);
      }
    };
    const intervalId = setInterval(autoSync, SYNC_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  // Listen for data changes
  useEffect(() => {
    const handleDataChange = () => setRefreshTrigger(prev => prev + 1)
    window.addEventListener('data-change', handleDataChange)
    return () => window.removeEventListener('data-change', handleDataChange)
  }, [])

  // ✅ Delete Logic (Background Sync & No Success Alert)
  const handleDelete = async (row) => {
    // Confirm Dialog (এটা রাখা হয়েছে কারণ আপনি আগে চেয়েছিলেন)
    if (!window.confirm(`Are you sure you want to DELETE Serial No: ${row.slNo}?`)) {
      return;
    }

    // Modal Close Immediately
    setViewData(null)

    const userData = storage.getUserData()
    const sheetId = userData?.app_json?.data3fez?.sheetId
    if (!sheetId) return

    // Background Delete Call (No await, No alert)
    sheetsApi.deleteRow(sheetId, parseInt(row.rawRowIndex)) 
      .then(() => console.log('Delete synced'))
      .catch(err => console.error('Delete failed', err))
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <DataTable 
            refreshTrigger={refreshTrigger} 
            onView={(row) => setViewData(row)} 
          />
        </main>

        {/* Floating Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <button onClick={() => setShowPrintModal(true)} className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all">
            <FiPrinter size={24} />
          </button>
          <button onClick={() => setShowUpdateModal(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all">
            <FiRefreshCw size={24} />
          </button>
          <button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-all">
            <FiPlus size={24} />
          </button>
        </div>

        {/* Modals */}
        {showAddModal && <AddEntryModal onClose={() => setShowAddModal(false)} />}
        {showUpdateModal && <UpdateStatusModal onClose={() => setShowUpdateModal(false)} />}
        {showPrintModal && <PrintModal onClose={() => setShowPrintModal(false)} />}

        {/* View Modal */}
        {viewData && (
          <ViewModal 
            data={viewData} 
            onClose={() => setViewData(null)}
            onEdit={() => {
              setEditData(viewData)
              setViewData(null) 
            }}
            onDelete={() => handleDelete(viewData)}
          />
        )}

        {/* Edit Modal */}
        {editData && (
          <EditModal 
            data={editData} 
            onClose={() => setEditData(null)} 
          />
        )}
      </div>
    </AuthGuard>
  )
}