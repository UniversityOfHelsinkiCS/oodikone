import React, { useState } from 'react'
import { Divider, Loader } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import useLanguageCenterData from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'
import Toggle from 'components/StudyProgramme/Toggle'
import _ from 'lodash'

// field either 'courseCode' or 'faculty'
const getStats = (data, field) => {
  const stats = data.attempts.reduce((obj, cur) => {
    const old = obj[cur[field]]
    if (old) {
      const newStats = {
        total: old.total + 1,
        incomplete: cur.completed ? old.incomplete : old.incomplete + 1,
        completed: cur.completed ? old.completed + 1 : old.completed,
      }
      obj[cur[field]] = newStats
      return obj
    }
    obj[cur[field]] = { total: 1, incomplete: cur.completed ? 0 : 1, completed: cur.completed ? 1 : 0 }
    return obj
  }, {})
  console.log({ stats })
  // console.log({ courseStats })
  if (field === 'courseCode')
    return data.courses.map(course => ({ code: course.code, name: course.name, stats: stats[course.code] }))
  return Object.keys(stats).map(faculty => ({ code: faculty, name: '', stats: stats[faculty] }))
}

const shorten = (text, maxLength) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text
}

const getColumns = (byCourses, getTextIn) => {
  const columns = [
    {
      key: 'course-name',
      title: byCourses ? 'Course' : 'Faculty',
      getRowVal: row => row.code ?? 'No faculty found because enrollment date missing.',
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code ?? 'No faculty'}</b>
          {byCourses && (
            <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shorten(getTextIn(row.name), 90)}</i>
          )}
        </div>
      ),
    },
    {
      key: 'course-incomplete',
      title: 'Not completed',
      getRowVal: row => (row.stats ? row.stats.incomplete : 0),
    },
    {
      key: 'course-completed',
      title: 'Passed',
      getRowVal: row => (row.stats ? row.stats.completed : 0),
    },
    {
      key: 'course-total',
      title: 'Total',
      getRowVal: row => (row.stats ? row.stats.total : 0),
    },
  ]

  return columns
}

const LanguageCenterView = () => {
  const { data, isFetchingOrLoading, isError } = useLanguageCenterData()
  const { getTextIn } = useLanguage()
  const [byCourses, setByCourses] = useState(true)
  const [filterOld, setFilterOld] = useState(true)
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !data) return <Loader active style={{ marginTop: '15em' }} />

  const filterFaculties = data => {
    if (!filterOld) return data
    return {
      ...data,
      attempts: data.attempts.filter(attempt => attempt.faculty?.substring(0, 3).match(`^H\\d`)),
    }
  }
  console.log("kkesp-101 count ", data.attempts.filter(attempt => attempt.courseCode === 'KK-ESP101' && attempt.completed).length)
  console.log({ data })
  console.log(data.attempts.length)

  const rows = getStats(filterFaculties(data), byCourses ? 'courseCode' : 'faculty')
  console.log(rows.filter(row => !row.stats))
  console.log(rows.reduce((prev, cur) => (cur.stats ? cur.stats.total + prev : prev), 0))
  console.log(
    'sum of totals ',
    rows.reduce((previous, { stats }) => previous + (stats ? stats.total : 0), 0)
  )
  return (
    <div className="languagecenterview">
      <Divider horizontal>Language center overview</Divider>
      <div className="toggle-container">
        <Toggle firstLabel="By faculties" secondLabel="By courses" value={byCourses} setValue={setByCourses} />
        <Toggle
          firstLabel="All faculties"
          secondLabel="Filter out old faculties"
          value={filterOld}
          setValue={setFilterOld}
        />
      </div>
      <div className="languagecenter-table">
        <SortableTable columns={getColumns(byCourses, getTextIn)} data={rows} stretch />
      </div>
    </div>
  )
}

export default LanguageCenterView
