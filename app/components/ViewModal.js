'use client'

import { FiX, FiPrinter } from 'react-icons/fi'

export default function ViewModal({ data, onClose }) {
  if (!data) return null

  // ✅ শুধু Date দেখানোর জন্য ফাংশন (Time সম্পূর্ণ বাদ)
  const formatDate = (val) => {
    if (!val) return '-'
    const str = String(val).trim()
    
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
    } catch (e) {}
    
    // Fallback: T অথবা Space এর আগের অংশ নেওয়া
    return str.split('T')[0].split(' ')[0]
  }

  // ফিল্ড দেখানোর হেল্পার
  const renderField = (label, value, isDate = false) => (
    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
      <p className="text-xs font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words">
        {isDate ? formatDate(value) : (value || '-')}
      </p>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h2 className="text-xl font-bold">Meter Details: {data.meterNo}</h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="p-2 hover:bg-white/20 rounded-lg" title="Print Details">
              <FiPrinter size={20} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto print:p-0">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Basic Info</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField('SL No', data.slNo)}
                {renderField('Data Sheet No', data.dataSheetNo || data.dataNo)}
                {/* ✅ isDate=true ব্যবহার করা হয়েছে */}
                {renderField('Date', data.date, true)}
                {renderField('Account No', data.acountNo)}
                {renderField('Meter No', data.meterNo)}
                {renderField('kWh Reading', data.kwhReading)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Meter Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField('Manufacturer', data.mF)}
                {renderField('Class', data.class)}
                {renderField('Item', data.item)}
                {renderField('Status', data.status)}
                {renderField('Remarks', data.remarks)}
                {renderField('Note', data.note)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Seals & Conditions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField('Padlock Seal No', data.padlockSealNo)}
                {renderField('Padlock Condition', data.padlockSealConditon)}
                {renderField('Seal Info', data.sealInfo)}
                {renderField('Lead Seal Condition', data.leadSealConditon)}
                {renderField('Glass Cover', data.glasscover)}
                {renderField('Test Cliper', data.testCliper)}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Tracking & Testing</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {renderField('Lineman Name', data.linemanName)}
                {renderField('CMO', data.CMO)}
                {/* ✅ isDate=true ব্যবহার করা হয়েছে */}
                {renderField('Send Meter Date', data.sendMeterDate, true)}
                {renderField('Receive Meter Date', data.reciveMeterDate, true)}
                {renderField('Test Submit Date', data.testsubmitDate, true)}
                {renderField('Re-Issue Date', data.reIsudate, true)}
                {renderField('REB Test Full', data.rebTestfull)}
                {renderField('REB Test Data', data.rebtestData)}
              </div>
            </div>

            {data.googledriveLink && (
              <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100 inline-block">
                <a href={data.googledriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2">
                  🔗 View Google Drive Image / Link
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}