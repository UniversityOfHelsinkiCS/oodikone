import { FC } from 'react'
import { Button, Dropdown, Icon, Label } from 'semantic-ui-react'
import type { DropdownProps } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterType } from './filterType'

const filterTexts = {
  [FilterType.ALL]: {
    key: 'all',
    label: 'All',
  },
  [FilterType.PASSED]: {
    key: 'passed',
    label: 'Passed',
  },
  [FilterType.FAILED]: {
    key: 'failed',
    label: 'Failed',
  },
  [FilterType.ENROLLED_NO_GRADE]: {
    key: 'enrolledNoGrade',
    label: 'Enrolled, No Grade',
  },
}

export const CourseCard: FC<{
  course: any
  filterType: keyof typeof FilterType
  onChange: (type) => any
}> = ({ course, filterType, onChange }) => {
  const { getTextIn } = useLanguage()
  const name = 'courseFilter'

  const onClick: NonNullable<DropdownProps['Item']['onClick']> = (_, { value }) => onChange(value)

  const clear = () => {
    onChange(null)
  }

  return (
    <Label style={{ marginTop: '0.5rem' }}>
      {getTextIn(course?.course?.name)}

      <Dropdown
        button
        className="mini"
        data-cy={`${name}-${course?.course?.code}-dropdown`}
        fluid
        style={{ marginTop: '0.5rem' }}
        text={filterTexts[filterType].label}
        value={filterType}
      >
        <Dropdown.Menu>
          {Object.entries(filterTexts).map(([type, { key, label }]) => (
            <Dropdown.Item
              disabled={!Object.keys(course?.students[key] ?? {}).length}
              key={label}
              onClick={onClick}
              text={label}
              value={type}
            />
          ))}
        </Dropdown.Menu>
      </Dropdown>

      <Button
        compact
        data-cy={`${name}-${course?.course?.code}-clear`}
        icon
        onClick={clear}
        size="tiny"
        style={{ marginTop: '0.5rem' }}
      >
        <Icon name="close" />
      </Button>
    </Label>
  )
}
