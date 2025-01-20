import { useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router'
import { Container, Header, Menu, Segment, Tab } from 'semantic-ui-react'

import { getFullStudyProgrammeRights, getUnifiedProgrammeName, isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useSemanticTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { BasicOverview } from './BasicOverview'
import { DegreeCoursesTable } from './DegreeCourses'
import { ProgrammeCourses } from './ProgrammeCourses'
import { StudyProgrammeSelector } from './StudyProgrammeSelector'
import { StudyTrackOverview } from './StudyTrackOverview'
import { Tags } from './Tags'
import { UpdateView } from './UpdateView'

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
  const navigate = useNavigate()
  const location = useLocation()
  const { studyProgrammeId } = useParams()
  const { data: programmes } = useGetProgrammesQuery()
  const { language, getTextIn } = useLanguage()
  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const replace = useCallback(options => navigate(options, { replace: true }), [navigate])
  const [tab, setTab] = useSemanticTabs('p_tab', 0, { location, replace })
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroupsExcluded, setSpecialGroupsExcluded] = useState(false)
  const [graduated, setGraduated] = useState(false)
  useTitle('Study programmes')

  if (!studyProgrammeId) {
    return (
      <Container>
        <Header className="segmentTitle" size="large">
          Study programmes
        </Header>
        <StudyProgrammeSelector />
      </Container>
    )
  }

  const programmeId =
    studyProgrammeId && studyProgrammeId.includes('+') ? studyProgrammeId.split('+')[0] : studyProgrammeId
  const secondProgrammeId = studyProgrammeId && studyProgrammeId.includes('+') ? studyProgrammeId.split('+')[1] : ''

  const getPanes = () => {
    const panes = []
    panes.push({
      menuItem: 'Basic information',
      render: () => (
        <BasicOverview
          academicYear={academicYear}
          combinedProgramme={secondProgrammeId}
          setAcademicYear={setAcademicYear}
          setSpecialGroupsExcluded={setSpecialGroupsExcluded}
          specialGroupsExcluded={specialGroupsExcluded}
          studyprogramme={programmeId}
        />
      ),
    })
    panes.push({
      menuItem: 'Study tracks and class statistics',
      render: () => (
        <StudyTrackOverview
          combinedProgramme={secondProgrammeId}
          graduated={graduated}
          setGraduated={setGraduated}
          setSpecialGroupsExcluded={setSpecialGroupsExcluded}
          specialGroupsExcluded={specialGroupsExcluded}
          studyProgramme={programmeId}
        />
      ),
    })

    if (
      fullAccessToStudentData ||
      fullStudyProgrammeRights.includes(programmeId) ||
      fullStudyProgrammeRights.includes(secondProgrammeId)
    ) {
      if (isDefaultServiceProvider()) {
        panes.push({
          menuItem: <Menu.Item key="Programme courses">Programme courses</Menu.Item>,
          render: () => (
            <ProgrammeCourses
              academicYear={academicYear}
              combinedProgramme={secondProgrammeId}
              setAcademicYear={setAcademicYear}
              studyProgramme={programmeId}
            />
          ),
        })
      }
      panes.push({
        menuItem: 'Degree courses',
        render: () => (
          <DegreeCoursesTable
            combinedProgramme={secondProgrammeId}
            studyProgramme={programmeId}
            year={`${new Date().getFullYear()}`}
          />
        ),
      })
      panes.push({
        menuItem: 'Tags',
        render: () => <Tags combinedProgramme={secondProgrammeId} studyprogramme={programmeId} />,
      })
    }
    if (isAdmin) {
      panes.push({
        menuItem: 'Update statistics',
        render: () => <UpdateView combinedProgramme={secondProgrammeId} studyProgramme={programmeId} />,
      })
    }
    return panes
  }

  const programmeName = createName(programmeId, secondProgrammeId, programmes, language, getTextIn)
  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId
  const panes = getPanes()

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
        <Tab activeIndex={tab} onTabChange={setTab} panes={panes} />
      </Segment>
    </div>
  )
}
