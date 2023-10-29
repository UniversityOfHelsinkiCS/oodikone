import React, { useEffect, useState } from 'react'
import { Divider, Loader, Tab } from 'semantic-ui-react'
import './index.css'
import { useGetSemestersQuery } from 'redux/semesters'
import { useHistory } from 'react-router-dom'
import { useTabs } from 'common/hooks'
import { FacultiesTab } from './FacultiesTab/index'
import { SemestersTab } from './SemestersTab/index'
import { LanguageCenterContext } from './common'

const LanguageCenterView = () => {
  const semestersQuery = useGetSemestersQuery()
  const semesters =
    semestersQuery.isSuccess &&
    semestersQuery.data?.semesters &&
    Object.values(semestersQuery.data.semesters).filter(
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
        render: () => <FacultiesTab />,
      },
      {
        menuItem: 'By semesters',
        render: () => <SemestersTab />,
      },
    ]
  }

  if (!dates || !semesters) {
    return <Loader />
  }

  const settingsContext = {
    filters,
    setFilters,
    dates,
    setDates,
    mode,
    setMode,
    semesters,
  }

  return (
    <LanguageCenterContext.Provider value={settingsContext}>
      <div className="languagecenterview">
        <Divider horizontal>Language center statistics</Divider>
        <div className="languagecenter-table">
          <Tab panes={getPanes()} activeIndex={tab} onTabChange={setTab} />
        </div>
      </div>
    </LanguageCenterContext.Provider>
  )
}

export default LanguageCenterView
