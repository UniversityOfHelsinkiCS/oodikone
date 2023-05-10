import React, { useEffect, useState } from 'react'
import { connect, useSelector, useDispatch } from 'react-redux'
import { string, func, object } from 'prop-types'
import { Button, Label, Table, Icon, Dropdown, Container, Message, Form } from 'semantic-ui-react'
import {
  useAddProgressCriteriaCourseMutation,
  useAddProgressCriteriaCreditsMutation,
} from 'redux/programmeProgressCriteria'
import { getTextIn } from '../../../common'
import { GetMandatoryCourseLabels } from '../../../redux/mandatoryCourseLabels'
import {
  setCourseExclusion,
  removeCourseExclusion,
  getMandatoryCourses,
} from '../../../redux/populationMandatoryCourses'
import useLanguage from '../../LanguagePicker/useLanguage'
import sendEvent from '../../../common/sendEvent'

const sendAnalytics = sendEvent.degreeCourses

const DegreeCourses = ({ studyProgramme, criteria, setCriteria, setExclusion, removeExclusion }) => {
  const { language } = useLanguage()
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const [visible, setVisible] = useState({})
  const [modules, setModules] = useState([])
  const [creditsLimit1, setCreditsLimit1] = useState('')
  const [creditsLimit2, setCreditsLimit2] = useState('')
  const [creditsLimit3, setCreditsLimit3] = useState('')
  const [creditsLimit4, setCreditsLimit4] = useState('')
  const [creditsLimit5, setCreditsLimit5] = useState('')
  const [creditsLimit6, setCreditsLimit6] = useState('')

  const [addProgressCriteriaCourse, { data: courseData }] = useAddProgressCriteriaCourseMutation()
  const [addProgressCriteriaCredits, { data: creditsData }] = useAddProgressCriteriaCreditsMutation()

  useEffect(() => {
    dispatch(getMandatoryCourses(studyProgramme, true))
  }, [])

  useEffect(() => {
    if (courseData) {
      setCriteria(courseData)
    }
  }, [courseData])

  useEffect(() => {
    if (creditsData) {
      setCriteria(creditsData)
    }
  }, [creditsData])

  useEffect(() => {
    // ELÄINLÄÄKKIS REVISIT
    if (!mandatoryCourses || !mandatoryCourses?.defaultProgrammeCourses?.length) return
    const modules = {}
    mandatoryCourses.defaultProgrammeCourses.forEach(course => {
      const code = course.label_code
      if (!modules[code]) {
        modules[code] = []
      }
      modules[code].push(course)
    })

    setModules(
      Object.entries(modules)
        .map(([module, courses]) => ({ module, courses, module_order: courses[0].module_order }))
        .sort((a, b) => a.module_order - b.module_order)
    )
  }, [mandatoryCourses])

  // WARNING STUPIDNESS AHEAD
  useEffect(() => {
    if (!modules[0]) return
    if (modules[0].module === 'undefined') {
      dispatch(getMandatoryCourses(studyProgramme, true))
    }
  }, [modules])

  const getYear = criterionYear => {
    if (criterionYear === 1) return 'yearOne'
    if (criterionYear === 2) return 'yearTwo'
    if (criterionYear === 3) return 'yearThree'
    if (criterionYear === 4) return 'yearFour'
    if (criterionYear === 5) return 'yearFive'
    return 'yearSix'
  }

  const setExclusionButton = course => (
    <Button
      color="blue"
      onClick={() => {
        setExclusion(studyProgramme, [course.code])
        sendAnalytics('Set hidden button pressed', studyProgramme, course.name.fi)
      }}
    >
      Set hidden
    </Button>
  )
  const deleteButton = course => (
    <Button
      color="blue"
      onClick={() => {
        removeExclusion(studyProgramme, [course.visible.id])
        sendAnalytics('Set visible button pressed', studyProgramme, course.name.fi)
      }}
    >
      Set visible
    </Button>
  )

  const setCriteriaButton = (course, criterionYear) => (
    <Button
      color="green"
      onClick={() => {
        const year = getYear(criterionYear)
        const courses = criteria.courses ? [...criteria.courses[year], course.code] : [course.code]
        addProgressCriteriaCourse({ programmeCode: studyProgramme, courses, year: criterionYear })
      }}
    >
      {`Set criterion for year ${criterionYear}`}
    </Button>
  )
  const deleteCriteriaButton = (course, criterionYear) => (
    <Button
      color="red"
      onClick={() => {
        const year = getYear(criterionYear)
        const filteredCourses = criteria?.courses[year]?.filter(courseCode => courseCode !== course.code)
        addProgressCriteriaCourse({ programmeCode: studyProgramme, courses: filteredCourses, year: criterionYear })
      }}
    >
      {`Remove criterion for year ${criterionYear}`}
    </Button>
  )

  const labelDropdown = course => {
    if (['MH30_001', 'MH30_003', 'KH90_001'].includes(studyProgramme)) {
      return (
        <Dropdown text="Modify labels" className="link item">
          <Dropdown.Menu>
            {course.visible.visibility ? setExclusionButton(course) : deleteButton(course)}
            <Dropdown.Divider />
            {criteria?.courses?.yearOne?.includes(course.code)
              ? deleteCriteriaButton(course, 1)
              : setCriteriaButton(course, 1)}
            <Dropdown.Divider />
            {criteria?.courses?.yearTwo?.includes(course.code)
              ? deleteCriteriaButton(course, 2)
              : setCriteriaButton(course, 2)}
            <Dropdown.Divider />
            {criteria?.courses?.yearThree?.includes(course.code)
              ? deleteCriteriaButton(course, 3)
              : setCriteriaButton(course, 3)}
            <Dropdown.Divider />
            {criteria?.courses?.yearFour?.includes(course.code)
              ? deleteCriteriaButton(course, 4)
              : setCriteriaButton(course, 4)}
            <Dropdown.Divider />
            {criteria?.courses?.yearFive?.includes(course.code)
              ? deleteCriteriaButton(course, 5)
              : setCriteriaButton(course, 5)}
            <Dropdown.Divider />
            {criteria?.courses?.yearSix?.includes(course.code)
              ? deleteCriteriaButton(course, 6)
              : setCriteriaButton(course, 6)}
          </Dropdown.Menu>
        </Dropdown>
      )
    }
    return (
      <Dropdown text="Modify labels" className="link item">
        <Dropdown.Menu>
          {course.visible.visibility ? setExclusionButton(course) : deleteButton(course)}
          <Dropdown.Divider />
          {criteria?.courses?.yearOne?.includes(course.code)
            ? deleteCriteriaButton(course, 1)
            : setCriteriaButton(course, 1)}
          <Dropdown.Divider />
          {criteria?.courses?.yearTwo?.includes(course.code)
            ? deleteCriteriaButton(course, 2)
            : setCriteriaButton(course, 2)}
          <Dropdown.Divider />
          {criteria?.courses?.yearThree?.includes(course.code)
            ? deleteCriteriaButton(course, 3)
            : setCriteriaButton(course, 3)}
        </Dropdown.Menu>
      </Dropdown>
    )
  }

  const setCreditsLimitCriteria = () => {
    const credits = {
      year1: creditsLimit1 === '' ? criteria.credits.yearOne : creditsLimit1,
      year2: creditsLimit2 === '' ? criteria.credits.yearTwo : creditsLimit2,
      year3: creditsLimit3 === '' ? criteria.credits.yearThree : creditsLimit3,
      year4: creditsLimit4 === '' ? criteria.credits.yearOne : creditsLimit4,
      year5: creditsLimit5 === '' ? criteria.credits.yearTwo : creditsLimit5,
      year6: creditsLimit6 === '' ? criteria.credits.yearThree : creditsLimit6,
    }
    addProgressCriteriaCredits({ programmeCode: studyProgramme, credits })
  }

  const excludeAll = code => {
    const module = modules.find(({ module }) => module === code)
    setExclusion(
      studyProgramme,
      module.courses.filter(c => c.visible.visibility).map(c => c.code)
    )
  }

  const deleteAll = code => {
    const module = modules.find(({ module }) => module === code)
    removeExclusion(
      studyProgramme,
      module.courses.map(c => c.visible.id)
    )
  }

  const showAllButton = module => (
    <Button
      color="blue"
      onClick={() => {
        deleteAll(module)
        sendAnalytics('ShowAllButton pressed', module)
      }}
    >
      Set visible
    </Button>
  )

  const hideAllButton = module => (
    <Button
      color="blue"
      onClick={() => {
        excludeAll(module)
        sendAnalytics('HideAllButton pressed', module)
      }}
    >
      Set hidden
    </Button>
  )

  const toggleVisible = code => {
    const newState = !visible[code]
    setVisible({ ...visible, [code]: newState })
    sendAnalytics(newState ? 'Expanded group' : 'Collapsed group', code)
  }

  const calculateModuleVisibility = code => {
    const module = modules.find(({ module }) => module === code)
    if (!module.courses) {
      return 'no courses'
    }
    if (module.courses.every(course => course.visible.visibility)) {
      return 'visible'
    }
    if (module.courses.every(course => !course.visible.visibility)) {
      return 'hidden'
    }
    return 'partial'
  }

  const moduleVisibilityColor = visibility => {
    switch (visibility) {
      case 'visible':
        return 'green'
      case 'hidden':
        return 'red'
      default:
        return 'yellow'
    }
  }

  return (
    <Container>
      {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
        <>
          <Container>
            <Message style={{ fontSize: '16px' }}>
              <Message.Header>
                Change visibility of degree courses and select criteria for academic years
              </Message.Header>
              <p>
                Here you can change visibility of degree courses as and set course and credits criteria, for each year
                their own. Credits criteria is computed as follows: for the first academic year the credits are taken
                into account if they are completed during the first 12 months. For the second year, we take into account
                the completions during the first 24 months, for the third year the first 36 months.
              </p>
              <p>The progress of the students by these criteria will be shown in class statistics view.</p>
            </Message>
            <h5>Credit criteria</h5>
            <Form>
              <Form.Group widths="equal">
                <Form.Input
                  type="number"
                  fluid
                  label={`First year (12 months) last set: ${criteria?.credits?.yearOne}`}
                  onChange={e => setCreditsLimit1(e.target.value)}
                />
                <Form.Input
                  type="number"
                  fluid
                  label={`Second year (24 months) last set: ${criteria?.credits?.yearTwo}`}
                  onChange={e => setCreditsLimit2(e.target.value)}
                />
                <Form.Input
                  type="number"
                  fluid
                  label={`Third year (36 months) last set: ${criteria?.credits?.yearThree}`}
                  onChange={e => setCreditsLimit3(e.target.value)}
                />
              </Form.Group>
              {['MH30_001', 'MH30_003', 'KH90_001'].includes(studyProgramme) && (
                <Form.Group widths="equal">
                  <Form.Input
                    type="number"
                    fluid
                    label={`Fourth year (48 months) last set: ${criteria?.credits?.yearFour}`}
                    onChange={e => setCreditsLimit4(e.target.value)}
                  />
                  <Form.Input
                    type="number"
                    fluid
                    label={`Fifth year (60 months) last set: ${criteria?.credits?.yearFive}`}
                    onChange={e => setCreditsLimit5(e.target.value)}
                  />
                  <Form.Input
                    type="number"
                    fluid
                    label={`Sixth year (72 months) last set: ${criteria?.credits?.yearSix}`}
                    onChange={e => setCreditsLimit6(e.target.value)}
                  />
                </Form.Group>
              )}
              <Form.Button color="green" content="Save credit changes" onClick={setCreditsLimitCriteria} />
            </Form>
          </Container>
        </>
      )}
      <Table>
        <Table.Header>
          <Table.Row key="HeaderRow">
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Code</Table.HeaderCell>
            <Table.HeaderCell>Visibility Label</Table.HeaderCell>
            {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
              <Table.HeaderCell>Criterion Labels</Table.HeaderCell>
            )}
            <Table.HeaderCell>
              {studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)
                ? 'Set Labels'
                : 'Set Visibility'}
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {modules.map(({ module, courses }) => (
            <React.Fragment key={`fragment-${module}`}>
              <Table.Row key={module}>
                <Table.Cell style={{ cursor: 'pointer' }} onClick={() => toggleVisible(module)}>
                  <Icon name={visible[module] ? 'angle down' : 'angle right'} />
                  <b>{courses[0] && courses[0].label_name ? getTextIn(courses[0].label_name, language) : module}</b>
                </Table.Cell>
                <Table.Cell>{module}</Table.Cell>
                <Table.Cell>
                  <Label
                    content={calculateModuleVisibility(module)}
                    color={moduleVisibilityColor(calculateModuleVisibility(module))}
                  />
                </Table.Cell>
                {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && <Table.Cell />}
                <Table.Cell>
                  {calculateModuleVisibility(module) === 'hidden' ? showAllButton(module) : hideAllButton(module)}
                </Table.Cell>
              </Table.Row>
              {visible[module] &&
                courses
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(course => (
                    <Table.Row key={`${module}/${course.code}`}>
                      <Table.Cell>{getTextIn(course.name, language)}</Table.Cell>
                      <Table.Cell>{course.code}</Table.Cell>
                      <Table.Cell>
                        <Label
                          content={course.visible.visibility ? 'visible' : 'hidden'}
                          color={course.visible.visibility ? 'green' : 'red'}
                        />
                      </Table.Cell>
                      {(studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme)) && (
                        <Table.Cell>
                          {criteria?.courses?.yearOne?.includes(course.code) && <Label content="year 1" color="blue" />}
                          {criteria?.courses?.yearTwo?.includes(course.code) && <Label content="year 2" color="blue" />}
                          {criteria?.courses?.yearThree?.includes(course.code) && (
                            <Label content="year 3" color="blue" />
                          )}
                          {criteria?.courses?.yearFour?.includes(course.code) && (
                            <Label content="year 4" color="blue" />
                          )}
                          {criteria?.courses?.yearFive?.includes(course.code) && (
                            <Label content="year 5" color="blue" />
                          )}
                          {criteria?.courses?.yearSix?.includes(course.code) && <Label content="year 6" color="blue" />}
                        </Table.Cell>
                      )}
                      {studyProgramme.includes('KH') || ['MH30_001', 'MH30_003'].includes(studyProgramme) ? (
                        <Table.Cell>{labelDropdown(course)}</Table.Cell>
                      ) : (
                        <Table.Cell>
                          {course.visible.visibility ? setExclusionButton(course) : deleteButton(course)}
                        </Table.Cell>
                      )}
                    </Table.Row>
                  ))}
            </React.Fragment>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

DegreeCourses.propTypes = {
  studyProgramme: string.isRequired,
  removeExclusion: func.isRequired,
  setExclusion: func.isRequired,
  criteria: object.isRequired,
  setCriteria: func.isRequired,
}

const mapStateToProps = ({ mandatoryCourseLabels }) => ({
  labels: mandatoryCourseLabels.data,
})

const mapDispatchToProps = dispatch => ({
  getLabels: studyProgramme => dispatch(GetMandatoryCourseLabels(studyProgramme)),
  setExclusion: (programmecode, coursecode) => dispatch(setCourseExclusion(programmecode, coursecode)),
  removeExclusion: (programmecode, coursecode, id) => dispatch(removeCourseExclusion(programmecode, coursecode, id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(DegreeCourses)
