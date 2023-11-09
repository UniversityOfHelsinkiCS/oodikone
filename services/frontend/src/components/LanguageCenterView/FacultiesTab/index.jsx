/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import SortableTable, { row } from 'components/SortableTable'
import React, { useMemo } from 'react'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import { Loader } from 'semantic-ui-react'
import _ from 'lodash'
import { calculateTotals, getColumns } from './logic'
import { getRatio, useLanguageCenterContext } from '../common'
import { CompletionPicker, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

export const FacultiesTab = () => {
  const facultyQuery = useGetFacultiesQuery()
  const { numberMode, semesterFilter, setSemesterFilter, selectedSemesters } = useLanguageCenterContext()
  const { data, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()

  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const { getTextIn } = useLanguage()

  const totalRow = useMemo(() => {
    if (!data?.tableData) return null
    const totals = calculateTotals(data.tableData, data.faculties, selectedSemesters)
    return row(totals, { ignoreFilters: true, ignoreSorting: true })
  }, [data, facultyQuery.data])

  const tableData = useMemo(() => {
    if (!data) return []
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

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !data || !semesterFilter || !selectedSemesters?.length || !facultyMap)
    return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <CompletionPicker enableRatioOption />
      </div>
      <SortableTable
        columns={getColumns(getTextIn, [...data.faculties].sort(), numberMode, facultyMap)}
        data={tableData}
        stretch
      />
    </div>
  )
}
