import React, { useCallback, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Header, Segment, Tab, Menu } from 'semantic-ui-react'

import { useGetAuthorizedUserQuery } from 'redux/auth'
import { useGetProgressCriteriaQuery } from 'redux/programmeProgressCriteria'
import { getProgrammes } from 'redux/populationProgrammes'
import { getUnifiedProgrammeName } from 'common'
import { useTabs, useTitle } from 'common/hooks'
import { useLanguage } from '../LanguagePicker/useLanguage'
import { DegreeCoursesTable } from './DegreeCourses'
import { ConnectedStudyProgrammeSelector as StudyProgrammeSelector } from './StudyProgrammeSelector'
import { BasicOverview } from './BasicOverview'
import { StudytrackOverview } from './StudytrackOverview'
import { ProgrammeCourses } from './ProgrammeCourses'
import { UpdateView } from './UpdateView'
import '../PopulationQueryCard/populationQueryCard.css'
import { ConnectedTags as Tags } from './Tags'

const createName = (studyProgrammeId, combibedProgrammeId, programmes, language, getTextIn) => {
  if (combibedProgrammeId && programmes?.[studyProgrammeId] && programmes?.[combibedProgrammeId])
    return getUnifiedProgrammeName(
      getTextIn(programmes?.[studyProgrammeId].name),
      getTextIn(programmes?.[combibedProgrammeId].name),
      language
    )
  return programmes?.[studyProgrammeId] && getTextIn(programmes?.[studyProgrammeId].name)
}

export const StudyProgramme = () => {
  const dispatch = useDispatch()
  const history = useHistory()
  const { studyProgrammeId } = useParams()
  const programmes = useSelector(state => state.populationProgrammes?.data?.programmes)
  const progressCriteria = useGetProgressCriteriaQuery({ programmeCode: studyProgrammeId })
  const { language, getTextIn } = useLanguage()
  const { isAdmin, rights } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs('p_tab', 0, history)
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduated, setGraduated] = useState(false)
  const emptyCriteria = {
    courses: { yearOne: [], yearTwo: [], yearThree: [] },
    credits: { yearOne: 0, yearTwo: 0, yearThree: 0 },
  }
  const [criteria, setCriteria] = useState(progressCriteria?.data ? progressCriteria.data : emptyCriteria)
  useTitle('Study programmes')

  useEffect(() => {
    dispatch(getProgrammes())
  }, [])

  useEffect(() => {
    if (progressCriteria.data) {
      setCriteria(progressCriteria.data)
    }
  }, [progressCriteria.data])

  const programmeId =
    studyProgrammeId && studyProgrammeId.includes('+') ? studyProgrammeId.split('+')[0] : studyProgrammeId
  const secondProgrammeId = studyProgrammeId && studyProgrammeId.includes('+') ? studyProgrammeId.split('+')[1] : ''

  const getPanes = () => {
    const panes = []
    panes.push({
      menuItem: 'Basic information',
      render: () => (
        <BasicOverview
          studyprogramme={programmeId}
          history={history}
          specialGroups={specialGroups}
          setSpecialGroups={setSpecialGroups}
          academicYear={academicYear}
          setAcademicYear={setAcademicYear}
          combinedProgramme={secondProgrammeId}
        />
      ),
    })
    panes.push({
      menuItem: 'Studytracks and class statistics',
      render: () => (
        <StudytrackOverview
          studyprogramme={programmeId}
          history={history}
          specialGroups={specialGroups}
          setSpecialGroups={setSpecialGroups}
          graduated={graduated}
          setGraduated={setGraduated}
          combinedProgramme={secondProgrammeId}
        />
      ),
    })

    if (isAdmin || rights.includes(programmeId) || rights.includes(secondProgrammeId)) {
      panes.push({
        menuItem: <Menu.Item key="Programme courses">Programme courses</Menu.Item>,
        render: () => (
          <ProgrammeCourses
            academicYear={academicYear}
            studyProgramme={programmeId}
            setAcademicYear={setAcademicYear}
            combinedProgramme={secondProgrammeId}
          />
        ),
      })
      panes.push({
        menuItem: 'Degree courses',
        render: () => (
          <DegreeCoursesTable
            studyProgramme={programmeId}
            combinedProgramme={secondProgrammeId}
            criteria={criteria}
            setCriteria={setCriteria}
          />
        ),
      })
      panes.push({
        menuItem: 'Tags',
        render: () => <Tags studyprogramme={programmeId} combinedProgramme={secondProgrammeId} />,
      })
    }
    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <UpdateView studyprogramme={programmeId} combinedProgramme={secondProgrammeId} />,
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

  const programmeName = createName(programmeId, secondProgrammeId, programmes, language, getTextIn)
  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId
  const panes = getPanes()

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
          <span>
            {programmeLetterId ? `${programmeLetterId} - ` : ''} {programmeId}
          </span>
          <br />
          {secondProgrammeId && (
            <span>
              {secondProgrammeLetterId ? `${secondProgrammeLetterId} - ` : ''} {secondProgrammeId}
            </span>
          )}
        </div>
        <Tab panes={panes} activeIndex={tab} onTabChange={setTab} />
      </Segment>
    </div>
  )
}
