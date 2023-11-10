/* eslint-disable import/prefer-default-export */
import React, { useEffect, useMemo } from 'react'
import SortableTable, { row } from 'components/SortableTable'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { calculateTotals, getColumns } from './logic'
import { emptyCoursesFilter, useLanguageCenterContext } from '../common'
import '../index.css'
import {
  ColorModeSelector,
  CompletionPicker,
  FilterEmptyCoursesSelector,
  SemesterRangeSelector,
} from '../selectorComponents'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const {
    setSemesterFilter,
    semesterFilter,
    semesters,
    numberMode,
    colorMode,
    selectedSemesters,
    setNumberMode,
    data,
    filterEmptyCourses,
  } = useLanguageCenterContext()

  useEffect(() => {
    if (numberMode === 'ratio') {
      setNumberMode('completed')
    }
  }, [])

  const totalRow = useMemo(() => {
    if (!data) return null
    const totals = calculateTotals(data.tableData, selectedSemesters)
    return row(totals, { ignoreSorting: true, ignoreFilters: true })
  }, [data, selectedSemesters])

  if (numberMode === 'ratio') return null
  if (!semesters) return null
  const tableData = [totalRow, ...data.tableData]
  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <CompletionPicker enableRatioOption={false} />
        <ColorModeSelector />
        <FilterEmptyCoursesSelector />
      </div>
      <SortableTable
        columns={getColumns(
          getTextIn,
          semesters.filter(({ semestercode }) => selectedSemesters.includes(semestercode)),
          numberMode,
          colorMode,
          totalRow.bySemesters[numberMode]
        )}
        data={filterEmptyCourses ? emptyCoursesFilter(tableData, numberMode) : tableData}
        striped={colorMode === 'none'}
        stretch
      />
    </div>
  )
}
