import { useMemo } from 'react'

import {
  calculateNewTotalColumnValues,
  calculateTotals,
  useColorizedCoursesTableContext,
} from '@/components/ColorizedCoursesTable/common'
import {
  ColorModeSelector,
  NumberModeSelector,
  SemesterRangeSelector,
} from '@/components/ColorizedCoursesTable/selectorComponents'
import '@/components/ColorizedCoursesTable/index.css'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { OodiTable } from '@/components/OodiTable'
import { OodiTableExcelExport } from '@/components/OodiTable/excelExport'
import { useColumns } from './logic'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const { semesters, numberMode, colorMode, selectedSemesters, data } = useColorizedCoursesTableContext()

  const totalRow = useMemo(() => {
    if (!data) return {}
    return calculateTotals(data.tableData, selectedSemesters)
  }, [data, selectedSemesters])

  const [tableData, excelData] = useMemo(() => {
    if (!data) return []
    const tableData = calculateNewTotalColumnValues(data.tableData, selectedSemesters.map(String))
    const excelData = tableData.map(({ code, bySemesters }) => ({
      Course: code,
      ...Object.fromEntries(
        semesters
          .filter(({ semestercode }) => selectedSemesters.includes(semestercode))
          .map(({ name, semestercode }) => [`${getTextIn(name)}`, bySemesters[semestercode]?.[numberMode] ?? 0])
      ),
      Total: bySemesters[numberMode],
    }))

    return [tableData, excelData]
  }, [data, selectedSemesters])

  const cols = useColumns(
    getTextIn,
    semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
    numberMode,
    colorMode,
    totalRow.bySemesters[numberMode]
  )

  const tableOptions = {
    initialState: { columnPinning: { left: ['code'] } },
    state: {
      useZebrastripes: colorMode === 'none',
    },
  }

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector />
        <NumberModeSelector />
        <ColorModeSelector />
      </div>
      <OodiTable
        columns={cols}
        cy="ooditable-semesters"
        data={tableData}
        options={tableOptions}
        toolbarContent={<OodiTableExcelExport data={excelData} exportColumnKeys={cols.map(({ header }) => header)} />}
      />
    </div>
  )
}
