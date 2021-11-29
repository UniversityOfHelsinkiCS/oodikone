import React from 'react'
import { Label, Dropdown, Button, Icon, Popup } from 'semantic-ui-react'
import { getTextIn } from '../../../../common'
import useAnalytics from '../../useAnalytics'
import useLanguage from '../../../LanguagePicker/useLanguage'
import { FilterType } from './filterType'

const filterTexts = {
  [FilterType.ALL]: { label: 'All' },
  [FilterType.PASSED]: { label: 'Passed' },
  [FilterType.PASSED_AFTER_FAILURE]: { label: 'Passed After Failure' },
  [FilterType.FAILED]: { label: 'Failed' },
  [FilterType.FAILED_MANY_TIMES]: { label: 'Failed Multiple Times' },
  [FilterType.NOT_PARTICIPATED]: { label: 'Not Participated' },
  [FilterType.DID_NOT_PASS]: { label: "Didn't Pass" },
}

const CourseCard = ({ course, filterType, onChange }) => {
  const { language } = useLanguage()
  const analytics = useAnalytics()
  const name = 'course-filter'

  const onClick = (_, { value }) => onChange(value)

  const clear = () => {
    onChange(null)
    analytics.clearFilter(course.code)
  }

  return (
    <>
      <Label style={{ marginTop: '0.5rem' }}>
        {getTextIn(course.name, language)}

        <Dropdown
          text={filterTexts[filterType].label}
          value={filterType}
          fluid
          className="mini"
          button
          data-cy={`${name}-dropdown`}
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
              return <Dropdown.Item key={label} text={label} value={type} onClick={onClick} />
            })}
          </Dropdown.Menu>
        </Dropdown>

        <Button compact size="tiny" onClick={clear} icon data-cy={`${name}-clear`} style={{ marginTop: '0.5rem' }}>
          <Icon name="close" />
        </Button>
      </Label>
    </>
  )
}

export default CourseCard
