import { Container, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useTitle } from '@/common/hooks'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { PageTitle } from '@/components/material/PageTitle'
import { useTabs } from '@/hooks/tabs'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { BasicInformationTab } from './BasicInformationTab'
import { FacultyList } from './FacultyList'
import { GraduationTimesTab } from './GraduationTimesTab'
import { ProgressTab } from './ProgressTab'
import { StudentsByStartingYearTab } from './StudentsByStartingYearTab'
import { UpdateStatisticsTab } from './UpdateStatisticsTab'

export const Faculties = () => {
  const { getTextIn } = useLanguage()
  const { facultyId } = useParams()

  const { data: faculties = [] } = useGetFacultiesQuery()
  const faculty: GetFacultiesResponse | undefined =
    faculties.length > 0 && facultyId && faculties.find(faculty => faculty.id === facultyId)
  const facultyCode = faculty?.code
  const facultyName = faculty && getTextIn(faculty.name)

  useTitle(facultyName ? `${facultyName} - Faculties` : 'Faculties')

  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const [tab, handleTabChange] = useTabs(isAdmin ? 5 : 4)
  const [academicYear, setAcademicYear] = useState(false)
  const [studyProgrammes, setStudyProgrammes] = useState(false)
  const [specialGroups, setSpecialGroups] = useState(false)
  const [graduatedGroup, setGraduatedGroup] = useState(false)
  const requiredRights = { fullAccessToStudentData, programmeRights }

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
        <Tab data-cy="StudentsByStartingYearTab" label="Students by starting year" />
        <Tab data-cy="ProgressTab" label="Progress" />
        <Tab data-cy="GraduationTimesTab" label="Graduation times" />
        <Tab data-cy="UpdateStatisticsTab" label="Update statistics" />
      </Tabs>
      {tab === 0 && (
        <BasicInformationTab
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
        <StudentsByStartingYearTab
          faculty={faculty}
          graduatedGroup={graduatedGroup}
          requiredRights={requiredRights}
          setGraduatedGroup={setGraduatedGroup}
          setSpecialGroups={setSpecialGroups}
          specialGroups={specialGroups}
        />
      )}
      {tab === 2 && (
        <ProgressTab
          faculty={faculty}
          graduatedGroup={graduatedGroup}
          setGraduatedGroup={setGraduatedGroup}
          setSpecialGroups={setSpecialGroups}
          specialGroups={specialGroups}
        />
      )}
      {tab === 3 && (
        <GraduationTimesTab
          faculty={faculty}
          setStudyProgrammes={setStudyProgrammes}
          studyProgrammes={studyProgrammes}
        />
      )}
      {tab === 4 && isAdmin && <UpdateStatisticsTab id={faculty?.id} />}
    </Container>
  )
}
