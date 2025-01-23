import { utils, writeFile } from 'xlsx'

import { getTimestamp } from '@/util/timeAndDate'

export const exportToExcel = data => {
  const jsonItems = data.reduce((arr, cur) => {
    const { passed: Passed, failed: Failed, passrate: Passrate, category: Title } = cur
    const years = cur.realisations.map(r => ({
      Passed: r.passed,
      Failed: r.failed,
      Passrate: r.passrate,
      Title: r.realisation,
      obfuscated: r.obfuscated,
    }))
    const rows = [{ Title, Passed, Failed, Passrate }, ...years]
    const obfuscatedRows = rows.map(row => {
      if (row.obfuscated) {
        const obf = '5 or fewer students'
        return { Title: row.Title, Passed: obf, Failed: obf, Passrate: obf }
      }
      const { obfuscated, ...rest } = row
      return rest
    })
    arr.push(...obfuscatedRows)
    return arr
  }, [])
  const worksheet = utils.json_to_sheet(jsonItems)
  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, worksheet)
  writeFile(workbook, `oodikone_course_statistics_${getTimestamp()}.xlsx`)
}
