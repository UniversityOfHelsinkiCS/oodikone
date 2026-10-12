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

export type DegreeModule = Module & {
  /** Programme whose curriculum the module is from. Course visibility is saved separately for each programme. */
  programmeCode: string
}

const getModuleKey = (module: DegreeModule) => `${module.programmeCode}/${module.code}`

export const DegreeCourseTable = ({
  criteria,
  curriculumVersion,
  modules: initialModules,
  programmeNames,
  showCriteria,
  showVisibility,
  studyProgramme,
}: {
  criteria: ProgressCriteria
  curriculumVersion: string[]
  /** Modules of the first programme first, then those of the second programme of a combined programme */
  modules: DegreeModule[]
  /** Shown above each programme's modules when the modules are from more than one programme */
  programmeNames: Record<string, string>
  showCriteria: boolean
  showVisibility: boolean
  /** Programme whose progress criteria are edited */
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
  const criteriaYears = showCriteria ? getCriteriaYears(studyProgramme) : []
  const criteriaCourses = pendingCriteria?.source === criteria ? pendingCriteria.courses : criteria.courses

  useEffect(() => {
    setModules(initialModules)
  }, [initialModules])

  const getModule = (moduleKey: string) => modules.find(module => getModuleKey(module) === moduleKey)!

  const getModuleName = (module: DegreeModule) => {
    const firstCourse = module.courses[0]
    return firstCourse?.parent_name ? getTextIn(firstCourse.parent_name)! : module.code
  }

  const setCoursesVisibility = (programmeCode: string, courseCodes: string[], newVisibility: boolean) => {
    // Same course can be in many modules of the programme, so change them all
    setModules(prevModules =>
      prevModules.map(module =>
        module.programmeCode !== programmeCode
          ? module
          : {
              ...module,
              courses: module.courses.map(course =>
                courseCodes.includes(course.code)
                  ? { ...course, visible: { ...course.visible, visibility: newVisibility } }
                  : course
              ),
            }
      )
    )
  }

  const changeVisibility = (
    programmeCode: string,
    courses: ProgrammeCourse[],
    newVisibility: boolean,
    successMessage: string
  ) => {
    const request = {
      courseGroupIds: courses.map(course => course.group_id),
      curriculumVersion: version,
      programmeCode,
    }
    const mutation = newVisibility ? removeExclusion(request) : setExclusion(request)
    const courseCodes = courses.map(course => course.code)
    setCoursesVisibility(programmeCode, courseCodes, newVisibility)
    mutation
      .unwrap()
      .then(() => setStatusNotification(`${successMessage} ${reloadNote}`, 'success'))
      .catch(() => {
        setCoursesVisibility(programmeCode, courseCodes, !newVisibility)
        setStatusNotification('Failed to change visibility', 'error')
      })
  }

  const toggleCourseVisibility = (module: DegreeModule, course: ProgrammeCourse) => {
    const newVisibility = !course.visible.visibility
    const name = getTextIn(course.name)
    changeVisibility(
      module.programmeCode,
      [course],
      newVisibility,
      `${name} is now ${newVisibility ? 'shown' : 'hidden'}.`
    )
  }

  const toggleModuleVisibility = (module: DegreeModule) => {
    const visibility = getVisibility(module)

    if (visibility === CourseVisibility.HIDDEN) {
      changeVisibility(
        module.programmeCode,
        module.courses,
        true,
        `All courses in ${getModuleName(module)} are now shown.`
      )
      return
    }

    if (visibility === CourseVisibility.PARTIAL) {
      setModuleToHide(getModuleKey(module))
      return
    }
    hideModule(module)
  }

  const hideModule = (module: DegreeModule) => {
    const visibleCourses = module.courses.filter(course => course.visible.visibility)
    changeVisibility(
      module.programmeCode,
      visibleCourses,
      false,
      `All courses in ${getModuleName(module)} are now hidden.`
    )
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

  const isModuleExpanded = (moduleKey: string) => expandedModules[version]?.[moduleKey] ?? false

  const toggleExpanded = (moduleKey: string) => {
    setExpandedModules({
      ...expandedModules,
      [version]: { ...expandedModules[version], [moduleKey]: !isModuleExpanded(moduleKey) },
    })
  }

  const getVisibility = (module: DegreeModule) => {
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
  const columnCount = 2 + Number(showVisibility) + criteriaYears.length
  const showProgrammeRows = new Set(modules.map(module => module.programmeCode)).size > 1
  const pendingHideModule = moduleToHide ? getModule(moduleToHide) : null
  const remainingToHide = pendingHideModule?.courses.filter(course => course.visible.visibility).length ?? 0

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
          {modules.map((module, index) => {
            const { code: moduleCode, courses, programmeCode } = module
            const moduleKey = getModuleKey(module)
            const moduleName = getModuleName(module)
            const expanded = isModuleExpanded(moduleKey)
            const startsProgramme = index === 0 || modules[index - 1].programmeCode !== programmeCode
            return (
              <Fragment key={moduleKey}>
                {showProgrammeRows && startsProgramme && (
                  <TableRow data-cy={`programme-row-${programmeCode}`}>
                    <TableCell colSpan={columnCount} sx={{ bgcolor: 'grey.100' }}>
                      <Typography fontWeight="bold" variant="body2">
                        {programmeNames[programmeCode] ?? programmeCode} ({programmeCode})
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                <TableRow hover onClick={() => toggleExpanded(moduleKey)} sx={{ cursor: 'pointer' }}>
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
                        onChange={() => toggleModuleVisibility(module)}
                        visibility={getVisibility(module)}
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
                        <TableRow key={`${moduleKey}/${course.code}`} sx={{ bgcolor: 'grey.50' }}>
                          <TableCell sx={{ pl: 6 }}>{courseName}</TableCell>
                          <TableCell>{course.code}</TableCell>
                          {showVisibility && (
                            <TableCell>
                              <VisibilitySwitch
                                ariaLabel={`Show ${courseName}`}
                                cypress={`visibility-switch-${course.code}`}
                                onChange={() => toggleCourseVisibility(module, course)}
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
            {pendingHideModule &&
              `Some courses in ${getModuleName(pendingHideModule)} are already hidden. ` +
                `Hiding the module hides its remaining ${remainingToHide} ` +
                `${remainingToHide === 1 ? 'course' : 'courses'} for all Oodikone users.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModuleToHide(null)}>Cancel</Button>
          <Button
            data-cy="confirm-hide-module-button"
            onClick={() => {
              hideModule(pendingHideModule!)
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
