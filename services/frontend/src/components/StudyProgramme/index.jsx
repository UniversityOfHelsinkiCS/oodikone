import React, { useCallback, useEffect, useState } from 'react'
import { useHistory, withRouter } from 'react-router-dom'
import { connect, useDispatch, useSelector } from 'react-redux'
import { Header, Segment, Tab, Label, Menu } from 'semantic-ui-react'
import { useGetAuthorizedUserQuery } from 'redux/auth'
import DegreeCoursesTable from './DegreeCourses'
import StudyProgrammeSelector from './StudyProgrammeSelector'
import BasicOverview from './BasicOverview'
import StudytrackOverview from './StudytrackOverview'
import ProgrammeCoursesOverview from './programmeCoursesOverview'
import UpdateView from './UpdateView'
import '../PopulationQueryCard/populationQueryCard.css'
import { getTextIn } from '../../common'
import { useTabs, useTitle } from '../../common/hooks'
import TSA from '../../common/tsa'
import Tags from './Tags'

import { getProgrammes } from '../../redux/populationProgrammes'

import useLanguage from '../LanguagePicker/useLanguage'

const StudyProgramme = props => {
  const dispatch = useDispatch()
  const history = useHistory()
  const programmes = useSelector(state => state.populationProgrammes?.data?.programmes)
  const { language } = useLanguage()
  const { isAdmin, rights } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduated, setGraduated] = useState(false)

  useTitle('Study programmes')

  useEffect(() => {
    dispatch(getProgrammes())
  }, [])

  const getPanes = () => {
    const { match } = props
    const { studyProgrammeId } = match.params
    const panes = []
    panes.push({
      menuItem: 'Basic information',
      render: () => (
        <BasicOverview
          studyprogramme={studyProgrammeId}
          history={history}
          specialGroups={specialGroups}
          setSpecialGroups={setSpecialGroups}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
        />
      ),
    })
    panes.push({
      menuItem: 'Studytracks and student populations',
      render: () => (
        <StudytrackOverview
          studyprogramme={studyProgrammeId}
          history={history}
          specialGroups={specialGroups}
          setSpecialGroups={setSpecialGroups}
          graduated={graduated}
          setGraduated={setGraduated}
        />
      ),
    })
    panes.push({
      menuItem: (
        <Menu.Item key="Programme courses">
          Programme courses
          <Label color="green">New!</Label>
        </Menu.Item>
      ),
      render: () => (
        <ProgrammeCoursesOverview
          academicYear={academicYear}
          studyProgramme={studyProgrammeId}
          setAcademicYear={setAcademicYear}
        />
      ),
    })

    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <UpdateView studyprogramme={studyProgrammeId} />,
      })
    }

    if (isAdmin || rights.includes(studyProgrammeId)) {
      panes.push({
        menuItem: 'Degree Courses',
        render: () => <DegreeCoursesTable studyProgramme={studyProgrammeId} />,
      })
      panes.push({
        menuItem: 'Tags',
        render: () => <Tags studyprogramme={studyProgrammeId} />,
      })
    }
    return panes
  }

  const handleSelect = useCallback(
    programme => {
      history.push(`/study-programme/${programme}`, { selected: programme })
    },
    [history]
  )

  const { match } = props
  const { studyProgrammeId } = match.params
  const programmeName = programmes?.[studyProgrammeId] && getTextIn(programmes?.[studyProgrammeId].name, language)
  const panes = getPanes()

  useEffect(() => {
    if (!programmeName) {
      return
    }

    TSA.Matomo.sendEvent('Programme Usage', 'study programme overview', programmeName)
    TSA.Influx.sendEvent({
      group: 'Programme Usage',
      name: 'study programme overview',
      label: programmeName,
      value: 1,
    })
  }, [programmeName])

  if (!studyProgrammeId)
    return (
      <div className="segmentContainer">
        <Header className="segmentTitle" size="large">
          Study Programme
        </Header>
        <Segment className="contentSegment">
          <StudyProgrammeSelector handleSelect={handleSelect} selected={studyProgrammeId !== undefined} />
        </Segment>
      </div>
    )

  return (
    <div className="segmentContainer">
      <Segment className="contentSegment">
        <div align="center" style={{ padding: '30px' }}>
          <Header textAlign="center">{programmeName}</Header>
          <span>{studyProgrammeId}</span>
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}

export default connect()(withRouter(StudyProgramme))
