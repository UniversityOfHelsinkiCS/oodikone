/* eslint-disable import/prefer-default-export */
import useLanguage from 'components/LanguagePicker/useLanguage'
import SortableTable, { row } from 'components/SortableTable'
import React, { useMemo, useState } from 'react'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import { Loader } from 'semantic-ui-react'
import { calculateTotals, getColumns, getCourseFaculties } from './logic'
import { filterAttemptsByDates, filterFaculties, useLanguageCenterContext } from '../common'
import { ApplyFiltersButton, CompletionPicker, SemesterRangeSelector } from '../selectorComponents'
import '../index.css'

export const FacultiesTab = () => {
  const facultyQuery = useGetFacultiesQuery()
  const { filters, dates, setDates, semesters } = useLanguageCenterContext()
  const { data: rawData, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()
  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const [faculties, setFaculties] = useState([])
  const { getTextIn } = useLanguage()

  const tableData = useMemo(() => {
    if (!rawData) return []
    const facultyFilteredData = filterFaculties(rawData)

    const filteredAttempts =
      !filters.startDate || !filters.endDate
        ? facultyFilteredData.attempts
        : facultyFilteredData.attempts.filter(attempt => filterAttemptsByDates(attempt.date, filters))

    const data = { ...facultyFilteredData, attempts: filteredAttempts }
    const newFaculties = [...new Set(data.attempts.map(({ faculty }) => faculty))].sort()
    setFaculties(newFaculties)
    const courseFaculties = getCourseFaculties(data.attempts)

    const coursesWithFaculties = data.courses
      .map(c => ({ ...c, facultyStats: courseFaculties[c.code] }))
      .filter(course => course.facultyStats)
    const totals = calculateTotals(coursesWithFaculties)
    const totalRow = row(totals, { ignoreFilters: true, ignoreSorting: true })
    return [totalRow, ...coursesWithFaculties]
  }, [rawData, filters])

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData || !dates || !semesters || !facultyMap)
    return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div>
      <div className="options-container">
        <SemesterRangeSelector setDates={setDates} dates={dates} />
        <CompletionPicker />
      </div>
      <ApplyFiltersButton />

      <SortableTable columns={getColumns(getTextIn, faculties, filters.mode, facultyMap)} data={tableData} stretch />
    </div>
  )
}
