import { utils, writeFile } from 'xlsx'

import { DegreeProgramme, GetFacultyStudentStatsResponse } from '@/types/api/faculty'
import { getTimestamp } from '@/util/timeAndDate'
import { Name } from '@shared/types'

export const exportStudentTable = (
  data: GetFacultyStudentStatsResponse | undefined,
  programmeNames: Record<string, DegreeProgramme> | undefined,
  faculty: string,
  sortedkeys: string[],
  getTextIn: (text: Name | null | undefined, lang?: string) => string | null | undefined
) => {
  if (!data || !programmeNames) {
    return
  }

  const book = utils.book_new()
  const tableHeaders = data.titles.slice(1)
  const countriesExtra = data.facultyTableStatsExtra
  const years = Object.keys(data.facultyTableStats).sort((a, b) => {
    if (a === 'Total') return 1
    if (b === 'Total') return -1

    const yearA = parseInt(a.split(' - ')[0], 10)
    const yearB = parseInt(b.split(' - ')[0], 10)

    return yearB - yearA
  })

  const processTableData = (data: (number | string)[][], tableHeaders: string[]) => {
    let counter = 0
    return data.map(row =>
      row.reduce(
        (result, value) => {
          let header
          if (typeof value !== 'string') {
            header = tableHeaders[counter].replace('\n', ' ')
            counter += 1
          } else {
            header = counter === 0 ? '' : `${tableHeaders[counter - 1].replace('\n', ' ')} %`
            if (counter >= tableHeaders.length) counter = 0
          }
          return { ...result, [header]: value }
        },
        {} as Record<string, number | string>
      )
    )
  }

  const tableStats = processTableData(
    years.map(year => data.facultyTableStats[year]),
    tableHeaders
  )

  const tableSheet = utils.json_to_sheet(tableStats)
  utils.book_append_sheet(book, tableSheet, 'TotalTableStats')

  const programmeStats = data?.programmeStats || {}
  const progressStats = sortedkeys.reduce(
    (results, programme) => [
      ...results,
      ...Object.keys(programmeStats[programme]).map((yearRow, yearIndex) => {
        return {
          'Academic Year': years[yearIndex],
          Programme: programme,
          Name: getTextIn(programmeNames[programme].name) ?? '',
          ...processTableData([programmeStats[programme][yearRow]], tableHeaders)[0],
        }
      }),
    ],
    [] as Record<string, string | number>[]
  )
  const sheet = utils.json_to_sheet(progressStats)
  utils.book_append_sheet(book, sheet, 'FacultyProgrammeStats')

  const countriesHeadersForEachYear = years.reduce(
    (result, year) => ({
      ...result,
      [year]: [
        ...new Set(
          Object.keys(countriesExtra[year])
            .reduce((acc, programme) => [...acc, ...Object.keys(countriesExtra[year][programme])], [] as string[])
            .sort()
        ),
      ],
    }),
    {} as Record<string, string[]>
  )

  const programmeNamesByCode = Object.keys(programmeNames).reduce(
    (res, data) => ({
      ...res,
      [programmeNames[data].code]: {
        fi: programmeNames[data].name.fi,
        en: programmeNames[data].name.en,
        sv: programmeNames[data].name.sv,
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
          Name: getTextIn(programmeNamesByCode[programme]) ?? '',
          ...countriesHeadersForEachYear[year].reduce(
            (stats, country) => ({
              ...stats,
              [country]: countriesExtra[year][programme][country] || '',
            }),
            {}
          ),
        },
      ],
      [] as Record<string, string | number>[]
    )
    const countriesSheet = utils.json_to_sheet(countriesStats)
    utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  writeFile(book, `oodikone_${faculty}_programme_stats_${getTimestamp()}.xlsx`)
}
