import { useState } from 'react'
import { Button, Dropdown, Form, Message, Segment } from 'semantic-ui-react'

import { createLocaleComparator, getCurrentSemester, getFullStudyProgrammeRights } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { TeacherStatisticsTable } from '@/components/Teachers/TeacherStatisticsTable'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProvidersQuery } from '@/redux/providers'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useLazyGetTeacherStatisticsQuery } from '@/redux/teachers'
import { mapToProviders } from '@/shared/util/mapToProviders'

export const TeacherStatistics = () => {
  const { getTextIn } = useLanguage()
  const [semesterStart, setSemesterStart] = useState(null)
  const [semesterEnd, setSemesterEnd] = useState(null)
  const [providers, setProviders] = useState([])
  const { programmeRights, isAdmin } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const [getTeacherStatistics, { data: teacherData, isFetching, isLoading }] = useLazyGetTeacherStatisticsQuery()
  const { data: providersData = [] } = useGetProvidersQuery()
  const { data: semesterData } = useGetSemestersQuery()

  const semesters = !semesterData?.semesters
    ? []
    : Object.values(semesterData?.semesters)
        .reverse()
        .map(({ semestercode, name }, index) => ({
          key: index,
          value: semestercode,
          text: getTextIn(name),
        }))

  const setStartSemester = (_, { value }) => {
    setSemesterStart(value)
    if (semesterEnd <= value) {
      setSemesterEnd(value)
    }
  }

  const setEndSemester = (_, { value }) => {
    setSemesterEnd(value)
  }

  const changeProviders = (_, { value }) => {
    setProviders(value)
  }

  const teacherStats = teacherData
    ? Object.values(teacherData).map(teacher => ({
        id: teacher.id,
        name: teacher.name,
        credits: teacher.stats.credits,
        passed: teacher.stats.passed,
        failed: teacher.stats.failed,
        transferred: teacher.stats.transferred,
      }))
    : []

  const currentSemesterCode = getCurrentSemester(semesterData?.semesters)?.semestercode

  /*
      HowTo:
        Mostly the same point as in the backend file /routes/teachers.ts row 99 onwards.
        One question, though, is the data actually filtered in the front end? I.e., is
        the unfiltered data sent with the response, leading to unauthorized access to it
        in the networks-tab? (Haven't checked the code in detail, so only asking.)
  */
  const userProviders = mapToProviders(fullStudyProgrammeRights)
  const invalidQueryParams = providers.length === 0 || !semesterStart
  const providerOptions = isAdmin
    ? providersData
    : providersData.filter(provider => userProviders.includes(provider.code))
  const localizedProviderOptions = providerOptions
    .map(({ name, code }) => ({
      key: code,
      value: code,
      text: getTextIn(name),
      description: code,
    }))
    .sort(createLocaleComparator('text'))

  return (
    <div>
      <Message
        content={`
          Statistics for teachers that admitted credits during and between
          the given semesters for one of the given course providers.
        `}
        header="Teacher statistics by course providers"
      />
      <Segment>
        <Form loading={isLoading || isFetching}>
          <Form.Group widths="equal">
            <Form.Dropdown
              label="Start semester"
              name="semesterStart"
              onChange={setStartSemester}
              options={semesters.filter(semester => semester.value <= currentSemesterCode)}
              placeholder="Semester"
              search
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={semesterStart}
            />
            <Form.Dropdown
              disabled={!semesterStart}
              label="End semester"
              name="semesterEnd"
              onChange={setEndSemester}
              options={semesters.filter(
                semester => semester.value <= currentSemesterCode && semester.value >= semesterStart
              )}
              placeholder="Semester"
              search
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={semesterEnd}
            />
          </Form.Group>
          <Form.Field>
            <label>Course providers</label>
            <Dropdown
              data-cy="course-providers"
              multiple
              name="providers"
              onChange={changeProviders}
              options={localizedProviderOptions}
              placeholder="Providers"
              search
              selectOnBlur={false}
              selectOnNavigation={false}
              selection
              value={providers}
            />
          </Form.Field>
          <Button
            content="Search"
            disabled={invalidQueryParams}
            fluid
            onClick={() => getTeacherStatistics({ semesterStart, semesterEnd, providers })}
          />
        </Form>
      </Segment>
      {teacherStats.length > 0 && (
        <Segment>
          <TeacherStatisticsTable statistics={teacherStats} variant="leaderboard" />
        </Segment>
      )}
      {!isLoading && !isFetching && teacherData && teacherStats.length === 0 && <Message content="No teachers found" />}
    </div>
  )
}
