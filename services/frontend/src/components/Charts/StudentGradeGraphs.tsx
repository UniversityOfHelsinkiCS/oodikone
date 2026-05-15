import dayjs, { extend as dayjsExtend } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import ReactECharts from 'echarts-for-react'

import chunk from 'lodash-es/chunk'
import groupBy from 'lodash-es/groupBy'
import { useMemo } from 'react'
import { DateFormat } from '@/constants/date'
import type { SemestersData } from '@/hooks/useSemesters'
import { useGetSemestersQuery } from '@/redux/semesters'
import { reformatDate } from '@/util/timeAndDate'
import { StudentPageStudent } from '@oodikone/shared/types/studentData'
import { type GetTextIn, useLanguage } from '../LanguagePicker/useLanguage'

dayjsExtend(isSameOrAfter)

type SeriesData = {
  x: number
  y: number
  name?: string
}

const semesterChunkify = (courses, semesters, getTextIn: GetTextIn): SeriesData[] => {
  const semesterChunks = courses.reduce((acc, curr) => {
    const semester = semesters.find(
      semester => dayjs(curr.date).isSameOrAfter(semester.startdate) && dayjs(curr.date).isBefore(semester.enddate)
    )
    const semesterData = acc.find(data => data.semester === semester.name)
    if (semesterData) {
      semesterData.data.push(curr)
    } else {
      acc.push({ data: [curr], semester: semester.name })
    }
    return acc
  }, [])

  const semesterMeans = semesterChunks.reduce((acc, curr) => {
    const gradeSum = curr.data.reduce((a, b) => a + b.grade * b.credits, 0)
    const creditSum = curr.data.reduce((a, b) => a + b.credits, 0)
    if (curr.data.length > 0)
      acc.push({
        name: getTextIn(curr.semester),
        y: gradeSum / creditSum,
        x: new Date(curr.data[curr.data.length - 1].date).getTime(),
      })
    return acc
  }, [])

  return semesterMeans
}

const gradeMeanSeries = (
  student: StudentPageStudent,
  chunksize: number,
  semesters: SemestersData['semesters'] | undefined,
  getTextIn: ReturnType<typeof useLanguage>['getTextIn']
) => {
  const filteredCourses = student.courses.filter(
    course => !Number.isNaN(Number(course.grade)) && !course.isStudyModuleCredit && course.passed
  )

  const coursesGroupedByDate = groupBy(filteredCourses, 'date')

  const gradesAndMeans = Object.values(coursesGroupedByDate).reduce(
    (acc, courses) => {
      for (const course of courses) {
        acc.grades.push({
          grade: Number(course.grade),
          date: course.date.toString(),
          credits: course.credits,
        })
        // Weighted average: each grade is multiplied by the amount of credits the course is worth
        acc.totalGradeSum += Number(course.grade) * course.credits
        acc.totalCredits += course.credits
      }
      acc.mean.push({ y: acc.totalGradeSum / acc.totalCredits, x: new Date(courses[0].date).getTime() })
      return acc
    },
    {
      grades: [] as Array<{ grade: number; date: string; credits: number }>,
      mean: [] as SeriesData[],
      totalGradeSum: 0,
      totalCredits: 0,
    }
  )

  const size = Number(chunksize) ? chunksize : 3
  const chunks = chunk(gradesAndMeans.grades, size)

  const groupMeans = chunks.reduce<SeriesData[]>((acc, curr) => {
    const gradeSum = curr.reduce((a, b) => a + b.grade * b.credits, 0)
    const creditSum = curr.reduce((a, b) => a + b.credits, 0)
    if (curr.length > 0)
      acc.push({
        name: `${curr.length} courses between ${reformatDate(curr[0].date, DateFormat.DISPLAY_DATE)} and ${reformatDate(curr[curr.length - 1].date, DateFormat.DISPLAY_DATE)}`,
        y: gradeSum / creditSum,
        x: new Date(curr[curr.length - 1].date).getTime(),
      })
    return acc
  }, [])

  const semesterMeans = semesterChunkify(gradesAndMeans.grades, Object.values(semesters ?? {}), getTextIn)

  return {
    totalMeans: [{ data: gradesAndMeans.mean }],
    groupMeans: [{ data: groupMeans }],
    semesterMeans: [{ data: semesterMeans }],
  }
}

export const StudentGradeGraphs = ({
  student,
  graphMode,
  groupSize,
}: {
  student: StudentPageStudent
  graphMode: 'total' | 'group' | 'semester'
  groupSize: number
}) => {
  const { getTextIn } = useLanguage()
  const { data: semesters } = useGetSemestersQuery()
  const { semesters: allSemesters } = semesters ?? { semesters: {} }

  const { totalMeans, groupMeans, semesterMeans } = useMemo(
    () => gradeMeanSeries(student, groupSize, allSemesters, getTextIn),
    [student, groupSize, allSemesters, getTextIn]
  )

  const selectedSeries: SeriesData[] =
    graphMode === 'group' ? groupMeans[0].data : graphMode === 'semester' ? semesterMeans[0].data : totalMeans[0].data

  const gradeOption = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'line',
          snap: true,
        },
        formatter: (
          rawParams:
            | { data?: { x?: number; y?: number; name?: string } }
            | Array<{ data?: { x?: number; y?: number; name?: string } }>
        ) => {
          const params = Array.isArray(rawParams) ? rawParams : [rawParams]
          const point = params.find(param => param.data)
          const data = point?.data
          if (!data) return ''
          const date = data.x ? reformatDate(new Date(data.x), DateFormat.DISPLAY_DATE) : ''
          const description = data.name ? `<br/>${data.name}` : ''
          return `${data.y?.toFixed(2) ?? ''}${date ? `<br/>${date}` : ''}${description}`
        },
      },
      grid: {
        show: true,
        width: '100%',
        left: 'left',
        top: 55,
      },
      toolbox: {
        left: 'left',
        feature: {
          dataZoom: {
            yAxisIndex: 'none',
          },
          restore: {},
          saveAsImage: {},
        },
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0, filterMode: 'none' },
        { type: 'slider', xAxisIndex: 0, filterMode: 'none' },
      ],
      xAxis: {
        type: 'time',
      },
      yAxis: {
        type: 'value',
        position: 'right',
        min: 1,
        max: 5.1,
        splitLine: { show: true },
      },
      series: [
        {
          type: 'line',
          smooth: 0.1,
          showSymbol: false,
          data: selectedSeries.map(point => ({
            value: [point.x, point.y],
            x: point.x,
            y: point.y,
            name: point.name,
          })),
        },
      ],
      animation: true,
    }),
    [selectedSeries]
  )

  return <ReactECharts option={gradeOption} style={{ height: 420 }} />
}
