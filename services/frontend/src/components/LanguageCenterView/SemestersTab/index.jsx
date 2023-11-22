/* eslint-disable import/prefer-default-export */
import React, { useEffect, useMemo } from 'react'
import SortableTable, { row } from 'components/SortableTable'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { calculateTotals, getColumns } from './logic'
import { useLanguageCenterContext } from '../common'
import '../index.css'
import { ColorModeSelector, NumberModeSelector, SemesterRangeSelector } from '../selectorComponents'

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
  } = useLanguageCenterContext()

  useEffect(() => {
    if (!['completions', 'enrollments'].includes(numberMode)) {
      setNumberMode('completions')
    }
  }, [])

  const totalRow = useMemo(() => {
    if (!data) return null
    const totals = calculateTotals(data.tableData, selectedSemesters)
    return row(totals, { ignoreSorting: true, ignoreFilters: true })
  }, [data, selectedSemesters])

  if (!semesters) return null
  const tableData = [totalRow, ...data.tableData]
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
        stretch
      />
    </div>
  )
}
