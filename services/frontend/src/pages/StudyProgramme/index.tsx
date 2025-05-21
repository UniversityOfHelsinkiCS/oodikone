import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'
import { useParams } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { GetTextIn, useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { DegreeProgramme } from '@/types/api/faculty'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'
import { Language } from '@oodikone/shared/language'
import { BasicInformationTab } from './BasicInformationTab'
import { DegreeCoursesTab } from './DegreeCoursesTab'
import { ProgrammeCoursesTab } from './ProgrammeCoursesTab'
import { StudyProgrammeSelector } from './StudyProgrammeSelector'
import { StudyTracksAndClassStatisticsTab } from './StudyTracksAndClassStatisticsTab'
import { TagsTab } from './TagsTab'
import { UpdateStatisticsTab } from './UpdateStatisticsTab'

const getProgrammeName = (
  studyProgrammeId: string | undefined,
  combibedProgrammeId: string,
  programmes: Record<string, DegreeProgramme> | undefined,
  language: Language,
  getTextIn: GetTextIn
) => {
  if (!studyProgrammeId) {
    return null
  }

  if (combibedProgrammeId && programmes?.[studyProgrammeId] && programmes?.[combibedProgrammeId]) {
    return getCombinedProgrammeName(
      getTextIn(programmes?.[studyProgrammeId].name)!,
      getTextIn(programmes?.[combibedProgrammeId].name)!,
      language
    )
  }
  return programmes?.[studyProgrammeId] && getTextIn(programmes?.[studyProgrammeId].name)
}

const getSubtitle = (programmeId: string, programmeLetterId?: string, secondProgrammeLetterId?: string) => {
  if (!programmeLetterId) {
    return programmeId
  }
  if (secondProgrammeLetterId) {
    return `${programmeLetterId}+${secondProgrammeLetterId} - ${programmeId}`
  }
  return `${programmeLetterId} - ${programmeId}`
}

export const StudyProgramme = () => {
  const { studyProgrammeId } = useParams()
  const { data: programmes } = useGetProgrammesQuery()
  const { language, getTextIn } = useLanguage()
  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const [currentTab, setCurrentTab] = useTabs(isAdmin ? 6 : 5)
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroupsExcluded, setSpecialGroupsExcluded] = useState(false)
  const [graduated, setGraduated] = useState(false)

  const programmeId = studyProgrammeId?.includes('+') ? studyProgrammeId.split('+')[0] : studyProgrammeId
  const secondProgrammeId = studyProgrammeId?.includes('+') ? studyProgrammeId.split('+')[1] : ''
  const programmeName = getProgrammeName(programmeId, secondProgrammeId, programmes, language, getTextIn)

  useTitle(programmeName ? `${programmeName} - Study programmes` : 'Study programmes')

  if (!studyProgrammeId || !programmeId) {
    return <StudyProgrammeSelector />
  }

  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId

  const otherTabsVisible: boolean =
    fullAccessToStudentData ||
    fullStudyProgrammeRights.includes(programmeId) ||
    fullStudyProgrammeRights.includes(secondProgrammeId)

  const tabs = [
    {
      key: 'BasicInformationTab',
      cypress: 'basic-information-tab',
      label: 'Basic information',
      component: (
        <BasicInformationTab
          academicYear={academicYear}
          combinedProgramme={secondProgrammeId}
          key="BasicInformationTabContent"
          setAcademicYear={setAcademicYear}
          setSpecialGroupsExcluded={setSpecialGroupsExcluded}
          specialGroupsExcluded={specialGroupsExcluded}
          studyProgramme={programmeId}
        />
      ),
    },
    {
      key: 'StudyTracksAndClassStatisticsTab',
      cypress: 'study-tracks-and-class-statistics-tab',
      label: 'Study tracks and class statistics',
      component: (
        <StudyTracksAndClassStatisticsTab
          combinedProgramme={secondProgrammeId}
          graduated={graduated}
          key="StudyTracksAndClassStatisticsTabContent"
          setGraduated={setGraduated}
          setSpecialGroupsExcluded={setSpecialGroupsExcluded}
          specialGroupsExcluded={specialGroupsExcluded}
          studyProgramme={programmeId}
        />
      ),
    },
  ]

  if (otherTabsVisible && isDefaultServiceProvider()) {
    tabs.push({
      key: 'ProgrammeCoursesTab',
      cypress: 'programme-courses-tab',
      label: 'Programme courses',
      component: (
        <ProgrammeCoursesTab
          academicYear={academicYear}
          combinedProgramme={secondProgrammeId}
          key="ProgrammeCoursesTabContent"
          setAcademicYear={setAcademicYear}
          studyProgramme={programmeId}
        />
      ),
    })
  }

  if (otherTabsVisible) {
    tabs.push(
      {
        key: 'DegreeCoursesTab',
        cypress: 'degree-courses-tab',
        label: 'Degree courses',
        component: (
          <DegreeCoursesTab
            combinedProgramme={secondProgrammeId}
            key="DegreeCoursesTabContent"
            studyProgramme={programmeId}
            year={`${new Date().getFullYear()}`}
          />
        ),
      },
      {
        key: 'TagsTab',
        cypress: 'tags-tab',
        label: 'Tags',
        component: <TagsTab combinedProgramme={secondProgrammeId} key="TagsTabContent" studyProgramme={programmeId} />,
      }
    )
  }

  if (isAdmin) {
    tabs.push({
      key: 'UpdateStatisticsTab',
      cypress: 'update-statistics-tab',
      label: 'Update statistics',
      component: (
        <UpdateStatisticsTab
          combinedProgramme={secondProgrammeId}
          key="UpdateStatisticsTabContent"
          studyProgramme={programmeId}
        />
      ),
    })
  }

  return (
    <Container maxWidth="lg">
      <PageTitle
        subtitle={getSubtitle(studyProgrammeId, programmeLetterId, secondProgrammeLetterId)}
        title={programmeName}
      />
      <Stack gap={2}>
        <Tabs
          data-cy="study-programme-tabs"
          onChange={(_event, newTab) => setCurrentTab(newTab)}
          value={currentTab}
          variant="scrollable"
        >
          {tabs.map(tab => (
            <Tab data-cy={tab.cypress} key={tab.key} label={tab.label} />
          ))}
        </Tabs>
        {tabs.map(tab => currentTab === tabs.indexOf(tab) && tab.component)}
      </Stack>
    </Container>
  )
}
