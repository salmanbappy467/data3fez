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
  const [formData, setFormData] = useState(() => {
    const initial = { ...data }
    
    // ✅ Custom values initialization for "Other" selections
    initial.remarksCustom = ''
    initial.padlockCustom = ''
    initial.sealInfoCustom = ''
    initial.leadCustom = ''
    initial.glassCustom = ''
    initial.clipperCustom = ''

    const checkOther = (name, customName, options) => {
      const val = initial[name]
      if (val && !options.includes(val) && val !== '') {
        initial[customName] = val
        initial[name] = 'other'
      }
    }

    checkOther('remarks', 'remarksCustom', REMARKS_OPTIONS)
    checkOther('padlockSealConditon', 'padlockCustom', CONDITION_OPTIONS)
    checkOther('sealInfo', 'sealInfoCustom', CONDITION_OPTIONS)
    checkOther('leadSealConditon', 'leadCustom', CONDITION_OPTIONS)
    checkOther('glasscover', 'glassCustom', CONDITION_OPTIONS)
    checkOther('testCliper', 'clipperCustom', CONDITION_OPTIONS)

    return initial
  })

  const handleChange = (e, manualValue) => {
    // ✅ Flexible handleChange to support both event and manual name-value
    if (typeof e === 'string') {
      setFormData(prev => ({ ...prev, [e]: manualValue }))
    } else {
      const { name, value } = e.target
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const userData = storage.getUserData()
    const sheetId = userData?.app_json?.data3fez?.sheetId
    if (!sheetId) return

    const submitData = { ...formData }
    
    // ✅ Merge custom "Other" values before saving
    const getFinalValue = (mainKey, customKey) => {
      if (submitData[mainKey] === 'other') return submitData[customKey] || ''
      return submitData[mainKey]
    }

    submitData.remarks = getFinalValue('remarks', 'remarksCustom')
    submitData.padlockSealConditon = getFinalValue('padlockSealConditon', 'padlockCustom')
    submitData.sealInfo = getFinalValue('sealInfo', 'sealInfoCustom')
    submitData.leadSealConditon = getFinalValue('leadSealConditon', 'leadCustom')
    submitData.glasscover = getFinalValue('glasscover', 'glassCustom')
    submitData.testCliper = getFinalValue('testCliper', 'clipperCustom')

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

  const renderSelect = (name, label, options, customName) => (
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
      {formData[name] === 'other' && customName && (
        <input
          type="text"
          name={customName}
          value={formData[customName] || ''}
          onChange={handleChange}
          placeholder={`Enter custom ${label.toLowerCase()}`}
          className="w-full mt-2 px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white animate-fade-in"
        />
      )}
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
                {renderSelect('remarks', 'Remarks', REMARKS_OPTIONS, 'remarksCustom')}
                {renderInput('note', 'Note')}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">🔒 Seals & Conditions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">Padlock Seal No</label>
  <textarea
    value={formData.padlockSealNo || ''}
    onChange={(e) => handleChange('padlockSealNo', e.target.value)}
    className="input-field min-h-[80px]" // হাইট একটু বাড়িয়ে দেওয়া হয়েছে
    rows={2} 
    placeholder="Example:&#10;Seal-1&#10;Seal-2"
  />
</div>
                {renderSelect('padlockSealConditon', 'Padlock Seal Condition', CONDITION_OPTIONS, 'padlockCustom')}
                {renderSelect('sealInfo', 'Seal Info', CONDITION_OPTIONS, 'sealInfoCustom')}
                {renderSelect('leadSealConditon', 'Lead Seal Condition', CONDITION_OPTIONS, 'leadCustom')}
                {renderSelect('glasscover', 'Glass Cover', CONDITION_OPTIONS, 'glassCustom')}
                {renderSelect('testCliper', 'Test Cliper', CONDITION_OPTIONS, 'clipperCustom')}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-2 mb-4">📅 Tracking & Testing Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {renderInput('linemanName', 'Lineman Name')}
                {renderInput('CMO', 'CMO')}
                {renderInput('sendMeterDate', 'Send Meter Date', 'date')}
                {renderInput('reciveMeterDate', 'Receive Meter Date', 'date')}
                {renderInput('rebTestfull', 'REB Test Data Full')}
                {renderInput('rebtestData', 'REB Test Condition')}
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