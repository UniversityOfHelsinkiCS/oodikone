import React, { useEffect, useState } from 'react'
import { Divider, Icon, Button, Loader, Tab } from 'semantic-ui-react'
import './index.css'
import { useGetSemestersQuery } from 'redux/semesters'
import { useHistory } from 'react-router-dom'
import { useTabs } from 'common/hooks'
import { CompletionPicker, SemesterSelector } from './selectorComponents'
import { FacultiesTab } from './FacultiesTab'

const LanguageCenterView = () => {
  const semesterQuery = useGetSemestersQuery()
  const semesters =
    semesterQuery.isSuccess &&
    semesterQuery.data?.semesters &&
    Object.values(semesterQuery.data.semesters).filter(
      sem => sem.semestercode >= 134 && new Date(sem.startdate).getFullYear() <= new Date().getFullYear()
    )

  const [mode, setMode] = useState('total')
  const [dates, setDates] = useState(null)
  const [filters, setFilters] = useState({ mode, ...dates })

  const history = useHistory()
  const [tab, setTab] = useTabs('lc_tab', 0, history)

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

  const getPanes = () => {
    return [
      {
        menuItem: 'By faculties',
        render: () => <FacultiesTab filters={filters} dates={dates} semesters={semesters} />,
      },
      {
        menuItem: 'By semesters',
        render: () => <FacultiesTab filters={filters} dates={dates} semesters={semesters} />,
      },
    ]
  }

  if (!dates || !semesters) {
    return <Loader />
  }

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
            {semesters && (
              <SemesterSelector
                allSemesters={semesters?.filter(s => {
                  return dates.startDate.semestercode <= s.semestercode
                })}
                setSemester={semester => setDates({ ...dates, endDate: semester })}
                semester={dates?.endDate}
              />
            )}
          </div>
        </div>
        <CompletionPicker setMode={setMode} mode={mode} />
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
        <Tab panes={getPanes()} activeIndex={tab} onTabChange={setTab} />
      </div>
    </div>
  )
}

export default LanguageCenterView
