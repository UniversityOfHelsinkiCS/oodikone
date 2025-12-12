import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { ProgrammeDropdown } from '@/components/CourseStatistics/ProgrammeDropdown'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/Section'
import { ALL, CourseStatisticsSummary, CourseStudyProgramme } from '@/pages/CourseStatistics/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { AttemptData } from '@/types/attemptData'
import { DropdownOption } from '@/types/dropdownOption'
import { getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { AttemptsTable } from './AttemptsTable'
import { exportToExcel } from './export'

export const SummaryTab = ({
  onClickCourse,

  courseSummaryFormProgrammes,
  setCourseSummaryFormProgrammes,
  programmes,
  statistics,
}: {
  onClickCourse: (courseCode: string) => void

  courseSummaryFormProgrammes: string[]
  setCourseSummaryFormProgrammes: React.Dispatch<React.SetStateAction<string[]>>
  programmes: CourseStudyProgramme[]
  statistics: CourseStatisticsSummary
}) => {
  const { roles, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = hasAccessToAllCourseStats(roles, fullStudyProgrammeRights)
  const { getTextIn } = useLanguage()

  const handleChange = (newProgrammes: string[]) => {
    let selected = [...newProgrammes].filter(programme => programme !== ALL.value)
    if (
      (!courseSummaryFormProgrammes.includes(ALL.value) && newProgrammes.includes(ALL.value)) ||
      newProgrammes.length === 0
    ) {
      selected = [ALL.value]
    }

    setCourseSummaryFormProgrammes(selected)
  }

  const data: AttemptData[] = statistics.map(stat => {
    const { coursecode, name, realisations, summary } = stat
    const { passed, failed, passRate } = summary

    return {
      id: coursecode,
      category: getTextIn(name)!,
      passed,
      failed,
      passRate,
      realisations,
    }
  })

  const options: DropdownOption[] = programmes
    .map(programme => ({ ...programme, size: Object.values(programme.students).flat().length }))
    .filter(programme => programme.size)
    .map(({ text, ...rest }) => ({ ...rest, text: getTextIn(text)! }))

  return (
    <Stack gap={2}>
      <Box gap={1}>
        {userHasAccessToAllStats ? (
          <ProgrammeDropdown
            label="Select degree programmes"
            onChange={handleChange}
            options={options}
            value={courseSummaryFormProgrammes}
          />
        ) : null}
      </Box>
      <Section exportOnClick={() => exportToExcel(data)}>
        <AttemptsTable data={data} onClickCourse={onClickCourse} userHasAccessToAllStats={userHasAccessToAllStats} />
        <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
      </Section>
    </Stack>
  )
}
