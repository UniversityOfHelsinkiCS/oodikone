import React, { useEffect, useState } from 'react'
import { connect, useSelector, useDispatch } from 'react-redux'
import { string, func } from 'prop-types'
import { Button, Label, Table, Icon } from 'semantic-ui-react'
import { getTextIn } from '../../../common'
import { GetMandatoryCourseLabels } from '../../../redux/mandatoryCourseLabels'
import {
  setCourseExclusion,
  removeCourseExclusion,
  getMandatoryCourses
} from '../../../redux/populationMandatoryCourses'
import useLanguage from '../../LanguagePicker/useLanguage'

const MandatoryCourseTable = ({ studyProgramme, setExclusion, removeExclusion }) => {
  const { language } = useLanguage()
  const dispatch = useDispatch()
  const mandatoryCourses = useSelector(({ populationMandatoryCourses }) => populationMandatoryCourses.data)
  const [visible, setVisible] = useState({})
  const [modules, setModules] = useState([])

  useEffect(() => {
    dispatch(getMandatoryCourses(studyProgramme, true))
  }, [])

  useEffect(() => {
    if (!mandatoryCourses) return
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

  const setExclusionButton = code => <Button onClick={() => setExclusion(studyProgramme, [code])}>Set hidden</Button>
  const deleteButton = id => <Button onClick={() => removeExclusion(studyProgramme, [id])}>Set visible</Button>

  const excludeAll = code => {
    const module = modules.find(({ module }) => module === code)
    setExclusion(studyProgramme, module.courses.filter(c => c.visible.visibility).map(c => c.code))
  }

  const deleteAll = code => {
    const module = modules.find(({ module }) => module === code)
    removeExclusion(studyProgramme, module.courses.map(c => c.visible.id))
  }

  const showAllButton = module => <Button onClick={() => deleteAll(module)}>Set visible</Button>
  const hideAllButton = module => <Button onClick={() => excludeAll(module)}>Set hidden</Button>

  const toggleVisible = code => {
    const newState = !visible[code]
    setVisible({ ...visible, [code]: newState })
  }

  const calculateModuleVisibility = code => {
    const module = modules.find(({ module }) => module === code)
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
    <Table>
      <Table.Header>
        <Table.HeaderCell>Name</Table.HeaderCell>
        <Table.HeaderCell>Label</Table.HeaderCell>
        <Table.HeaderCell>Set visibility</Table.HeaderCell>
      </Table.Header>
      <Table.Body>
        {modules.map(({ module, courses }) => (
          <>
            <Table.Row key={module}>
              <Table.Cell style={{ cursor: 'pointer' }} onClick={() => toggleVisible(module)}>
                <Icon name={visible[module] ? 'angle down' : 'angle right'} />
                <b>{courses[0].label_name ? courses[0].label_name[language] : module}</b>
              </Table.Cell>
              <Table.Cell>
                <Label
                  content={calculateModuleVisibility(module)}
                  color={moduleVisibilityColor(calculateModuleVisibility(module))}
                />
              </Table.Cell>
              <Table.Cell>
                {calculateModuleVisibility(module) === 'hidden' ? showAllButton(module) : hideAllButton(module)}
              </Table.Cell>
            </Table.Row>
            {visible[module] &&
              courses.map(course => (
                <Table.Row key={`${module}/${course.code}`}>
                  <Table.Cell>{getTextIn(course.name, language)}</Table.Cell>
                  <Table.Cell>
                    <Label
                      content={course.visible.visibility ? 'visible' : 'hidden'}
                      color={course.visible.visibility ? 'green' : 'red'}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {course.visible.visibility ? setExclusionButton(course.code) : deleteButton(course.visible.id)}
                  </Table.Cell>
                </Table.Row>
              ))}
          </>
        ))}
      </Table.Body>
    </Table>
  )
}

MandatoryCourseTable.propTypes = {
  studyProgramme: string.isRequired,
  removeExclusion: func.isRequired,
  setExclusion: func.isRequired
}

const mapStateToProps = ({ mandatoryCourseLabels }) => ({
  labels: mandatoryCourseLabels.data
})

const mapDispatchToProps = dispatch => ({
  getLabels: studyProgramme => dispatch(GetMandatoryCourseLabels(studyProgramme)),
  setExclusion: (programmecode, coursecode) => dispatch(setCourseExclusion(programmecode, coursecode)),
  removeExclusion: (programmecode, coursecode, id) => dispatch(removeCourseExclusion(programmecode, coursecode, id))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MandatoryCourseTable)
