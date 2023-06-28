/* eslint-disable camelcase */
import React from 'react'
import { Form, Dropdown } from 'semantic-ui-react'
import moment from 'moment'
import _ from 'lodash'
import useLanguage from 'components/LanguagePicker/useLanguage'
import createFilter from './createFilter'

const StudyTrackFilterCard = ({ options, onOptionsChange, withoutSelf, activeAt, code }) => {
  const { selected } = options
  const { getTextIn } = useLanguage()

  const activeAtMoment = activeAt && moment(activeAt)

  const dropdownOptions = _.chain(withoutSelf())
    .filter(student => !student.transferredStudyright)
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
      .filter(({ studyright_elements, graduated }) =>
        studyright_elements.some(
          sre =>
            sre.element_detail.type === 30 &&
            (!activeAt ||
              moment(activeAt).isBetween(
                moment(sre.startdate),
                graduated ? moment() : moment(sre.enddate),
                'day',
                '[]'
              ))
        )
      )
      .flatMap(({ studyright_elements }) => studyright_elements)
      .map(sre => sre.element_detail.code)
      .some(code => selected.includes(code))
  },

  render: (props, { args }) => (
    <StudyTrackFilterCard {...props} code={_.get(args, 'code')} activeAt={_.get(args, 'activeAt')} />
  ),
})
