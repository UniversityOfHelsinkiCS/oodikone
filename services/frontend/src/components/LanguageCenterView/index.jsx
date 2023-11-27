import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Loader, Tab } from 'semantic-ui-react'

import { useHistory } from 'react-router-dom'

import { useTabs, useTitle } from 'common/hooks'
import { useGetLanguageCenterDataQuery } from 'redux/languageCenterView'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetSemestersQuery } from 'redux/semesters'
import { FacultiesTab } from './FacultiesTab/index'
import { SemestersTab } from './SemestersTab/index'
import { LanguageCenterContext } from './common'
import { InfoBox } from './InfoBox'
import './index.css'

export const LanguageCenterView = () => {
  useTitle('Language center view')
  const semestersQuery = useGetSemestersQuery()
  const semesters =
    semestersQuery.isSuccess &&
    semestersQuery.data?.semesters &&
    Object.values(semestersQuery.data.semesters).filter(
      // 135 = Fall 2017
      sem => sem.semestercode >= 135 && new Date(sem.startdate).getFullYear() <= new Date().getFullYear()
    )
  const facultyQuery = useGetFacultiesQuery()

  const facultyMap = useMemo(
    () =>
      facultyQuery.data?.reduce((obj, cur) => {
        obj[cur.code] = cur.name
        return obj
      }, {}),
    [facultyQuery?.data]
  )

  const { data, isFetchingOrLoading, isError } = useGetLanguageCenterDataQuery()

  const [numberMode, setNumberMode] = useState('completions')
  const [colorMode, setColorMode] = useState('none')
  const [semesterFilter, setSemesterFilter] = useState(null)
  const [filterEmptyCourses, setFilterEmptyCourses] = useState(true)
  const history = useHistory()
  const [tab, setTab] = useTabs('languagecenter_tab', 0, history)

  const selectedSemesters = useMemo(() => {
    const selectedSemestersArray = []
    if (semesterFilter?.start && semesterFilter?.end) {
      for (let i = parseInt(semesterFilter.start, 10); i <= parseInt(semesterFilter.end, 10); i++) {
        selectedSemestersArray.push(i)
      }
    }

    return [...new Set(selectedSemestersArray)]
  }, [semesterFilter])

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

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>
  if (!data || isFetchingOrLoading || !semesterFilter || !semesters?.length || !facultyMap)
    return <Loader active style={{ marginTop: '15em' }} />

  const settingsContext = {
    semesterFilter,
    setSemesterFilter,
    numberMode,
    setNumberMode,
    semesters,
    colorMode,
    setColorMode,
    selectedSemesters,
    data,
    facultyMap,
    filterEmptyCourses,
    setFilterEmptyCourses,
  }

  return (
    <LanguageCenterContext.Provider value={settingsContext}>
      <div className="languagecenterview">
        <Divider horizontal>Language center statistics</Divider>
        <InfoBox />
        <div className="languagecenter-table">
          <Tab panes={getPanes()} activeIndex={tab} onTabChange={setTab} />
        </div>
      </div>
    </LanguageCenterContext.Provider>
  )
}
