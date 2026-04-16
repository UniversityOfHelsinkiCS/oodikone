import { FormattedStudent, Phase } from '@oodikone/shared/types'

type CourseWithCode = {
  course_code?: string
  course?: {
    code?: string
  }
}

type StudyPlanLike = {
  included_courses: string[]
}

const resolveCourseCode = (course: CourseWithCode) => course.course_code ?? course.course?.code

const toMillis = (date: Date | string) => new Date(date).getTime()

export const getIncludedCourseCodesByProgrammeCodes = (
  student: FormattedStudent,
  programmeCodes: string[]
): Set<string> => {
  if (!programmeCodes) return new Set()
  const studyplans = student.studyplans.filter(studyplan => programmeCodes.includes(studyplan.programme_code))
  return new Set(studyplans.flatMap(studyplan => studyplan.included_courses))
}

export const getGraduationsByCodes = (
  student: FormattedStudent,
  programmeCodes: string[],
  showBachelorAndMaster: boolean
): number[] => {
  if (!programmeCodes) return []
  if (showBachelorAndMaster) {
    return (
      student.studyRights
        .find(studyRight => studyRight.studyRightElements.some(element => programmeCodes.includes(element.code)))
        ?.studyRightElements.filter(({ graduated }) => !!graduated) ?? []
    )
      .map(({ endDate }) => new Date(endDate).getTime())
      .sort((a, b) => a - b)
  }

  return student.studyRights
    .flatMap(studyRight => studyRight.studyRightElements)
    .filter(({ graduated, code }) => !!graduated && programmeCodes.includes(code))
    .map(({ endDate }) => new Date(endDate).getTime())
    .sort((a, b) => a - b)
}

export const filterCoursesByStudyPlan = <TCourse extends CourseWithCode>(
  courses: TCourse[],
  studyPlan?: StudyPlanLike
): TCourse[] => {
  if (!studyPlan) return courses
  return courses.filter(course => {
    const code = resolveCourseCode(course)
    return !!code && studyPlan.included_courses.includes(code)
  })
}

export const createGoalLineData = (
  graphStartDate: number,
  graphEndDate: number,
  absences: {
    startDate: Date | string
    endDate: Date | string
    enrollmenttype: number
    statutoryAbsence: boolean
  }[]
) => {
  const getColor = (type: number) => {
    if (type === 2) return '#ffb300'
    if (type === 3) return '#e53935'
    return '#96d7c3'
  }

  const absenceIsBetweenGraphDates = (startDate: number, endDate: number) =>
    (graphStartDate <= startDate && startDate <= graphEndDate) || (graphStartDate <= endDate && endDate <= graphEndDate)

  let totalAbsenceYears = 0
  const relevantAbsences = absences
    .filter(absence => {
      const start = toMillis(absence.startDate)
      const end = toMillis(absence.endDate)
      if (absence.enrollmenttype === 3) {
        return absenceIsBetweenGraphDates(start, end) && start <= Date.now()
      }
      return absenceIsBetweenGraphDates(start, end)
    })
    .sort((a, b) => toMillis(a.startDate) - toMillis(b.startDate))

  const points: number[][] = [[graphStartDate, 0]]
  const markAreas: Array<{
    range: [{ xAxis: number }, { xAxis: number }]
    color: string
    borderType: 'solid' | 'dashed'
  }> = []

  for (const absence of relevantAbsences) {
    const absenceStart = toMillis(absence.startDate)
    const absenceEnd = toMillis(absence.endDate)
    const targetCreditsBeforeAbsence =
      ((absenceStart - graphStartDate) / (365.25 * 24 * 60 * 60 * 1000) - totalAbsenceYears) * 60

    const absenceInYears = (absenceEnd - absenceStart) / (365.25 * 24 * 60 * 60 * 1000)
    totalAbsenceYears += absenceInYears

    points.push([absenceStart, targetCreditsBeforeAbsence])
    points.push([absenceEnd, targetCreditsBeforeAbsence])
    markAreas.push({
      range: [{ xAxis: absenceStart }, { xAxis: absenceEnd }],
      color: getColor(absence.enrollmenttype),
      borderType: absence.statutoryAbsence ? 'dashed' : 'solid',
    })
  }

  const yearsFromStart = (graphEndDate - graphStartDate) / (365.25 * 24 * 60 * 60 * 1000)
  const endingCredits = (yearsFromStart - totalAbsenceYears) * 60
  points.push([graphEndDate, endingCredits])
  points.sort((a, b) => a[0] - b[0])

  return { points, markAreas }
}

export const getStudentTransferMarkers = (
  student: Pick<FormattedStudent, 'studyRights'>,
  getTextIn: (text: unknown) => string | null | undefined
): Array<{ value: number; label: string }> =>
  student.studyRights.reduce<Array<{ value: number; label: string }>>((transfers, studyRight) => {
    const phase1Programmes = studyRight.studyRightElements.filter(element => element.phase === Phase.ANY)
    const phase2Programmes = studyRight.studyRightElements.filter(element => element.phase === Phase.MASTER)

    for (const programmes of [phase1Programmes, phase2Programmes]) {
      for (const element of programmes.slice(0, -1)) {
        transfers.push({
          value: new Date(element.startDate).getTime(),
          label: `Transfer to ${getTextIn(element.name) ?? ''}`,
        })
      }
    }

    return transfers
  }, [])

/** HACK: markPoint (in this case the graduation marker) needs a datapoint to attach to. This creates a synthetic data point
to the time of graduation and attaches the markPoint to it (remember to sort the datapoints again) */
export const getGraduationDataPoints = (
  dataPoints: number[][],
  markPoints: { coord: number[]; name: string }[],
  graduationDate: number
) => {
  dataPoints.sort((a, b) => a[0] - b[0])

  const index = dataPoints.findIndex(point => point[0] > graduationDate)
  let y: number
  if (index <= 0) {
    y = graduationDate > (dataPoints.at(0)?.[0] ?? 0) ? dataPoints[dataPoints.length - 1][1] : dataPoints[0][1]
  } else {
    const yBefore = dataPoints[index - 1][1]
    const yAfter = dataPoints[index][1]
    y = Math.round((yBefore + yAfter) / 2)
  }

  const coord = [graduationDate, y]
  dataPoints.push(coord)
  dataPoints.sort((a, b) => a[0] - b[0])
  markPoints.push({ coord, name: `Graduation` })
}
