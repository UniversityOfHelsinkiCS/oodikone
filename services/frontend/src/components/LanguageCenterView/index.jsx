import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Dropdown, Icon, Loader, Radio, Button } from 'semantic-ui-react'
import SortableTable, { row } from 'components/SortableTable'
import useLanguageCenterData from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'
import moment from 'moment'
import { useGetSemestersQuery } from 'redux/semesters'
import { useGetFacultiesQuery } from 'redux/facultyStats'

const shorten = (text, maxLength) => (text.length > maxLength ? `${text.substring(0, maxLength)} ... ` : text)

const getColumns = (getTextIn, faculties, mode, facultyMap) => {
  const columns = [
    {
      key: 'course-name',
      title: 'Course',
      getRowVal: row => row.code ?? 'No faculty found because enrollment date missing.',
      getRowContent: row => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <b>{row.code ?? 'No faculty'}</b>
          <i style={{ color: 'gray', fontWeight: 'normal' }}>{row.name && shorten(getTextIn(row.name), 60)}</i>
        </div>
      ),
    },
    ...faculties.map(facultyCode => ({
      key: facultyCode ?? 'no-faculty',
      title: facultyCode ?? 'No faculty',
      headerProps: { title: getTextIn(facultyMap[facultyCode]) },
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

const filterAttemptsByDates = (date, { startDate, endDate }) => {
  const start = startDate.startdate ?? moment(new Date('1900-1-1'))
  const end = endDate.enddate ?? moment(new Date('2100-01-01'))
  return moment(new Date(date)).isBetween(start, end)
}

const LanguageCenterView = () => {
  const facultyQuery = useGetFacultiesQuery()
  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const { data: rawData, isFetchingOrLoading, isError } = useLanguageCenterData()
  const { getTextIn } = useLanguage()
  const [mode, setMode] = useState('total')
  const semesterQuery = useGetSemestersQuery()
  const semesters =
    semesterQuery.isSuccess &&
    semesterQuery.data?.semesters &&
    Object.values(semesterQuery.data.semesters).filter(
      sem => sem.semestercode >= 133 && new Date(sem.startdate).getFullYear() <= new Date().getFullYear()
    )
  const [dates, setDates] = useState(null)
  const [filters, setFilters] = useState({ mode, ...dates })
  const [faculties, setFaculties] = useState([])

  useEffect(() => {
    if (!dates && semesters)
      setDates({
        startDate: semesters[0],
        endDate: semesters[semesters.length - 1],
      })
    if (!filters.startDate || !filters.endDate) {
      setFilters({ ...filters, startDate: semesters[0], endDate: semesters[semesters.length - 1] })
    }
  }, [semesters])

  const filterFaculties = data => {
    return {
      ...data,
      attempts: data.attempts.filter(attempt => !attempt.faculty || attempt.faculty?.substring(0, 3).match(`^H\\d`)),
    }
  }

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
  if (isFetchingOrLoading || !rawData) return <Loader active style={{ marginTop: '15em' }} />

  return (
    <div className="languagecenterview">
      <Divider horizontal>Language center statistics</Divider>
      <div className="options-container">
        <div className="datepicker-container">
          <div className="calendar-icon-container">
            <Icon size="big" name="calendar alternate outline" />
          </div>
          <div className="datepicker-acual-container">
            <b>From</b>
            <SemesterSelector
              setSemester={semester => setDates({ ...dates, startDate: semester })}
              semester={dates.startDate}
              allSemesters={semesters}
            />
            <b>Until</b>
            <SemesterSelector
              allSemesters={semesters.filter(s => {
                return dates.startDate.semestercode <= s.semestercode
              })}
              setSemester={semester => setDates({ ...dates, endDate: semester })}
              semester={dates.endDate}
            />
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
              label="Enrolled but not passed"
              onChange={() => setMode('notCompleted')}
              checked={mode === 'notCompleted'}
            />
          </div>
          <div>
            <Radio
              name="modeRadioGroup"
              value="completed"
              label="Passed"
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
        <div className="button-container">
          <Button
            disabled={
              filters.startDate === dates.startDate && filters.endDate === dates.endDate && filters.mode === mode
            }
            onClick={() => setFilters({ mode, ...dates })}
            color="green"
          >
            Apply filters
          </Button>
        </div>
      </div>
      <div className="languagecenter-table">
        <SortableTable columns={getColumns(getTextIn, faculties, filters.mode, facultyMap)} data={tableData} stretch />
      </div>
    </div>
  )
}

const SemesterSelector = ({ allSemesters, semester, setSemester }) => {
  const { getTextIn } = useLanguage()
  const currentValue =
    allSemesters.find(({ semestercode }) => semester.semestercode === semestercode) ?? allSemesters[0]
  const options = useMemo(
    () => allSemesters.map(s => ({ key: s.semestercode, text: getTextIn(s.name), value: s.semestercode })),
    [allSemesters]
  )

  return (
    <div>
      <Dropdown
        onChange={(_, { value }) => setSemester(allSemesters.find(({ semestercode }) => semestercode === value))}
        value={currentValue.semestercode}
        options={options}
      />
    </div>
  )
}

export default LanguageCenterView
