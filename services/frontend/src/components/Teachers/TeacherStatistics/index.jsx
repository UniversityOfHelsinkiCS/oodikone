import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { shape, func, arrayOf, bool, string } from 'prop-types'
import { Form, Segment, Dropdown, Button, Message } from 'semantic-ui-react'
import moment from 'moment'
import { getProviders } from '../../../redux/providers'
import { getSemesters } from '../../../redux/semesters'
import { getTeacherStatistics } from '../../../redux/teacherStatistics'
import TeacherStatisticsTable from '../TeacherStatisticsTable'
import { getUserIsAdmin, getTextIn } from '../../../common'
import useLanguage from '../../LanguagePicker/useLanguage'

const TeacherStatistics = ({
  getProviders,
  getSemesters,
  getTeacherStatistics,
  semesters,
  providers,
  statistics,
  pending,
  isAdmin,
  rights,
  history,
}) => {
  const { language } = useLanguage()
  const [semesterStart, setSemesterStart] = useState(null)
  const [semesterEnd, setSemesterEnd] = useState(null)
  const [display, setDisplay] = useState(false)
  // awful variable name but for some reason we need providers for props and state :kuolemakiitos:
  const [provs, setProviders] = useState([])

  useEffect(() => {
    getProviders()
    getSemesters()
  }, [])

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

  const handleSubmit = async () => {
    await getTeacherStatistics(semesterStart, semesterEnd, provs)
    setDisplay(true)
  }

  const userProviders = mapToProviders(rights)
  const invalidQueryParams = provs.length === 0 || !semesterStart
  const providerOptions = isAdmin ? providers : providers.filter(p => userProviders.includes(p.code))
  const localizedProviderOptions = providerOptions.map(({ name, ...rest }) => ({
    ...rest,
    text: getTextIn(name, language),
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
        <Form loading={pending}>
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
          <Button fluid content="Search" onClick={handleSubmit} disabled={invalidQueryParams} />
        </Form>
      </Segment>
      {display && !pending && (
        <Segment>
          <TeacherStatisticsTable statistics={statistics} onClickFn={id => history.push(`/teachers/${id}`)} />
        </Segment>
      )}
    </div>
  )
}

TeacherStatistics.propTypes = {
  providers: arrayOf(shape({})).isRequired,
  semesters: arrayOf(shape({})).isRequired,
  statistics: arrayOf(shape({})).isRequired,
  getSemesters: func.isRequired,
  getProviders: func.isRequired,
  getTeacherStatistics: func.isRequired,
  pending: bool.isRequired,
  history: shape({}).isRequired,
  rights: arrayOf(string).isRequired,
  isAdmin: bool.isRequired,
}

const mapStateToProps = state => {
  const {
    providers,
    teacherStatistics,
    auth: {
      token: { rights, roles },
    },
  } = state
  const { semesters } = state.semesters.data
  const providerOptions = providers.data
  const semesterOptions = !semesters
    ? []
    : Object.values(semesters)
        .reverse()
        .map(({ semestercode, name }, idx) => ({
          key: idx,
          value: semestercode,
          text: name.en,
        }))
  const statistics = Object.values(teacherStatistics.data).map(teacher => ({
    id: teacher.id,
    name: teacher.name,
    credits: teacher.stats.credits,
    passed: teacher.stats.passed,
    failed: teacher.stats.failed,
    transferred: teacher.stats.transferred,
  }))
  return {
    providers: providerOptions,
    semesters: semesterOptions,
    statistics,
    pending: teacherStatistics.pending,
    error: teacherStatistics.error,
    rights,
    isAdmin: getUserIsAdmin(roles),
  }
}

export default connect(mapStateToProps, {
  getProviders,
  getSemesters,
  getTeacherStatistics,
})(withRouter(TeacherStatistics))
