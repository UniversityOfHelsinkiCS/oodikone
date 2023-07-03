import React, { useState } from 'react'
import { Divider, Icon, Loader, Radio } from 'semantic-ui-react'
import SortableTable, { row } from 'components/SortableTable'
import useLanguageCenterData from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'
import DateTimeSelector from 'components/DateTimeSelector'
import moment from 'moment'

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
      key: facultyCode ?? 'no-faculty',
      title: facultyCode ?? 'No faculty',
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
      title: 'Total',
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

const calculateTotals = coursesWithFaculties => {
  const facultyStats = {}
  coursesWithFaculties.forEach(course => {
    Object.entries(course.facultyStats).forEach(([faculty, stats]) => {
      if (!facultyStats[faculty]) {
        facultyStats[faculty] = { notCompleted: 0, completed: 0 }
      }
      const oldStats = facultyStats[faculty]
      if (!oldStats.notCompleted) oldStats.notCompleted = 0
      if (!oldStats.completed) oldStats.completed = 0
      oldStats.notCompleted += stats.notCompleted ?? 0
      oldStats.completed += stats.completed ?? 0
    })
  })
  return { code: 'TOTAL', name: { en: 'All courses total' }, facultyStats }
}

const filterAttemptsByDates = (date, dates) => {
  const start = dates.startDate?.toDate().getTime() ?? moment(new Date('1900-1-1'))
  const end = dates.endDate?.toDate().getTime() ?? moment(new Date('2100-01-01'))
  return moment(date).isBetween(start, end)
}

const LanguageCenterView = () => {
  const { data: rawData, isFetchingOrLoading, isError } = useLanguageCenterData()
  const { getTextIn } = useLanguage()
  const [mode, setMode] = useState('total')
  const [dates, setDates] = useState({ startDate: null, endDate: null })

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData) return <Loader active style={{ marginTop: '15em' }} />

  const filterFaculties = data => {
    return {
      ...data,
      attempts: data.attempts.filter(attempt => !attempt.faculty || attempt.faculty?.substring(0, 3).match(`^H\\d`)),
    }
  }

  const facultyFilteredData = filterFaculties(rawData)
  const filteredAttempts = facultyFilteredData.attempts.filter(attempt => filterAttemptsByDates(attempt.date, dates))
  const data = { attempts: filteredAttempts, ...facultyFilteredData }
  const courseFaculties = getCourseFaculties(data.attempts)
  const coursesWithFaculties = data.courses
    .map(c => ({ ...c, facultyStats: courseFaculties[c.code] }))
    .filter(course => course.facultyStats)
  const faculties = [...new Set(data.attempts.map(({ faculty }) => faculty))].sort()

  const totals = calculateTotals(coursesWithFaculties)
  const totalRow = row(totals, { ignoreFilters: true, ignoreSorting: true })
  return (
    <div className="languagecenterview">
      <Divider horizontal>Language center statistics</Divider>
      <div className="options-container">
        <div className="datepicker-container">
          <div className="calendar-icon-container">
            <Icon size="huge" name="calendar alternate outline" />
          </div>
          <div className="datepicker-acual-container">
            <b>From</b>
            <DateTimeSelector onChange={value => setDates({ ...dates, startDate: value })} value={dates.startDate} />
            <b>Until</b>
            <DateTimeSelector onChange={value => setDates({ ...dates, endDate: value })} value={dates.endDate} />
          </div>
        </div>
        <div className="completion-container">
          <div className="completion-icon-container" />
          <b className="options-header">Course completion</b>
          <div className="completion-acual-container" />
          <div>
            <Radio
              name="modeRadioGroup"
              value="notCompleted"
              label="Not completed"
              onChange={() => setMode('notCompleted')}
              checked={mode === 'notCompleted'}
            />
          </div>
          <div>
            <Radio
              name="modeRadioGroup"
              value="completed"
              label="Completed"
              onChange={() => setMode('completed')}
              checked={mode === 'completed'}
            />
          </div>
          <div>
            <Radio
              name="modeRadioGroup"
              value="total"
              label="Both"
              onChange={() => setMode('total')}
              checked={mode === 'total'}
            />
          </div>
        </div>
      </div>
      <div className="languagecenter-table">
        <SortableTable
          columns={getColumns(getTextIn, faculties, mode)}
          data={[totalRow, ...coursesWithFaculties]}
          stretch
        />
      </div>
    </div>
  )
}

export default LanguageCenterView
