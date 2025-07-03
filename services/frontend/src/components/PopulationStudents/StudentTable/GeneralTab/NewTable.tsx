import { OodiTable } from '@/components/OodiTable'

import { FormattedStudentData } from '../GeneralTab'
import { formatDate } from '@/util/timeAndDate'
import { DateFormat } from '@/constants/date'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useMemo } from 'react'

import { ColumnDef } from '@tanstack/react-table'

export const NewTable = ({
  filteredStudents
}: {
  filteredStudents: any[]
}) => {
  const { getTextIn } = useLanguage()

  const getStudyRight = student => {
    const code = 'KH50_005'
    return student.studyRights.find(studyRight => studyRight.studyRightElements.some(element => element.code === code))
  }

  const getProgrammeList = ({ studentNumber }) => {
    return []
  }

  const getMostRecentAttainment = student => {
    const code = 'KH50_005'
    const studyPlan = student.studyplans?.find(plan => plan.programme_code === code) ?? null
    if (!studyPlan) return ''

    const { included_courses } = studyPlan
    const dates = student.courses
      .filter(course => included_courses.includes(course.course_code) && course.passed === true)
      .map(course => course.date)
    if (!dates.length) return ''
    const latestDate = dates.sort((a, b) => +new Date(b) - +new Date(a))[0]
    return formatDate(latestDate, DateFormat.ISO_DATE)
  }

  const getExtent = student => ''

  const parseTags = tags => {
    const studentTags = tags?.map(studentTag => studentTag.tag.tagname)
    return studentTags.join(', ')
  }

  const isAdmin = true
  const columns: ColumnDef<FormattedStudentData>[] = [
    // { accessorKey: 'firstNames', header: 'First names' },
    { accessorKey: 'lastName', header: 'Last name' },
    // { accessorKey: 'studentNumber', header: 'Student number' },
    // { accessorKey: 'email', header: 'email' },
    // { accessorKey: 'phoneNumber', header: 'Phone number' },
    // { accessorKey: 'sisuID', header: 'sisuID' },
    {
      header: 'Credits', columns: [
        { accessorKey: 'creditsTotal', header: 'Total' },
        { accessorKey: 'creditsHops', header: 'In HOPS' },
        { accessorKey: 'creditsSince', header: 'Since' },
      ]
    },
    { accessorKey: 'studyTrack', header: 'studyTrack' },
    { accessorKey: 'studyRightStart', header: 'studyRightStart' },
    { accessorKey: 'programmeStart', header: 'programmeStart' },
    { accessorKey: 'option', header: 'option' },
    { accessorKey: 'graduationDate', header: 'graduationDate' },
    { accessorKey: 'startYearAtUniversity', header: 'startYearAtUniversity' },
    { accessorKey: 'programmeStatus', header: 'programmeStatus' },
    { accessorKey: 'transferredFrom', header: 'transferredFrom' },
    { accessorKey: 'admissionType', header: 'admissionType' },
    { accessorKey: 'gender', header: 'gender' },
    { accessorKey: 'citizenships', header: 'citizenships' },
    { accessorKey: 'curriculumPeriod', header: 'curriculumPeriod' },
    { accessorKey: 'mostRecentAttainment', header: 'mostRecentAttainment' },
    { accessorKey: 'tvex', header: 'tvex' },
    { accessorKey: 'tags', header: 'tags' },
    { accessorKey: 'extent', header: 'extent' },
    { accessorKey: 'updatedAt', header: 'updatedAt' },
  ];

  const formatStudent = (student: any): FormattedStudentData => {
    const correctStudyRight = getStudyRight(student)
    const programmesList = getProgrammeList(student)

    const result: FormattedStudentData = {
      // firstNames: student.firstnames,
      lastName: student.lastname,
      // studentNumber: student.obfuscated ? 'Hidden' : student.studentNumber,
      // email: student.email,
      // phoneNumber: student.phoneNumber,
      // sisuID: student.sis_person_id,
      creditsTotal: student.allCredits ?? student.credits,
      creditsHops: 0,
      creditsSince: 0,
      studyTrack: null,
      studyRightStart: formatDate(undefined, DateFormat.ISO_DATE),
      programmeStart: formatDate(undefined, DateFormat.ISO_DATE),
      option: getTextIn(student.option?.name) ?? '',
      semesterEnrollments: {
        exportValue: 0,
        content: null,
      },
      graduationDate: '',
      startYearAtUniversity: '',
      programmes: { programmes: programmesList, exportValue: ';' },
      programmeStatus: '',
      transferredFrom: '',
      admissionType: null,
      gender: student.gender_code,
      citizenships: student.citizenships?.map(getTextIn).sort().join(', ') ?? null,
      curriculumPeriod: student.curriculumVersion,
      mostRecentAttainment: getMostRecentAttainment(student),
      tvex: !!correctStudyRight?.tvex,
      tags: parseTags(student.tags) ?? null,
      extent: isAdmin && getExtent(student),
      updatedAt: isAdmin && formatDate(student.updatedAt, DateFormat.ISO_DATE_DEV),
    }

    return result
  }

  console.time("formatStudents")
  const data = useMemo(() => filteredStudents.map(student => formatStudent(student)), [filteredStudents])
  console.timeEnd("formatStudents")

  return <OodiTable data={data} columns={columns} />
}
