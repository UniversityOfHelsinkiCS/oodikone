import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import _ from 'lodash'
import createFilter from './createFilter'
import filterInfo from '../../../common/InfoToolTips/filters'

const moment = require('moment')

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
            label="All"
            name="radioGroup"
            checked={activeProgramme === null && activeCombinedProgramme === null}
            onChange={toggle(null, 'default')}
            data-cy="option-activity-status-all"
          />
          <Radio
            label={`Active ${restOfTitle}`}
            name="radioGroup"
            checked={activeProgramme === true}
            onChange={toggle(true, 'default')}
            data-cy="option-active"
            style={{ margin: '0.5rem 0' }}
          />
          {combinedProgrammeCode && (
            <Radio
              label={`Active ${typeOfCombined} studyright`}
              name="radioGroup"
              checked={activeCombinedProgramme === true}
              onChange={toggle(true, 'combinedProgramme')}
              data-cy="option-active-combined"
              style={{ margin: '0.5rem 0' }}
            />
          )}
          <Radio
            label={`Inactive ${restOfTitle}`}
            name="radioGroup"
            checked={activeProgramme === false}
            onChange={toggle(false, 'default')}
            data-cy="option-inactive"
            style={{ margin: '0.5rem 0' }}
          />
          {combinedProgrammeCode && (
            <Radio
              label={`Inactive ${typeOfCombined} studyright`}
              name="radioGroup"
              checked={activeCombinedProgramme === false}
              onChange={toggle(false, 'combinedProgramme')}
              data-cy="option-inactive-combined"
            />
          )}
        </Form.Field>
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'studyrightStatusFilter',

  title: 'Studyright Status',

  info: filterInfo.studyrightStatus,

  defaultOptions: {
    activeProgramme: null,
    activeCombinedProgramme: null,
  },

  isActive: ({ activeProgramme, activeCombinedProgramme }) =>
    activeProgramme !== null || activeCombinedProgramme !== null,

  filter: (student, { activeProgramme, activeCombinedProgramme }, { args }) => {
    const { code, combinedProgrammeCode } = args
    const now = moment(new Date())

    const status = s => {
      // Studyright is active if the student has enrolled (absent or present) for this semester and the studyright has not yet ended
      if (activeProgramme === true || activeCombinedProgramme === true)
        return s.active === 1 && ((s.enddate && moment(s.enddate).isAfter(now)) || !s.enddate)
      // Studyright is inactive if the student has not enrolled for this semester or the studyright has expired
      if (activeProgramme === false || activeCombinedProgramme === false)
        return !s.graduated && (s.active === 0 || (s.enddate && moment(s.enddate).isBefore(now)))
      return true
    }

    const chosenCode = activeCombinedProgramme && combinedProgrammeCode ? combinedProgrammeCode : code
    return student.studyrights.some(s => {
      const correctStatus = status(s)
      return correctStatus && s.studyright_elements.some(s => s.code === chosenCode)
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
