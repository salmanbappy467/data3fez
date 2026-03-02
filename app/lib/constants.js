export const API_ENDPOINTS = {
  PBSNET_ADMIN: process.env.NEXT_PUBLIC_PBSNET_ADMIN_URL,
  GOOGLE_SHEETS: '/api/sheets',
}

export const HEADER_COLUMNS = [
  "slNo", "dataSheetNo", "status", "date", "acountNo", "meterNo", 
  "kwhReading", "mF", "class", "item", "remarks", "padlockSealNo",
  "padlockSealConditon", "sealInfo", "leadSealConditon", "glasscover", 
  "testCliper", "linemanName", "CMO", "sendMeterDate", "reciveMeterDate", 
  "rebTestfull", "rebtestData", "testsubmitDate", "googledriveLink", 
  "reIsudate", "note"
]

export const STATUS_OPTIONS = [
  "Meter Room", "HQ office", "REB Weare House", "damage", "reIsued"
]

export const MF_OPTIONS = [
  "Hexing", "Ch", "Libra", "Fitzail", "Wasian", 
  "Holly", "Kv2c+", "Hosaf", "Northern", "Modern"
]

export const CLASS_OPTIONS = ["200", "100"]

export const ITEM_OPTIONS = ["J-3", "J-2", "J-4", "J-43", "J-31"]

export const REMARKS_OPTIONS = [
  "পোড়ার কারনে রিমুভ",
  "ভাঙ্গার কারেনে রিমুভ",
  "সার্কিট নস্ট",
  "ডিসপ্লে সাদা",
  "ডিস্পলে ঘোলা",
  "other"
]

export const CONDITION_OPTIONS = [
  "ভাল", "মরিচা", "সংযুক্ত", "নাই", "ভাঙ্গা", "other"
]

export const DEFAULT_PRINT_SETTINGS = {
  zonalname: "Zone Name",
  pbsname: "PBS Name",
  title: "Meter Data Sheet",
  fot1: "Prepared By",
  fot2: "Checked By",
  fot3: "Approved By",
  fot4: "Signature",
  printColumns: {
    "Print-serialnu": "ক্রমিক নং",
    "acountNo": "একাউন্ট নং",
    "meterNo": "মিটার নং",
    "kwhReading": "রিডিং",
    "mF": "প্রস্তুতকারক",
    "class": "ক্লাস",
    "item": "আইটেম",
    "date": "তারিখ",
    "remarks": "মন্তব্য",
    "padlockSealNo": "সিল নং",
    "padlockSealConditon": "প্যাডলক অবস্থা",
    "sealInfo": "সিল তথ্য",
    "leadSealConditon": "লিড সিল",
    "glasscover": "গ্লাস কভার",
    "testCliper": "টেস্ট ক্লিপার"
  }
}