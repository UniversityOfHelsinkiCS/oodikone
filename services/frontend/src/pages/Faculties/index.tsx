import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'
import { useParams } from 'react-router'

import { PageTitle } from '@/components/common/PageTitle'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useTabs } from '@/hooks/tabs'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetFacultiesQuery } from '@/redux/facultyStats'
import { BasicInformationTab } from './BasicInformationTab'
import { FacultyList } from './FacultyList'
import { GraduationTimesTab } from './GraduationTimesTab'
import { StudentsByStartingYearTab } from './StudentsByStartingYearTab'
import { UpdateStatisticsTab } from './UpdateStatisticsTab'

export const Faculties = () => {
  const { getTextIn } = useLanguage()
  const { facultyId } = useParams()

  const { data: faculties = [] } = useGetFacultiesQuery()
  const faculty = facultyId && faculties.length > 0 ? faculties.find(faculty => faculty.id === facultyId) : undefined
  const facultyCode = faculty?.code
  const facultyName = getTextIn(faculty?.name) ?? undefined

  useTitle(facultyName ? `${facultyName} - Faculties` : 'Faculties')

  const { isAdmin, fullAccessToStudentData, programmeRights } = useGetAuthorizedUserQuery()
  const [tab, setTab] = useTabs(isAdmin ? 4 : 3)
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
      <PageTitle subtitle={facultyCode} title={facultyName} />
      <Stack gap={2}>
        <Tabs data-cy="faculty-tabs" onChange={(_event, newTab) => setTab(newTab)} value={tab}>
          <Tab label="Basic information" />
          <Tab label="Students by starting year" />
          <Tab label="Graduation times" />
          {isAdmin ? <Tab label="Update statistics" /> : null}
        </Tabs>
        {tab === 0 && (
          <BasicInformationTab
            faculty={faculty}
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
          <GraduationTimesTab
            faculty={faculty}
            setStudyProgrammes={setStudyProgrammes}
            studyProgrammes={studyProgrammes}
          />
        )}
        {tab === 3 && isAdmin ? <UpdateStatisticsTab id={faculty?.id} /> : null}
      </Stack>
    </Container>
  )
}
