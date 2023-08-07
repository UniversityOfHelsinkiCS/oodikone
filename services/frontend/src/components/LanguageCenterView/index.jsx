import React, { useState } from 'react'
import { Divider, Loader, Radio } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import useLanguageCenterData from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'
import Toggle from 'components/StudyProgramme/Toggle'

const shorten = (text, maxLength) => (text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text)

const getColumns = (getTextIn, faculties, mode) => {
  const columns = [
    {
      key: 'course-name',
      title: 'Course',
      getRowVal: row => row.code ?? 'No faculty found because enrollment date missing.',
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code ?? 'No faculty'}</b>
          <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shorten(getTextIn(row.name), 90)}</i>
        </div>
      ),
    },
    ...faculties.map(facultyCode => ({
      key: facultyCode,
      title: facultyCode,
      getRowVal: row => {
        const stats = row.facultyStats[facultyCode]
        if (!stats) return 0
        if (mode === 'total') {
          const result = (stats.completed ?? 0) + (stats.notCompleted ?? 0)
          return result
        }
        return stats[mode] ?? 0
      },
      filterable: false,
    })),
    {
      key: 'all',
      title: 'All faculties',
      getRowVal: row => {
        const objVals = Object.values(row.facultyStats)
        const arr = objVals.map(stat => {
          if (mode === 'total') {
            const notCompleted = stat.notCompleted ?? 0
            const completed = stat.completed ?? 0
            return notCompleted + completed
          }
          return stat[mode]
        })
        return arr.reduce((sum, cur) => {
          if (cur === undefined) return sum
          return cur + sum
        }, 0)
      },
    },
  ]
  return columns
}

const getCourseFaculties = attempts => {
  const map = attempts.reduce((obj, cur) => {
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = {}
    }
    if (!obj[cur.courseCode][cur.faculty]) {
      obj[cur.courseCode][cur.faculty] = {}
    }
    const stats = obj[cur.courseCode][cur.faculty]
    const field = cur.completed ? 'completed' : 'notCompleted'
    if (!stats[field]) {
      stats[field] = 1
    } else {
      stats[field] += 1
    }
    return obj
  }, {})
  return map
}

const LanguageCenterView = () => {
  const { data: rawData, isFetchingOrLoading, isError } = useLanguageCenterData()
  const { getTextIn } = useLanguage()
  const [filterOld, setFilterOld] = useState(true)
  const [mode, setMode] = useState('total')
  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData) return <Loader active style={{ marginTop: '15em' }} />

  const filterFaculties = data => {
    if (!filterOld) return data
    return {
      ...data,
      attempts: data.attempts.filter(attempt => attempt.faculty?.substring(0, 3).match(`^H\\d`)),
    }
  }

  const data = filterFaculties(rawData)
  const courseFaculties = getCourseFaculties(data.attempts)
  const coursesWithFaculties = data.courses
    .map(c => ({ ...c, facultyStats: courseFaculties[c.code] }))
    .filter(course => course.facultyStats)
  const faculties = [...new Set(data.attempts.map(({ faculty }) => faculty))].sort()
  console.log({ attempts: data.attempts, courseFaculties, coursesWithFaculties })
  return (
    <div className="languagecenterview">
      <Divider horizontal>Language center overview</Divider>
      <div className="toggle-container">
        <Radio
          name="modeRadioGroup"
          value="total"
          label="Total"
          onChange={() => setMode('total')}
          checked={mode === 'total'}
        />
        <Radio
          name="modeRadioGroup"
          value="notCompleted"
          label="Not completed"
          onChange={() => setMode('notCompleted')}
          checked={mode === 'notCompleted'}
        />
        <Radio
          name="modeRadioGroup"
          value="completed"
          label="Completed"
          onChange={() => setMode('completed')}
          checked={mode === 'completed'}
        />
        <Toggle
          firstLabel="All faculties"
          secondLabel="Filter out old faculties"
          value={filterOld}
          setValue={setFilterOld}
        />
      </div>
      <div className="languagecenter-table">
        <SortableTable columns={getColumns(getTextIn, faculties, mode)} data={coursesWithFaculties} stretch />
      </div>
    </div>
  )
}

export default LanguageCenterView
