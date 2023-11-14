/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import SortableTable, { row } from 'components/SortableTable'
import React, { useMemo } from 'react'
import _ from 'lodash'
import { calculateTotals, getColumns } from './logic'
import { getRatio, useLanguageCenterContext } from '../common'
import { CompletionPicker, FilterEmptyCoursesSelector, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

export const emptyCoursesFilter = (courses, numberMode) =>
  courses.filter(({ bySemesters }) =>
    numberMode === 'ratio'
      ? bySemesters.facultiesTotal.completions || bySemesters.facultiesTotal.enrollments
      : bySemesters.facultiesTotal[numberMode]
  )

export const FacultiesTab = () => {
  const { numberMode, semesterFilter, setSemesterFilter, selectedSemesters, data, facultyMap, filterEmptyCourses } =
    useLanguageCenterContext()

  const { getTextIn } = useLanguage()

  const totalRow = useMemo(() => {
    const totals = calculateTotals(data.tableData, data.faculties, selectedSemesters)
    return row(totals, { ignoreFilters: true, ignoreSorting: true })
  }, [data, facultyMap])

  const tableData = useMemo(() => {
    const tableData = [totalRow, ..._.cloneDeep(data.tableData)]
    tableData.forEach(course => {
      const facultiesTotal = { completions: 0, enrollments: 0, ratio: null }
      selectedSemesters.forEach(semestercode => {
        data.faculties.forEach(faculty => {
          if (!course.bySemesters.cellStats[faculty])
            course.bySemesters.cellStats[faculty] = { completions: 0, enrollments: 0, ratio: null }
          const stats = course.bySemesters[semestercode]?.[faculty]
          if (!stats) return
          course.bySemesters.cellStats[faculty].completions += stats.completions
          course.bySemesters.cellStats[faculty].enrollments += stats.enrollments
          course.bySemesters.cellStats[faculty].ratio = getRatio(course.bySemesters.cellStats[faculty])
          facultiesTotal.completions += stats.completions
          facultiesTotal.enrollments += stats.enrollments
        })
        facultiesTotal.ratio = getRatio(facultiesTotal)
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
        <CompletionPicker enableRatioOption />
        <FilterEmptyCoursesSelector />
      </div>
      <SortableTable
        columns={getColumns(getTextIn, [...data.faculties].sort(), numberMode, facultyMap)}
        data={filterEmptyCourses ? emptyCoursesFilter(tableData, numberMode) : tableData}
        stretch
      />
    </div>
  )
}
