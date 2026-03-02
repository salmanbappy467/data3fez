'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'
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

export default function EditModal({ data, onClose }) {
  const [formData, setFormData] = useState({ ...data })
  const [saving, setSaving] = useState(false)

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId

      // প্রতিটি column এর index বের করি
      const allHeaders = Object.keys(data).filter(k => k !== '_rowIndex')
      
      for (let i = 0; i < allHeaders.length; i++) {
        const key = allHeaders[i]
        if (formData[key] !== data[key]) {
          await sheetsApi.updateCell(
            sheetId,
            data._rowIndex + 1, // 1-based row index
            i + 1, // 1-based column index
            formData[key]
          )
        }
      }

      alert('Updated successfully')
      onClose()
    } catch (error) {
      alert('Update failed: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <h2 className="text-xl font-bold">Edit Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid md:grid-cols-2 gap-4">
            <InputField 
              label="Data Sheet No" 
              value={formData.dataSheetNo} 
              onChange={(v) => handleChange('dataSheetNo', v)} 
              maxLength={5} 
            />
            
            <SelectField 
              label="Status" 
              value={formData.status} 
              onChange={(v) => handleChange('status', v)} 
              options={STATUS_OPTIONS} 
            />
            
            <InputField 
              label="Date" 
              value={formData.date} 
              onChange={(v) => handleChange('date', v)} 
            />
            
            <InputField 
              label="Account No" 
              value={formData.acountNo} 
              onChange={(v) => handleChange('acountNo', v)} 
              maxLength={7} 
              placeholder="xxx-xxxx" 
            />
            
            <InputField 
              label="Meter No" 
              value={formData.meterNo} 
              onChange={(v) => handleChange('meterNo', v)} 
              maxLength={18} 
            />
            
            <InputField 
              label="kWh Reading" 
              type="number" 
              step="0.01" 
              value={formData.kwhReading} 
              onChange={(v) => handleChange('kwhReading', v)} 
            />
            
            <SelectField 
              label="Manufacturer" 
              value={formData.mF} 
              onChange={(v) => handleChange('mF', v)} 
              options={MF_OPTIONS} 
            />
            
            <SelectField 
              label="Class" 
              value={formData.class} 
              onChange={(v) => handleChange('class', v)} 
              options={CLASS_OPTIONS} 
            />
            
            <SelectField 
              label="Item" 
              value={formData.item} 
              onChange={(v) => handleChange('item', v)} 
              options={ITEM_OPTIONS} 
            />
            
            <TextAreaField 
              label="Remarks" 
              value={formData.remarks} 
              onChange={(v) => handleChange('remarks', v)} 
            />
            
            <TextAreaField 
              label="Padlock Seal No" 
              value={formData.padlockSealNo} 
              onChange={(v) => handleChange('padlockSealNo', v)} 
              placeholder="সীল-১&#10;সীল-২" 
            />
            
            <InputField 
              label="Padlock Condition" 
              value={formData.padlockSealConditon} 
              onChange={(v) => handleChange('padlockSealConditon', v)} 
            />
            
            <InputField 
              label="Seal Info" 
              value={formData.sealInfo} 
              onChange={(v) => handleChange('sealInfo', v)} 
            />
            
            <InputField 
              label="Lead Seal Condition" 
              value={formData.leadSealConditon} 
              onChange={(v) => handleChange('leadSealConditon', v)} 
            />
            
            <InputField 
              label="Glass Cover" 
              value={formData.glasscover} 
              onChange={(v) => handleChange('glasscover', v)} 
            />
            
            <InputField 
              label="Test Clipper" 
              value={formData.testCliper} 
              onChange={(v) => handleChange('testCliper', v)} 
            />
            
            <InputField 
              label="Lineman Name" 
              value={formData.linemanName} 
              onChange={(v) => handleChange('linemanName', v)} 
              maxLength={20} 
            />
            
            <InputField 
              label="CMO No" 
              value={formData.CMO} 
              onChange={(v) => handleChange('CMO', v)} 
              maxLength={10} 
            />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InputField({ label, value, onChange, type = 'text', ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        {...props}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="input-field">
        <option value="">Select...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  )
}

function TextAreaField({ label, value, onChange, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="input-field"
        rows={2}
        {...props}
      />
    </div>
  )
}