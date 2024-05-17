import { useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Container, Header, Menu, Segment, Tab } from 'semantic-ui-react'

import { getFullStudyProgrammeRights, getUnifiedProgrammeName } from '@/common'
import { useTabs, useTitle } from '@/common/hooks'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetProgressCriteriaQuery } from '@/redux/programmeProgressCriteria'
import { BasicOverview } from './BasicOverview'
import { DegreeCoursesTable } from './DegreeCourses'
import { ProgrammeCourses } from './ProgrammeCourses'
import { StudyProgrammeSelector } from './StudyProgrammeSelector'
import { StudytrackOverview } from './StudytrackOverview'
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
  const history = useHistory()
  const { studyProgrammeId } = useParams()
  const { data: programmesAndStudyTracks } = useGetProgrammesQuery()
  const programmes = programmesAndStudyTracks?.programmes
  const progressCriteria = useGetProgressCriteriaQuery({ programmeCode: studyProgrammeId })
  const { language, getTextIn } = useLanguage()
  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
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
          academicYear={academicYear}
          combinedProgramme={secondProgrammeId}
          setAcademicYear={setAcademicYear}
          setSpecialGroups={setSpecialGroups}
          specialGroups={specialGroups}
          studyprogramme={programmeId}
        />
      ),
    })
    panes.push({
      menuItem: 'Studytracks and class statistics',
      render: () => (
        <StudytrackOverview
          combinedProgramme={secondProgrammeId}
          graduated={graduated}
          setGraduated={setGraduated}
          setSpecialGroups={setSpecialGroups}
          specialGroups={specialGroups}
          studyprogramme={programmeId}
        />
      ),
    })

    if (
      fullAccessToStudentData ||
      fullStudyProgrammeRights.includes(programmeId) ||
      fullStudyProgrammeRights.includes(secondProgrammeId)
    ) {
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
      panes.push({
        menuItem: 'Degree courses',
        render: () => (
          <DegreeCoursesTable
            combinedProgramme={secondProgrammeId}
            criteria={criteria}
            setCriteria={setCriteria}
            studyProgramme={programmeId}
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
        render: () => <UpdateView combinedProgramme={secondProgrammeId} studyprogramme={programmeId} />,
      })
    }
    return panes
  }

  const programmeName = createName(programmeId, secondProgrammeId, programmes, language, getTextIn)
  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId
  const panes = getPanes()

  if (!studyProgrammeId) {
    return (
      <Container>
        <Header className="segmentTitle" size="large">
          Study programmes
        </Header>
        <StudyProgrammeSelector selected={studyProgrammeId !== undefined} />
      </Container>
    )
  }

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
