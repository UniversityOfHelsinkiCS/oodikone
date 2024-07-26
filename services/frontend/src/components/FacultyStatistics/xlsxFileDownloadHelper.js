import { utils, writeFile } from 'xlsx'

import { getTimestamp } from '@/util/timeAndDate'
import { sortProgrammeKeys } from './facultyHelpers'

export const downloadStudentTable = (studentStats, programmeNames, faculty, sortedkeys, getTextIn) => {
  const book = utils.book_new()
  const tableHeaders = studentStats.data.titles.slice(1)
  const countriesExtra = studentStats.data.facultyTableStatsExtra
  const years = Object.keys(studentStats.data.facultyTableStats).sort((a, b) => {
    if (a === 'Total') return 1
    if (b === 'Total') return -1

    const yearA = parseInt(a.split(' - ')[0], 10)
    const yearB = parseInt(b.split(' - ')[0], 10)

    return yearB - yearA
  })

  const processTableData = (data, tableHeaders) => {
    let counter = 0
    return data.map(row =>
      row.reduce((result, value) => {
        let header
        if (typeof value !== 'string') {
          header = tableHeaders[counter].replace('\n', ' ')
          counter += 1
        } else {
          header = counter === 0 ? '' : `${tableHeaders[counter - 1].replace('\n', ' ')} %`
          if (counter >= tableHeaders.length) counter = 0
        }
        return { ...result, [header]: value }
      }, {})
    )
  }

  const tableStats = processTableData(
    years.map(year => studentStats.data.facultyTableStats[year]),
    tableHeaders
  )
  const tableSheet = utils.json_to_sheet(tableStats)
  utils.book_append_sheet(book, tableSheet, 'TotalTableStats')

  const programmeStats = studentStats?.data?.programmeStats || {}
  const progressStats = sortedkeys.reduce(
    (results, programme) => [
      ...results,
      ...Object.keys(programmeStats[programme]).map((yearRow, yearIndex) => {
        return {
          'Academic Year': years[yearIndex],
          Programme: programme,
          Name: getTextIn(programmeNames[programme]),
          ...processTableData([programmeStats[programme][yearRow]], tableHeaders)[0],
        }
      }),
    ],
    []
  )
  const sheet = utils.json_to_sheet(progressStats)
  utils.book_append_sheet(book, sheet, 'FacultyProgrammeStats')

  const countriesHeadersForEachYear = years.reduce(
    (result, year) => ({
      ...result,
      [year]: [
        ...new Set(
          Object.keys(countriesExtra[year])
            .reduce((acc, programme) => [...acc, ...Object.keys(countriesExtra[year][programme])], [])
            .sort()
        ),
      ],
    }),
    {}
  )

  const programmeNamesByCode = Object.keys(programmeNames).reduce(
    (res, data) => ({
      ...res,
      [programmeNames[data].code]: {
        fi: programmeNames[data].fi,
        en: programmeNames[data].en,
        sv: programmeNames[data].sv,
      },
    }),
    {}
  )

  years.forEach(year => {
    const countriesStats = Object.keys(countriesExtra[year]).reduce(
      (result, programme) => [
        ...result,
        {
          'Academic Year': year,
          Programme: programme,
          Name: getTextIn(programmeNamesByCode[programme]),
          ...countriesHeadersForEachYear[year].reduce(
            (stats, country) => ({
              ...stats,
              [country]: countriesExtra[year][programme][country] || '',
            }),
            {}
          ),
        },
      ],
      []
    )
    const countriesSheet = utils.json_to_sheet(countriesStats)
    utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  writeFile(book, `oodikone_${faculty.code}_programme_stats_${getTimestamp()}.xlsx`)
}

export const downloadProgressTable = (progressStats, programmeNames, faculty, getTextIn) => {
  const bachelorStats = progressStats?.bachelorStats
  const bachelorMasterStats = progressStats?.bachelorMasterStats
  const masterStats = progressStats?.masterStats
  const doctorStats = progressStats?.doctorStats

  const book = utils.book_new()

  const progressStatsBachelor = bachelorStats.tableStats || []
  const progressStatsBachelorMaster = bachelorMasterStats.tableStats || []
  const progressStatsMaster = masterStats.tableStats || []
  const progressStatsDoctor = doctorStats.tableStats || []

  const tableData = [progressStatsBachelor, progressStatsMaster, progressStatsBachelorMaster, progressStatsDoctor]
  const tableHeadersData = [
    bachelorStats.tableTitles,
    masterStats.tableTitles,
    bachelorMasterStats.tableTitles,
    doctorStats.tableTitles,
  ]

  const sheetNames = ['Bachelor', 'Master', 'Bachelor-Master', 'Doctor']
  let counter = -1
  tableData.forEach(tableStats => {
    counter += 1
    if (tableStats.length > 0) {
      const tableStatsAsXlsx = tableStats.map(yearArray =>
        yearArray.reduce(
          (result, value, yearIndex) => ({ ...result, [tableHeadersData[counter][yearIndex]]: value }),
          {}
        )
      )
      const tableSheet = utils.json_to_sheet(tableStatsAsXlsx)
      utils.book_append_sheet(book, tableSheet, `TableStats-${sheetNames[counter]}`)
    }
  })

  const progressStatsBachelorProg = progressStats?.data?.bachelorsProgStats || {}
  const progressStatsBcMsProg = progressStats?.data?.bcMsProgStats || {}
  const progressStatsMastersProg = progressStats?.data?.mastersProgStats || {}
  const progressStatsDoctorProg = progressStats?.data?.doctoralProgStats || {}
  const programmeData = [
    progressStatsBachelorProg,
    progressStatsMastersProg,
    progressStatsBcMsProg,
    progressStatsDoctorProg,
  ]
  const tableHeadersDataProg = [
    progressStats?.data?.yearlyBachelorTitles,
    progressStats?.data?.yearlyMasterTitles,
    progressStats?.data?.yearlyBcMsTitles,
    doctorStats.tableTitles,
  ]
  counter = -1
  const years = progressStatsBachelor.map(row => row[0])

  programmeData.forEach(programmes => {
    counter += 1
    if (programmes) {
      const progressStats = sortProgrammeKeys(Object.keys(programmes), faculty.code).reduce(
        (results, programme) => [
          ...results,
          ...programmes[programme].map((yearRow, yearIndex) => {
            const yearlyHeaders =
              tableHeadersDataProg[counter][0] !== ''
                ? tableHeadersDataProg[counter][yearIndex]
                : tableHeadersDataProg[counter].slice(1)
            return {
              'Academic Year': years[yearIndex],
              Programme: programme,
              Name: getTextIn(programmeNames[programme]),
              ...yearRow.reduce(
                (result, value, valueIndex) => ({
                  ...result,
                  [yearlyHeaders[valueIndex]]: value,
                }),
                {}
              ),
            }
          }),
        ],
        []
      )
      const sheet = utils.json_to_sheet(progressStats)
      utils.book_append_sheet(book, sheet, sheetNames[counter])
    }
  })
  writeFile(book, `oodikone_${faculty.code}_progress_tab_${getTimestamp()}.xlsx`)
}
