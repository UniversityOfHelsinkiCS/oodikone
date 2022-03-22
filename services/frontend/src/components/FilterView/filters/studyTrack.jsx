import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import { getTextIn } from 'common'
import moment from 'moment'
import _ from 'lodash'
import createFilter from './createFilter'

const StudyTrackFilterCard = ({ options, onOptionsChange, withoutSelf, activeAt, code }) => {
  const { selected } = options

  const activeAtMoment = activeAt && moment(activeAt)

  const dropdownOptions = _.chain(withoutSelf())
    .flatMap(student => student.studyrights)
    .map(sr => sr.studyright_elements)
    .filter(sre => sre.some(e => e.code === code))
    .flatMap()
    .filter(
      sre =>
        sre.element_detail?.type === 30 &&
        (activeAtMoment ? activeAtMoment.isBetween(sre.startdate, sre.enddate, 'day', '[]') : true)
    )
    .map(sre => sre.element_detail)
    .keyBy('code')
    .values()
    .map(({ code, name }) => ({
      key: code,
      value: code,
      text: `${getTextIn(name)} (${code})`,
      content: (
        <>
          {getTextIn(name)}{' '}
          <span style={{ whiteSpace: 'nowrap', color: 'rgb(136, 136, 136)', fontSize: '0.8em' }}>({code})</span>
        </>
      ),
    }))
    .value()

  const handleChange = (_, { value }) => {
    onOptionsChange({
      selected: value,
    })
  }

  return (
    <Form>
      <Dropdown
        options={dropdownOptions}
        value={selected}
        onChange={handleChange}
        placeholder="Choose study track"
        className="mini"
        selection
        clearable
        button
        search
        multiple
        fluid
        data-cy="StudyTrack-filter-dropdown"
      />
    </Form>
  )
}

export default createFilter({
  key: 'StudyTrack',

  title: 'Study Track',

  defaultOptions: {
    selected: [],
  },

  isActive: ({ selected }) => selected.length > 0,

  filter: (student, { selected, args }) => {
    const activeAt = _.get(args, 'activeAt', moment())

    return student.studyrights
      .flatMap(sr => sr.studyright_elements)
      .filter(
        sre =>
          sre.element_detail.type === 30 &&
          (!activeAt || moment(activeAt).isBetween(sre.startdate, sre.enddate, 'day', '[]'))
      )
      .map(sre => sre.element_detail.code)
      .some(code => selected.includes(code))
  },

  render: (props, { args }) => (
    <StudyTrackFilterCard {...props} code={_.get(args, 'code')} activeAt={_.get(args, 'activeAt')} />
  ),
})
