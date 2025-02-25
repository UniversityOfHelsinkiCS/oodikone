import { Container, Stack, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProgrammesQuery } from '@/redux/populations'
import { Language } from '@/shared/language'
import { getFullStudyProgrammeRights } from '@/util/access'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'
import { BasicInformationTab } from './BasicInformationTab'
import { DegreeCoursesTab } from './DegreeCoursesTab'
import { ProgrammeCoursesTab } from './ProgrammeCoursesTab'
import { StudyProgrammeSelector } from './StudyProgrammeSelector'
import { StudyTracksAndClassStatisticsTab } from './StudyTracksAndClassStatisticsTab'
import { TagsTab } from './TagsTab'
import { UpdateStatisticsTab } from './UpdateStatisticsTab'

const getProgrammeName = (
  studyProgrammeId: string,
  combibedProgrammeId: string,
  programmes,
  language: Language,
  getTextIn
) => {
  if (combibedProgrammeId && programmes?.[studyProgrammeId] && programmes?.[combibedProgrammeId]) {
    return getCombinedProgrammeName(
      getTextIn(programmes?.[studyProgrammeId].name),
      getTextIn(programmes?.[combibedProgrammeId].name),
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
  const [tab, setTab] = useTabs(isAdmin ? 6 : 5)
  const [academicYear, setAcademicYear] = useState(false)
  const [specialGroupsExcluded, setSpecialGroupsExcluded] = useState(false)
  const [graduated, setGraduated] = useState(false)

  useTitle('Study programmes') // TODO: Include programme name if a programme is selected

  if (!studyProgrammeId) {
    return <StudyProgrammeSelector />
  }

  const programmeId = studyProgrammeId?.includes('+') ? studyProgrammeId.split('+')[0] : studyProgrammeId
  const secondProgrammeId = studyProgrammeId?.includes('+') ? studyProgrammeId.split('+')[1] : ''
  const programmeName = getProgrammeName(programmeId, secondProgrammeId, programmes, language, getTextIn)
  const programmeLetterId = programmes?.[programmeId]?.progId
  const secondProgrammeLetterId = programmes?.[secondProgrammeId]?.progId

  const otherTabsVisible =
    fullAccessToStudentData ||
    fullStudyProgrammeRights.includes(programmeId) ||
    fullStudyProgrammeRights.includes(secondProgrammeId)

  return (
    <Container maxWidth="lg">
      <PageTitle
        subtitle={getSubtitle(studyProgrammeId, programmeLetterId, secondProgrammeLetterId)}
        title={programmeName}
      />
      <Stack gap={2}>
        <Tabs data-cy="StudyProgrammeTabs" onChange={(_event, newTab) => setTab(newTab)} value={tab}>
          <Tab data-cy="BasicInformationTab" label="Basic information" />
          <Tab data-cy="StudyTracksAndClassStatisticsTab" label="Study tracks and class statistics" />
          {otherTabsVisible && isDefaultServiceProvider() && (
            <Tab data-cy="ProgrammeCoursesTab" label="Programme courses" />
          )}
          {otherTabsVisible && <Tab data-cy="DegreeCoursesTab" label="Degree courses" />}
          {otherTabsVisible && <Tab data-cy="TagsTab" label="Tags" />}
          {isAdmin && <Tab data-cy="UpdateStatisticsTab" label="Update statistics" />}
        </Tabs>
        {tab === 0 && (
          <BasicInformationTab
            academicYear={academicYear}
            combinedProgramme={secondProgrammeId}
            setAcademicYear={setAcademicYear}
            setSpecialGroupsExcluded={setSpecialGroupsExcluded}
            specialGroupsExcluded={specialGroupsExcluded}
            studyprogramme={programmeId}
          />
        )}
        {tab === 1 && (
          <StudyTracksAndClassStatisticsTab
            combinedProgramme={secondProgrammeId}
            graduated={graduated}
            setGraduated={setGraduated}
            setSpecialGroupsExcluded={setSpecialGroupsExcluded}
            specialGroupsExcluded={specialGroupsExcluded}
            studyProgramme={programmeId}
          />
        )}
        {tab === 2 && otherTabsVisible && isDefaultServiceProvider() && (
          <ProgrammeCoursesTab
            academicYear={academicYear}
            combinedProgramme={secondProgrammeId}
            setAcademicYear={setAcademicYear}
            studyProgramme={programmeId}
          />
        )}
        {tab === 3 && otherTabsVisible && (
          <DegreeCoursesTab
            combinedProgramme={secondProgrammeId}
            studyProgramme={programmeId}
            year={`${new Date().getFullYear()}`}
          />
        )}
        {tab === 4 && otherTabsVisible && (
          <TagsTab combinedProgramme={secondProgrammeId} studyprogramme={programmeId} />
        )}
        {tab === 5 && isAdmin && (
          <UpdateStatisticsTab combinedProgramme={secondProgrammeId} studyProgramme={programmeId} />
        )}
      </Stack>
    </Container>
  )
}
