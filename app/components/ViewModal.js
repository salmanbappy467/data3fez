'use client'

import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi'

export default function ViewModal({ data, onClose, onEdit, onDelete }) {
  if (!data) return null

  // All fields configuration
  const fields = [
    { key: 'slNo', label: 'Serial No' },
    { key: 'dataSheetNo', label: 'Data Sheet No' },
    { key: 'status', label: 'Status' },
    { key: 'date', label: 'Date' },
    { key: 'acountNo', label: 'Account No' },
    { key: 'meterNo', label: 'Meter No' },
    { key: 'kwhReading', label: 'kWh Reading' },
    { key: 'mF', label: 'Manufacturer' },
    { key: 'class', label: 'Class' },
    { key: 'item', label: 'Item' },
    { key: 'remarks', label: 'Remarks' },
    { key: 'padlockSealNo', label: 'Padlock Seal No' },
    { key: 'padlockSealConditon', label: 'Padlock Condition' },
    { key: 'sealInfo', label: 'Seal Info' },
    { key: 'leadSealConditon', label: 'Lead Seal Condition' },
    { key: 'glasscover', label: 'Glass Cover' },
    { key: 'testCliper', label: 'Test Clipper' },
    { key: 'linemanName', label: 'Lineman Name' },
    { key: 'CMO', label: 'CMO No' },
    { key: 'sendMeterDate', label: 'Send Meter Date' },
    { key: 'reciveMeterDate', label: 'Receive Meter Date' },
    { key: 'rebTestfull', label: 'REB Test Full' },
    { key: 'rebtestData', label: 'REB Test Data' },
    { key: 'testsubmitDate', label: 'Test Submit Date' },
    { key: 'googledriveLink', label: 'Google Drive Link' },
    { key: 'reIsudate', label: 'Re-Issue Date' },
    { key: 'note', label: 'Note' },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <h2 className="text-xl font-bold">Meter Details #{data.slNo}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid md:grid-cols-2 gap-4">
            {fields.map(({ key, label }) => (
              <div key={key} className={`border-b pb-3 ${key === 'remarks' || key === 'note' || key === 'googledriveLink' ? 'md:col-span-2' : ''}`}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-gray-900 break-words ${key === 'meterNo' ? 'font-mono' : ''}`}>
                  {data[key] || '-'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium border border-red-100"
          >
            <FiTrash2 /> Delete
          </button>
          
          <button 
            onClick={onEdit}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm"
          >
            <FiEdit2 /> Edit Entry
          </button>
        </div>
      </div>
    </div>
  )
}