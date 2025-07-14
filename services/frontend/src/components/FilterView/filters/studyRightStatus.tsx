import { Form, Radio } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

const StudyRightStatusFilterCard = ({ args, options, onOptionsChange }) => {
  const { combinedProgrammeCode, showBachelorAndMaster } = args
  const { activeProgramme, activeCombinedProgramme } = options

  const toggle = (buttonValue, type) => () =>
    onOptionsChange(
      type === 'combinedProgramme'
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
  return (
    <Form>
      <Form.Field style={{ display: 'flex', flexDirection: 'column', gap: '0.5em' }}>
        <Radio
          checked={activeProgramme === null && activeCombinedProgramme === null}
          data-cy="option-activity-status-all"
          label="All"
          name="radioGroup"
          onChange={toggle(null, 'default')}
        />
        <Radio
          checked={activeProgramme === true}
          data-cy="option-active"
          label={`Active ${restOfTitle}`}
          name="radioGroup"
          onChange={toggle(true, 'default')}
        />
        {showBachelorAndMaster && (
          <Radio
            checked={activeCombinedProgramme === true}
            data-cy="option-active-combined"
            label={`Active ${typeOfCombined} study right`}
            name="radioGroup"
            onChange={toggle(true, 'combinedProgramme')}
          />
        )}
        <Radio
          checked={activeProgramme === false}
          data-cy="option-inactive"
          label={`Inactive ${restOfTitle}`}
          name="radioGroup"
          onChange={toggle(false, 'default')}
        />
        {showBachelorAndMaster && (
          <Radio
            checked={activeCombinedProgramme === false}
            data-cy="option-inactive-combined"
            label={`Inactive ${typeOfCombined} study right`}
            name="radioGroup"
            onChange={toggle(false, 'combinedProgramme')}
          />
        )}
      </Form.Field>
    </Form>
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
      if (studyRight.studyRightElements.find(element => element.code === code).graduated) {
        return false
      }

      return activeProgramme === isStudyRightActive(enrollment)
    } else {
      const BACHELOR = 'urn:code:degree-program-type:bachelors-degree'
      const MASTER = 'urn:code:degree-program-type:masters-degree'
      const hasBachelorsProgramme =
        studyRight.studyRightElements.find(element => element.degreeProgrammeType === BACHELOR) != null
      const graduatedBachelor = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === BACHELOR && element.graduated
      )
      const graduatedMaster = studyRight.studyRightElements.some(
        element => element.degreeProgrammeType === MASTER && element.graduated
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
