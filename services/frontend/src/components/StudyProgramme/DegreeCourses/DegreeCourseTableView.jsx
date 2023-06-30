import React, { useState } from 'react'
import { Button, Label, Table, Icon, Dropdown } from 'semantic-ui-react'
import useLanguage from '../../LanguagePicker/useLanguage'

const getYear = criterionYear => {
  if (criterionYear === 1) return 'yearOne'
  if (criterionYear === 2) return 'yearTwo'
  if (criterionYear === 3) return 'yearThree'
  if (criterionYear === 4) return 'yearFour'
  if (criterionYear === 5) return 'yearFive'
  return 'yearSix'
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

const DegreeCourseTableView = ({
  modules,
  studyProgramme,
  combinedProgramme,
  criteria,
  setExclusion,
  removeExclusion,
  addProgressCriteriaCourse,
}) => {
  const [visible, setVisible] = useState({})
  const { getTextIn } = useLanguage()

  const excludeAll = code => {
    const module = modules.find(({ module }) => module === code)
    const excludeFromProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
    setExclusion(
      studyProgramme,
      excludeFromProgramme,
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
      }}
    >
      Set hidden
    </Button>
  )

  const toggleVisible = code => {
    const newState = !visible[code]
    setVisible({ ...visible, [code]: newState })
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

  const setExclusionButton = course => {
    const excludeFromProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
    return (
      <Button
        color="blue"
        onClick={() => {
          setExclusion(studyProgramme, excludeFromProgramme, [course.code])
        }}
      >
        Set hidden
      </Button>
    )
  }
  const deleteButton = course => (
    <Button
      color="blue"
      onClick={() => {
        removeExclusion(studyProgramme, [course.visible.id])
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
  return (
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
                <b>{courses[0] && courses[0].label_name ? getTextIn(courses[0].label_name) : module}</b>
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
                    <Table.Cell>{getTextIn(course.name)}</Table.Cell>
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
                        {criteria?.courses?.yearThree?.includes(course.code) && <Label content="year 3" color="blue" />}
                        {criteria?.courses?.yearFour?.includes(course.code) && <Label content="year 4" color="blue" />}
                        {criteria?.courses?.yearFive?.includes(course.code) && <Label content="year 5" color="blue" />}
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
  )
}
export default DegreeCourseTableView
