import { filterToolTips } from '@/common/InfoToolTips'
import { DegreeProgrammeType, EnrollmentType } from '@oodikone/shared/types'
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

  const modeObject = showBachelorAndMaster
    ? {
        All: () => toggle(null, false),
        [`Active ${restOfTitle}`]: () => toggle(true, false),
        [`Inactive ${restOfTitle}`]: () => toggle(false, false),
        [`Active ${typeOfCombined} study right`]: () => toggle(true, true),
        [`Inactive ${typeOfCombined} study right`]: () => toggle(false, true),
      }
    : {
        All: () => toggle(null, false),
        [`Active ${restOfTitle}`]: () => toggle(true, false),
        [`Inactive ${restOfTitle}`]: () => toggle(false, false),
      }

  const modeOptions = Object.keys(modeObject).map(key => ({
    key,
    text: key,
    value: key,
  }))

  return (
    <FilterRadio
      defaultValue={modeOptions.at(0)?.value ?? ''}
      filterKey="studyRightStatusFilter"
      onChange={({ target }) => modeObject[target.value]()}
      options={modeOptions}
    />
  )
}

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
    if (!currentSemester) return true

    const studyRight = student.studyRights.find(({ studyRightElements }) =>
      studyRightElements.some(element => element.code === code)
    )
    if (!studyRight) return false

    const currentSemesterCode = currentSemester.semestercode
    const enrollment = studyRight.semesterEnrollments?.find(enrollment => enrollment.semester === currentSemesterCode)
    const isActiveStudyRight = [EnrollmentType.PRESENT, EnrollmentType.ABSENT].includes(
      enrollment?.type ?? EnrollmentType.INACTIVE
    )

    if (!showBachelorAndMaster) {
      if (studyRight.studyRightElements.some(element => element.code === code && element.graduated)) return false

      return activeProgramme === isActiveStudyRight
    } else {
      const hasBachelorsProgramme = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === DegreeProgrammeType.BACHELOR
      )
      const graduatedBachelor = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === DegreeProgrammeType.BACHELOR && element.graduated
      )
      const graduatedMaster = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === DegreeProgrammeType.MASTER && element.graduated
      )

      if (activeProgramme !== null) {
        if (!hasBachelorsProgramme || graduatedBachelor) return false
        return activeProgramme === isActiveStudyRight
      }

      if (activeCombinedProgramme !== null) {
        if ((hasBachelorsProgramme && !graduatedBachelor) || graduatedMaster) return false
        return activeCombinedProgramme === isActiveStudyRight
      }
    }
    return false
  },

  render: StudyRightStatusFilterCard,
})
