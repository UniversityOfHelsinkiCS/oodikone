/* eslint-disable import/prefer-default-export */
import React, { useMemo } from 'react'
import { Loader } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { getColumns, getCourseMapWithSemesters } from './logic'
import { filterFaculties, useLanguageCenterContext } from '../common'
import '../index.css'
import { ApplyFiltersButton, CompletionPicker } from '../selectorComponents'

export const SemestersTab = () => {
  const { getTextIn } = useLanguage()
  const { dates, semesters, filters } = useLanguageCenterContext()
  const { data: rawData, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()

  const tableData = useMemo(() => {
    if (!rawData) return []
    const facultyFilteredData = filterFaculties(rawData)
    const data = { ...facultyFilteredData }
    const courseMap = getCourseMapWithSemesters(data.attempts, semesters)
    return data.courses.map(c => ({ ...c, semesterStats: courseMap[c.code] })).filter(course => course.semesterStats)
  }, [rawData, filters])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData || !dates || !semesters) return <Loader active style={{ marginTop: '15em' }} />

  if (!semesters) return null
  return (
    <div>
      <div className="options-container">
        <CompletionPicker />
      </div>
      <ApplyFiltersButton />
      <SortableTable columns={getColumns(getTextIn, semesters, filters.mode)} data={tableData} stretch />
    </div>
  )
}
