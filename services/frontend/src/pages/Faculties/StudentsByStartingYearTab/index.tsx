import Stack from '@mui/material/Stack'

import { useState } from 'react'

import { facultyToolTips } from '@/common/InfoToolTips'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { Toggle } from '@/components/material/Toggle'
import { ToggleContainer } from '@/components/material/ToggleContainer'
import { useGetFacultyStudentStatsQuery } from '@/redux/facultyStats'
import { GetFacultiesResponse } from '@/types/api/faculty'
import { exportStudentTable } from './exportStudentTable'
import { FacultyStudentDataTable } from './FacultyStudentDataTable'
import { ProgressSection } from './ProgressSection'

type ProgrammeKeys = {
  progId: string
  code: string
}

const getKey = (programmeKeys: ProgrammeKeys[], index: number) => {
  if (programmeKeys[index].code.startsWith('T') || programmeKeys[index].code.startsWith('LIS')) {
    return 'T'
  }
  if (programmeKeys[index].code.includes('KH')) {
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
  const getTableLinePlaces = (programmeKeys: ProgrammeKeys[]) => {
    if (programmeKeys.length === 0) {
      return []
    }
    const key = getKey(programmeKeys, 0)
    const plotLinePlaces = [['0', key]]
    for (let i = 0; i < programmeKeys.length - 1; i++) {
      if (
        (programmeKeys[i].code.includes('KH') && programmeKeys[i + 1].code.includes('MH')) ||
        (programmeKeys[i].code.includes('MH') &&
          (programmeKeys[i + 1].code.startsWith('T') || programmeKeys[i + 1].code.startsWith('LIS')))
      ) {
        const key = getKey(programmeKeys, i + 1)
        plotLinePlaces.push([(i + 1).toString(), key])
      }
    }
    return plotLinePlaces
  }

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
          <Toggle
            cypress="graduated-toggle"
            disabled={isError || isLoading}
            firstLabel="Graduated included"
            infoBoxContent={facultyToolTips.graduatedToggle}
            secondLabel="Graduated excluded"
            setValue={setGraduatedGroup}
            value={graduatedGroup}
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
              tableLinePlaces={getTableLinePlaces(programmeKeys)}
              tableStats={studentStats?.data.facultyTableStats}
              titles={studentStats?.data.titles}
              years={studentStats?.data.years}
            />
          ) : null}
        </Stack>
      </Section>
      <ProgressSection faculty={faculty} graduatedGroup={graduatedGroup} specialGroups={specialGroups} />
    </Stack>
  )
}
