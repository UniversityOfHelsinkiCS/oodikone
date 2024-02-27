import React, { useEffect, useMemo, useState } from 'react'
import { Divider, Loader, Tab } from 'semantic-ui-react'

import { getCurrentSemester } from '@/common'
import { useTitle } from '@/common/hooks'
import { useGetSemestersQuery } from '@/redux/semesters'
import { ColorizedCoursesTableContext } from './common'
import { FacultiesTab } from './FacultiesTab'
import { SemestersTab } from './SemestersTab'
import './index.css'

export const ColorizedCoursesTable = ({ fetchDataHook, studyProgramme, title, panes, infoBox, dividerText }) => {
  useTitle(title)
  const { data: semesterData } = useGetSemestersQuery()
  const currentSemester = semesterData && getCurrentSemester(semesterData.semesters)
  const semesters =
    semesterData &&
    Object.values(semesterData.semesters).filter(
      // 135 = Fall 2017
      sem => sem.semestercode >= 135 && sem.semestercode <= currentSemester.semestercode
    )

  const { data, isFetching, isLoading, isError } = fetchDataHook({ id: studyProgramme })

  const [numberMode, setNumberMode] = useState('completions')
  const [colorMode, setColorMode] = useState('none')
  const [semesterFilter, setSemesterFilter] = useState(null)
  const [filterEmptyCourses, setFilterEmptyCourses] = useState(true)

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

  const possiblePanes = [
    {
      name: 'Faculties',
      menuItem: 'By faculties',
      render: () => <FacultiesTab />,
    },
    {
      name: 'Semesters',
      menuItem: 'By semesters',
      render: () => <SemestersTab />,
    },
  ]

  const displayedPanes = panes.map(tab => possiblePanes.find(t => t.name === tab))

  if (isError) return <h3>Something went wrong, please try refreshing the page.</h3>

  if (!data || isFetching || isLoading || !semesterFilter || !semesters?.length) {
    return <Loader active style={{ marginTop: '15em' }} />
  }

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
    filterEmptyCourses,
    setFilterEmptyCourses,
  }

  return (
    <ColorizedCoursesTableContext.Provider value={settingsContext}>
      <div className="colorized-courses-table">
        {dividerText && (
          <Divider style={{ marginTop: '3em' }} horizontal>
            {dividerText}
          </Divider>
        )}
        {infoBox}
        {displayedPanes.length === 1 ? displayedPanes[0].render() : <Tab panes={displayedPanes} />}
      </div>
    </ColorizedCoursesTableContext.Provider>
  )
}
