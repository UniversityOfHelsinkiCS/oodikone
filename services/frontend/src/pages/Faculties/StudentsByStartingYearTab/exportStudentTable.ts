import { utils, writeFile } from 'xlsx'

import { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { GetFacultyStudentStatsResponse } from '@/types/api/faculty'
import { getTimestamp } from '@/util/timeAndDate'

/* This is theoretically useless, as js would sort exactly the same way without a function, but w.e */
const sortByYear = (a: string, b: string) => {
  if (a === 'Total') return 1
  if (b === 'Total') return -1

  const yearA = parseInt(a.split(' - ')[0], 10)
  const yearB = parseInt(b.split(' - ')[0], 10)

  return yearB - yearA
}

export const exportStudentTable = (
  data: GetFacultyStudentStatsResponse | undefined,
  faculty: string,
  sortedkeys: string[],
  getTextIn: GetTextIn
) => {
  if (!data) {
    return
  }

  const { programmeNames, programmeStats } = data

  const book = utils.book_new()
  const tableHeaders = data.titles.slice(1)
  const countriesExtra = data.facultyTableStatsExtra
  const years = Object.keys(data.facultyTableStats).sort(sortByYear)

  const processTableData = (data: (number | string)[][], tableHeaders: string[]) => {
    let counter = 0
    return data.map(row =>
      row.reduce(
        (result, value) => {
          let header: string
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

  const progressStats: Record<string, string | number>[] = sortedkeys.flatMap(programme => [
    ...Object.keys(programmeStats[programme])
      .sort(sortByYear)
      .map(yearRow => ({
        'Academic Year': yearRow,
        Programme: programme,
        Name: getTextIn(programmeNames[programme].name) ?? '',
        ...processTableData([programmeStats[programme][yearRow]], tableHeaders)[0],
      })),
  ])

  const sheet = utils.json_to_sheet(progressStats)
  utils.book_append_sheet(book, sheet, 'FacultyProgrammeStats')

  const countriesHeadersForEachYear = years.reduce(
    (result, year) => ({
      ...result,
      [year]: Array.from(
        new Set(
          Object.keys(countriesExtra[year]).flatMap(programme => [...Object.keys(countriesExtra[year][programme])])
        )
      ).sort(),
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
    const countriesStats = Object.keys(countriesExtra[year]).map(programme => ({
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
    }))
    const countriesSheet = utils.json_to_sheet(countriesStats)
    utils.book_append_sheet(book, countriesSheet, `CountriesStats-${year}`)
  })

  writeFile(book, `oodikone_${faculty}_programme_stats_${getTimestamp()}.xlsx`)
}
