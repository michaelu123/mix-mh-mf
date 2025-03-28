import { dialog } from 'electron'
import fsp from 'fs/promises'
import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

const fields = [
  'MITGLIEDSNR',
  '@MH@MF',
  'ANREDE',
  'TITEL',
  'VORNAME',
  'ADEL',
  'NAME',
  'NAMENSZUSATZ',
  'BRIEFANREDE',
  'BRIEFANREDE2',
  'ORGANISATION1',
  'ORGANISATION2',
  'ORGANISATION3',
  'ADRESSZUSATZ',
  'ABTEILUNG',
  'FUNKTION',
  'STRASSE',
  'PLZ',
  'ORT',
  'POSTFACH',
  'PPLZ',
  'PORT',
  'BUNDESLAND',
  'STAAT',
  'TELEFON1',
  'TELEFON2',
  'MOBIL',
  'Fax',
  'EMAIL',
  'EMAIL2',
  'SKYPE',
  'Homepage',
  'DEAKTIV',
  'DEAKTIVGRUND',
  'GEBURTSDATUM',
  'GEBURTSJAHR',
  'BERUF',
  'EINTRITT',
  'AUSTRITT',
  'KUENDIGUNG_AM',
  'AUSTRITTSGRUND',
  'STATUS',
  'AKTIONSCODE',
  'BEITRAGSSCHLUESSEL',
  'BEITRAG',
  'FAELLIG_AM',
  'DAUERSPENDE',
  'ZAHLART',
  'MAHNUNG1',
  'MAHNUNG2',
  'LV',
  'KV',
  'OG',
  'WUNSCH_GL',
  'ZUZUG_LV',
  'ZUZUG_KV',
  'ANZAHL_MF',
  'RUECKLAUF1',
  'RUECKLAUF2',
  'ANZAHL_RW',
  'NOTIZ',
  'BV_NOTIZEN'
]

const msgs = []
const hmap = new Map()

export async function opendialog(ev, h_or_f, o_or_c) {
  console.log('opendialog h_or_f', h_or_f, 'o_or_c', o_or_c)
  const res = await dialog.showOpenDialog({
    title: o_or_c
      ? 'Wähle Datei mit ' + (h_or_f ? 'Haupt' : 'Familien') + 'mitgliedern'
      : 'Wähle Ausgabedatei',
    // buttonLabel: 'buttonlabel',
    filters: [{ name: 'CSV', extensions: ['csv'] }],
    properties: [o_or_c ? 'openFile' : 'promptToCreate'],
    message: 'message'
  })
  return res.canceled ? '' : res.filePaths[0]
}

function name(row) {
  return row['VORNAME'] + ' ' + row['NAME'] + ', ' + row['MITGLIEDSNR']
}

function toHNr(s) {
  if (s.length > 2) {
    return s.substring(0, s.length - 2) + '00'
  }
  return s
}

function hrows(hmRecords, fmRecords) {
  for (const hrow of hmRecords) {
    hrow['@MH@MF'] = ''
    if (!hrow['EMAIL']) {
      hrow['MITGLIEDSNR'] += ' @H'
      hrow['@MH@MF'] += '@H'
    }
  }
  for (const frow of fmRecords) {
    if (!frow['EMAIL']) {
      const hnr = toHNr(frow['MITGLIEDSNR'])
      const hrow = hmap.get(hnr)
      if (!hrow) {
        msgs.push('Kein Hauptmitglied für ' + name(frow))
        continue
      }
      if (!hrow['MITGLIEDSNR'].includes('@F')) {
        hrow['MITGLIEDSNR'] += ' @F'
        hrow['@MH@MF'] += '@F'
      }
    }
  }
  return hmRecords
}

function frows(hmRecords, fmRecords) {
  const res = []
  for (const frow of fmRecords) {
    frow['@MH@MF'] = ''
    if (!frow['EMAIL']) {
      const hnr = toHNr(frow['MITGLIEDSNR'])
      const hrow = hmap.get(hnr)
      if (!hrow) {
        msgs.push('Kein Hauptmitglied für ' + name(frow))
        frow['@MH@MF'] = '@HM-ERROR'
        continue
      }
      if (hrow['EMAIL']) {
        frow['EMAIL2'] = hrow['EMAIL']
        res.push(frow)
      } else continue
    }
  }
  return res
}

export async function processCSV(ev, hmFile, fmFile, outFile, mode = 'h') {
  const hmContent = await fsp.readFile(hmFile)
  const fmContent = await fsp.readFile(fmFile)
  const hmRecords = parse(hmContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    delimiter: ';'
  })
  msgs.length = 0
  msgs.push('Hauptmitglieder: ' + hmRecords.length + ' Einträge gelesen')
  for (const row of hmRecords) {
    hmap.set(row['MITGLIEDSNR'], row)
  }
  const fmRecords = parse(fmContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    delimiter: ';'
  })
  msgs.push('Familienmitglieder: ' + fmRecords.length + ' Einträge gelesen')

  let outRecords = mode == 'h' ? hrows(hmRecords, fmRecords) : frows(hmRecords, fmRecords)
  const columns = fields.map((s) => {
    return { key: s }
  })

  for (const rec of outRecords) {
    for (const f of fields) {
      if (!(f in rec)) {
        rec[f] = ''
      }
    }
  }

  const outContent = stringify(outRecords, {
    bom: true,
    delimiter: ';',
    header: true,
    columns
  })
  await fsp.writeFile(outFile, outContent)
  msgs.push('Fertig')
  return msgs
}
