import React from 'react'
import { Form, Radio } from 'semantic-ui-react'
import _ from 'lodash'
import createFilter from './createFilter'
import filterInfo from '../../../common/InfoToolTips/filters'

const moment = require('moment')

const StudyrightStatusFilterCard = ({ options, onOptionsChange }) => {
  const { active } = options

  const toggle = buttonValue => () =>
    onOptionsChange({
      active: active === buttonValue ? null : buttonValue,
    })

  return (
    <Form>
      <div className="card-content">
        <Form.Field style={{ display: 'flex', flexDirection: 'column' }}>
          <Radio
            label="All"
            name="radioGroup"
            checked={active === null}
            onChange={toggle(null)}
            data-cy="option-activity-status-all"
          />
          <Radio
            label="Active studyright"
            name="radioGroup"
            checked={active === true}
            onChange={toggle(true)}
            data-cy="option-active"
            style={{ margin: '0.5rem 0' }}
          />
          <Radio
            label="Passive studyright"
            name="radioGroup"
            checked={active === false}
            onChange={toggle(false)}
            data-cy="option-passive"
          />
        </Form.Field>
      </div>
    </Form>
  )
}

export default createFilter({
  key: 'studyrightStatusFilter',

  title: 'Studyright status',

  info: filterInfo.studyrightStatus,

  defaultOptions: {
    studyrightStatus: null,
  },

  isActive: ({ studyrightStatus }) => studyrightStatus !== null,

  filter: (student, { active }, { args }) => {
    const { code } = args
    const now = new Date()

    const status = s => {
      if (active === true) return s.active && s.enddate && moment(s.enddate).isAfter(now) // Studyright is active if the student has enrolled (absent or present) for this semester and the studyright has not yet ended
      if (active === false) return !s.graduated && (!s.active || (s.enddate && moment(s.enddate).isBefore(now))) // Studyright is inactive if the student has not enrolled for this semester or the studyright has expired
      return true
    }

    return student.studyrights.some(s => {
      const correctStatus = status(s)
      return correctStatus && s.studyright_elements.some(s => s.code === code)
    })
  },

  component: StudyrightStatusFilterCard,

  render: (props, { args }) => <StudyrightStatusFilterCard {...props} code={_.get(args, 'code')} />,
})
