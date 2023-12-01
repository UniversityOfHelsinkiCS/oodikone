import React from 'react'
import { useSelector } from 'react-redux'
import { Segment, Label, Header, Divider, Form } from 'semantic-ui-react'
import { oneOfType, number, string, bool } from 'prop-types'

import { getCourseStats, getAvailableStats, getCourses } from 'selectors/courseStats'
import { useLanguage } from 'components/LanguagePicker/useLanguage'
import { ConnectedSingleCourseStats as SingleCourseStats } from '../SingleCourseStats'

const CourseSelector = ({ courses, selected, setSelected }) => (
  <>
    <Header as="h4">Select course</Header>
    <Form>
      <Form.Select fluid options={courses} onChange={(e, { value }) => setSelected(value)} value={selected} />
    </Form>
    <Divider />
  </>
)

export const SingleCourseTab = ({ selected, setSelected, userHasAccessToAllStats }) => {
  const { getTextIn } = useLanguage()
  const stats = useSelector(getCourseStats)
  const availableStats = useSelector(getAvailableStats)
  const courses = useSelector(getCourses).map(({ code, name }) => ({
    key: code,
    value: code,
    text: `${getTextIn(name)} (${code})`,
  }))

  if (!stats[selected]) return null

  return (
    <div>
      <Segment>
        {courses.length > 1 && <CourseSelector courses={courses} selected={selected} setSelected={setSelected} />}
        <Label
          key={stats[selected].coursecode}
          content={`${stats[selected].alternatives.map(code => ` ${code}`)} ${getTextIn(stats[selected].name)} `}
        />
      </Segment>
      <SingleCourseStats
        stats={stats[selected]}
        userHasAccessToAllStats={userHasAccessToAllStats}
        availableStats={availableStats[selected]}
      />
    </div>
  )
}

SingleCourseTab.propTypes = {
  selected: oneOfType([number, string]).isRequired,
  userHasAccessToAllStats: bool.isRequired,
}
