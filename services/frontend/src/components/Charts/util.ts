import { FormattedStudent } from "@oodikone/shared/types"

export const getGraduationsByCodes = (student: FormattedStudent, programmeCodes: string[], showBachelorAndMaster: boolean): number[] => {
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

/** HACK: markPoint (in this case the graduation marker) needs a datapoint to attach to. This creates a synthetic data point
to the time of graduation and attaches the markPoint to it (remember to sort the datapoints again) */
export const getGraduationDataPoints = (dataPoints: number[][], markPoints: { coord: number[], name: string }[], graduationDate: number) => {
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
  markPoints.push({ coord, name: `Graduation` })

}
