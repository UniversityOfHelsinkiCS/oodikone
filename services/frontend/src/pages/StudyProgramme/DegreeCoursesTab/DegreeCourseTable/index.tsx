import { Fragment, useEffect, useState } from 'react'
import { Button, Dropdown, Icon, Label, Table } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useRemoveCourseExclusionMutation, useSetCourseExclusionMutation } from '@/redux/courseExclusions'
import { useAddProgressCriteriaCourseMutation } from '@/redux/progressCriteria'
import { Module, ProgressCriteria } from '@/shared/types'
import { isBachelorOrLicentiateProgramme, isMedicalProgramme } from '@/util/studyProgramme'

const getYear = (criterionYear: number) => {
  return {
    1: 'yearOne',
    2: 'yearTwo',
    3: 'yearThree',
    4: 'yearFour',
    5: 'yearFive',
    6: 'yearSix',
  }[criterionYear]
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

export const DegreeCourseTable = ({
  combinedProgramme,
  criteria,
  curriculumVersion,
  modules: initialModules,
  studyProgramme,
}: {
  combinedProgramme: string
  criteria: ProgressCriteria
  curriculumVersion: string[]
  modules: Module[]
  studyProgramme: string
}) => {
  const [visible, setVisible] = useState({})
  const { getTextIn } = useLanguage()
  const [modules, setModules] = useState(initialModules)
  const [setExclusion] = useSetCourseExclusionMutation()
  const [removeExclusion] = useRemoveCourseExclusionMutation()
  const [addProgressCriteriaCourse] = useAddProgressCriteriaCourseMutation()

  const version = curriculumVersion.join(',')
  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  const setModuleVisibility = (code, newVisibility) => {
    // Same course can be in many modules, so change them all
    const courseCodes = modules.find(module => module.moduleName === code).courses.map(course => course.code)
    setModules(
      modules.map(module => ({
        ...module,
        courses: module.courses.map(course => {
          if (courseCodes.includes(course.code)) {
            return {
              ...course,
              visible: { ...course.visible, visibility: newVisibility },
            }
          }
          return course
        }),
      }))
    )
  }

  const setCourseVisibility = (code, newVisibility) => {
    setModules(
      modules.map(mod => ({
        ...mod,
        courses: mod.courses.map(course => {
          if (course.code !== code) return course
          return {
            ...course,
            visible: { ...course.visible, visibility: newVisibility },
          }
        }),
      }))
    )
  }

  const isVisible = moduleCode => {
    if (!visible[version]) {
      setVisible[version] = {}
      return false
    }
    return visible[version][moduleCode]
  }

  const excludeAll = code => {
    const module = modules.find(module => module.moduleName === code)
    const excludeFromProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
    setExclusion({
      programmeCode: excludeFromProgramme,
      courseCodes: module.courses.filter(course => course.visible.visibility).map(course => course.code),
      curriculumVersion: version,
    })
    setModuleVisibility(code, false)
  }

  const deleteAll = code => {
    const module = modules.find(module => module.moduleName === code)
    removeExclusion({
      programmeCode: studyProgramme,
      courseCodes: module.courses.map(course => course.code),
      curriculumVersion: version,
    })
    setModuleVisibility(code, true)
  }

  const showAllButton = module => (
    <Button color="blue" onClick={() => deleteAll(module)}>
      Set visible
    </Button>
  )

  const hideAllButton = module => (
    <Button color="blue" onClick={() => excludeAll(module)}>
      Set hidden
    </Button>
  )

  const toggleVisible = code => {
    const newState = !isVisible(code)
    setVisible({ ...visible, [version]: { ...visible[version], [code]: newState } })
  }

  const calculateModuleVisibility = code => {
    const module = modules.find(module => module.moduleName === code)
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
          setExclusion({
            programmeCode: excludeFromProgramme,
            courseCodes: [course.code],
            curriculumVersion: version,
          })
          setCourseVisibility(course.code, false)
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
        removeExclusion({
          programmeCode: studyProgramme,
          courseCodes: [course.visible.id],
          curriculumVersion: version,
        })
        setCourseVisibility(course.code, true)
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
        void addProgressCriteriaCourse({
          programmeCode: studyProgramme,
          courses,
          year: criterionYear,
          version: curriculumVersion,
        })
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
        void addProgressCriteriaCourse({ programmeCode: studyProgramme, courses: filteredCourses, year: criterionYear })
      }}
    >
      {`Remove criterion for year ${criterionYear}`}
    </Button>
  )

  const labelDropdown = course => {
    if (isMedicalProgramme(studyProgramme)) {
      return (
        <Dropdown className="link item" text="Modify labels">
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
      <Dropdown className="link item" text="Modify labels">
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
          <Table.HeaderCell>Visibility label</Table.HeaderCell>
          {isBachelorOrLicentiateProgramme(studyProgramme) && <Table.HeaderCell>Criterion labels</Table.HeaderCell>}
          <Table.HeaderCell>
            {isBachelorOrLicentiateProgramme(studyProgramme) ? 'Set labels' : 'Set visibility'}
          </Table.HeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {modules.map(({ moduleName, courses }) => (
          <Fragment key={`fragment-${moduleName}`}>
            <Table.Row key={moduleName}>
              <Table.Cell onClick={() => toggleVisible(moduleName)} style={{ cursor: 'pointer' }}>
                <Icon name={isVisible(moduleName) ? 'angle down' : 'angle right'} />
                <b>{courses[0] && courses[0].parent_name ? getTextIn(courses[0].parent_name) : moduleName}</b>
              </Table.Cell>
              <Table.Cell>{moduleName}</Table.Cell>
              <Table.Cell>
                <Label
                  color={moduleVisibilityColor(calculateModuleVisibility(moduleName))}
                  content={calculateModuleVisibility(moduleName)}
                />
              </Table.Cell>
              {isBachelorOrLicentiateProgramme(studyProgramme) && <Table.Cell />}
              <Table.Cell>
                {calculateModuleVisibility(moduleName) === 'hidden'
                  ? showAllButton(moduleName)
                  : hideAllButton(moduleName)}
              </Table.Cell>
            </Table.Row>
            {isVisible(moduleName) &&
              courses
                .sort((a, b) => a.code.localeCompare(b.code))
                .map(course => (
                  <Table.Row key={`${moduleName}/${course.code}`}>
                    <Table.Cell>{getTextIn(course.name)}</Table.Cell>
                    <Table.Cell>{course.code}</Table.Cell>
                    <Table.Cell>
                      <Label
                        color={course.visible.visibility ? 'green' : 'red'}
                        content={course.visible.visibility ? 'visible' : 'hidden'}
                      />
                    </Table.Cell>
                    {isBachelorOrLicentiateProgramme(studyProgramme) && (
                      <Table.Cell>
                        {criteria?.courses?.yearOne?.includes(course.code) && <Label color="blue" content="year 1" />}
                        {criteria?.courses?.yearTwo?.includes(course.code) && <Label color="blue" content="year 2" />}
                        {criteria?.courses?.yearThree?.includes(course.code) && <Label color="blue" content="year 3" />}
                        {criteria?.courses?.yearFour?.includes(course.code) && <Label color="blue" content="year 4" />}
                        {criteria?.courses?.yearFive?.includes(course.code) && <Label color="blue" content="year 5" />}
                        {criteria?.courses?.yearSix?.includes(course.code) && <Label color="blue" content="year 6" />}
                      </Table.Cell>
                    )}
                    {isBachelorOrLicentiateProgramme(studyProgramme) ? (
                      <Table.Cell>{labelDropdown(course)}</Table.Cell>
                    ) : (
                      <Table.Cell>
                        {course.visible.visibility ? setExclusionButton(course) : deleteButton(course)}
                      </Table.Cell>
                    )}
                  </Table.Row>
                ))}
          </Fragment>
        ))}
      </Table.Body>
    </Table>
  )
}
