'use client'

import { useState } from 'react'
import { FiX, FiSave } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { 
  STATUS_OPTIONS, 
  MF_OPTIONS, 
  CLASS_OPTIONS, 
  ITEM_OPTIONS, 
  REMARKS_OPTIONS, 
  CONDITION_OPTIONS 
} from '../lib/constants'

// ✅ Helper: Save করার সময় strictly DD/MM/YYYY ফরম্যাটে কনভার্ট করবে
const formatToDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts[0].length === 4) return `${parts[2].substring(0,2)}/${parts[1]}/${parts[0]}`;
  }
  
  try {
    const d = new Date(str);
    if (!isNaN(d)) return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth()+1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch (e) {}
  
  return str.split('T')[0].split(' ')[0];
}

// ✅ Helper: Edit পেজ লোড হওয়ার সময় YYYY-MM-DD ফরম্যাটে কনভার্ট করবে (Time বাদ দিয়ে)
const parseToYYYYMMDD = (dateStr) => {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str.substring(0, 10);
  
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
     const [d, m, y] = str.split('/');
     return `${y}-${m}-${d}`;
  }

  if (str.includes('T')) return str.split('T')[0];

  try {
    const d = new Date(str);
    if (!isNaN(d)) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch(e) {}
  
  return str.split(' ')[0];
}

export default function EditModal({ data, onClose }) {
  const [formData, setFormData] = useState({ ...data })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const userData = storage.getUserData()
    const sheetId = userData?.app_json?.data3fez?.sheetId
    if (!sheetId) return

    const submitData = { ...formData }
    
    const dateFields = ['date', 'sendMeterDate', 'reciveMeterDate', 'testsubmitDate', 'reIsudate']
    dateFields.forEach(field => {
       if (submitData[field]) {
          submitData[field] = formatToDDMMYYYY(submitData[field])
       }
    })

    // ✅ Background API Call
    sheetsApi.updateRow(sheetId, data.rawRowIndex, submitData).catch(err => console.error(err))
    onClose() 
  }

  const renderInput = (name, label, type = 'text') => {
    let value = formData[name] || '';
    if (type === 'date') value = parseToYYYYMMDD(value);

    return (
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
      </div>
    )
  }

  const renderSelect = (name, label, options) => (
    <div className="mb-3">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
      >
        <option value="">-- Select {label} --</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            ✏️ Edit Entry <span className="text-yellow-100 text-sm font-medium">({data.meterNo})</span>
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <form id="editForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">📝 Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput('slNo', 'SL No')}
                {renderInput('dataSheetNo', 'Data Sheet No')}
                {renderInput('date', 'Date', 'date')}
                {renderInput('acountNo', 'Account No')}
                {renderInput('meterNo', 'Meter No')}
                {renderInput('kwhReading', 'kWh Reading')}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">⚙️ Meter Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderSelect('mF', 'Manufacturer (MF)', MF_OPTIONS)}
                {renderSelect('class', 'Class', CLASS_OPTIONS)}
                {renderSelect('item', 'Item', ITEM_OPTIONS)}
                {renderSelect('status', 'Status', STATUS_OPTIONS)}
                {renderSelect('remarks', 'Remarks', REMARKS_OPTIONS)}
                {renderInput('note', 'Note')}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">🔒 Seals & Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput('padlockSealNo', 'Padlock Seal No')}
                {renderSelect('padlockSealConditon', 'Padlock Seal Condition', CONDITION_OPTIONS)}
                {renderInput('sealInfo', 'Seal Info')}
                {renderSelect('leadSealConditon', 'Lead Seal Condition', CONDITION_OPTIONS)}
                {renderSelect('glasscover', 'Glass Cover', CONDITION_OPTIONS)}
                {renderSelect('testCliper', 'Test Cliper', CONDITION_OPTIONS)}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">📅 Tracking & Testing Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput('linemanName', 'Lineman Name')}
                {renderInput('CMO', 'CMO')}
                {renderInput('sendMeterDate', 'Send Meter Date', 'date')}
                {renderInput('reciveMeterDate', 'Receive Meter Date', 'date')}
                {renderInput('rebTestfull', 'REB Test Full')}
                {renderInput('rebtestData', 'REB Test Data')}
                {renderInput('testsubmitDate', 'Test Submit Date', 'date')}
                {renderInput('reIsudate', 'Re-Issue Date', 'date')}
                <div className="col-span-full">
                  {renderInput('googledriveLink', 'Google Drive Link', 'url')}
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-6 border-t bg-white flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="editForm"
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <FiSave size={20} />
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}