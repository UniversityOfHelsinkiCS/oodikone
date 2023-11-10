/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import SortableTable, { row } from 'components/SortableTable'
import React, { useMemo } from 'react'
import _ from 'lodash'
import { calculateTotals, getColumns } from './logic'
import { emptyCoursesFilter, getRatio, useLanguageCenterContext } from '../common'
import { CompletionPicker, FilterEmptyCoursesSelector, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

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
      const facultiesTotal = { completed: 0, notCompleted: 0, ratio: null }
      selectedSemesters.forEach(semestercode => {
        data.faculties.forEach(faculty => {
          if (!course.bySemesters.cellStats[faculty])
            course.bySemesters.cellStats[faculty] = { completed: 0, notCompleted: 0, ratio: null }
          const stats = course.bySemesters[semestercode]?.[faculty]
          if (!stats) return
          course.bySemesters.cellStats[faculty].completed += stats.completed
          course.bySemesters.cellStats[faculty].notCompleted += stats.notCompleted
          course.bySemesters.cellStats[faculty].ratio = getRatio(course.bySemesters.cellStats[faculty])
          facultiesTotal.completed += stats.completed
          facultiesTotal.notCompleted += stats.notCompleted
        })
        facultiesTotal.ratio = getRatio(facultiesTotal)
      })
      course.bySemesters.facultiesTotal = facultiesTotal
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
