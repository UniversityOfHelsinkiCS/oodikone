import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon,
} from '@mui/icons-material'
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Fragment, useEffect, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useRemoveCourseExclusionMutation, useSetCourseExclusionMutation } from '@/redux/courseExclusions'
import { CourseVisibility } from '@/types/courseVisibility'
import { isBachelorOrLicentiateProgramme } from '@/util/studyProgramme'
import { Module, ProgrammeCourse, ProgressCriteria } from '@oodikone/shared/types'
import { CriterionLabelSelectButton } from './CriterionLabelSelectButton'
import { ToggleVisibilityButton } from './ToggleVisibilityButton'
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
  const [moduleCoursesVisible, setModuleCoursesVisible] = useState<Record<string, Record<string, boolean>>>({})
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

  const areModuleCoursesVisible = (moduleCode: string) => {
    if (!moduleCoursesVisible[version]) {
      setModuleCoursesVisible[version] = {}
      return false
    }
    return moduleCoursesVisible[version][moduleCode]
  }

  const excludeOne = (course: ProgrammeCourse) => {
    void setExclusion({
      courseCodes: [course.code],
      curriculumVersion: version,
      programmeCode: combinedProgramme === '' ? studyProgramme : combinedProgramme,
    })
    setCourseVisibility(course.code, false)
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

  const removeOne = (course: ProgrammeCourse) => {
    void removeExclusion({
      courseCodes: course.visible.id ? [course.visible.id] : [],
      curriculumVersion: version,
      programmeCode: studyProgramme,
    })
    setCourseVisibility(course.code, true)
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

  const toggleVisible = (moduleCode: string) => {
    const newState = !areModuleCoursesVisible(moduleCode)
    setModuleCoursesVisible({
      ...moduleCoursesVisible,
      [version]: { ...moduleCoursesVisible[version], [moduleCode]: newState },
    })
  }

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
      <Table data-cy="degree-course-table" size="small">
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
                      {areModuleCoursesVisible(moduleCode) ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                    </IconButton>
                    <Typography fontWeight="bold" variant="body2">
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
                  <ToggleVisibilityButton
                    onClick={() =>
                      getVisibility(moduleCode) === CourseVisibility.HIDDEN
                        ? deleteAll(moduleCode)
                        : excludeAll(moduleCode)
                    }
                    visible={getVisibility(moduleCode) !== CourseVisibility.HIDDEN}
                  />
                </TableCell>
              </TableRow>
              {areModuleCoursesVisible(moduleCode) &&
                courses
                  .sort((a, b) => a.code.localeCompare(b.code))
                  .map(course => (
                    <TableRow key={`${moduleCode}/${course.code}`} sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>{getTextIn(course.name)}</TableCell>
                      <TableCell>{course.code}</TableCell>
                      <TableCell>
                        <VisibilityChip visibility={getVisibility(moduleCode)} />
                      </TableCell>
                      {isBachelorOrLicentiateProgramme(studyProgramme) && (
                        <TableCell>
                          {Object.values(criteria.courses).length > 0 ? (
                            <Stack direction="row" gap={1}>
                              {Object.keys(criteria.courses).map(
                                (year, index) =>
                                  criteria.courses[year].includes(course.code) && (
                                    <Chip color="primary" key={year} label={`year ${index + 1}`} size="small" />
                                  )
                              )}
                            </Stack>
                          ) : (
                            <Typography color="text.secondary" variant="body2">
                              No labels set
                            </Typography>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Stack direction="row" gap={1}>
                          <ToggleVisibilityButton
                            onClick={() => (course.visible.visibility ? excludeOne(course) : removeOne(course))}
                            visible={course.visible.visibility}
                          />
                          {isBachelorOrLicentiateProgramme(studyProgramme) && (
                            <CriterionLabelSelectButton
                              course={course}
                              criteria={criteria}
                              studyProgramme={studyProgramme}
                            />
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
