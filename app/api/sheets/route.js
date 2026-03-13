import { google } from 'googleapis'
import { NextResponse } from 'next/server'

// Initialize Google Auth
let privateKey = process.env.GOOGLE_PRIVATE_KEY
if (privateKey) {
  // Remove any surrounding quotes that might have been picked up
  privateKey = privateKey.trim()
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
    privateKey = privateKey.substring(1, privateKey.length - 1)
  }

  // Handle literal "backslash n" strings and actual escaped newlines
  privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '')
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

/**
 * Helper to get the correct range with escaped sheet name.
 * If sheetName is not found, it creates it.
 */
async function getEffectiveRange(spreadsheetId, sheetName, range) {
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId })
  let sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName)

  if (!sheet) {
    // Create the sheet if it doesn't exist
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: sheetName,
              },
            },
          },
        ],
      },
    })
    sheet = response.data.replies[0].addSheet
  }

  return `'${sheetName}'!${range}`
}

export async function POST(request) {
  try {
    const { action, sheetId, sheetName, data, row, col, value, rowIndex } = await request.json()

    if (!sheetId) throw new Error('Sheet ID is required')

    let responseData = { status: 'success' }

    switch (action) {
      case 'read': {
        const range = await getEffectiveRange(sheetId, sheetName, 'A:AC')
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: range,
        })
        responseData.data = response.data.values || []
        break
      }

      case 'add': {
        const range = await getEffectiveRange(sheetId, sheetName, 'A:A')
        await sheets.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [Array.isArray(data) ? data : Object.values(data)],
          },
        })
        break
      }

      case 'update': {
        const range = await getEffectiveRange(sheetId, sheetName, `${String.fromCharCode(64 + col)}${row}`)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[value]],
          },
        })
        break
      }

      case 'updateRow': {
        const { row, values } = data
        const range = await getEffectiveRange(sheetId, sheetName, `A${row}:ZZ${row}`)
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: range,
          valueInputOption: 'RAW',
          requestBody: {
            values: [values],
          },
        })
        break
      }

      case 'batchUpdate': {
        const { updates } = data // Array of { range, values }
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            data: updates.map(u => ({
              range: `'${sheetName}'!${u.range}`,
              values: u.values
            })),
            valueInputOption: 'RAW',
          },
        })
        break
      }

      case 'delete': {
        const index = rowIndex || row
        if (!index) throw new Error('Row index is required for deletion')

        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId })
        let sheet = spreadsheet.data.sheets.find(s => s.properties.title === sheetName)

        if (!sheet) {
          // If sheet doesn't exist, nothing to delete from it
          break
        }

        const gid = sheet.properties.sheetId

        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: gid,
                    dimension: 'ROWS',
                    startIndex: index - 1,
                    endIndex: index,
                  },
                },
              },
            ],
          },
        })
        break
      }

      default:
        throw new Error('Unsupported action')
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Google Sheets API Error:', error)
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    )
  }
}
