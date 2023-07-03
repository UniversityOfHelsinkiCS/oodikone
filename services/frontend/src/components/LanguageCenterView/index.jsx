import React from 'react'
import { Divider, Loader } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import useLanguageCenterData from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'

const getRows = data => {
  const courseStats = data.attempts.reduce((obj, cur) => {
    const old = obj[cur.courseCode]
    if (old) {
      const newStats = {
        total: old.total + 1,
        incomplete: cur.completed ? old.incomplete : old.incomplete + 1,
        completed: cur.completed ? old.completed + 1 : old.completed,
      }
      obj[cur.courseCode] = newStats
      return obj
    }
    obj[cur.courseCode] = { total: 1, incomplete: cur.incomplete ? 0 : 1, completed: cur.completed ? 1 : 0 }
    return obj
  }, {})
  // console.log({ courseStats })
  return data.courses.map(course => ({ code: course.code, name: course.name, stats: courseStats[course.code] }))
}

const shorten = (text, maxLength) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text
}

const getColumns = getTextIn => {
  const columns = [
    {
      key: 'course-name',
      title: 'Courses',
      getRowVal: row => row.code,
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code}</b>
          <i style={{ color: 'gray', fontWeight: 'normal' }}>{shorten(getTextIn(row.name), 90)}</i>
        </div>
      ),
    },
    {
      key: 'course-incomplete',
      title: 'Incomplete',
      getRowVal: row => (row.stats ? row.stats.incomplete : 0),
    },
    {
      key: 'course-completed',
      title: 'Completed',
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
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !data) return <Loader active style={{ marginTop: '15em' }} />

  // console.log({ data })

  const rows = getRows(data)

  //  console.log({ rows })

  return (
    <div className="languagecenterview">
      <Divider horizontal>Language center overview</Divider>
      <div className="languagecenter-table">
        <SortableTable columns={getColumns(getTextIn)} data={rows} stretch />
      </div>
    </div>
  )
}

export default LanguageCenterView
