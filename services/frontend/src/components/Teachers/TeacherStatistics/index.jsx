import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Dropdown, Form, Message, Segment } from 'semantic-ui-react'

import { getCurrentSemester } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { TeacherStatisticsTable } from '@/components/Teachers/TeacherStatisticsTable'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProvidersQuery } from '@/redux/providers'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useLazyGetTeacherStatisticsQuery } from '@/redux/teachers'
import { getFullStudyProgrammeRights, hasFullAccessToTeacherData } from '@/util/access'
import { createLocaleComparator } from '@/util/comparator'
import { mapToProviders } from '@oodikone/shared/util'

export const TeacherStatistics = () => {
  const { getTextIn } = useLanguage()
  const [semesterStart, setSemesterStart] = useState(null)
  const [semesterEnd, setSemesterEnd] = useState(null)
  const [providers, setProviders] = useState([])
  const { programmeRights, roles, iamGroups } = useGetAuthorizedUserQuery()
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

  const userProviders = mapToProviders(fullStudyProgrammeRights)
  const invalidQueryParams = providers.length === 0 || !semesterStart
  const providerOptions = hasFullAccessToTeacherData(roles, iamGroups)
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
        content={
          <ReactMarkdown>
            Statistics for teachers who admitted credits during or between the selected semesters for one of the
            specified course providers. This is determined by the acceptor person(s) of the attainment. While the
            acceptor person is often the responsible teacher for the course, this is not always the case. If an
            attainment has multiple acceptors, the full amount of credits is given to each acceptor (i.e., the credits
            are **not** divided between the acceptors).
          </ReactMarkdown>
        }
        header="Teacher statistics by course providers"
        info
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
