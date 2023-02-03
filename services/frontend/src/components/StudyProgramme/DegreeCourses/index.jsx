import React, { useEffect, useState } from 'react'
import { connect, useSelector, useDispatch } from 'react-redux'
import { string, func } from 'prop-types'
import { Button, Label, Table, Icon, Dropdown, Container, Message, Form } from 'semantic-ui-react'
import {
  useGetProgressCriteriaQuery,
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

const DegreeCourses = ({ studyProgramme, emptyCriteria, setExclusion, removeExclusion }) => {
  const { language } = useLanguage()
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const progressCriteria = useGetProgressCriteriaQuery({ programmeCode: studyProgramme })
  const [visible, setVisible] = useState({})
  const [modules, setModules] = useState([])
  const [creditsLimit1, setCreditsLimit1] = useState('')
  const [creditsLimit2, setCreditsLimit2] = useState('')
  const [creditsLimit3, setCreditsLimit3] = useState('')
  const [criteria, setCriteria] = useState(progressCriteria?.data ? progressCriteria.data : emptyCriteria)
  const [addProgressCriteriaCourse, { data: courseData }] = useAddProgressCriteriaCourseMutation()
  const [addProgressCriteriaCredits, { data: creditsData }] = useAddProgressCriteriaCreditsMutation()

  useEffect(() => {
    dispatch(getMandatoryCourses(studyProgramme, true))
  }, [])

  useEffect(() => {
    if (progressCriteria.data) {
      setCriteria(progressCriteria.data)
      setCreditsLimit1(progressCriteria.data.credits.yearOne)
      setCreditsLimit2(progressCriteria.data.credits.yearTwo)
      setCreditsLimit3(progressCriteria.data.credits.yearThree)
    }
  }, [progressCriteria.data])

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
    if (!mandatoryCourses || !mandatoryCourses.length) return
    const modules = {}
    mandatoryCourses.forEach(course => {
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
    let year = 'yearOne'
    if (criterionYear !== 1) {
      year = criterionYear === 2 ? 'yearTwo' : 'yearThree'
    }
    return year
  }

  const setExclusionButton = course => (
    <Button
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
    const credits = { year1: creditsLimit1, year2: creditsLimit2, year3: creditsLimit3 }
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
    <>
      {studyProgramme.includes('KH') && (
        <>
          <Message style={{ fontSize: '16px' }}>
            <Message.Header>Change visibility of degree courses and select criteria for academic years</Message.Header>
            <p>
              Here you can change visibility of degree courses as and set course and credits criteria. Each academic
              year have their own course and credits criteria. The progress of the students by these criteria will be
              shown in class statistics view. These statistics will be available at the latest at Friday on 10.2..
            </p>
          </Message>
          <Container>
            <h5>Credit criteria</h5>
            <Form>
              <Form.Group widths="equal">
                <Form.Input
                  type="number"
                  fluid
                  label="First year (12 months)"
                  placeholder={criteria?.credits?.yearOne}
                  onChange={e => setCreditsLimit1(e.target.value)}
                />
                <Form.Input
                  type="number"
                  fluid
                  label="Second year (24 months)"
                  placeholder={criteria?.credits?.yearTwo}
                  onChange={e => setCreditsLimit2(e.target.value)}
                />
                <Form.Input
                  type="number"
                  fluid
                  label="Third year (36 months)"
                  placeholder={criteria?.credits?.yearThree}
                  onChange={e => setCreditsLimit3(e.target.value)}
                />
              </Form.Group>
              <Form.Button content="Save credit changes" onClick={setCreditsLimitCriteria} />
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
            {studyProgramme.includes('KH') && <Table.HeaderCell>Criterion Labels</Table.HeaderCell>}
            <Table.HeaderCell>{studyProgramme.includes('KH') ? 'Set Labels' : 'Set Visibility'}</Table.HeaderCell>
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
                {studyProgramme.includes('KH') && <Table.Cell />}
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
                      {studyProgramme.includes('KH') && (
                        <Table.Cell>
                          {criteria?.courses?.yearOne?.includes(course.code) && <Label content="year 1" color="blue" />}
                          {criteria?.courses?.yearTwo?.includes(course.code) && <Label content="year 2" color="blue" />}
                          {criteria?.courses?.yearThree?.includes(course.code) && (
                            <Label content="year 3" color="blue" />
                          )}
                        </Table.Cell>
                      )}
                      {studyProgramme.includes('KH') ? (
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
    </>
  )
}

DegreeCourses.propTypes = {
  studyProgramme: string.isRequired,
  removeExclusion: func.isRequired,
  setExclusion: func.isRequired,
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
