import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Dropdown, Icon, Loader, Radio, Button } from 'semantic-ui-react'
import SortableTable from 'components/SortableTable'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import './index.css'
import useLanguage from 'components/LanguagePicker/useLanguage'
import { useGetSemestersQuery } from 'redux/semesters'
import { filterAttemptsByDates, getColumns, getCourseMapWithSemesters } from './dataprocessingTime'

const LanguageCenterViewTime = () => {
  const { data: rawData, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()
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

    const courseMap = getCourseMapWithSemesters(data.attempts, semesters)
    return data.courses.map(c => ({ ...c, semesterStats: courseMap[c.code] })).filter(course => course.semesterStats)
  }, [rawData, filters])

  // eslint-disable-next-line no-console
  console.log({ semesters, rawData, tableData })

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (isFetchingOrLoading || !rawData || !dates || !semesters) return <Loader active style={{ marginTop: '15em' }} />
  if (!semesters) return null
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
              setSemester={semester => {
                setDates({
                  endDate: dates.endDate.semestercode < semester.semestercode ? semester : dates.endDate,
                  startDate: semester,
                })
              }}
              semester={dates?.startDate}
              allSemesters={semesters}
            />
            <b>Until</b>
            <SemesterSelector
              allSemesters={semesters?.filter(s => {
                return dates.startDate.semestercode <= s.semestercode
              })}
              setSemester={semester => setDates({ ...dates, endDate: semester })}
              semester={dates?.endDate}
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
        <SortableTable columns={getColumns(getTextIn, semesters, filters.mode)} data={tableData} stretch />
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

export default LanguageCenterViewTime
