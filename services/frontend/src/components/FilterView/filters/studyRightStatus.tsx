import { filterToolTips } from '@/common/InfoToolTips'
import { DegreeProgrammeType } from '@oodikone/shared/types'
import { FilterTrayProps } from '../FilterTray'
import { FilterRadio } from './common/FilterRadio'
import { createFilter } from './createFilter'

const StudyRightStatusFilterCard = ({ args, options, onOptionsChange }: FilterTrayProps) => {
  const { combinedProgrammeCode, showBachelorAndMaster } = args
  const { activeProgramme, activeCombinedProgramme } = options

  const toggle = (buttonValue, isCombinedProgramme: boolean) =>
    onOptionsChange(
      isCombinedProgramme
        ? {
            activeProgramme: null,
            activeCombinedProgramme: activeCombinedProgramme === buttonValue ? null : buttonValue,
          }
        : {
            activeProgramme: activeProgramme === buttonValue ? null : buttonValue,
            activeCombinedProgramme: null,
          }
    )
  const restOfTitle = showBachelorAndMaster ? 'Bachelor study right' : 'study right'
  const typeOfCombined = combinedProgrammeCode === 'MH90_001' ? 'Licentiate' : 'Master'

  const modeObject = {
    All: () => toggle(null, false),
    [`Active ${restOfTitle}`]: () => toggle(true, false),
    [`Inactive ${restOfTitle}`]: () => toggle(false, false),
    ...(showBachelorAndMaster
      ? {
          [`Active ${typeOfCombined} study right`]: () => toggle(true, true),
          [`Inactive ${typeOfCombined} study right`]: () => toggle(false, true),
        }
      : {}),
  }

  const modeOptions = Object.keys(modeObject).map(key => ({
    key,
    text: key,
    value: key,
  }))

  const defaultOption = modeOptions.at(0)?.value ?? ''

  return (
    <FilterRadio
      defaultValue={defaultOption}
      filterKey="studyRightStatusFilter"
      onChange={({ target }) => modeObject[target.value]()}
      options={modeOptions}
    />
  )
}

const isStudyRightActive = enrollment => enrollment != null && [1, 2].includes(enrollment.type)

export const studyRightStatusFilter = createFilter({
  key: 'studyRightStatusFilter',

  title: 'Study right status',

  info: filterToolTips.studyRightStatus,

  defaultOptions: {
    activeProgramme: null,
    activeCombinedProgramme: null,
  },

  isActive: ({ activeProgramme, activeCombinedProgramme }) =>
    activeProgramme !== null || activeCombinedProgramme !== null,

  filter: (student, { args, options }) => {
    const { activeProgramme, activeCombinedProgramme } = options
    const { code, currentSemester, showBachelorAndMaster } = args
    if (!currentSemester) {
      return true
    }
    const studyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === code)
    )
    const currentSemesterCode = currentSemester.semestercode
    if (!studyRight) {
      return false
    }
    const enrollment = studyRight.semesterEnrollments?.find(enrollment => enrollment.semester === currentSemesterCode)

    if (!showBachelorAndMaster) {
      if (studyRight.studyRightElements.find(element => element.code === code)?.graduated) {
        return false
      }

      return activeProgramme === isStudyRightActive(enrollment)
    } else {
      const hasBachelorsProgramme =
        studyRight.studyRightElements.find(element => element.degreeProgrammeType === DegreeProgrammeType.BACHELOR) !=
        null
      const graduatedBachelor = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === DegreeProgrammeType.BACHELOR && element.graduated
      )
      const graduatedMaster = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === DegreeProgrammeType.MASTER && element.graduated
      )

      if (activeProgramme !== null) {
        if (!hasBachelorsProgramme || graduatedBachelor) return false
        return activeProgramme === isStudyRightActive(enrollment)
      }

      if (activeCombinedProgramme !== null) {
        if ((hasBachelorsProgramme && !graduatedBachelor) || graduatedMaster) return false
        return activeCombinedProgramme === isStudyRightActive(enrollment)
      }
    }
    return false
  },

  render: StudyRightStatusFilterCard,
})
