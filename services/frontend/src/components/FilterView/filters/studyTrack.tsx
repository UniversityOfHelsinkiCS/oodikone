import { Dropdown, Form } from 'semantic-ui-react'
import type { DropdownProps } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { createFilter } from './createFilter'

const StudyTrackFilterCard = ({ code, onOptionsChange, options, students }) => {
  const { selected } = options
  const { getTextIn } = useLanguage()

  const dropdownOptions = students
    .flatMap(student => student.studyRights)
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(element => element.code === code && element.studyTrack !== null)
    .reduce((acc, element) => {
      const { studyTrack } = element
      if (acc.some(option => option.key === studyTrack.code)) {
        return acc
      }
      acc.push({
        key: studyTrack.code,
        value: studyTrack.code,
        text: `${getTextIn(studyTrack.name)} (${studyTrack.code})`,
        content: (
          <>
            {getTextIn(studyTrack.name)}{' '}
            <span style={{ whiteSpace: 'nowrap', color: '#888', fontSize: '0.8rem' }}>({studyTrack.code})</span>
          </>
        ),
      })
      return acc
    }, [])

  const handleChange: NonNullable<DropdownProps['onChange']> = (_, { value }) => {
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
  filter: (student, { args, options }) => {
    const { selected } = options

    return student.studyRights
      .flatMap(studyRight => studyRight.studyRightElements)
      .filter(element => element.code === args.code && element.studyTrack !== null)
      .some(element => selected.includes(element.studyTrack.code))
  },

  render: (props, { args }) => <StudyTrackFilterCard {...props} code={args.code} />,
})
