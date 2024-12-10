import { Stack } from '@mui/material'
import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { useGetFacultyStudentStatsQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { exportStudentTable } from './export'
import { FacultyStudentDataTable } from './FacultyStudentDataTable'

const getKey = (programmeKeys: string[][], index: number) => {
  if (programmeKeys[index][1].startsWith('T') || programmeKeys[index][1].startsWith('LIS')) {
    return 'T'
  }
  if (programmeKeys[index][1].includes('KH')) {
    return 'KH'
  }
  return 'MH'
}

export const StudentsByStartingYearTab = ({
  faculty,
  graduatedGroup,
  requiredRights,
  setGraduatedGroup,
  setSpecialGroups,
  specialGroups,
}: {
  faculty: GetFacultiesResponse
  graduatedGroup: boolean
  requiredRights: { fullAccessToStudentData: boolean; programmeRights: string[] }
  setGraduatedGroup: (value: boolean) => void
  setSpecialGroups: (value: boolean) => void
  specialGroups: boolean
}) => {
  const [showPercentages, setShowPercentages] = useState(false)

  const specials = specialGroups ? 'SPECIAL_EXCLUDED' : 'SPECIAL_INCLUDED'
  const graduated = graduatedGroup ? 'GRADUATED_EXCLUDED' : 'GRADUATED_INCLUDED'
  const { getTextIn } = useLanguage()
  const studentStats = useGetFacultyStudentStatsQuery({
    id: faculty.id,
    specialGroups: specials,
    graduated,
  })

  const isLoading = studentStats.isLoading || studentStats.isFetching
  const isError = studentStats.isError || (studentStats.isSuccess && !studentStats.data)

  // These are for color coding the rows based on the programme; bachelor, master, doctor
  const getTableLinePlaces = (programmeKeys: string[][]) => {
    if (programmeKeys.length === 0) {
      return []
    }
    const key = getKey(programmeKeys, 0)
    const plotLinePlaces = [['0', key]]
    for (let i = 0; i < programmeKeys.length - 1; i++) {
      if (
        (programmeKeys[i][1].includes('KH') && programmeKeys[i + 1][1].includes('MH')) ||
        (programmeKeys[i][1].includes('MH') &&
          (programmeKeys[i + 1][1].startsWith('T') || programmeKeys[i + 1][1].startsWith('LIS')))
      ) {
        const key = getKey(programmeKeys, i + 1)
        plotLinePlaces.push([(i + 1).toString(), key])
      }
    }
    return plotLinePlaces
  }

  const sortedProgrammeKeysStudents = studentStats?.data?.programmeStats
    ? Object.keys(studentStats?.data?.programmeStats || {})
        .sort((a, b) => {
          const priority = {
            'urn:code:degree-program-type:bachelors-degree': 1,
            'urn:code:degree-program-type:masters-degree': 2,
          }

          const aPriority = priority[studentStats?.data?.programmeNames[a]?.degreeProgrammeType ?? ''] || 3
          const bPriority = priority[studentStats?.data?.programmeNames[b]?.degreeProgrammeType ?? ''] || 3

          return aPriority - bPriority
        })
        .map(programme => [studentStats?.data?.programmeNames[programme]?.progId ?? '', programme])
    : []

  return (
    <Stack gap={2}>
      <Section>
        <Stack alignItems="center" direction="column" gap={2} justifyContent="space-around">
          <Toggle
            cypress="StudentToggle"
            disabled={isError || isLoading}
            firstLabel="All study rights"
            infoBoxContent={facultyToolTips.studentToggle}
            secondLabel="Special study rights excluded"
            setValue={setSpecialGroups}
            value={specialGroups}
          />
          <Toggle
            cypress="GraduatedToggle"
            disabled={isError || isLoading}
            firstLabel="Graduated included"
            infoBoxContent={facultyToolTips.graduatedToggle}
            secondLabel="Graduated excluded"
            setValue={setGraduatedGroup}
            value={graduatedGroup}
          />
          <Toggle
            cypress="HidePercentagesToggle"
            disabled={isError || isLoading}
            firstLabel="Hide percentages"
            secondLabel="Show percentages"
            setValue={setShowPercentages}
            value={showPercentages}
          />
        </Stack>
      </Section>
      <Section
        cypress="FacultyStudentTable"
        exportOnClick={() =>
          exportStudentTable(
            studentStats?.data,
            studentStats?.data?.programmeNames,
            faculty.code,
            sortedProgrammeKeysStudents.map(listObj => listObj[1]),
            getTextIn
          )
        }
        infoBoxContent={facultyToolTips.studentsStatsOfTheFaculty}
        isError={isError}
        isLoading={isLoading}
        title="Students of the faculty by starting year"
      >
        {studentStats?.data && (
          <FacultyStudentDataTable
            extraTableStats={studentStats?.data.facultyTableStatsExtra}
            programmeNames={studentStats?.data.programmeNames}
            programmeStats={studentStats?.data.programmeStats}
            requiredRights={requiredRights}
            showPercentages={showPercentages}
            sortedKeys={sortedProgrammeKeysStudents.map(listObj => listObj[1])}
            tableLinePlaces={getTableLinePlaces(sortedProgrammeKeysStudents)}
            tableStats={studentStats?.data.facultyTableStats}
            titles={studentStats?.data.titles}
            years={studentStats?.data.years}
          />
        )}
      </Section>
    </Stack>
  )
}
