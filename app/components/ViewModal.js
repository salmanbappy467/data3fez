'use client'

import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { 
  STATUS_OPTIONS, 
  MF_OPTIONS, 
  CLASS_OPTIONS, 
  ITEM_OPTIONS, 
  REMARKS_OPTIONS, 
  CONDITION_OPTIONS,
  HEADER_COLUMNS 
} from '../lib/constants'
import { format } from 'date-fns'

export default function AddEntryModal({ onClose }) {
  const [formData, setFormData] = useState({
    slNo: '',
    dataSheetNo: '',
    status: 'Meter Room',
    date: format(new Date(), 'dd/MM/yyyy'),
    acountNo: '',
    meterNo: '',
    kwhReading: '',
    mF: '',
    class: '200',
    item: 'J-3',
    remarks: '',
    padlockSealNo: '',
    padlockSealConditon: '',
    sealInfo: '',
    leadSealConditon: '',
    glasscover: '',
    testCliper: '',
    linemanName: '',
    CMO: '',
  })
  const [saving, setSaving] = useState(false)
  const [showOtherRemarks, setShowOtherRemarks] = useState(false)

  useEffect(() => {
    loadLastSlNo()
  }, [])

  const loadLastSlNo = async () => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      if (!sheetId) return

      const data = await sheetsApi.readData(sheetId)
      if (data.length > 1) {
        const lastRow = data[data.length - 1]
        const lastSlNo = parseInt(lastRow[0]) || 0
        setFormData(prev => ({ ...prev, slNo: String(lastSlNo + 1) }))
      } else {
        setFormData(prev => ({ ...prev, slNo: '1' }))
      }
    } catch (error) {
      console.error('Load SlNo Error:', error)
      setFormData(prev => ({ ...prev, slNo: '1' }))
    }
  }

  const handleChange = (key, value) => {
    if (key === 'acountNo') {
      value = value.replace(/\D/g, '').slice(0, 7)
      if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3)
      }
    }

    if (key === 'remarks' && value === 'other') {
      setShowOtherRemarks(true)
      setFormData(prev => ({ ...prev, [key]: '' }))
      return
    }

    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId

      if (!sheetId) {
        alert('Please setup Google Sheet first')
        return
      }

      const rowData = HEADER_COLUMNS.map(col => formData[col] || '')

      await sheetsApi.addRow(sheetId, rowData)
      alert('✅ Entry added successfully')
      onClose()
    } catch (error) {
      alert('❌ Failed to add entry: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <h2 className="text-2xl font-bold">➕ Add New Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
            <FiX size={28} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Serial No */}
            <InputField 
              label="Serial No (Auto)" 
              value={formData.slNo} 
              onChange={(v) => handleChange('slNo', v)} 
              disabled 
            />
            
            {/* Data Sheet No */}
            <InputField 
              label="Data Sheet No (Optional)" 
              value={formData.dataSheetNo} 
              onChange={(v) => handleChange('dataSheetNo', v)} 
              maxLength={5}
              placeholder="12345"
            />
            
            {/* Status */}
            <SelectField 
              label="Status" 
              value={formData.status} 
              onChange={(v) => handleChange('status', v)} 
              options={STATUS_OPTIONS} 
            />
            
            {/* Date */}
            <InputField 
              label="Date" 
              value={formData.date} 
              onChange={(v) => handleChange('date', v)} 
              placeholder="dd/mm/yyyy"
            />
            
            {/* Account No */}
            <InputField 
              label="Account No (xxx-xxxx)" 
              value={formData.acountNo} 
              onChange={(v) => handleChange('acountNo', v)} 
              placeholder="123-4567"
            />
            
            {/* Meter No */}
            <InputField 
              label="Meter No (18 digits)" 
              value={formData.meterNo} 
              onChange={(v) => handleChange('meterNo', v)} 
              maxLength={18}
              placeholder="123456789012345678"
            />
            
            {/* kWh Reading */}
            <InputField 
              label="kWh Reading" 
              type="number" 
              step="0.01" 
              value={formData.kwhReading} 
              onChange={(v) => handleChange('kwhReading', v)}
              placeholder="1234.56"
            />
            
            {/* Manufacturer */}
            <SelectField 
              label="Manufacturer" 
              value={formData.mF} 
              onChange={(v) => handleChange('mF', v)} 
              options={MF_OPTIONS} 
            />
            
            {/* Class */}
            <SelectField 
              label="Class" 
              value={formData.class} 
              onChange={(v) => handleChange('class', v)} 
              options={CLASS_OPTIONS} 
            />
            
            {/* Item */}
            <SelectField 
              label="Item" 
              value={formData.item} 
              onChange={(v) => handleChange('item', v)} 
              options={ITEM_OPTIONS} 
            />
            
            {/* Remarks */}
            <div className="md:col-span-2">
              {!showOtherRemarks ? (
                <SelectField 
                  label="Remarks" 
                  value={formData.remarks} 
                  onChange={(v) => handleChange('remarks', v)} 
                  options={REMARKS_OPTIONS} 
                />
              ) : (
                <InputField 
                  label="Remarks (Manual)" 
                  value={formData.remarks} 
                  onChange={(v) => handleChange('remarks', v)}
                  placeholder="Enter custom remark"
                />
              )}
            </div>
            
            {/* Padlock Seal No */}
            <TextAreaField 
              label="Padlock Seal No (সীল-১, সীল-২)" 
              value={formData.padlockSealNo} 
              onChange={(v) => handleChange('padlockSealNo', v)}
              placeholder="সীল-১&#10;সীল-২"
            />
            
            {/* Padlock Condition */}
            <SelectField 
              label="Padlock Condition" 
              value={formData.padlockSealConditon} 
              onChange={(v) => handleChange('padlockSealConditon', v)} 
              options={CONDITION_OPTIONS} 
            />
            
            {/* Seal Info */}
            <SelectField 
              label="Seal Info" 
              value={formData.sealInfo} 
              onChange={(v) => handleChange('sealInfo', v)} 
              options={CONDITION_OPTIONS} 
            />
            
            {/* Lead Seal Condition */}
            <SelectField 
              label="Lead Seal Condition" 
              value={formData.leadSealConditon} 
              onChange={(v) => handleChange('leadSealConditon', v)} 
              options={CONDITION_OPTIONS} 
            />
            
            {/* Glass Cover */}
            <SelectField 
              label="Glass Cover" 
              value={formData.glasscover} 
              onChange={(v) => handleChange('glasscover', v)} 
              options={CONDITION_OPTIONS} 
            />
            
            {/* Test Clipper */}
            <SelectField 
              label="Test Clipper" 
              value={formData.testCliper} 
              onChange={(v) => handleChange('testCliper', v)} 
              options={CONDITION_OPTIONS} 
            />
            
            {/* Lineman Name */}
            <InputField 
              label="Lineman Name" 
              value={formData.linemanName} 
              onChange={(v) => handleChange('linemanName', v)} 
              maxLength={20}
              placeholder="Enter name"
            />
            
            {/* CMO No */}
            <InputField 
              label="CMO No" 
              value={formData.CMO} 
              onChange={(v) => handleChange('CMO', v)} 
              maxLength={10}
              placeholder="1234567890"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-4">
          <button 
            onClick={onClose} 
            className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-100 font-semibold transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
          >
            {saving ? '💾 Saving...' : '✅ Add Entry'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components
function InputField({ label, value, onChange, type = 'text', disabled = false, ...props }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <select 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
      >
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
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
        rows={3}
        {...props}
      />
    </div>
  )
}