import moment from 'moment'
import React, { useState } from 'react'
import { Form, Segment, Dropdown, Button, Message } from 'semantic-ui-react'

import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetProvidersQuery } from '@/redux/providers'
import { useGetSemestersQuery } from '@/redux/semesters'
import { useLazyGetTeacherStatisticsQuery } from '@/redux/teachers'
import { TeacherStatisticsTable } from '../TeacherStatisticsTable'

export const TeacherStatistics = () => {
  const { getTextIn } = useLanguage()
  const [semesterStart, setSemesterStart] = useState(null)
  const [semesterEnd, setSemesterEnd] = useState(null)
  // awful variable name but for some reason we need providers for props and state :kuolemakiitos:
  const [provs, setProviders] = useState([])
  const { rights, isAdmin } = useGetAuthorizedUserQuery()
  const [getTeacherStatistics, { data: teacherData, isFetching, isLoading }] = useLazyGetTeacherStatisticsQuery()
  const { data: providers = [] } = useGetProvidersQuery()

  const { data: semesterData } = useGetSemestersQuery()

  const semesters = !semesterData?.semesters
    ? []
    : Object.values(semesterData?.semesters)
        .reverse()
        .map(({ semestercode, name }, idx) => ({
          key: idx,
          value: semestercode,
          text: name.en,
        }))

  const setStartSemester = (_, { value }) => {
    setSemesterStart(value)
    if (semesterEnd <= value) {
      setSemesterEnd(value)
    }
  }

  /*
    Maps new studyright codes to providercodes. Just a wild guess on how the codes are structured....
    --------
    KH50_005
    500-K005
    --------
    KH57_001
    500-K001
    --------
    KH74_001
    740-K001
    --------
    KH80_003
    800-K003
    --------
    etcetc...
    */
  const mapToProviders = rights =>
    rights.map(r => {
      const isNumber = str => !Number.isNaN(Number(str))
      if (r.includes('_')) {
        const [left, right] = r.split('_')
        const prefix = [...left].filter(isNumber).join('')
        const suffix = `${left[0]}${right}`
        const providercode = `${prefix}0-${suffix}`
        return providercode
      }
      return r
    })

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

  const userProviders = mapToProviders(rights)
  const invalidQueryParams = provs.length === 0 || !semesterStart
  const providerOptions = isAdmin ? providers : providers.filter(p => userProviders.includes(p.code))
  const localizedProviderOptions = providerOptions.map(({ name, code }) => ({
    key: code,
    value: code,
    text: getTextIn(name),
  }))
  const filteredOptions = semesters.filter(sem => {
    const options =
      moment(new Date()).diff(new Date(`${new Date().getFullYear()}-8-1`), 'days') > 0
        ? Number(sem.text.replace(/[^0-9]/g, '')) <= new Date().getFullYear()
        : Number(sem.text.replace(/[^0-9]/g, '')) < new Date().getFullYear() ||
          (Number(sem.text.replace(/[^0-9]/g, '')) === new Date().getFullYear() && sem.text.includes('Spring')) // so that current spring is included
    return options
  })
  return (
    <div>
      <Message
        header="Teacher statistics by course providers"
        content="Statistics for teachers that admitted credits during
              and between the given semesters for one of the given course providers."
      />
      <Segment>
        <Form loading={isLoading || isFetching}>
          <Form.Group widths="equal">
            <Form.Dropdown
              name="semesterStart"
              placeholder="Semester"
              label="Start semester"
              selection
              search
              options={filteredOptions}
              value={semesterStart}
              onChange={setStartSemester}
              selectOnBlur={false}
              selectOnNavigation={false}
            />
            <Form.Dropdown
              name="semesterEnd"
              placeholder="Semester"
              label="End semester"
              selection
              search
              options={filteredOptions.filter(semester => semester.value >= semesterStart)}
              disabled={!semesterStart}
              value={semesterEnd}
              onChange={setEndSemester}
              selectOnBlur={false}
              selectOnNavigation={false}
            />
          </Form.Group>
          <Form.Field>
            <label>Course providers</label>
            <Dropdown
              name="providers"
              placeholder="Providers"
              multiple
              selection
              search
              options={localizedProviderOptions}
              value={provs}
              onChange={changeProviders}
              selectOnBlur={false}
              selectOnNavigation={false}
              data-cy="course-providers"
            />
          </Form.Field>
          <Button
            fluid
            content="Search"
            onClick={() => getTeacherStatistics({ semesterStart, semesterEnd, providers: provs })}
            disabled={invalidQueryParams}
          />
        </Form>
      </Segment>
      {teacherStats.length > 0 && (
        <Segment>
          <TeacherStatisticsTable statistics={teacherStats} variant="leaderboard" />
        </Segment>
      )}
    </div>
  )
}
