import { useDispatch, useSelector } from 'react-redux'
import { Divider, Form, Header, Label, Segment } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { setSelectedCourse } from '@/redux/singleCourseStats'
import { getAvailableStats, getCourses, getCourseStats } from '@/selectors/courseStats'
import { SingleCourseStats } from './SingleCourseStats'

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

const CourseLabel = ({ code, name, primary }) => (
  <Label color={primary ? 'blue' : undefined} size="large" style={{ marginBottom: 5, marginRight: 5 }}>
    {code} {name}
  </Label>
)

export const CourseTab = ({ selected, setSelected, userHasAccessToAllStats }) => {
  const { getTextIn } = useLanguage()
  const stats = useSelector(getCourseStats)
  const availableStats = useSelector(getAvailableStats)
  const courses = useSelector(getCourses).map(({ code, name }) => ({
    key: code,
    value: code,
    text: `${getTextIn(name)} (${code})`,
  }))

  if (!stats[selected]) {
    return null
  }

  const hasSubstitutions = stats[selected].alternatives.length > 1

  return (
    <div>
      <Segment>
        <Header as="h4">{hasSubstitutions ? 'Selected courses' : 'Selected course'}</Header>
        {courses.length > 1 && <CourseSelector courses={courses} selected={selected} setSelected={setSelected} />}
        {hasSubstitutions && <Header as="h5">Course</Header>}
        <CourseLabel code={selected} key={selected} name={getTextIn(stats[selected].name)} primary />
        {hasSubstitutions && <Header as="h5">Substitutions</Header>}
        {stats[selected].alternatives
          .filter(course => course.code !== selected)
          .map(course => (
            <CourseLabel code={course.code} key={course.code} name={getTextIn(course.name)} />
          ))}
      </Segment>
      <SingleCourseStats
        availableStats={availableStats[selected]}
        stats={stats[selected]}
        userHasAccessToAllStats={userHasAccessToAllStats}
      />
    </div>
  )
}
