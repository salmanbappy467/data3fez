'use client'

import { useState } from 'react'
import AuthGuard from './components/AuthGuard'
import Navbar from './components/Navbar'
import DataTable from './components/DataTable'
import AddEntryModal from './components/AddEntryModal'
import UpdateStatusModal from './components/UpdateStatusModal'
import PrintModal from './components/PrintModal'
import { FiPlus, FiRefreshCw, FiPrinter } from 'react-icons/fi'

export default function HomePage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <DataTable refreshTrigger={refreshTrigger} />
        </main>

        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
          <button
            onClick={() => setShowPrintModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-full shadow-2xl hover:shadow-green-500/50 hover:scale-110 transition-all"
            title="Print Datasheet"
          >
            <FiPrinter size={24} />
          </button>

          <button
            onClick={() => setShowUpdateModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all"
            title="Update Status"
          >
            <FiRefreshCw size={24} />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 hover:scale-110 transition-all"
            title="Add Entry"
          >
            <FiPlus size={24} />
          </button>
        </div>

        {/* Modals */}
        {showAddModal && (
          <AddEntryModal
            onClose={() => {
              setShowAddModal(false)
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        )}

        {showUpdateModal && (
          <UpdateStatusModal
            onClose={() => {
              setShowUpdateModal(false)
              setRefreshTrigger(prev => prev + 1)
            }}
          />
        )}

        {showPrintModal && (
          <PrintModal onClose={() => setShowPrintModal(false)} />
        )}
      </div>
    </AuthGuard>
  )
}