import { Stack } from '@mui/material'
import { flatten } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { ProgrammeDropdown } from '@/components/material/ProgrammeDropdown'
import { Section } from '@/components/material/Section'
import { TotalsDisclaimer } from '@/components/material/TotalsDisclaimer'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { setProgrammes } from '@/redux/coursesSummaryForm'
import { ALL, getAllStudyProgrammes, getSummaryStatistics } from '@/selectors/courseStats'
import { AttemptData } from '@/types/attemptData'
import { DropdownOption } from '@/types/dropdownOption'
import { getFullStudyProgrammeRights, userHasAccessToAllCourseStats } from '@/util/access'
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

export const SummaryTab = ({ onClickCourse }: { onClickCourse: (courseCode: string) => void }) => {
  const { roles, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const userHasAccessToAllStats = userHasAccessToAllCourseStats(roles, fullStudyProgrammeRights)
  const dispatch = useDispatch()
  const programmes = useSelector((state: RootState) => getAllStudyProgrammes(state))
  const form = useSelector((state: RootState) => state.courseSummaryForm)
  const statistics = useSelector((state: RootState) => getSummaryStatistics(state, userHasAccessToAllStats))
  const { getTextIn } = useLanguage()

  const handleChange = (newProgrammes: string[]) => {
    let selected = [...newProgrammes].filter(programme => programme !== ALL.value)
    if ((!form.programmes.includes(ALL.value) && newProgrammes.includes(ALL.value)) || newProgrammes.length === 0) {
      selected = [ALL.value]
    }
    dispatch(setProgrammes(selected))
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
    .map(programme => ({ ...programme, size: new Set(flatten(Object.values(programme.students))).size }))
    .filter(programme => programme.size > 0)
    .map(({ text, ...rest }) => ({ text: getTextIn(text)!, ...rest }))

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        {userHasAccessToAllStats && (
          <ProgrammeDropdown
            label="Select study programmes"
            onChange={handleChange}
            options={options}
            value={form.programmes}
          />
        )}
      </Stack>
      <Section exportOnClick={() => exportToExcel(data)}>
        <AttemptsTable data={data} onClickCourse={onClickCourse} userHasAccessToAllStats={userHasAccessToAllStats} />
        <TotalsDisclaimer userHasAccessToAllStats={userHasAccessToAllStats} />
      </Section>
    </Stack>
  )
}
