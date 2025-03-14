import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Fragment, useEffect, useState } from 'react'
import { Label } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useRemoveCourseExclusionMutation, useSetCourseExclusionMutation } from '@/redux/courseExclusions'
import { Module, ProgrammeCourse, ProgressCriteria } from '@/shared/types'
import { CourseVisibility } from '@/types/courseVisibility'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { LabelSelect } from './LabelSelect'
import { VisibilityChip } from './VisibilityChip'

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

  const version = curriculumVersion.join(',')
  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  const getModule = (moduleCode: string) => modules.find(module => module.code === moduleCode)!

  const setModuleVisibility = (moduleCode: string, newVisibility: boolean) => {
    // Same course can be in many modules, so change them all
    const courseCodes = getModule(moduleCode).courses.map(course => course.code)
    setModules(
      modules.map(module => ({
        ...module,
        courses: module.courses.map(course => {
          if (courseCodes.includes(course.code)) {
            return {
              ...course,
              visible: { ...course.visible, visibility: newVisibility },
            } as ProgrammeCourse
          }
          return course
        }),
      }))
    )
  }

  const setCourseVisibility = (moduleCode: string, newVisibility: boolean) => {
    setModules(
      modules.map(module => ({
        ...module,
        courses: module.courses.map(course => {
          if (course.code !== moduleCode) {
            return course
          }
          return {
            ...course,
            visible: { ...course.visible, visibility: newVisibility },
          } as ProgrammeCourse
        }),
      }))
    )
  }

  const isVisible = (moduleCode: string) => {
    if (!visible[version]) {
      setVisible[version] = {}
      return false
    }
    return visible[version][moduleCode]
  }

  const excludeAll = (moduleCode: string) => {
    const module = getModule(moduleCode)
    const excludeFromProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
    void setExclusion({
      courseCodes: module.courses.filter(course => course.visible.visibility).map(course => course.code),
      curriculumVersion: version,
      programmeCode: excludeFromProgramme,
    })
    setModuleVisibility(moduleCode, false)
  }

  const deleteAll = (moduleCode: string) => {
    const module = getModule(moduleCode)
    void removeExclusion({
      courseCodes: module.courses.map(course => course.code),
      curriculumVersion: version,
      programmeCode: studyProgramme,
    })
    setModuleVisibility(moduleCode, true)
  }

  const showAllButton = (moduleCode: string) => (
    <Button color="primary" onClick={() => deleteAll(moduleCode)}>
      Set visible
    </Button>
  )

  const hideAllButton = (moduleCode: string) => (
    <Button color="primary" onClick={() => excludeAll(moduleCode)}>
      Set hidden
    </Button>
  )

  const toggleVisible = (moduleCode: string) => {
    const newState = !isVisible(moduleCode)
    setVisible({ ...visible, [version]: { ...visible[version], [moduleCode]: newState } })
  }

  const setExclusionButton = (course: ProgrammeCourse) => {
    const excludeFromProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
    return (
      <Button
        color="primary"
        onClick={() => {
          void setExclusion({
            courseCodes: [course.code],
            curriculumVersion: version,
            programmeCode: excludeFromProgramme,
          })
          setCourseVisibility(course.code, false)
        }}
      >
        Set hidden
      </Button>
    )
  }

  const deleteButton = (course: ProgrammeCourse) => (
    <Button
      color="primary"
      onClick={() => {
        void removeExclusion({
          courseCodes: course.visible.id ? [course.visible.id] : [],
          curriculumVersion: version,
          programmeCode: studyProgramme,
        })
        setCourseVisibility(course.code, true)
      }}
    >
      Set visible
    </Button>
  )

  const getVisibility = (moduleCode: string) => {
    const module = getModule(moduleCode)
    if (!module.courses) {
      return CourseVisibility.NO_COURSES
    }
    if (module.courses.every(course => course.visible.visibility)) {
      return CourseVisibility.VISIBLE
    }
    if (module.courses.every(course => !course.visible.visibility)) {
      return CourseVisibility.HIDDEN
    }
    return CourseVisibility.PARTIAL
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Code</TableCell>
            <TableCell>Visibility</TableCell>
            {isBachelorOrLicentiateProgramme(studyProgramme) && <TableCell>Criterion labels</TableCell>}
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {modules.map(({ code: moduleCode, courses }) => (
            <Fragment key={`${moduleCode}-fragment`}>
              <TableRow key={moduleCode}>
                <TableCell>
                  <Box alignItems="center" display="flex" justifyContent="left">
                    <IconButton onClick={() => toggleVisible(moduleCode)} size="small">
                      {isVisible(moduleCode) ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                    <Typography variant="body2">
                      {courses[0] && courses[0].parent_name ? getTextIn(courses[0].parent_name) : moduleCode}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{moduleCode}</TableCell>
                <TableCell>
                  <VisibilityChip visibility={getVisibility(moduleCode)} />
                </TableCell>
                {isBachelorOrLicentiateProgramme(studyProgramme) && <TableCell />}
                <TableCell>
                  {getVisibility(moduleCode) === CourseVisibility.HIDDEN
                    ? showAllButton(moduleCode)
                    : hideAllButton(moduleCode)}
                </TableCell>
              </TableRow>
              {isVisible(moduleCode) &&
                courses
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(course => (
                    <TableRow key={`${moduleCode}/${course.code}`}>
                      <TableCell>{getTextIn(course.name)}</TableCell>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>
                        <VisibilityChip visibility={getVisibility(moduleCode)} />
                      </TableCell>
                      {isBachelorOrLicentiateProgramme(studyProgramme) && (
                        <TableCell>
                          {criteria.courses.yearOne.includes(course.code) && <Label color="blue" content="year 1" />}
                          {criteria.courses.yearTwo.includes(course.code) && <Label color="blue" content="year 2" />}
                          {criteria.courses.yearThree.includes(course.code) && <Label color="blue" content="year 3" />}
                          {criteria.courses.yearFour.includes(course.code) && <Label color="blue" content="year 4" />}
                          {criteria.courses.yearFive.includes(course.code) && <Label color="blue" content="year 5" />}
                          {criteria.courses.yearSix.includes(course.code) && <Label color="blue" content="year 6" />}
                        </TableCell>
                      )}
                      {isBachelorOrLicentiateProgramme(studyProgramme) ? (
                        <TableCell>
                          <LabelSelect course={course} criteria={criteria} studyProgramme={studyProgramme} />
                        </TableCell>
                      ) : (
                        <TableCell>
                          {course.visible.visibility ? setExclusionButton(course) : deleteButton(course)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
