import { Form, Radio } from 'semantic-ui-react'

import { filterToolTips } from '@/common/InfoToolTips'
import { createFilter } from './createFilter'

const StudyrightStatusFilterCard = ({ options, onOptionsChange, combinedProgrammeCode }) => {
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
  const restOfTitle = combinedProgrammeCode ? 'Bachelor studyright' : 'studyright'
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
        {combinedProgrammeCode && (
          <Radio
            checked={activeCombinedProgramme === true}
            data-cy="option-active-combined"
            label={`Active ${typeOfCombined} studyright`}
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
        {combinedProgrammeCode && (
          <Radio
            checked={activeCombinedProgramme === false}
            data-cy="option-inactive-combined"
            label={`Inactive ${typeOfCombined} studyright`}
            name="radioGroup"
            onChange={toggle(false, 'combinedProgramme')}
          />
        )}
      </Form.Field>
    </Form>
  )
}

export const studyrightStatusFilter = createFilter({
  key: 'studyrightStatusFilter',

  title: 'Studyright status',

  info: filterToolTips.studyRightStatus,

  defaultOptions: {
    activeProgramme: null,
    activeCombinedProgramme: null,
  },

  isActive: ({ activeProgramme, activeCombinedProgramme }) =>
    activeProgramme !== null || activeCombinedProgramme !== null,

  filter: (student, { activeProgramme, activeCombinedProgramme }, { args }) => {
    const { code, combinedProgrammeCode, currentSemester } = args
    if (!currentSemester) {
      return true
    }

    const chosenCode = activeCombinedProgramme !== null && combinedProgrammeCode ? combinedProgrammeCode : code
    const studyRight = student.studyRights.find(studyRight =>
      studyRight.studyRightElements.some(element => element.code === chosenCode)
    )

    if (!studyRight || studyRight.studyRightElements.find(element => element.code === chosenCode).graduated) {
      return false
    }

    const currentSemesterCode = currentSemester.semestercode
    const enrollment = studyRight.semesterEnrollments?.find(enrollment => enrollment.semester === currentSemesterCode)

    // Studyright is active if the student has enrolled (absent or present) for the current semester
    if (activeProgramme === true || activeCombinedProgramme === true) {
      return enrollment != null && [1, 2].includes(enrollment.type)
    }

    // Studyright is inactive if the student has not enrolled for the current semester
    if (activeProgramme === false || activeCombinedProgramme === false) {
      return enrollment == null || (enrollment && enrollment.type === 3)
    }

    return false
  },

  render: (props, { args }) => (
    <StudyrightStatusFilterCard {...props} combinedProgrammeCode={args.combinedProgrammeCode} />
  ),
})
