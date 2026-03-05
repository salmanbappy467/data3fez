'use client'

import { useState } from 'react'
import { FiX, FiSave } from 'react-icons/fi'
import { sheetsApi } from '../lib/api'
import { storage } from '../lib/storage'
import { HEADER_COLUMNS, STATUS_OPTIONS, MF_OPTIONS, CLASS_OPTIONS, ITEM_OPTIONS } from '../lib/constants'

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
      if (!sheetId) return

      // শুধু পরিবর্তন হওয়া ডাটাগুলো বের করা
      const changedData = {}
      HEADER_COLUMNS.forEach(key => {
        if (formData[key] !== data[key]) {
          changedData[key] = formData[key]
        }
      })

      if (Object.keys(changedData).length === 0) {
        onClose()
        return
      }

      // ✅ নতুন updateRow ব্যবহার করা হচ্ছে
      // এটি প্রথমে লোকাল ডাটাবেস আপডেট করবে -> পেজ রিফ্রেশ করবে -> তারপর ব্যাকগ্রাউন্ডে সার্ভারে পাঠাবে
      sheetsApi.updateRow(
        sheetId, 
        parseInt(data.rawRowIndex), // রো ইনডেক্স
        changedData // শুধু পরিবর্তিত ডাটা
      ).catch(err => console.error('Background sync error:', err))

      // সাথে সাথেই মডাল বন্ধ (User Experience Fast)
      onClose()
      
    } catch (error) {
      console.error('Save failed:', error)
      alert('Failed to save: ' + error.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b bg-blue-600 text-white">
          <h2 className="text-xl font-bold">Edit Entry #{data.slNo}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg"><FiX size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
           {/* আপনার আগের মতো সব ইনপুট ফিল্ড এখানে থাকবে */}
           <div className="grid md:grid-cols-2 gap-4">
              <InputField label="Date" value={formData.date} onChange={v => handleChange('date', v)} />
              <SelectField label="Status" value={formData.status} onChange={v => handleChange('status', v)} options={STATUS_OPTIONS} />
              <InputField label="Account No" value={formData.acountNo} onChange={v => handleChange('acountNo', v)} />
              <InputField label="Meter No" value={formData.meterNo} onChange={v => handleChange('meterNo', v)} />
              <InputField label="kWh Reading" value={formData.kwhReading} onChange={v => handleChange('kwhReading', v)} />
              <SelectField label="Manufacturer" value={formData.mF} onChange={v => handleChange('mF', v)} options={MF_OPTIONS} />
              <SelectField label="Class" value={formData.class} onChange={v => handleChange('class', v)} options={CLASS_OPTIONS} />
              <SelectField label="Item" value={formData.item} onChange={v => handleChange('item', v)} options={ITEM_OPTIONS} />
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <textarea className="input-field" value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} rows={2} />
              </div>

              {/* ... অন্যান্য ফিল্ড (আপনার আগের কোডের মতো) ... */}
           </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
          <button onClick={onClose} className="px-6 py-2 border rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            {saving ? 'Saving...' : <><FiSave /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper Components (নিচে দিতে হবে)
function InputField({ label, value, onChange, type = 'text', ...props }) {
  return <div><label className="block text-sm font-medium mb-1 text-gray-700">{label}</label><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="input-field" {...props} /></div>
}
function SelectField({ label, value, onChange, options }) {
  return <div><label className="block text-sm font-medium mb-1 text-gray-700">{label}</label><select value={value || ''} onChange={e => onChange(e.target.value)} className="input-field"><option value="">Select...</option>{options.map(o => <option key={o} value={o}>{o}</option>)}</select></div>
}