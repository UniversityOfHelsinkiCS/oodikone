import React, { useMemo } from 'react'
import _ from 'lodash'

import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { SortableTable, row } from 'components/SortableTable'
import { getColumns } from './logic'
import { calculateTotals, useLanguageCenterContext, emptyFields } from '../common'
import { ColorModeSelector, NumberModeSelector, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

export const FacultiesTab = () => {
  const { numberMode, colorMode, semesterFilter, setSemesterFilter, selectedSemesters, data, facultyMap } =
    useLanguageCenterContext()

  const { getTextIn } = useLanguage()

  const totalRow = useMemo(() => {
    const totals = calculateTotals(data.tableData, selectedSemesters, data.faculties)
    return row(totals, { ignoreFilters: true, ignoreSorting: true })
  }, [data, facultyMap])

  const tableData = useMemo(() => {
    const tableData = [_.cloneDeep(totalRow), ..._.cloneDeep(data.tableData)]
    tableData.forEach(course => {
      const facultiesTotal = { ...emptyFields }
      selectedSemesters.forEach(semestercode => {
        data.faculties.forEach(faculty => {
          if (!course.bySemesters.cellStats[faculty]) course.bySemesters.cellStats[faculty] = { ...emptyFields }
          const stats = course.bySemesters[semestercode]?.[faculty]
          if (!stats) return
          course.bySemesters.cellStats[faculty].completions += stats.completions
          course.bySemesters.cellStats[faculty].enrollments += stats.enrollments
          course.bySemesters.cellStats[faculty].rejected += stats.rejected
          course.bySemesters.cellStats[faculty].difference = stats.difference
          facultiesTotal.completions += stats.completions
          facultiesTotal.enrollments += stats.enrollments
          facultiesTotal.rejected += stats.rejected
          facultiesTotal.difference += stats.difference
        })
        facultiesTotal.difference += course.bySemesters[semestercode]?.difference ?? 0
      })
      course.bySemesters.facultiesTotal = facultiesTotal
      course.bySemesters = { ...course.bySemesters, facultiesTotal }
    })
    return tableData
  }, [selectedSemesters, data])

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
          [...data.faculties].sort(),
          numberMode,
          colorMode,
          facultyMap,
          totalRow.bySemesters[numberMode]
        )}
        data={tableData}
        stretch
        striped={colorMode === 'none'}
      />
    </div>
  )
}
