/* eslint-disable camelcase */
import _ from 'lodash'
import moment from 'moment'
import React from 'react'
import { Dropdown, Form } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const StudyTrackFilterCard = ({ activeAt, code, onOptionsChange, options, withoutSelf }) => {
  const { selected } = options
  const { getTextIn } = useLanguage()

  const activeAtMoment = activeAt && moment(activeAt)

  const dropdownOptions = _.chain(withoutSelf())
    .filter(student => !student.transferredStudyright)
    .flatMap(student => student.studyrights)
    .map(studyright => studyright.studyright_elements)
    .filter(element => element.some(element => element.code === code))
    .flatMap()
    .filter(
      element =>
        element.element_detail?.type === 30 &&
        (activeAtMoment ? activeAtMoment.isBetween(element.startdate, element.enddate, 'day', '[]') : true)
    )
    .map(element => element.element_detail)
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
        button
        className="mini"
        clearable
        data-cy="StudyTrack-filter-dropdown"
        fluid
        multiple
        onChange={handleChange}
        options={dropdownOptions}
        placeholder="Choose study track"
        search
        selection
        value={selected}
      />
    </Form>
  )
}

export const studyTrackFilter = createFilter({
  key: 'StudyTrack',
  title: 'Study track',
  defaultOptions: {
    selected: [],
  },
  isActive: ({ selected }) => (selected !== undefined ? selected.length > 0 : false),
  filter: (student, { selected, args }) => {
    const activeAt = _.get(args, 'activeAt', moment())

    return student.studyrights
      .filter(({ studyright_elements, graduated }) =>
        studyright_elements.some(
          element =>
            element.element_detail.type === 30 &&
            (!activeAt ||
              moment(activeAt).isBetween(
                moment(element.startdate),
                graduated ? moment() : moment(element.enddate),
                'day',
                '[]'
              ))
        )
      )
      .flatMap(({ studyright_elements }) => studyright_elements)
      .map(element => element.element_detail.code)
      .some(code => selected.includes(code))
  },
  render: (props, { args }) => (
    <StudyTrackFilterCard {...props} activeAt={_.get(args, 'activeAt')} code={_.get(args, 'code')} />
  ),
})
