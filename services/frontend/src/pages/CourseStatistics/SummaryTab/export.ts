import { utils, writeFile } from 'xlsx'

import { formatPassRate } from '@/pages/CourseStatistics/courseStatisticsUtils'
import { AttemptData } from '@/types/attemptData'
import { getTimestamp } from '@/util/timeAndDate'

type Row = {
  Title: string
  Passed: string
  Failed: string
  'Pass rate': string
  obfuscated?: boolean
}

export const exportToExcel = (data: AttemptData[]) => {
  const sheetRows = data.reduce((rows, course) => {
    const courseRow: Row = {
      Title: course.category ?? '',
      Passed: course.passed.toString(),
      Failed: course.failed.toString(),
      'Pass rate': formatPassRate(course.passrate),
    }
    const years: Row[] = course.realisations.map(realisation => ({
      Title: realisation.realisation,
      Passed: realisation.passed.toString(),
      Failed: realisation.failed.toString(),
      'Pass rate': formatPassRate(realisation.passrate),
      obfuscated: realisation.obfuscated,
    }))
    const obfuscatedRows: Row[] = [courseRow, ...years].map(row => {
      if (row.obfuscated) {
        const obfuscatedText = '5 or fewer students'
        return { Title: row.Title, Passed: obfuscatedText, Failed: obfuscatedText, 'Pass rate': obfuscatedText }
      }
      const { obfuscated, ...rest } = row
      return rest
    })
    rows.push(...obfuscatedRows)
    return rows
  }, [] as Row[])

  const worksheet = utils.json_to_sheet(sheetRows)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet)
  writeFile(workbook, `oodikone_course_statistics_${getTimestamp()}.xlsx`)
}
