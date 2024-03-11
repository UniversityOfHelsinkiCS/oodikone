import { oneOfType, number, string, bool } from 'prop-types'
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Segment, Label, Header, Divider, Form } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { setSelectedCourse } from '@/redux/singleCourseStats'
import { getCourseStats, getAvailableStats, getCourses } from '@/selectors/courseStats'
import { ConnectedSingleCourseStats as SingleCourseStats } from '../SingleCourseStats'

const CourseSelector = ({ courses, selected, setSelected }) => {
  const dispatch = useDispatch()
  const onCourseChange = (_, { value }) => {
    setSelected(value)
    dispatch(setSelectedCourse(value))
  }

  return (
    <>
      <Header as="h4">Select course</Header>
      <Form>
        <Form.Select data-cy="course-selector" fluid onChange={onCourseChange} options={courses} value={selected} />
      </Form>
      <Divider />
    </>
  )
}

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
          content={`${stats[selected].alternatives.map(code => ` ${code}`)} ${getTextIn(stats[selected].name)} `}
          key={stats[selected].coursecode}
        />
      </Segment>
      <SingleCourseStats
        availableStats={availableStats[selected]}
        stats={stats[selected]}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </div>
  )
}

SingleCourseTab.propTypes = {
  selected: oneOfType([number, string]).isRequired,
  userHasAccessToAllStats: bool.isRequired,
}
