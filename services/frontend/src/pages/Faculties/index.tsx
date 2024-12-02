import { Container, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader } from 'semantic-ui-react'

import { useTitle } from '@/common/hooks'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/shared/types/api/faculty'
import { BasicOverview } from './BasicOverview'
import { FacultyList } from './FacultyList'
import { FacultyProgrammeOverview } from './FacultyProgrammeOverview'
import { TimesAndPathsView } from './TimesAndPaths'
import { UpdateView } from './UpdateView'

export const Faculties = () => {
  const { getTextIn } = useLanguage()
  const { facultyId } = useParams()

  const { data: faculties = [], isLoading } = useGetFacultiesQuery()
  const faculty: GetFacultiesResponse | undefined =
    faculties.length > 0 && facultyId && faculties.find(faculty => faculty.id === facultyId)
  const facultyCode = faculty?.code
  const facultyName = faculty && getTextIn(faculty.name)

  useTitle(facultyName ? `${facultyName} - Faculties` : 'Faculties')

  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const [tab, handleTabChange] = useTabs(isAdmin ? 4 : 3)
  const [academicYear, setAcademicYear] = useState(false)
  const [studyProgrammes, setStudyProgrammes] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const requiredRights = { fullAccessToStudentData, programmeRights }

  if (isLoading) {
    // TODO: Replace with Section
    return <Loader active style={{ marginTop: '10em' }} />
  }

  if (!facultyCode) {
    const sortedFaculties = faculties.toSorted((a, b) => a.code.localeCompare(b.code))
    return <FacultyList faculties={sortedFaculties} />
  }

  return (
    <Container data-cy="FacultySegmentContainer" maxWidth="lg">
      <PageTitle subtitle={facultyCode} title={facultyName ?? 'Faculties'} />
      <Tabs
        onChange={(event, newValue) => handleTabChange(event, { activeIndex: newValue })}
        sx={{ marginBottom: 2 }}
        value={tab}
      >
        <Tab data-cy="BasicInformationTab" label="Basic information" />
        <Tab data-cy="ProgrammesAndStudentPopulationsTab" label="Programmes and student populations" />
        <Tab data-cy="GraduationTimesTab" label="Graduation times" />
        <Tab data-cy="UpdateStatisticsTab" label="Update statistics" />
      </Tabs>
      {tab === 0 && (
        <BasicOverview
          academicYear={academicYear}
          faculty={faculty}
          setAcademicYear={setAcademicYear}
          setSpecialGroups={setSpecialGroups}
          setStudyProgrammes={setStudyProgrammes}
          specialGroups={specialGroups}
          studyProgrammes={studyProgrammes}
        />
      )}
      {tab === 1 && (
        <FacultyProgrammeOverview
          faculty={faculty}
          graduatedGroup={graduatedGroup}
          requiredRights={requiredRights}
          setGraduatedGroup={setGraduatedGroup}
          setSpecialGroups={setSpecialGroups}
          specialGroups={specialGroups}
        />
      )}
      {tab === 2 && (
        <TimesAndPathsView
          faculty={faculty}
          setStudyProgrammes={setStudyProgrammes}
          studyProgrammes={studyProgrammes}
        />
      )}
      {tab === 3 && isAdmin && <UpdateView faculty={faculty?.id} />}
    </Container>
  )
}
