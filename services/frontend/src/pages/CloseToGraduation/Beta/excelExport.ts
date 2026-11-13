import { getEnrollmentTypeTextForExcel } from '@/common'
import type { GetTextIn } from '@/components/LanguagePicker/useLanguage'
import { DateFormat } from '@/constants/date'
import type { SemestersData } from '@/hooks/useSemesters'
import { getPreferredLanguage } from '@/pages/CloseToGraduation/Beta/filters'
import { reformatDate } from '@/util/timeAndDate'
import type { CloseToGraduationData } from '@oodikone/shared/routes/populations'

const toIsoDate = (date: Date | string | undefined) => (date ? reformatDate(date, DateFormat.ISO_DATE) : '')

const toYesNo = (value: boolean) => (value ? 'Yes' : 'No')

const getEnrollmentStatus = (studyright: CloseToGraduationData['studyright'], semester: number) => {
  if (!studyright.semesterEnrollments) return 'Not enrolled'
  const enrollment = studyright.semesterEnrollments.find(enrollment => enrollment.semester === semester)
  if (!enrollment) return 'No study right'
  return getEnrollmentTypeTextForExcel(enrollment.type, enrollment.statutoryAbsence)
}

export const toExportRows = (
  rows: CloseToGraduationData[],
  getTextIn: GetTextIn,
  semesters: SemestersData['semesters'],
  semestersToInclude: number[]
): Record<string, string | number>[] =>
  rows.map(row => ({
    'Student number': row.student.studentNumber,
    Name: row.student.name,
    'Phone number': row.student.phoneNumber,
    Email: row.student.email,
    'Secondary email': row.student.secondaryEmail,
    'Preferred language': getPreferredLanguage(row.student.preferredLanguage),
    Faculty: getTextIn(row.faculty) ?? '',
    Programme: getTextIn(row.programme.name) ?? '',
    'Programme code': row.programme.code,
    'Study track': getTextIn(row.programme.studyTrack) ?? '',
    'Start of study right': toIsoDate(row.studyright.startDate),
    'Started in programme': toIsoDate(row.programme.startedAt),
    'Completed credits – HOPS': row.credits.hops,
    'Completed credits – Total': row.credits.all,
    'BSc & MSc study right': toYesNo(row.studyright.isBaMa),
    'Curriculum period': row.curriculumPeriod ?? '',
    'Semesters absent': row.numberOfAbsentSemesters,
    'Semesters used': row.numberOfUsedSemesters,
    'Thesis completed': toYesNo(row.thesisInfo != null),
    'Thesis attainment date': toIsoDate(row.thesisInfo?.attainmentDate),
    'Thesis course code': row.thesisInfo?.courseCode ?? '',
    'Thesis grade': row.thesisInfo?.grade ?? '',
    'Latest attainment date – HOPS': toIsoDate(row.attainmentDates.latestHops),
    'Latest attainment date – Total': toIsoDate(row.attainmentDates.latestTotal),
    'Earliest attainment date – HOPS': toIsoDate(row.attainmentDates.earliestHops),
    ...Object.fromEntries(
      semestersToInclude.map(semester => [
        `Enrollment status – ${getTextIn(semesters[`${semester}`]?.name) ?? semester}`,
        getEnrollmentStatus(row.studyright, semester),
      ])
    ),
  }))
