import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'

import { TotalsDisclaimer } from '@/components/common/TotalsDisclaimer'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ProgrammeDropdown } from '@/components/material/ProgrammeDropdown'
import { Section } from '@/components/Section'
import { ALL, CourseStatisticsSummary, CourseStudyProgramme } from '@/pages/CourseStatistics/util'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { AttemptData } from '@/types/attemptData'
import { DropdownOption } from '@/types/dropdownOption'
import { getFullStudyProgrammeRights, hasAccessToAllCourseStats } from '@/util/access'
import { AttemptsTable } from './AttemptsTable'
import { exportToExcel } from './export'

// Certified JavaScript moment but basically this was crashing
// since sometimes object like {en: ..., fi: ...., sv: ....}
// was being passed to React which is not legal but then again
// it works sometimes? so doing this to make sure while fixing
// the crash the realisations that worked will keep working
const unObjectifyProperty = ({ obj, property }: { obj: object; property: string }) => {
  const suspectField = obj[property]
  if (typeof suspectField === 'object' && suspectField !== null) {
    if (suspectField.en) {
      return { ...obj, [property]: suspectField.en }
    }
    throw Error(`Invalid object being tried to pass to React: ${JSON.stringify(suspectField)}`)
  }
  return { ...obj, [property]: suspectField }
}

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
      realisations: realisations.map(obj => {
        return unObjectifyProperty({ obj, property: 'realisation' }) as {
          failed: number
          obfuscated?: boolean
          passed: number
          passRate: string | null
          realisation: string
        }
      }),
    }
  })

  const options: DropdownOption[] = programmes
    .map(programme => ({ ...programme, size: new Set(Object.values(programme.students).flat()).size }))
    .filter(programme => programme.size > 0)
    .map(({ text, ...rest }) => ({ text: getTextIn(text)!, ...rest }))

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
