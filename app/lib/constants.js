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
  "Meter Room", "HQ office","Compleated", "REB Weare House", "damage", "re-Isued","OK","Pending","BMDA-m"
]

export const MF_OPTIONS = [
  "Hexing", 
  "CH", 
  "Libra", 
  "Wasion",
  "Holly", 
  "GEKV", 
  "Hosaf", 
  "Northern", 
  "Modern", 
  "Itron", 
  "Cell",
  "other"
];

export const CLASS_OPTIONS = ["200", "100","20"]

export const ITEM_OPTIONS = ["J-3", "J-2", "J-4 ", "J-43", "BMDA J2"]

export const REMARKS_OPTIONS = [
  "পোড়ার কারনে রিমুভ",
  "ভাঙ্গার কারণে রিমুভ",
  "সার্কিট নষ্ট",
  "ডিসপ্লে সাদা",
  "ডিসপ্লে ঘোলা",
  "ডিসপ্লেতে রিডিং লাফায়",
  "ডিসপ্লে কালো বা ইন-অ্যাক্টিভ",
  "টার্মিনাল পয়েন্ট পোড়া",
  "মৌসুম শেষে সাময়িক রিমুভ",
  "আবেদনে মিটার পরীক্ষা",
  "আবেদনে মিটার রিমুভ",
  "চুরিকৃত মিটার ফেরত",
  "বজ্রপাতে মিটার পোড়া",
  "লোড বৃদ্ধির কারণে রিমুভ",
  "other"
]

export const CONDITION_OPTIONS = [
  "ভালো", "মরিচা", "সংযুক্ত", "নাই", "ভাঙা","পোড়া","অভ্যন্তরীণ","other"
]

export const DEFAULT_PRINT_SETTINGS = {
  zonalname: "জোনাল অফিস",
  pbsname: "পল্লী বিদ্যুৎ সমিতি",
  title: "৩ ফেজ মিটারের তথ্য",
  fot1: "মিটার টেস্টার",
  fot2: "এজিএম(ওএন্ডএম)",
  fot3: "ডেপুটি জেনারেল ম্যানেজার",
  fot4: "ডেপুটি জেনারেল ম্যানেজার (কারিগরি)",
  printColumns: {
    "Print-serialnu": "ক্রমিক নং",
    "acountNo": "হিসাব  নং",
    "meterNo": "মিটার  সিরিয়াল নং",
    "kwhReading": "মিটার  রিডিং",
    "mF": "প্রস্তুতকারকের নাম",
    "class": "ক্লাস",
    "item": "আইটেম",
    "date": "মিটার অপসারণের তারিখ",
    "remarks": "মিটার অপসারণের কারণ",
    "padlockSealNo": "প্যাডলক সীল নং",
    "padlockSealConditon": "প্যাডলক সীলের অবস্থা",
    "sealInfo": "সীল সংযুক্ত না থাকলে তাহার কারণ",
    "leadSealConditon": "লিড সীলের অবস্থা",
    "glasscover": "গ্লাস কভারের অবস্থা",
    "testCliper": "টেস্ট ক্লিপের অবস্থা"
  }
}