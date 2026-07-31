import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'

import { useEffect, useMemo, useState } from 'react'

import { getEnrollmentTypeTextForExcel, isFall } from '@/common'
import { closeToGraduationToolTips } from '@/common/InfoToolTips'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { StudentInfoItem } from '@/components/common/StudentInfoItem'
import { TableHeaderWithTooltip } from '@/components/common/TableHeaderWithTooltip'
import { InfoBox } from '@/components/InfoBox/InfoBoxWithTooltip'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { LoadingSection } from '@/components/Loading'
import { getSemestersPresentFunctions } from '@/components/PopulationComponents/Students/Table/GeneralTab/columnHelpers/semestersPresent'
import { DateFormat } from '@/constants/date'
import { useTitle } from '@/hooks/title'
import { useSemesters } from '@/hooks/useSemesters'
import { useGetStudentsCloseToGraduationQuery } from '@/redux/closeToGraduation'
import { CheckIcon } from '@/theme'
import { reformatDate } from '@/util/timeAndDate'
import { getFullLanguage, Language } from '@oodikone/shared/language'
import { range } from '@oodikone/shared/util'
import { OodiTable } from '@/components/OodiTable'
import { CloseToGraduationData } from '@oodikone/shared/routes/populations'
import { createColumnHelper, type TableOptions } from '@tanstack/react-table'
import { CheckBoxSelector, DateRangeSelector, MultiSelector, RangeSelector, TextSelector } from './filters'
import uniqBy from 'lodash-es/uniqBy'
import Tooltip from '@mui/material/Tooltip'

const NUMBER_OF_DISPLAYED_SEMESTERS = 6

const CheckIconWithTitle = ({ visible, title }: { visible: boolean; title?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'center' }} title={title}>
    {visible ? <CheckIcon color="success" fontSize="small" /> : <Box sx={{ width: '20px', height: '20px' }} />}
  </Box>
)

const columnHelper = createColumnHelper<CloseToGraduationData>()

export const CloseToGraduation = () => {
  useTitle('Students close to graduation')
  const { data: students, isFetching } = useGetStudentsCloseToGraduationQuery()
  const semesterData = useSemesters()
  const { semesters, currentSemester } = semesterData

  const [selectedTab, setSelectedTab] = useState(0)
  const { getTextIn, language } = useLanguage()
  const { getSemesterEnrollmentsContent, getSemesterEnrollmentsVal } = useMemo(
    () =>
      getSemestersPresentFunctions({
        getTextIn,
        year: new Date().getFullYear() - Math.floor(NUMBER_OF_DISPLAYED_SEMESTERS / 2),
        programme: null,
        semestersToAddToStart: null,
        semesters: semesterData,
      }),
    [semesters, getTextIn, students]
  )
  const currentSemesterCode = currentSemester?.semestercode
  const semestersToInclude = useMemo(
    () =>
      currentSemesterCode != null
        ? range(
            isFall(currentSemesterCode)
              ? currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 2
              : currentSemesterCode - NUMBER_OF_DISPLAYED_SEMESTERS + 1,
            isFall(currentSemesterCode) ? currentSemesterCode + 2 : currentSemesterCode + 1
          )
        : [],
    [currentSemesterCode]
  )

  const [columnFilters, setColumnFilters] = useState({
    curriculumPeriod: [],
    faculty: [],
    programme: [],
    studyTrack: [],
    'student.studentNumber': '',
    'credits.hops': [0, 1000],
    'credits.all': [0, 1000],
    numberOfAbsentSemesters: [],
    numberOfUsedSemesters: [],
  })

  const displayedData = (selectedTab === 0 ? students?.bachelor : students?.masterAndLicentiate) ?? []

  const curriculumPeriods = [...new Set(
    displayedData.map(({ curriculumPeriod }) => curriculumPeriod).filter(curr => curr !== null)
  )].map(val => ({
    key: val,
    value: val,
    text: val,
  }))
  .sort(({ key: a }, { key: b }) => b.localeCompare(a))

  const studyProgrammes = uniqBy(
    displayedData.map(({ programme }) => programme).filter(curr => curr !== null),
    'code'
  ).map(({ code, name }) => ({
    key: code,
    value: code,
    text: `${code} - ${getTextIn(name)}`,
  }))
  .sort(({ key: a }, { key: b }) => a.localeCompare(b))

  const studyTracks = uniqBy(
    displayedData.map(({ programme }) => programme.studyTrack).filter(curr => curr !== null),
    language
  )
  .map(name => getTextIn(name))
  .map(val => ({
    key: val,
    value: val,
    text: val,
  }))
  .sort(({ key: a }, { key: b }) => a?.localeCompare(b ?? '') ?? 0)

  const faculties = uniqBy(
    displayedData.map(({ faculty }) => faculty).filter(curr => curr !== null),
    language
  )
  .map(name => getTextIn(name))
  .map(val => ({
    key: val,
    value: val,
    text: val,
  }))
  .sort(({ key: a }, { key: b }) => a?.localeCompare(b ?? '') ?? 0)

  const hopsCredits = displayedData.map(({ credits }) => credits.hops).filter(Number)
  const allCredits = displayedData.map(({ credits }) => credits.all).filter(Number)

  const ooditableColumns = useMemo(
    () => [
      columnHelper.accessor('student.studentNumber', {
        id: 'student.studentNumber',
        header: 'Student number',
        cell: cell => (
          <StudentInfoItem
            sisPersonId={cell.row.original.student.sis_person_id}
            studentNumber={cell.getValue<string>()}
          />
        ),
        meta: {
          filterComponent: () => <TextSelector label="Student number" value={columnFilters['student.studentNumber']} setValue={(val) => setColumnFilters(prev => ({ ...prev, 'student.studentNumber': val }))} />
        }
      }),
      columnHelper.accessor('student.name', {
        id: 'student.name',
        header: 'Name',
      }),
      columnHelper.accessor('student.phoneNumber', {
        id: 'student.phoneNumber',
        header: 'Phone number',
      }),
      columnHelper.accessor('student.email', {
        id: 'student.email',
        header: 'Email',
      }),
      columnHelper.accessor('student.secondaryEmail', {
        id: 'student.secondaryEmail',
        header: 'Secondary email',
      }),
      columnHelper.accessor(row => getFullLanguage(row.student.preferredLanguage as Language), {
        id: 'preferredLanguage',
        header: 'Preferred language',
        filterFn: (row, columnId, filterValue) => !filterValue.length || filterValue.includes(row.original[columnId]),
        meta: {
          filterComponent: () => <MultiSelector value={[]} setValue={(val) => setColumnFilters(prev => ({ ...prev, preferredLanguage: val }))} options={[]} />
        }
      }),
      columnHelper.accessor(row => getTextIn(row.faculty), {
        header: 'Faculty',
        id: 'faculty',
        filterFn: (row, columnId, filterValue) => !filterValue.length || filterValue.includes(getTextIn(row.original[columnId])),
        meta: {
          filterComponent: () => <MultiSelector value={columnFilters.faculty} setValue={(val) => setColumnFilters(prev => ({ ...prev, faculty: val }))} options={faculties} />
        }
      }),
      columnHelper.accessor(row => getTextIn(row.programme.name), {
        header: 'Programme',
        id: 'programme',
        filterFn: (row, columnId, filterValue) => !filterValue.length || filterValue.includes(row.original[columnId]?.code),
        meta: {
          filterComponent: () => <MultiSelector value={columnFilters.programme} setValue={(val) => setColumnFilters(prev => ({ ...prev, programme: val }))} options={studyProgrammes} />
        }
      }),
      columnHelper.accessor(row => getTextIn(row.programme.studyTrack), {
        id: 'studyTrack',
        header: 'Study track',
        filterFn: (row, _, filterValue) => !filterValue.length || filterValue.includes(getTextIn(row.original.programme?.studyTrack)),
        meta: {
          filterComponent: () => <MultiSelector value={columnFilters.studyTrack} setValue={(val) => setColumnFilters(prev => ({ ...prev, studyTrack: val }))} options={studyTracks} />
        }
      }),
      columnHelper.accessor(row => new Date(row.studyright.startDate), {
        id: 'startOfStudyRight',
        cell: ({ cell }) => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: 'Start of study right',
        meta: {
          filterComponent: () => <DateRangeSelector />
        }
      }),
      columnHelper.accessor(row => new Date(row.programme.startedAt), {
        id: 'startedInProgramme',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Started in programme"
            tooltipText="For students with only a study right in the master’s programme, this date is the same as 'Start of study right'. For students with study rights in both the bachelor’s and master’s programmes, this date represents when they started in the master’s programme (i.e. one day after graduating from the bachelor’s programme)."
          />
        ),
        meta: {
          filterComponent: () => <DateRangeSelector />
        }
      }),
      columnHelper.accessor('credits.hops', {
        id: 'credits.hops',
        header: 'Completed credits – HOPS',
        filterFn: (row, _, filterValue) => {
          const [min, max] = filterValue
          const val = row.original.credits?.hops

          return min <= val && val <= max
        },
        meta: {
          filterComponent: () => <RangeSelector value={columnFilters['credits.hops']} setValue={(val) => setColumnFilters(prev => ({ ...prev, 'credits.hops': val }))} options={hopsCredits} />
        },
      }),
      columnHelper.accessor('credits.all', {
        id: 'credits.all',
        header: 'Completed credits – Total',
        filterFn: (row, _, filterValue) => {
          const [min, max] = filterValue
          const val = row.original.credits?.all

          return min <= val && val <= max
        },
        meta: {
          filterComponent: () => <RangeSelector value={columnFilters['credits.all']} setValue={(val) => setColumnFilters(prev => ({ ...prev, 'credits.all': val }))} options={allCredits} />
        },
      }),
      columnHelper.accessor('studyright.isBaMa', {
        cell: cell => <CheckIconWithTitle visible={cell.getValue<boolean>()} />,
        header: () => (
          <TableHeaderWithTooltip
            header="BSc & MSc study right"
            tooltipText="Indicates whether the student has been granted the study right to complete both a bachelor's and a master's degree."
          />
        ),
        meta: {
          filterComponent: () => <CheckBoxSelector />
        },
      }),
      columnHelper.accessor('curriculumPeriod', {
        header: () => (
          <TableHeaderWithTooltip
            header="Curriculum period"
            tooltipText="The curriculum period the student has chosen for their primary study plan"
          />
        ),
        enableColumnFilter: true,
        filterFn: (row, columnId, filterValue) => !filterValue.length || filterValue.includes(row.original[columnId]),
        meta: {
          filterComponent: () => <MultiSelector value={columnFilters.curriculumPeriod} setValue={(val) => setColumnFilters(prev => ({ ...prev, curriculumPeriod: val }))} options={curriculumPeriods} />
        },
      }),
      columnHelper.accessor(row => getSemesterEnrollmentsVal(row.studyright), {
        header: 'Semester enrollments',
        cell: cell => {
          const content = getSemesterEnrollmentsContent(cell.row.original.student, cell.row.original.studyright)

          return (
            <Box sx={{ display: 'flex', m: 0.5 }}>
              {content?.map(({ key, onHoverString, typeLabel, graduationCrown }) => (
                <Tooltip key={key} placement="top" title={onHoverString}>
                  <span className={`enrollment-label label-${typeLabel} ${graduationCrown}`} />
                </Tooltip>
              ))}
            </Box>
          )
        },
        id: 'semesterEnrollments',
      }),
      columnHelper.accessor('numberOfAbsentSemesters', {
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters absent"
            tooltipText="The number of semesters the student has been absent (both statutory (*lakiperusteinen*) and non-statutory absences) during their study right. The current semester is included."
          />
        ),
        meta: {
          filterComponent: () => <RangeSelector value={columnFilters.numberOfAbsentSemesters} setValue={(val) => setColumnFilters(prev => ({ ...prev, numberOfAbsentSemesters: val }))} options={[]} />
        },
      }),
      columnHelper.accessor('numberOfUsedSemesters', {
        header: () => (
          <TableHeaderWithTooltip
            header="Semesters used"
            tooltipText="The number of semesters the student has either been enrolled as present (*läsnäoleva*) or the enrollment was neglected (*laiminlyöty*) during their study right. The current semester is included."
          />
        ),
        meta: {
          filterComponent: () => <RangeSelector value={columnFilters.numberOfUsedSemesters} setValue={(val) => setColumnFilters(prev => ({ ...prev, numberOfUsedSemesters: val }))} options={[]} />
        },
      }),
      columnHelper.accessor(row => row.thesisInfo != null, {
        id: 'thesisCompleted',
        cell: cell => (
          <CheckIconWithTitle
            title={
              cell.getValue()
                ? [
                    `Attainment date: ${reformatDate(cell.row.original.thesisInfo?.attainmentDate, DateFormat.ISO_DATE)}`,
                    `Course code: ${cell.row.original.thesisInfo?.courseCode}`,
                    `Grade: ${cell.row.original.thesisInfo?.grade}`,
                  ].join('\n')
                : undefined
            }
            visible={cell.getValue<boolean>()}
          />
        ),
        header: () => (
          <TableHeaderWithTooltip
            header="Thesis completed"
            tooltipText="The thesis attainment must be linked to the correct study right. You can see the attainment date, course code, and grade by hovering over the check mark."
          />
        ),
        meta: {
          filterComponent: () => <CheckBoxSelector />
        },
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.latestHops), {
        id: 'latestAttainmentDateHops',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Latest attainment date – HOPS"
            tooltipText="The date when the student last completed a course in their primary study plan"
          />
        ),
        meta: {
          filterComponent: () => <DateRangeSelector />
        }
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.latestTotal), {
        id: 'latestAttainmentDateTotal',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Latest attainment date – Total"
            tooltipText="The date when the student last completed any course at the university"
          />
        ),
        meta: {
          filterComponent: () => <DateRangeSelector />
        }
      }),
      columnHelper.accessor(row => new Date(row.attainmentDates.earliestHops), {
        id: 'earlistAttainmentDateHops',
        cell: cell => reformatDate(cell.getValue<Date>(), DateFormat.ISO_DATE),
        header: () => (
          <TableHeaderWithTooltip
            header="Earliest attainment date – HOPS"
            tooltipText="The date when the student first completed a course in their primary study plan"
          />
        ),
        meta: {
          filterComponent: () => <DateRangeSelector />
        }
      }),
      ...semestersToInclude.map(semester => columnHelper.accessor(row => {
          if (!row.studyright.semesterEnrollments) {
            return 'Not enrolled'
          }
          const enrollment = row.studyright.semesterEnrollments.find(enrollment => enrollment.semester === semester)
          return getEnrollmentTypeTextForExcel(enrollment?.type, enrollment?.statutoryAbsence)
        }, {
        id: `enrollmentFor${getTextIn(semesters[`${semester}`]?.name)!}`,
        header: `Enrollment status – ${getTextIn(semesters[`${semester}`]?.name)}`,
      })),
    ],
    [columnFilters, students, semesters, semestersToInclude]
  )

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    'student.name': false,
    'student.phoneNumber': false,
    'student.email': false,
    'student.secondaryEmail': false,
    preferredLanguage: false,
    semesterEnrollments: false,
  })

  useEffect(() => {
    const hiddenColumns: string[] = []
    for (const column of ooditableColumns) {
      if (column.id?.startsWith('enrollmentFor')) hiddenColumns.push(column.id ?? column.header)
    }

    setColumnVisibility(prev => ({ ...prev, ...Object.fromEntries(hiddenColumns.map(key => [key, false])) }))
  }, [ooditableColumns])

  console.log(columnFilters)
  const ooditable: Partial<TableOptions<CloseToGraduationData>> = {
    enableFilters: true,
    state: {
      columnVisibility,
      columnFilters: Object.entries(columnFilters).map(([id, value]) => ({ id, value })),
    },
  }

  return (
    <PageLayout maxWidth="lg">
      <PageTitle title="Students close to graduation">
        <Box sx={{ my: 3, textAlign: 'center' }}>
          <InfoBox content={closeToGraduationToolTips} />
        </Box>
      </PageTitle>
      <Tabs centered onChange={(_event, value) => setSelectedTab(value)} value={selectedTab}>
        <Tab label="Bachelor's programmes" />
        <Tab label="Master's and licentiate's programmes" />
      </Tabs>
      {isFetching ? <LoadingSection /> : <OodiTable options={ooditable} data={displayedData} columns={ooditableColumns} />}
      <Box sx={{ minHeight: '1.25rem' }}>
        {!!students?.lastUpdated && (
          <Typography color="text.secondary" variant="body2">
            Last updated: {reformatDate(students.lastUpdated, DateFormat.LONG_DATE_TIME)}
          </Typography>
        )}
      </Box>
    </PageLayout>
  )
}
