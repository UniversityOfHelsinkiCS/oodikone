/* eslint-disable import/prefer-default-export */
import React, { useMemo } from 'react'
import { Loader } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { getColumns, getCourseMapWithSemesters } from './logic'
import { useLanguageCenterContext } from '../common'
import '../index.css'
import { CompletionPicker, SemesterRangeSelector } from '../selectorComponents'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const { setSemesterFilter, semesterFilter, semesters, mode } = useLanguageCenterContext()
  const { data: rawData, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()

  const tableData = useMemo(() => {
    if (!rawData) return []
    const data = { ...rawData }
    const courseMap = getCourseMapWithSemesters(data.attempts, semesters)
    return data.courses.map(c => ({ ...c, semesterStats: courseMap[c.code] })).filter(course => course.semesterStats)
  }, [rawData])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData || !semesterFilter || !semesters)
    return <Loader active style={{ marginTop: '15em' }} />

  if (!semesters) return null
  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setSemesterFilter={setSemesterFilter} semesterFilter={semesterFilter} />
        <CompletionPicker />
      </div>
      <SortableTable columns={getColumns(getTextIn, semesters, mode)} data={tableData} striped={false} stretch />
    </div>
  )
}
