import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { Fragment, useEffect, useState } from 'react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useStatusNotification } from '@/components/StatusNotification/Context'
import { CriteriaYearOption, getCriteriaYears } from '@/pages/StudyProgramme/DegreeCoursesTab/criteriaYears'
import { VisibilitySwitch } from '@/pages/StudyProgramme/DegreeCoursesTab/DegreeCourseTable/VisibilitySwitch'
import { useRemoveCourseExclusionMutation, useSetCourseExclusionMutation } from '@/redux/courseExclusions'
import { useAddProgressCriteriaCourseMutation } from '@/redux/progressCriteria'
import { KeyboardArrowDownIcon, KeyboardArrowRightIcon } from '@/theme'
import { CourseVisibility } from '@/types/courseVisibility'
import { Module, ProgrammeCourse, ProgressCriteria } from '@oodikone/shared/types'
import { StyledTable } from '@/components/common/StyledTable'

const reloadNote = 'Reload the page to see the change in other views.'

export const DegreeCourseTable = ({
  combinedProgramme,
  criteria,
  curriculumVersion,
  modules: initialModules,
  showCriteria,
  showVisibility,
  studyProgramme,
}: {
  combinedProgramme: string
  criteria: ProgressCriteria
  curriculumVersion: string[]
  modules: Module[]
  showCriteria: boolean
  showVisibility: boolean
  studyProgramme: string
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, Record<string, boolean>>>({})
  const { getTextIn } = useLanguage()
  const { setStatusNotification } = useStatusNotification()
  const [modules, setModules] = useState(initialModules)
  // Unsaved criteria changes, discarded when updated criteria arrive from the server
  const [pendingCriteria, setPendingCriteria] = useState<{
    courses: ProgressCriteria['courses']
    source: ProgressCriteria
  } | null>(null)
  const [moduleToHide, setModuleToHide] = useState<string | null>(null)
  const [setExclusion] = useSetCourseExclusionMutation()
  const [removeExclusion] = useRemoveCourseExclusionMutation()
  const [addProgressCriteriaCourse] = useAddProgressCriteriaCourseMutation()

  const version = curriculumVersion.join(',')
  const exclusionProgramme = combinedProgramme === '' ? studyProgramme : combinedProgramme
  const criteriaYears = showCriteria ? getCriteriaYears(studyProgramme) : []
  const criteriaCourses = pendingCriteria?.source === criteria ? pendingCriteria.courses : criteria.courses

  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  const getModule = (moduleCode: string) => modules.find(module => module.code === moduleCode)!

  const getModuleName = (moduleCode: string) => {
    const firstCourse = getModule(moduleCode).courses[0]
    return firstCourse?.parent_name ? getTextIn(firstCourse.parent_name)! : moduleCode
  }

  const setCoursesVisibility = (courseCodes: string[], newVisibility: boolean) => {
    // Same course can be in many modules, so change them all
    setModules(prevModules =>
      prevModules.map(module => ({
        ...module,
        courses: module.courses.map(course =>
          courseCodes.includes(course.code)
            ? { ...course, visible: { ...course.visible, visibility: newVisibility } }
            : course
        ),
      }))
    )
  }

  const changeVisibility = (courses: ProgrammeCourse[], newVisibility: boolean, successMessage: string) => {
    const request = { courseGroupIds: courses.map(course => course.group_id), curriculumVersion: version }
    const mutation = newVisibility
      ? removeExclusion({ ...request, programmeCode: exclusionProgramme })
      : setExclusion({ ...request, programmeCode: exclusionProgramme })
    setCoursesVisibility(
      courses.map(course => course.code),
      newVisibility
    )
    mutation
      .unwrap()
      .then(() => setStatusNotification(`${successMessage} ${reloadNote}`, 'success'))
      .catch(() => {
        setCoursesVisibility(
          courses.map(course => course.code),
          !newVisibility
        )
        setStatusNotification('Failed to change visibility', 'error')
      })
  }

  const toggleCourseVisibility = (course: ProgrammeCourse) => {
    const newVisibility = !course.visible.visibility
    const name = getTextIn(course.name)
    changeVisibility([course], newVisibility, `${name} is now ${newVisibility ? 'shown' : 'hidden'}.`)
  }

  const toggleModuleVisibility = (moduleCode: string) => {
    const { courses } = getModule(moduleCode)
    const visibility = getVisibility(moduleCode)
    const name = getModuleName(moduleCode)

    if (visibility === CourseVisibility.HIDDEN) {
      changeVisibility(courses, true, `All courses in ${name} are now shown.`)
      return
    }

    if (visibility === CourseVisibility.PARTIAL) {
      setModuleToHide(moduleCode)
      return
    }
    hideModule(moduleCode)
  }

  const hideModule = (moduleCode: string) => {
    const visibleCourses = getModule(moduleCode).courses.filter(course => course.visible.visibility)
    changeVisibility(visibleCourses, false, `All courses in ${getModuleName(moduleCode)} are now hidden.`)
  }

  const toggleCriteriaYear = (course: ProgrammeCourse, { key, year }: CriteriaYearOption) => {
    const current = criteriaCourses[key] ?? []
    const isRequired = current.includes(course.group_id)
    const courseGroupIds = isRequired
      ? current.filter(groupId => groupId !== course.group_id)
      : [...current, course.group_id]
    const name = getTextIn(course.name)

    setPendingCriteria({ courses: { ...criteriaCourses, [key]: courseGroupIds }, source: criteria })
    addProgressCriteriaCourse({ programmeCode: studyProgramme, courseGroupIds, year })
      .unwrap()
      .then(() =>
        setStatusNotification(
          isRequired ? `${name} removed from year ${year} criteria` : `${name} added to year ${year} criteria`,
          'success'
        )
      )
      .catch(() => {
        setPendingCriteria(null)
        setStatusNotification('Failed to update criteria', 'error')
      })
  }

  const isModuleExpanded = (moduleCode: string) => expandedModules[version]?.[moduleCode] ?? false

  const toggleExpanded = (moduleCode: string) => {
    setExpandedModules({
      ...expandedModules,
      [version]: { ...expandedModules[version], [moduleCode]: !isModuleExpanded(moduleCode) },
    })
  }

  const getVisibility = (moduleCode: string) => {
    const module = getModule(moduleCode)
    if (!module.courses?.length) {
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

  const countRequired = (courses: ProgrammeCourse[], { key }: CriteriaYearOption) =>
    courses.filter(course => criteriaCourses[key]?.includes(course.group_id)).length

  const headerRowSpan = showCriteria ? 2 : 1
  const remainingToHide = moduleToHide
    ? getModule(moduleToHide).courses.filter(course => course.visible.visibility).length
    : 0

  return (
    <>
      <StyledTable showCellBorders data-cy="degree-course-table" size="small">
        <TableHead>
          <TableRow>
            <TableCell rowSpan={headerRowSpan}>Name</TableCell>
            <TableCell rowSpan={headerRowSpan}>Code</TableCell>
            {showVisibility && <TableCell rowSpan={headerRowSpan}>Visibility</TableCell>}
            {showCriteria && (
              <TableCell align="center" colSpan={criteriaYears.length}>
                Required for year criteria
              </TableCell>
            )}
          </TableRow>
          {showCriteria && (
            <TableRow>
              {criteriaYears.map(({ year }) => (
                <TableCell align="center" key={year}>
                  Year {year}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableHead>
        <TableBody>
          {modules.map(({ code: moduleCode, courses }) => {
            const moduleName = getModuleName(moduleCode)
            const expanded = isModuleExpanded(moduleCode)
            return (
              <Fragment key={`${moduleCode}-fragment`}>
                <TableRow hover onClick={() => toggleExpanded(moduleCode)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box alignItems="center" display="flex" justifyContent="left">
                      <IconButton
                        aria-expanded={expanded}
                        aria-label={expanded ? `Hide courses of ${moduleName}` : `Show courses of ${moduleName}`}
                        size="small"
                      >
                        {expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                      </IconButton>
                      <Typography fontWeight="bold" variant="body2">
                        {moduleName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{moduleCode}</TableCell>
                  {showVisibility && (
                    <TableCell>
                      <VisibilitySwitch
                        ariaLabel={`Show all courses of ${moduleName}`}
                        cypress={`visibility-switch-${moduleCode}`}
                        onChange={() => toggleModuleVisibility(moduleCode)}
                        visibility={getVisibility(moduleCode)}
                      />
                    </TableCell>
                  )}
                  {criteriaYears.map(option => {
                    const requiredCount = countRequired(courses, option)
                    return (
                      <TableCell align="center" key={option.year}>
                        {requiredCount > 0 && (
                          <Typography
                            color="text.secondary"
                            title={`${requiredCount} of ${courses.length} courses required for year ${option.year}`}
                            variant="body2"
                          >
                            {requiredCount} / {courses.length}
                          </Typography>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
                {expanded &&
                  [...courses]
                    .sort((a, b) => a.code.localeCompare(b.code))
                    .map(course => {
                      const courseName = getTextIn(course.name)
                      return (
                        <TableRow key={`${moduleCode}/${course.code}`} sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ pl: 6 }}>{courseName}</TableCell>
                          <TableCell>{course.code}</TableCell>
                          {showVisibility && (
                            <TableCell>
                              <VisibilitySwitch
                                ariaLabel={`Show ${courseName}`}
                                cypress={`visibility-switch-${course.code}`}
                                onChange={() => toggleCourseVisibility(course)}
                                visibility={
                                  course.visible.visibility ? CourseVisibility.VISIBLE : CourseVisibility.HIDDEN
                                }
                              />
                            </TableCell>
                          )}
                          {criteriaYears.map(option => (
                            <TableCell align="center" key={option.year} padding="checkbox">
                              <Checkbox
                                checked={criteriaCourses[option.key]?.includes(course.group_id) ?? false}
                                data-cy={`criteria-checkbox-${option.year}-${course.code}`}
                                inputProps={{ 'aria-label': `${courseName} required for year ${option.year}` }}
                                onChange={() => toggleCriteriaYear(course, option)}
                                size="small"
                              />
                            </TableCell>
                          ))}
                        </TableRow>
                      )
                    })}
              </Fragment>
            )
          })}
        </TableBody>
      </StyledTable>
      <Dialog onClose={() => setModuleToHide(null)} open={moduleToHide !== null}>
        <DialogTitle>Hide the whole module?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {moduleToHide &&
              `Some courses in ${getModuleName(moduleToHide)} are already hidden. ` +
                `Hiding the module hides its remaining ${remainingToHide} ` +
                `${remainingToHide === 1 ? 'course' : 'courses'} for all Oodikone users.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleToHide(null)}>Cancel</Button>
          <Button
            data-cy="confirm-hide-module-button"
            onClick={() => {
              hideModule(moduleToHide!)
              setModuleToHide(null)
            }}
            variant="contained"
          >
            Hide module
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
