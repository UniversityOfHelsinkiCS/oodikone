import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'
import { useParams } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { PageTitle } from '@/components/common/PageTitle'
import { GetTextIn, useLanguage } from '@/components/LanguagePicker/useLanguage'
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
  combibedProgrammeId: string | undefined,
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
  if (programmeLetterId) {
    if (secondProgrammeLetterId) {
      return `${programmeLetterId}+${secondProgrammeLetterId} - ${programmeId}`
    }

    return `${programmeLetterId} - ${programmeId}`
  }
  return programmeId
}

export const StudyProgramme = () => {
  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const { language, getTextIn } = useLanguage()
  const { studyProgrammeId } = useParams()

  const [currentTab, setCurrentTab] = useTabs(5 + Number(isAdmin))
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroupsExcluded, setSpecialGroupsExcluded] = useState(false)
  const [graduated, setGraduated] = useState(false)

  const { data: programmes } = useGetProgrammesQuery()

  const [programmeId, secondProgrammeId] = [...(studyProgrammeId?.split('+') ?? []), '', '']

  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId
  const programmeName = getProgrammeName(programmeId, secondProgrammeId, programmes, language, getTextIn)

  useTitle(programmeName ? `${programmeName} - Degree programmes` : 'Degree programmes')
  if (!studyProgrammeId || !programmeId) return <StudyProgrammeSelector />
  if (!programmes) return null

  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const otherTabsVisible: boolean =
    !!fullAccessToStudentData ||
    fullStudyProgrammeRights.includes(programmeId) ||
    fullStudyProgrammeRights.includes(secondProgrammeId)

  const tabs = [
    {
      key: 'BasicInformationTab',
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
        label: 'Degree courses',
        component: (
          <DegreeCoursesTab
            combinedProgramme={secondProgrammeId}
            degreeProgramme={programmeId}
            key="DegreeCoursesTabContent"
            year={`${new Date().getFullYear()}`}
          />
        ),
      },
      {
        key: 'TagsTab',
        label: 'Tags',
        component: <TagsTab combinedProgramme={secondProgrammeId} key="TagsTabContent" studyProgramme={programmeId} />,
      }
    )
  }

  if (isAdmin) {
    tabs.push({
      key: 'UpdateStatisticsTab',
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
          onChange={(_, newTab) => setCurrentTab(newTab)}
          value={currentTab}
          variant="scrollable"
        >
          {tabs.map(tab => (
            <Tab data-cy={tab.key} key={tab.key} label={tab.label} />
          ))}
        </Tabs>
        {tabs.at(currentTab)?.component ?? null}
      </Stack>
    </Container>
  )
}
