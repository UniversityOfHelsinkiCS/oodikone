import React from 'react'
import { Button, Dropdown, Icon, Label, Popup } from 'semantic-ui-react'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterType } from './filterType'

const filterTexts = {
  [FilterType.ALL]: { label: 'All' },
  [FilterType.PASSED]: { label: 'Passed' },
  [FilterType.FAILED]: { label: 'Failed' },
  [FilterType.ENROLLED_NO_GRADE]: { label: 'Enrolled, No Grade' },
}
// a bandaid solution to prevent oodikone crashing
const translate = {
  ALL: 'all',
  PASSED: 'passed',
  FAILED: 'failed',
  ENROLLED_NO_GRADE: 'enrolledNoGrade',
}

export const CourseCard = ({ course, filterType, onChange }) => {
  const { getTextIn } = useLanguage()
  const name = 'courseFilter'

  const onClick = (_, { value }) => onChange(value)

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
          {Object.entries(filterTexts).map(([type, { label, info }]) => {
            if (info) {
              return (
                <Popup
                  basic
                  content={info}
                  key={label}
                  trigger={<Dropdown.Item onClick={onClick} text={label} value={type} />}
                />
              )
            }
            if (course?.students[translate[type]] && Object.keys(course?.students[translate[type]]).length === 0)
              return <Dropdown.Item disabled key={label} onClick={onClick} text={label} value={type} />
            return <Dropdown.Item key={label} onClick={onClick} text={label} value={type} />
          })}
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
