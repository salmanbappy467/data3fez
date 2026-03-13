'use client'

import { useState, useEffect } from 'react'
import { FiX } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { STATUS_OPTIONS, MF_OPTIONS, CLASS_OPTIONS, ITEM_OPTIONS, REMARKS_OPTIONS, CONDITION_OPTIONS, HEADER_COLUMNS } from '../lib/constants'
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
    mF: 'Hexing',
    class: '200',
    item: 'J-3',
    remarks: '',
    remarksCustom: '',
    padlockSealNo: '',
    padlockSealConditon: 'সংযুক্ত',
    padlockCustom: '',
    sealInfo: 'সংযুক্ত',
    sealInfoCustom: '',
    leadSealConditon: 'সংযুক্ত',
    leadCustom: '',
    glasscover: 'ভালো',
    glassCustom: '',
    testCliper: 'অভ্যন্তরীণ',
    clipperCustom: '',
    linemanName: '',
    CMO: '',
  })
  const [saving, setSaving] = useState(false)
  const [linemanSuggestions, setLinemanSuggestions] = useState([])

  useEffect(() => {
    loadLastSlNo()
    loadLinemanHistory()
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

  const loadLinemanHistory = async () => {
    try {
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId
      if (!sheetId) return

      const data = await sheetsApi.readData(sheetId)
      const names = [...new Set(data.slice(1).map(row => row[17]).filter(Boolean))]
      setLinemanSuggestions(names)
    } catch (error) {
      console.error('Load Lineman Error:', error)
    }
  }

  const handleChange = (key, value) => {
    if (key === 'acountNo') {
      value = value.replace(/\D/g, '').slice(0, 7)
      if (value.length > 3) {
        value = value.slice(0, 3) + '-' + value.slice(3)
      }
    }
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const getFinalValue = (mainKey, customKey) => {
    if (formData[mainKey] === 'other') {
      return formData[customKey]
    }
    return formData[mainKey]
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      const userData = storage.getUserData()
      const sheetId = userData?.app_json?.data3fez?.sheetId

      if (!sheetId) {
        alert('Please setup Google Sheet first')
        setSaving(false) // Reset saving state
        return
      }

      const finalData = {
        ...formData,
        remarks: getFinalValue('remarks', 'remarksCustom'),
        padlockSealConditon: getFinalValue('padlockSealConditon', 'padlockCustom'),
        sealInfo: getFinalValue('sealInfo', 'sealInfoCustom'),
        leadSealConditon: getFinalValue('leadSealConditon', 'leadCustom'),
        glasscover: getFinalValue('glasscover', 'glassCustom'),
        testCliper: getFinalValue('testCliper', 'clipperCustom'),
      }

      const rowData = HEADER_COLUMNS.map(col => finalData[col] || '')
      
      // ✅ ফাস্ট সেভ: 'await' সরানো হয়েছে এবং ব্যাকগ্রাউন্ডে পাঠানো হচ্ছে
      sheetsApi.addRow(sheetId, rowData).catch(err => {
        console.error('Background sync failed:', err)
        alert('Sync Failed: ' + err.message) // অপশনাল: ফেইল হলে ইউজারকে জানানো
      })
      
      // IndexedDB (Local) এ সেভ হয়ে গেছে, তাই সাথে সাথেই বন্ধ করে দিচ্ছি
      onClose()
      
    } catch (error) {
      alert('Failed to add entry: ' + error.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
          <h2 className="text-xl font-bold">Add New Entry</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Basic Info */}
            <InputField label="Serial No" value={formData.slNo} onChange={(v) => handleChange('slNo', v)} disabled />
            <InputField label="Data Sheet No (Optional)" value={formData.dataSheetNo} onChange={(v) => handleChange('dataSheetNo', v)} maxLength={5} />
            
            <SelectField label="Status" value={formData.status} onChange={(v) => handleChange('status', v)} options={STATUS_OPTIONS} />
            <InputField label="Date" value={formData.date} onChange={(v) => handleChange('date', v)} placeholder="dd/mm/yyyy" />
            
            {/* Meter Info */}
            <InputField label="Account No" value={formData.acountNo} onChange={(v) => handleChange('acountNo', v)} placeholder="xxx-xxxx" />
            <InputField label="Meter No" value={formData.meterNo} onChange={(v) => handleChange('meterNo', v)} maxLength={18} />
            
            <InputField label="kWh Reading" type="number" step="0.01" value={formData.kwhReading} onChange={(v) => handleChange('kwhReading', v)} />
            <SelectField label="Manufacturer" value={formData.mF} onChange={(v) => handleChange('mF', v)} options={MF_OPTIONS} />
            
            <SelectField label="Class" value={formData.class} onChange={(v) => handleChange('class', v)} options={CLASS_OPTIONS} />
            <SelectField label="Item" value={formData.item} onChange={(v) => handleChange('item', v)} options={ITEM_OPTIONS} />

            {/* Remarks with Custom Option */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <select
                value={formData.remarks}
                onChange={(e) => handleChange('remarks', e.target.value)}
                className="input-field mb-2"
              >
                <option value="">Select...</option>
                {REMARKS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              {formData.remarks === 'other' && (
                <input
                  type="text"
                  placeholder="Enter custom remark"
                  value={formData.remarksCustom}
                  onChange={(e) => handleChange('remarksCustom', e.target.value)}
                  className="input-field"
                />
              )}
            </div>

            {/* Seal Numbers */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Padlock Seal No</label>
              <textarea
                value={formData.padlockSealNo}
                onChange={(e) => handleChange('padlockSealNo', e.target.value)}
                placeholder="সীল-১&#10;সীল-২"
                className="input-field"
                rows={2}
              />
            </div>

            {/* Condition Fields with Custom Option */}
            <ConditionalField
              label="Padlock Seal Condition"
              value={formData.padlockSealConditon}
              customValue={formData.padlockCustom}
              onChange={(v) => handleChange('padlockSealConditon', v)}
              onCustomChange={(v) => handleChange('padlockCustom', v)}
            />

            <ConditionalField
              label="Seal Info"
              value={formData.sealInfo}
              customValue={formData.sealInfoCustom}
              onChange={(v) => handleChange('sealInfo', v)}
              onCustomChange={(v) => handleChange('sealInfoCustom', v)}
            />

            <ConditionalField
              label="Lead Seal Condition"
              value={formData.leadSealConditon}
              customValue={formData.leadCustom}
              onChange={(v) => handleChange('leadSealConditon', v)}
              onCustomChange={(v) => handleChange('leadCustom', v)}
            />

            <ConditionalField
              label="Glass Cover"
              value={formData.glasscover}
              customValue={formData.glassCustom}
              onChange={(v) => handleChange('glasscover', v)}
              onCustomChange={(v) => handleChange('glassCustom', v)}
            />

            <ConditionalField
              label="Test Clipper"
              value={formData.testCliper}
              customValue={formData.clipperCustom}
              onChange={(v) => handleChange('testCliper', v)}
              onCustomChange={(v) => handleChange('clipperCustom', v)}
            />

            {/* Personnel Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lineman Name</label>
              <input
                type="text"
                list="lineman-suggestions"
                value={formData.linemanName}
                onChange={(e) => handleChange('linemanName', e.target.value)}
                className="input-field"
                maxLength={20}
              />
              <datalist id="lineman-suggestions">
                {linemanSuggestions.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
            </div>

            <InputField label="CMO No" value={formData.CMO} onChange={(v) => handleChange('CMO', v)} maxLength={10} />
          </div>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Add Entry'}
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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="input-field disabled:bg-gray-100"
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

function ConditionalField({ label, value, customValue, onChange, onCustomChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select value={value || ''} onChange={(e) => onChange(e.target.value)} className="input-field mb-2">
        <option value="">Select...</option>
        {CONDITION_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      {value === 'other' && (
        <input
          type="text"
          placeholder="Enter custom value"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          className="input-field"
        />
      )}
    </div>
  )
}