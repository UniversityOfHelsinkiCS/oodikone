import React, { useCallback, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Segment, Header, Tab, Loader } from 'semantic-ui-react'

import { useTabs, useTitle } from '@/common/hooks'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { BasicOverview } from './BasicOverview'
import { FacultyProgrammeOverview } from './FacultyProgrammeOverview'
import { FacultySelector } from './FacultySelector'
import { TimesAndPathsView } from './TimesAndPaths'
import { UpdateView } from './UpdateView'

export const FacultyStatistics = () => {
  useTitle('Faculties')
  const history = useHistory()
  const { facultyCode } = useParams()
  const { getTextIn } = useLanguage()
  const allFaculties = useGetFacultiesQuery()
  const faculties = allFaculties?.data

  const faculty = faculties && facultyCode && faculties.find(f => f.code === facultyCode)
  const facultyName = faculty && getTextIn(faculty.name)

  const { isAdmin, programmeRights } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [studyProgrammes, setStudyProgrammes] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const requiredRights = { isAdmin, programmeRights }

  const handleSelect = useCallback(
    faculty => {
      history.push(`/faculties/${faculty}`, { selected: faculty })
    },
    [history]
  )

  if (allFaculties.isLoading || allFaculties.isFetching) {
    return <Loader active style={{ marginTop: '10em' }} />
  }

  const getPanes = () => {
    const panes = [
      {
        menuItem: 'Basic information',
        render: () => (
          <BasicOverview
            academicYear={academicYear}
            faculty={faculty}
            setAcademicYear={setAcademicYear}
            setSpecialGroups={setSpecialGroups}
            setStudyProgrammes={setStudyProgrammes}
            specialGroups={specialGroups}
            studyProgrammes={studyProgrammes}
          />
        ),
      },
      {
        menuItem: 'Programmes and student populations',
        render: () => (
          <FacultyProgrammeOverview
            faculty={faculty}
            graduatedGroup={graduatedGroup}
            requiredRights={requiredRights}
            setGraduatedGroup={setGraduatedGroup}
            setSpecialGroups={setSpecialGroups}
            specialGroups={specialGroups}
          />
        ),
      },
      {
        menuItem: 'Graduation times',
        render: () => (
          <TimesAndPathsView
            faculty={faculty}
            setStudyProgrammes={setStudyProgrammes}
            studyProgrammes={studyProgrammes}
          />
        ),
      },
    ]

    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <UpdateView faculty={faculty?.code} />,
      })
    }

    return panes
  }

  const panes = getPanes()

  if (!facultyCode)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Faculty statistics
        </Header>
        <Segment className="contentSegment">
          <FacultySelector faculties={faculties} handleSelect={handleSelect} selected={facultyCode !== undefined} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer" data-cy="FacultySegmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{facultyName}</Header>
          <span>{facultyCode}</span>
        </div>
        <Tab activeIndex={tab} onTabChange={setTab} panes={panes} />
      </Segment>
    </div>
  )
}
