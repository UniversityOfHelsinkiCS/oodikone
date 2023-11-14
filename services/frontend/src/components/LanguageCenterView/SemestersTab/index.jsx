/* eslint-disable import/prefer-default-export */
import React, { useEffect, useMemo } from 'react'
import SortableTable, { row } from 'components/SortableTable'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { calculateTotals, getColumns } from './logic'
import { useLanguageCenterContext } from '../common'
import '../index.css'
import {
  ColorModeSelector,
  CompletionPicker,
  FilterEmptyCoursesSelector,
  SemesterRangeSelector,
} from '../selectorComponents'

export const emptyCoursesFilter = (courses, numberMode) =>
  courses.filter(({ bySemesters }) =>
    numberMode === 'ratio'
      ? bySemesters.facultiesTotal.completions || bySemesters.facultiesTotal.enrollments
      : bySemesters[numberMode]
  )

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
      setNumberMode('completions')
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
