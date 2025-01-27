import { Stack, Typography } from '@mui/material'
import { flatten } from 'lodash'
import { useDispatch, useSelector } from 'react-redux'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { Section } from '@/components/material/Section'
import { RootState } from '@/redux'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { setValue } from '@/redux/coursesSummaryForm'
import { ALL, getAllStudyProgrammes, getSummaryStatistics } from '@/selectors/courseStats'
import { AttemptData } from '@/types/attemptData'
import { DropdownOption } from '@/types/dropdownOption'
import { getFullStudyProgrammeRights, userHasAccessToAllCourseStats } from '@/util/access'
import { ProgrammeDropdown } from '../ProgrammeDropdown'
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
  const programmes = useSelector(state => getAllStudyProgrammes(state))
  const form = useSelector((state: RootState) => state.courseSummaryForm)
  const statistics = useSelector((state: RootState) => getSummaryStatistics(state, userHasAccessToAllStats))
  const { getTextIn } = useLanguage()

  const handleChange = (newProgrammes: string[]) => {
    let selected = [...newProgrammes].filter(programme => programme !== ALL.value)
    if ((!form.programmes.includes(ALL.value) && newProgrammes.includes(ALL.value)) || newProgrammes.length === 0) {
      selected = [ALL.value]
    }
    dispatch(setValue('programmes', selected))
  }

  const data: AttemptData[] = statistics.map(stat => {
    const { coursecode, name, realisations, summary } = stat
    const { passed, failed, passrate } = summary
    return {
      id: coursecode,
      category: getTextIn(name),
      passed,
      failed,
      passrate,
      realisations: realisations.map(obj => {
        return unObjectifyProperty({ obj, property: 'realisation' })
      }),
    }
  })

  const options: DropdownOption[] = programmes
    .map(programme => ({ ...programme, size: new Set(flatten(Object.values(programme.students))).size }))
    .filter(programme => programme.size > 0)
    .map(({ text, ...rest }) => ({ text: typeof text === 'string' ? text : getTextIn(text), ...rest }))
    .map(programme => ({ ...programme, name: programme.text }))

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
        {!userHasAccessToAllStats && (
          <Typography color="text.secondary" component="span" variant="body2">
            * Years with 5 students or fewer are NOT included in the total
          </Typography>
        )}
      </Section>
    </Stack>
  )
}
