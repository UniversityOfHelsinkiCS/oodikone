import React, { useCallback, useEffect, useState } from 'react'
import { withRouter, useHistory } from 'react-router-dom'
import { Segment, Header, Tab, Loader } from 'semantic-ui-react'
import { useGetFacultiesQuery } from 'redux/facultyStats'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import { getTextIn } from 'common'
import { useTabs, useTitle } from '../../common/hooks'
import FacultySelector from './facultySelector'
import BasicOverview from './BasicOverview'
import ProgrammeOverview from './FacultyProgrammeOverview'
import TimesAndPathsView from './TimesAndPaths'
import UpdateView from './UpdateView'
import useLanguage from '../LanguagePicker/useLanguage'
import TSA from '../../common/tsa'

const FacultyStatistics = props => {
  useTitle('Faculties')
  const history = useHistory()
  const { language } = useLanguage()
  const allFaculties = useGetFacultiesQuery()
  const faculties = allFaculties?.data

  const { match } = props
  const { facultyCode } = match.params
  const faculty = faculties && facultyCode && faculties.find(f => f.code === facultyCode)
  const facultyName = faculty && getTextIn(faculty.name, language)

  const { isAdmin } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [studyProgrammes, setStudyProgrammes] = useState(false)

  useEffect(() => {
    if (!facultyName) {
      return
    }

    TSA.Matomo.sendEvent('Faculty Usage', 'faculty overview', facultyName)
    TSA.Influx.sendEvent({
      group: 'Faculty Usage',
      name: 'faculty overview',
      label: facultyName,
      value: 1,
    })
  }, [facultyName])

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
            faculty={faculty}
            academicYear={academicYear}
            setAcademicYear={setAcademicYear}
            studyProgrammes={studyProgrammes}
            setStudyProgrammes={setStudyProgrammes}
            language={language}
          />
        ),
      },
      {
        menuItem: 'Programmes and student populations',
        render: () => (
          <ProgrammeOverview
            faculty={faculty}
            studyProgrammes={studyProgrammes}
            setStudyProgrammes={setStudyProgrammes}
          />
        ),
      },
    ]

    if (isAdmin) {
      panes.push({
        menuItem: 'Graduation times',
        render: () => (
          <TimesAndPathsView
            faculty={faculty}
            studyProgrammes={studyProgrammes}
            setStudyProgrammes={setStudyProgrammes}
          />
        ),
      })
    }

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
          <FacultySelector faculties={faculties} selected={facultyCode !== undefined} handleSelect={handleSelect} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{facultyName}</Header>
          <span>{facultyCode}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

export default withRouter(FacultyStatistics)
