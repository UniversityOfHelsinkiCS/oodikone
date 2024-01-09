import xlsx from 'xlsx'
import { getTimestamp } from 'common'
import { sortProgrammeKeys } from './facultyHelpers'

export const downloadStudentTableCsv = (studentStats, programmeNames, faculty, sortedkeys, getTextIn) => {
  const book = xlsx.utils.book_new()
  const tableHeaders = studentStats.data.titles.slice(1)
  const countriesExtra = studentStats.data.facultyTableStatsExtra
  const years = Object.keys(studentStats.data.facultyTableStats)
    .map(year => year)
    .reverse()

  let counter = 0
  const tableStatsAsCsv = years.map(year =>
    studentStats.data.facultyTableStats[year].reduce((result, value) => {
      let header = '%'
      if (typeof value !== 'string') {
        header = tableHeaders[counter]
        counter += 1
      } else {
        header = `${tableHeaders[counter - 1]} %`
        if (counter >= tableHeaders.length) counter = 0
      }
      return { ...result, [header]: value }
    }, {})
  )
  const tableSheet = xlsx.utils.json_to_sheet(tableStatsAsCsv)
  xlsx.utils.book_append_sheet(book, tableSheet, 'TotalTableStats')

  const programmeStats = studentStats?.data?.programmeStats || {}
  counter = 0
  const progressStatsToCsv = sortedkeys.reduce(
    (results, programme) => [
      ...results,
      ...Object.keys(programmeStats[programme]).map((yearRow, yearIndex) => {
        return {
          'Acdemic Year': years[yearIndex],
          Programme: programme,
          Name: getTextIn(programmeNames[programme]),
          ...programmeStats[programme][yearRow].reduce((result, value) => {
            let header = '%'
            if (typeof value !== 'string') {
              header = tableHeaders[counter]
              counter += 1
            } else {
              header = `${tableHeaders[counter - 1]} %`
              if (counter >= tableHeaders.length) counter = 0
            }
            return { ...result, [header]: value }
          }, {}),
        }
      }),
    ],
    []
  )
  const sheet = xlsx.utils.json_to_sheet(progressStatsToCsv)
  xlsx.utils.book_append_sheet(book, sheet, 'FacultyProgrammeStats')

  const countriesHeadersForEachYear = years.reduce(
    (result, year) => ({
      ...result,
      [year]: [
        ...new Set(
          Object.keys(countriesExtra[year]).reduce(
            (acc, prog) => [...acc, ...Object.keys(countriesExtra[year][prog])].sort(),
            []
          )
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
          'Acdemic Year': year,
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
    const countriesSheet = xlsx.utils.json_to_sheet(countriesStats)
    xlsx.utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  xlsx.writeFile(book, `oodikone_${faculty.code}_programme_stats_${getTimestamp()}.xlsx`)
}

export const downloadProgressTableCsv = (progressStats, programmeNames, faculty, getTextIn) => {
  const bachelorStats = progressStats?.bachelorStats
  const bachelorMasterStats = progressStats?.bachelorMasterStats
  const masterStats = progressStats?.masterStats
  const doctorStats = progressStats?.doctorStats

  const book = xlsx.utils.book_new()

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
      const tableStatsAsCsv = tableStats.map(yearArray =>
        yearArray.reduce(
          (result, value, yearIndex) => ({ ...result, [tableHeadersData[counter][yearIndex]]: value }),
          {}
        )
      )
      const tableSheet = xlsx.utils.json_to_sheet(tableStatsAsCsv)
      xlsx.utils.book_append_sheet(book, tableSheet, `TableStats-${sheetNames[counter]}`)
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
      const progressStatsToCsv = sortProgrammeKeys(Object.keys(programmes), faculty.code).reduce(
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
      const sheet = xlsx.utils.json_to_sheet(progressStatsToCsv)
      xlsx.utils.book_append_sheet(book, sheet, sheetNames[counter])
    }
  })
  xlsx.writeFile(book, `oodikone_${faculty.code}_progress_tab_${getTimestamp()}.xlsx`)
}
