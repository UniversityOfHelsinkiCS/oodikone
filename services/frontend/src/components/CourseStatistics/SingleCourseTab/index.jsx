import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Segment, Label, Header, Divider, Form } from 'semantic-ui-react'
import { oneOfType, number, string, bool } from 'prop-types'
import { ConnectedSingleCourseStats as SingleCourseStats } from '../SingleCourseStats'
import { useLanguage } from '../../LanguagePicker/useLanguage'
import { getCourseStats, getAvailableStats, getCourses } from '../../../selectors/courseStats'

export const SingleCourseTab = ({ selected, userHasAccessToAllStats }) => {
  const [selection, setSelection] = useState(selected)
  const { getTextIn } = useLanguage()
  const stats = useSelector(getCourseStats)
  const availableStats = useSelector(getAvailableStats)
  const courses = useSelector(getCourses).map(({ code, name }) => ({
    key: code,
    value: code,
    text: <Header content={name} />,
    content: name,
  }))

  useEffect(() => {
    setSelection(selected)
  }, [selected])

  if (!stats[selection]) return null

  return (
    <div>
      <Segment>
        <Form>
          {courses ? (
            courses.text
          ) : (
            <Form.Dropdown
              name="selected"
              options={courses}
              onChange={(e, { value }) => setSelection(value)}
              value={selection || courses.value}
              selectOnBlur={false}
              selectOnNavigation={false}
            />
          )}
          <Divider />
          <Label.Group>
            <Label
              key={stats[selection].coursecode}
              content={`${stats[selection].alternatives.map(code => ` ${code}`)} ${getTextIn(stats[selection].name)} `}
            />
          </Label.Group>
        </Form>
      </Segment>
      {selection && (
        <SingleCourseStats
          stats={stats[selection]}
          userHasAccessToAllStats={userHasAccessToAllStats}
          availableStats={availableStats[selected]}
        />
      )}
    </div>
  )
}

SingleCourseTab.propTypes = {
  selected: oneOfType([number, string]).isRequired,
  userHasAccessToAllStats: bool.isRequired,
}
