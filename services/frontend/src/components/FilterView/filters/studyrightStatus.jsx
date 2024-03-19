import _ from 'lodash'
import moment from 'moment'
import React from 'react'
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
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
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
            style={{ margin: '0.5rem 0' }}
          />
          {combinedProgrammeCode && (
            <Radio
              checked={activeCombinedProgramme === true}
              data-cy="option-active-combined"
              label={`Active ${typeOfCombined} studyright`}
              name="radioGroup"
              onChange={toggle(true, 'combinedProgramme')}
              style={{ margin: '0.5rem 0' }}
            />
          )}
          <Radio
            checked={activeProgramme === false}
            data-cy="option-inactive"
            label={`Inactive ${restOfTitle}`}
            name="radioGroup"
            onChange={toggle(false, 'default')}
            style={{ margin: '0.5rem 0' }}
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
      </div>
    </Form>
  )
}

export const studyrightStatusFilter = createFilter({
  key: 'studyrightStatusFilter',

  title: 'Studyright Status',

  info: filterToolTips.studyrightStatus,

  defaultOptions: {
    activeProgramme: null,
    activeCombinedProgramme: null,
  },

  isActive: ({ activeProgramme, activeCombinedProgramme }) =>
    activeProgramme !== null || activeCombinedProgramme !== null,

  filter: (student, { activeProgramme, activeCombinedProgramme }, { args }) => {
    const { code, combinedProgrammeCode } = args
    const now = moment(new Date())

    const status = studyright => {
      // Studyright is active if the student has enrolled (absent or present) for this semester and the studyright has not yet ended
      if (activeProgramme === true || activeCombinedProgramme === true)
        return (
          studyright.active === 1 &&
          ((studyright.enddate && moment(studyright.enddate).isAfter(now)) || !studyright.enddate)
        )
      // Studyright is inactive if the student has not enrolled for this semester or the studyright has expired
      if (activeProgramme === false || activeCombinedProgramme === false)
        return (
          !studyright.graduated &&
          (studyright.active === 0 || (studyright.enddate && moment(studyright.enddate).isBefore(now)))
        )
      return true
    }

    const chosenCode = activeCombinedProgramme && combinedProgrammeCode ? combinedProgrammeCode : code
    return student.studyrights.some(studyright => {
      const correctStatus = status(studyright)
      return (
        correctStatus && studyright.studyright_elements.some(studyrightElement => studyrightElement.code === chosenCode)
      )
    })
  },

  component: StudyrightStatusFilterCard,

  render: (props, { args }) => (
    <StudyrightStatusFilterCard
      {...props}
      code={_.get(args, 'code')}
      combinedProgrammeCode={_.get(args, 'combinedProgrammeCode')}
    />
  ),
})
