/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import SortableTable, { row } from 'components/SortableTable'
import React, { useMemo } from 'react'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import { Loader } from 'semantic-ui-react'
import { calculateTotals, getColumns } from './logic'
import { useLanguageCenterContext } from '../common'
import { CompletionPicker, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

export const FacultiesTab = () => {
  const facultyQuery = useGetFacultiesQuery()
  const { numberMode, semesterFilter, setSemesterFilter, semesters, selectedSemesters } = useLanguageCenterContext()
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
    const totals = calculateTotals(
      data.tableData,
      data.faculties,
      semesters.map(s => s.semestercode)
    )
    return row(totals, { ignoreFilters: true, ignoreSorting: true })
  }, [data, facultyQuery.data])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !data || !semesterFilter || !semesters?.length || !facultyMap)
    return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <CompletionPicker />
      </div>
      <SortableTable
        columns={getColumns(getTextIn, [...data.faculties].sort(), numberMode, selectedSemesters, facultyMap)}
        data={[totalRow, ...data.tableData]}
        stretch
      />
    </div>
  )
}
