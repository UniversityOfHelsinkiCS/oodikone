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

const priority = {
  'urn:code:degree-program-type:bachelors-degree': 1,
  'urn:code:degree-program-type:masters-degree': 2,
} as const

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
  const { getTextIn } = useLanguage()
  const [showPercentages, setShowPercentages] = useState(false)

  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const {
    data: studentStats,
    isError,
    isSuccess,
    isFetching: isLoading,
  } = useGetFacultyStudentStatsQuery({
    id: faculty.id,
    specialGroups: specials,
  })

  const programmeKeys: string[] = Object.keys(studentStats?.programmeStats ?? {}).sort((a, b) => {
    const aPriority = priority[studentStats?.programmeNames[a]?.degreeProgrammeType ?? ''] ?? 3
    const bPriority = priority[studentStats?.programmeNames[b]?.degreeProgrammeType ?? ''] ?? 3

    return aPriority - bPriority
  })

  return (
    <Stack gap={2}>
      <Section>
        <ToggleContainer>
          <Toggle
            cypress="study-right-toggle"
            disabled={isLoading || isError || (isSuccess && !studentStats)}
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
        exportOnClick={() => exportStudentTable(studentStats, faculty.code, programmeKeys, getTextIn)}
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
          {studentStats ? (
            <FacultyStudentDataTable
              extraTableStats={studentStats.facultyTableStatsExtra}
              programmeNames={studentStats.programmeNames}
              programmeStats={studentStats.programmeStats}
              requiredRights={requiredRights}
              showPercentages={showPercentages}
              sortedKeys={programmeKeys}
              tableStats={studentStats.facultyTableStats}
              titles={studentStats.titles}
              years={studentStats.years}
            />
          ) : null}
        </Stack>
      </Section>
      <ProgressSection faculty={faculty} specialGroups={specialGroups} />
    </Stack>
  )
}
