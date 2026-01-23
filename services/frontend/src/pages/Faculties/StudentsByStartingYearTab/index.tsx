import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { Toggle } from '@/components/common/toggle/Toggle'
import { ToggleContainer } from '@/components/common/toggle/ToggleContainer'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { useGetFacultyStudentStatsQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { exportStudentTable } from './exportStudentTable'
import { FacultyStudentDataTable } from './FacultyStudentDataTable'
import { ProgressSection } from './ProgressSection'

type ProgrammeKeys = {
  progId: string
  code: string
}

export const StudentsByStartingYearTab = ({
  faculty,
  requiredRights,
  setSpecialGroups,
  specialGroups,
}: {
  faculty: GetFacultiesResponse
  requiredRights: { fullAccessToStudentData: boolean; programmeRights: string[] }
  setSpecialGroups: (value: boolean) => void
  specialGroups: boolean
}) => {
  const [showPercentages, setShowPercentages] = useState(false)

  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const { getTextIn } = useLanguage()
  const studentStats = useGetFacultyStudentStatsQuery({
    id: faculty.id,
    specialGroups: specials,
  })

  const isLoading = studentStats.isLoading || studentStats.isFetching
  const isError = studentStats.isError || (studentStats.isSuccess && !studentStats.data)

  const programmeKeys: ProgrammeKeys[] = studentStats?.data?.programmeStats
    ? Object.keys(studentStats?.data?.programmeStats || {})
        .sort((a, b) => {
          const priority = {
            'urn:code:degree-program-type:bachelors-degree': 1,
            'urn:code:degree-program-type:masters-degree': 2,
          }

          const aPriority = priority[studentStats?.data?.programmeNames[a]?.degreeProgrammeType ?? ''] ?? 3
          const bPriority = priority[studentStats?.data?.programmeNames[b]?.degreeProgrammeType ?? ''] ?? 3

          return aPriority - bPriority
        })
        .map(programme => ({ progId: studentStats?.data?.programmeNames[programme]?.progId ?? '', code: programme }))
    : []

  return (
    <Stack gap={2}>
      <Section>
        <ToggleContainer>
          <Toggle
            cypress="study-right-toggle"
            disabled={isError || isLoading}
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studyRightToggle}
            secondLabel="Special study rights excluded"
            setValue={setSpecialGroups}
            value={specialGroups}
          />
        </ToggleContainer>
      </Section>
      <Section
        cypress="faculty-student-table"
        exportOnClick={() =>
          exportStudentTable(
            studentStats?.data,
            faculty.code,
            programmeKeys.map(listObj => listObj.code),
            getTextIn
          )
        }
        infoBoxContent={facultyToolTips.studentsStatsOfTheFaculty}
        isError={isError}
        isLoading={isLoading}
        title="Students of the faculty by starting year"
      >
        <Stack gap={2}>
          <ToggleContainer>
            <Toggle
              cypress="percentage-toggle"
              disabled={isError || isLoading}
              firstLabel="Hide percentages"
              secondLabel="Show percentages"
              setValue={setShowPercentages}
              value={showPercentages}
            />
          </ToggleContainer>
          {studentStats?.data ? (
            <FacultyStudentDataTable
              extraTableStats={studentStats?.data.facultyTableStatsExtra}
              programmeNames={studentStats?.data.programmeNames}
              programmeStats={studentStats?.data.programmeStats}
              requiredRights={requiredRights}
              showPercentages={showPercentages}
              sortedKeys={programmeKeys.map(listObj => listObj.code)}
              tableStats={studentStats?.data.facultyTableStats}
              titles={studentStats?.data.titles}
              years={studentStats?.data.years}
            />
          ) : null}
        </Stack>
      </Section>
      <ProgressSection faculty={faculty} specialGroups={specialGroups} />
    </Stack>
  )
}
