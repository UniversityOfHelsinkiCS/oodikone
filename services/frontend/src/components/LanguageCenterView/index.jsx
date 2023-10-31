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
  const [semesterFilter, setSemesterFilter] = useState(null)
  const history = useHistory()
  const [tab, setTab] = useTabs('languagecenter_tab', 0, history)

  useEffect(() => {
    if (!semesters?.length) return
    if (!semesterFilter)
      setSemesterFilter({
        start: semesters[0].semestercode,
        end: semesters[semesters.length - 1].semestercode,
      })
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

  if (!semesterFilter || !semesters?.length) {
    return <Loader />
  }

  const settingsContext = {
    semesterFilter,
    setSemesterFilter,
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
