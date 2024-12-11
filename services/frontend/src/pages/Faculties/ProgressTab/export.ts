import { utils, writeFile } from 'xlsx'

import { sortProgrammeKeys } from '@/util/faculty'
import { getTimestamp } from '@/util/timeAndDate'
import { Name, NameWithCode } from '@shared/types'

export const exportProgressTable = (
  progressStats,
  programmeNames: Record<string, NameWithCode> | undefined,
  faculty: string,
  getTextIn: (text: Name | null | undefined, lang?: string) => string | null | undefined
) => {
  if (!progressStats || !programmeNames) {
    return
  }

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
      const progressStats = sortProgrammeKeys(Object.keys(programmes), faculty).reduce(
        (results, programme) => [
          ...results,
          ...programmes[programme as string].map((yearRow, yearIndex) => {
            const yearlyHeaders =
              tableHeadersDataProg[counter][0] !== ''
                ? tableHeadersDataProg[counter][yearIndex]
                : tableHeadersDataProg[counter].slice(1)
            return {
              'Academic Year': years[yearIndex],
              Programme: programme,
              Name: getTextIn(programmeNames[programme as string]),
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
      const sheet = utils.json_to_sheet(progressStats as string[])
      utils.book_append_sheet(book, sheet, sheetNames[counter])
    }
  })

  writeFile(book, `oodikone_${faculty}_progress_tab_${getTimestamp()}.xlsx`)
}
