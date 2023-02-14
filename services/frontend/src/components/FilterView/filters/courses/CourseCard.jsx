import React from 'react'
import { Label, Dropdown, Button, Icon, Popup } from 'semantic-ui-react'
import { getTextIn } from '../../../../common'
import useLanguage from '../../../LanguagePicker/useLanguage'
import { FilterType } from './filterType'

const filterTexts = {
  [FilterType.ALL]: { label: 'All' },
  [FilterType.PASSED]: { label: 'Passed' },
  [FilterType.PASSED_AFTER_FAILURE]: { label: 'Passed After Failure' },
  [FilterType.FAILED]: { label: 'Failed' },
  [FilterType.FAILED_MANY_TIMES]: { label: 'Failed Multiple Times' },
  // [FilterType.ENROLLED_NO_GRADE]: { label: 'Enrolled, No Grade' },
}
// a bandaid solution to prevent oodikone crashing
const translate = {
  ALL: 'all',
  PASSED: 'passed',
  PASSED_AFTER_FAILURE: 'retryPassed',
  FAILED: 'failed',
  FAILED_MANY_TIMES: 'failedMany',
  // ENROLLED_NO_GRADE: 'totalEnrolledNoGrade',
  // NOT_PARTICIPATED: 'notParticipated',
}

const CourseCard = ({ course, filterType, onChange }) => {
  const { language } = useLanguage()
  const name = 'courseFilter'

  const onClick = (_, { value }) => onChange(value)

  const clear = () => {
    onChange(null)
  }

  return (
    <>
      <Label style={{ marginTop: '0.5rem' }}>
        {getTextIn(course?.course?.name, language)}

        <Dropdown
          text={filterTexts[filterType].label}
          value={filterType}
          fluid
          className="mini"
          button
          data-cy={`${name}-${course?.course?.code}-dropdown`}
          style={{ marginTop: '0.5rem' }}
        >
          <Dropdown.Menu>
            {Object.entries(filterTexts).map(([type, { label, info }]) => {
              if (info) {
                return (
                  <Popup
                    key={label}
                    basic
                    trigger={<Dropdown.Item text={label} value={type} onClick={onClick} />}
                    content={info}
                  />
                )
              }
              if (course?.students[translate[type]] && Object.keys(course?.students[translate[type]]).length === 0)
                return <Dropdown.Item key={label} text={label} value={type} onClick={onClick} disabled />
              return <Dropdown.Item key={label} text={label} value={type} onClick={onClick} />
            })}
          </Dropdown.Menu>
        </Dropdown>

        <Button
          compact
          size="tiny"
          onClick={clear}
          icon
          data-cy={`${name}-${course?.course?.code}-clear`}
          style={{ marginTop: '0.5rem' }}
        >
          <Icon name="close" />
        </Button>
      </Label>
    </>
  )
}

export default CourseCard
