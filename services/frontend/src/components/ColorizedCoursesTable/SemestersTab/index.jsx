import React, { useMemo } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { SortableTable, row } from '@/components/SortableTable'
import { useColorizedCoursesTableContext, calculateTotals, calculateNewTotalColumnValues } from '../common'
import '../index.css'
import { ColorModeSelector, NumberModeSelector, SemesterRangeSelector } from '../selectorComponents'
import { getColumns } from './logic'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const { setSemesterFilter, semesterFilter, semesters, numberMode, colorMode, selectedSemesters, data } =
    useColorizedCoursesTableContext()

  const totalRow = useMemo(() => {
    if (!data) return null
    const totals = calculateTotals(data.tableData, selectedSemesters)
    return row(totals, { ignoreSorting: true, ignoreFilters: true })
  }, [data, selectedSemesters])

  const updatedTableData = useMemo(() => {
    if (!data) return null
    return calculateNewTotalColumnValues(data.tableData, selectedSemesters.map(String))
  }, [data, selectedSemesters])

  const tableData = [totalRow, ...updatedTableData]

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <NumberModeSelector />
        <ColorModeSelector />
      </div>
      <SortableTable
        columns={getColumns(
          getTextIn,
          semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
          numberMode,
          colorMode,
          totalRow.bySemesters[numberMode]
        )}
        data={tableData}
        striped={colorMode === 'none'}
        firstColumnSticky
      />
    </div>
  )
}
