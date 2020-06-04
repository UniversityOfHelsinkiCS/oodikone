import React, { Component, Fragment } from 'react'
import { func, shape, string, arrayOf, integer, bool } from 'prop-types'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import { Segment, Table, Icon, Label, Header, Loader, Item, Menu, Tab, Input, Message } from 'semantic-ui-react'
import { isEmpty, sortBy, flattenDeep, cloneDeep } from 'lodash'
import moment from 'moment'
import Highcharts from 'highcharts/highstock'
import ReactHighcharts from 'react-highcharts'
import { withRouter, Link } from 'react-router-dom'

import { getStudent, removeStudentSelection, resetStudent } from '../../redux/students'
import { getSemesters } from '../../redux/semesters'
import StudentInfoCard from '../StudentInfoCard'
import CreditAccumulationGraphHighCharts from '../CreditAccumulationGraphHighCharts'
import { byDateDesc, reformatDate, getTextIn } from '../../common'
import { clearCourseStats } from '../../redux/coursestats'
import SortableTable from '../SortableTable'
import StudentCourseTable from '../StudentCourseTable'

class StudentDetails extends Component {
  constructor() {
    super()
    this.state = {
      graphYearStart: null,
      degreename: '',
      studyrightid: null,
      chunky: false,
      chunksize: 5
    }
  }

  componentDidMount() {
    this.props.getSemesters()
    this.unlistenHistory = this.props.history.listen(() => {
      this.props.resetStudent()
      this.props.removeStudentSelection()
    })
  }

  componentDidUpdate() {
    if (isEmpty(this.props.student) && this.props.studentNumber && !this.props.error) {
      this.props.getStudent(this.props.studentNumber)
    }
  }

  componentWillUnmount() {
    this.unlistenHistory()
  }

  componentWillReceiveProps(nextProps) {
    const changedStudent = nextProps.studentNumber !== this.props.studentNumber

    if (changedStudent) {
      this.setState({ graphYearStart: null })
    }
  }

  getAbsentYears = () => {
    const {
      semesters,
      student: { semesterenrollments }
    } = this.props
    semesterenrollments.sort((a, b) => a.semestercode - b.semestercode)
    const mappedSemesters = Object.values(semesters.semesters).reduce(
      (acc, { semestercode, startdate, enddate }) => ({ ...acc, [semestercode]: { startdate, enddate } }),
      {}
    )

    // If a student has been absent for a long period, then the enrollments aren't marked in oodi...
    // Therefore we need to manually patch empty enrollment ranges with absences
    const now = new Date().getTime()
    const latestSemester = parseInt(
      Object.entries(mappedSemesters).find(
        ([, { startdate, enddate }]) => now <= new Date(enddate).getTime() && now >= new Date(startdate).getTime()
      )[0],
      10
    )
    const mappedSemesterenrollments = semesterenrollments.reduce(
      (res, curr) => ({ ...res, [curr.semestercode]: curr }),
      {}
    )
    const patchedSemesterenrollments = []
    if (semesterenrollments.length) {
      let runningSemestercode = semesterenrollments[0].semestercode
      while (runningSemestercode <= latestSemester) {
        if (!mappedSemesterenrollments[runningSemestercode])
          patchedSemesterenrollments.push({ semestercode: runningSemestercode, enrollmenttype: 2 })
        else patchedSemesterenrollments.push(mappedSemesterenrollments[runningSemestercode])
        runningSemestercode++
      }
    }

    const formatAbsence = ({ semestercode }) => {
      const { startdate, enddate } = mappedSemesters[semestercode]
      return {
        semestercode,
        startdate: new Date(startdate).getTime(),
        enddate: new Date(enddate).getTime()
      }
    }

    const mergeAbsences = absences => {
      const res = []
      let currentSemestercode = -1
      if (absences.length) {
        res.push(absences[0])
        currentSemestercode = absences[0].semestercode
      }
      absences.forEach((absence, i) => {
        if (i === 0) return
        if (absence.semestercode === currentSemestercode + 1) res[res.length - 1].enddate = absence.enddate
        else res.push(absence)
        currentSemestercode = absence.semestercode
      })
      return res
    }

    return mergeAbsences(
      patchedSemesterenrollments
        .filter(({ enrollmenttype }) => enrollmenttype !== 1) // 1 = present & 2 = absent
        .map(absence => formatAbsence(absence))
    )
  }

  showPopulationStatistics = (studyprogramme, date) => {
    const year = moment(date).isBefore(moment(`${date.slice(0, 4)}-08-01`)) ? date.slice(0, 4) - 1 : date.slice(0, 4)
    const months = Math.ceil(moment.duration(moment().diff(`${year}-08-01`)).asMonths())
    return (
      `/populations?months=${months}&semesters=FALL&semesters=` +
      `SPRING&studyRights=%7B"programme"%3A"${studyprogramme}"%7D&year=${year}`
    )
  }

  handleStartDateChange = (elements, id) => {
    const { degreename, graphYearStart, studyrightid } = this.state

    if (id === studyrightid) {
      this.setState({
        graphYearStart: null,
        degreename: '',
        studyrightid: ''
      })
      return
    }

    const getTarget = () =>
      elements.degree ||
      sortBy(elements.programmes, 'startdate', ['desc'])[0] || { startdate: graphYearStart, name: degreename }

    const { startdate, name } = getTarget()
    this.setState({
      graphYearStart: startdate,
      degreename: name,
      studyrightid: id
    })
  }

  renderCreditsGraph = () => {
    const { translate, student } = this.props
    const { graphYearStart } = this.state
    const selectedStart = graphYearStart || student.started
    const filteredCourses = student.courses.filter(c => new Date(c.date) > new Date(selectedStart))
    const newStudent = cloneDeep(student)
    newStudent.courses = filteredCourses
    const sample = [newStudent]

    const dates = flattenDeep(student.courses.map(c => c.date)).map(d => new Date(d).getTime())
    sample.maxCredits = newStudent.courses.reduce((a, c) => {
      if (c.isStudyModuleCredit || !c.passed) return a + 0
      return a + c.credits
    }, 0)
    sample.maxDate = dates.length > 0 ? Math.max(...dates) : new Date().getTime()
    sample.minDate = new Date(selectedStart).getTime()

    return (
      <CreditAccumulationGraphHighCharts
        singleStudent
        students={sample}
        selectedStudents={[student.studentNumber]}
        title={translate('studentStatistics.chartTitle')}
        translate={translate}
        maxCredits={sample.maxCredits}
        absences={this.getAbsentYears()}
      />
    )
  }

  renderCourseParticipation = () => {
    const { translate, student, language } = this.props

    const courseHeaders = [
      translate('common.date'),
      translate('common.course'),
      translate('common.grade'),
      translate('common.credits'),
      ''
    ]

    const courseRowsByAcademicYear = {}

    student.courses.sort(byDateDesc).forEach(c => {
      const { date, grade, credits, course, isStudyModuleCredit, passed } = c
      let icon = null
      if (isStudyModuleCredit) {
        icon = <Icon name="certificate" color="purple" />
      } else if (passed) {
        icon = <Icon name="check circle outline" color="green" />
      } else {
        icon = <Icon name="circle outline" color="red" />
      }

      if (!courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`]) {
        courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`] = []
      }
      if (!courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`]) {
        courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`] = []
      }

      if (new Date(date).getMonth() < 7) {
        courseRowsByAcademicYear[`${new Date(date).getFullYear() - 1}-${new Date(date).getFullYear()}`].push([
          reformatDate(date, 'DD.MM.YYYY'),
          `${
            isStudyModuleCredit
              ? `${getTextIn(course.name, language)} [Study Module]`
              : getTextIn(course.name, language)
          } (${course.code})`,
          <div>
            {icon}
            {grade}
          </div>,
          credits,
          <Item
            as={Link}
            to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
          >
            <Icon name="level up alternate" onClick={() => this.props.clearCourseStats()} />
          </Item>
        ])
      } else {
        courseRowsByAcademicYear[`${new Date(date).getFullYear()}-${new Date(date).getFullYear() + 1}`].push([
          reformatDate(date, 'DD.MM.YYYY'),
          `${
            isStudyModuleCredit
              ? `${getTextIn(course.name, language)} [Study Module]`
              : getTextIn(course.name, language)
          } (${course.code})`,
          <div>
            {icon}
            {grade}
          </div>,
          credits,
          <Item
            as={Link}
            to={`/coursestatistics?courseCodes=["${course.code}"]&separate=false&unifyOpenUniCourses=false`}
          >
            <Icon name="level up alternate" onClick={() => this.props.clearCourseStats()} />
          </Item>
        ])
      }
    })

    const courseTables = Object.keys(courseRowsByAcademicYear).map(academicYear => {
      if (courseRowsByAcademicYear[academicYear] < 1) return null

      return (
        <Fragment key={academicYear}>
          <Header content={academicYear} />
          <StudentCourseTable
            headers={courseHeaders}
            rows={courseRowsByAcademicYear[academicYear]}
            noResultText="Student has courses marked"
          />
        </Fragment>
      )
    })

    return (
      <Fragment>
        <Header content="Courses" />
        {courseTables}
      </Fragment>
    )
  }

  renderTags = () => {
    const { student, language } = this.props
    const data = Object.values(
      student.tags.reduce((acc, t) => {
        if (!acc[t.programme.code]) acc[t.programme.code] = { programme: t.programme, tags: [] }
        acc[t.tag.studytrack].tags.push(t)
        return acc
      }, {})
    )
    if (data.length === 0) return null
    return (
      <Fragment>
        <Header content="Tags" />
        <SortableTable
          data={data}
          getRowKey={t => t.programme.code}
          columns={[
            {
              key: 'PROGRAMME',
              title: 'Programme',
              getRowVal: t => getTextIn(t.programme.name, language),
              cellProps: { collapsing: true }
            },
            {
              key: 'CODE',
              title: 'Code',
              getRowVal: t => t.programme.code,
              cellProps: { collapsing: true }
            },
            {
              key: 'TAGS',
              title: 'Tags',
              getRowVal: t => sortBy(t.tags.map(tt => tt.tag.tagname)).join(':'),
              getRowContent: t =>
                sortBy(t.tags, t => t.tag.tagname).map(t => (
                  <Label key={t.tag.tag_id} content={t.tag.tagname} color={t.tag.personal_user_id ? 'purple' : null} />
                ))
            }
          ]}
        />
      </Fragment>
    )
  }

  renderStudyRights = () => {
    const { student, language } = this.props
    const { studyrightid } = this.state
    const studyRightHeaders = ['Degree', 'Programme', 'Study Track', 'Graduated']
    const studyRightRows = student.studyrights.map(studyright => {
      const degree = sortBy(studyright.studyright_elements, 'enddate').find(e => e.element_detail.type === 10)
      const formattedDegree = degree && {
        startdate: degree.startdate,
        enddate: degree.enddate,
        name: getTextIn(degree.element_detail.name, language),
        graduateionDate: degree.graduation_date,
        canceldate: degree.canceldate
      }
      const programmes = sortBy(studyright.studyright_elements, 'enddate')
        .filter(e => e.element_detail.type === 20)
        .map(programme => ({
          code: programme.code,
          startdate: programme.startdate,
          enddate: programme.enddate,
          name: getTextIn(programme.element_detail.name, language)
        }))
      const studytracks = sortBy(studyright.studyright_elements, 'enddate')
        .filter(e => e.element_detail.type === 30)
        .map(studytrack => ({
          startdate: studytrack.startdate,
          enddate: studytrack.enddate,
          name: getTextIn(studytrack.element_detail.name, language)
        }))
      return {
        studyrightid: studyright.studyrightid,
        graduated: studyright.graduated,
        canceldate: studyright.canceldate,
        enddate: studyright.enddate,
        elements: { degree: formattedDegree, programmes, studytracks }
      }
    })

    const filterDuplicates = (elem1, index, array) => {
      for (let i = 0; i < array.length; i++) {
        const elem2 = array[i]
        if (
          elem1.name === elem2.name &&
          ((elem1.startdate > elem2.startdate && elem1.enddate <= elem2.enddate) ||
            (elem1.enddate < elem2.enddate && elem1.startdate >= elem2.startdate))
        ) {
          return false
        }
      }
      return true
    }

    return (
      <Fragment>
        <Header content="Studyrights" />
        <Table className="fixed-header">
          <Table.Header>
            <Table.Row>
              {studyRightHeaders.map(header => (
                <Table.HeaderCell key={header}>{header}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortBy(studyRightRows, c => Number(c.studyrightid))
              .reverse()
              .map(c => {
                if (c.elements.programmes.length > 0 || c.elements.degree) {
                  return (
                    <Table.Row
                      active={c.studyrightid === studyrightid}
                      key={c.studyrightid}
                      onClick={() => this.handleStartDateChange(c.elements, c.studyrightid)}
                    >
                      <Table.Cell verticalAlign="middle">
                        {c.elements.degree && (
                          <p key={c.elements.degree.name}>
                            {`${c.elements.degree.name}
                          (${reformatDate(c.elements.degree.startdate, 'DD.MM.YYYY')} -
                          ${reformatDate(c.elements.degree.enddate, 'DD.MM.YYYY')})`}
                            <br />
                          </p>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        {sortBy(c.elements.programmes.filter(filterDuplicates), 'startdate')
                          .reverse()
                          .map(programme => (
                            <p key={`${programme.name}-${programme.startdate}`}>
                              {`${programme.name} (${reformatDate(programme.startdate, 'DD.MM.YYYY')} - ${reformatDate(
                                programme.enddate,
                                'DD.MM.YYYY'
                              )})`}
                              <Item as={Link} to={this.showPopulationStatistics(programme.code, programme.startdate)}>
                                <Icon name="level up alternate" />
                              </Item>{' '}
                              <br />
                            </p>
                          ))}
                      </Table.Cell>
                      <Table.Cell>
                        {sortBy(c.elements.studytracks.filter(filterDuplicates), 'startdate')
                          .reverse()
                          .map(studytrack => (
                            <p key={studytrack.name}>
                              {`${studytrack.name} (${reformatDate(
                                studytrack.startdate,
                                'DD.MM.YYYY'
                              )} - ${reformatDate(studytrack.enddate, 'DD.MM.YYYY')})`}
                              <br />{' '}
                            </p>
                          ))}
                      </Table.Cell>
                      <Table.Cell>
                        {c.canceldate ? ( // eslint-disable-line
                          <div>
                            <p style={{ color: 'red', fontWeight: 'bold' }}>CANCELED</p>
                          </div>
                        ) : c.graduated ? (
                          <div>
                            <Icon name="check circle outline" color="green" />
                            <p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
                          </div>
                        ) : (
                          <div>
                            <Icon name="circle outline" color="red" />
                            <p>{reformatDate(c.enddate, 'DD.MM.YYYY')}</p>
                          </div>
                        )}
                      </Table.Cell>
                    </Table.Row>
                  )
                }
                return null
              })}
          </Table.Body>
        </Table>
      </Fragment>
    )
  }

  chunkifyArray = (array, size = 1) => {
    if (!array) return []
    const firstChunk = array.slice(0, size) // create the first chunk of the given array
    if (!firstChunk.length) {
      return array // this is the base case to terminal the recursive
    }
    return [firstChunk].concat(this.chunkifyArray(array.slice(size, array.length), size))
  }

  // probably needs some fixing to be done
  gradeMeanSeries = student => {
    const { chunksize } = this.state
    const sortedCourses = student.courses.sort(byDateDesc).reverse()
    const filterCourses = sortedCourses.filter(c => Number(c.grade) && !c.isStudyModuleCredit && c.passed)
    const data = filterCourses.reduce(
      (acc, curr) => {
        acc.grades.push({ grade: Number(curr.grade), date: curr.date, code: curr.course_code })
        acc.dates.push(reformatDate(curr.date, 'DD.MM.YYYY'))
        const sum = acc.grades.reduce((a, b) => a + b.grade, 0)
        acc.mean.push({ y: sum / acc.grades.length, x: new Date(curr.date).getTime() })
        if (!acc.minDate) {
          acc.minDate = curr.date
          acc.maxDate = curr.date
        }
        if (acc.minDate > curr.date) acc.minDate = curr.date
        if (acc.maxDate < curr.date) acc.maxDate = curr.date
        return acc
      },
      { grades: [], dates: [], mean: [], minDate: null, maxDate: null }
    )
    const size = Number(chunksize) ? chunksize : 3
    const chunks = this.chunkifyArray(data.grades, size)
    const chunkMeans = chunks.reduce((acc, curr) => {
      const sum = curr.reduce((a, b) => a + b.grade, 0)
      acc.push({
        name: `${curr.length} courses`,
        y: sum / curr.length,
        x: new Date(curr[curr.length - 1].date).getTime()
      })
      return acc
    }, [])
    data.chunkMeans = [{ name: 'Group mean', data: chunkMeans, seriesThreshold: 150 }]
    return data
  }

  renderGradeGraph = student => {
    const series = this.gradeMeanSeries(student)
    const { chunky, chunksize } = this.state
    const { mean, chunkMeans } = series
    const shownMean = chunky ? chunkMeans : [{ data: mean, name: 'Total mean', seriesThreshold: 150 }]

    const options = {
      chart: {
        type: 'spline'
      },
      title: {
        text: 'Grade plot'
      },
      xAxis: {
        type: 'datetime',
        min: new Date(series.minDate).getTime(),
        max: new Date(series.maxDate).getTime()
      },
      yAxis: {
        min: 1,
        max: 5
      },
      series: shownMean
    }
    return (
      <div align="center">
        <Message style={{ maxWidth: '400px' }}>
          <Message.Header>Grade graph</Message.Header>
          <p>
            Plotting of grades. Total mean shows how the grade mean has developed during studies. Group mean splits
            courses into chunks of selected size and takes the mean out of those grades.
          </p>
        </Message>
        <Menu compact align="center">
          <Menu.Item active={!chunky} name="Show total mean" onClick={() => this.setState({ chunky: false })} />
          <Menu.Item active={chunky} name="Show group mean" onClick={() => this.setState({ chunky: true })} />
        </Menu>
        {chunky && (
          <div>
            <Input
              label="Group size"
              defaultValue={chunksize}
              onChange={e => this.setState({ chunksize: Number(e.target.value) })}
            />
          </div>
        )}
        <ReactHighcharts highcharts={Highcharts} config={options} />
      </div>
    )
  }

  render() {
    const { translate, student, studentNumber, pending, error, semesters, fetching } = this.props
    if (fetching) return <Loader active={fetching} />
    if ((pending || !studentNumber || isEmpty(student) || !semesters) && !error) return null
    if (error) {
      return (
        <Segment textAlign="center">
          <p>Student not found or no sufficient permissions</p>
        </Segment>
      )
    }

    const panes = [
      { menuItem: 'Credit graph', render: () => <Tab.Pane>{this.renderCreditsGraph()}</Tab.Pane> },
      { menuItem: 'Grade graph', render: () => <Tab.Pane>{this.renderGradeGraph(student)}</Tab.Pane> }
    ]

    return (
      <Segment className="contentSegment">
        <StudentInfoCard student={student} translate={translate} />
        <Tab panes={panes} />
        {this.renderTags()}
        {this.renderStudyRights()}
        {this.renderCourseParticipation()}
      </Segment>
    )
  }
}

StudentDetails.propTypes = {
  language: string.isRequired,
  getStudent: func.isRequired,
  history: shape({}).isRequired,
  resetStudent: func.isRequired,
  removeStudentSelection: func.isRequired,
  studentNumber: string,
  translate: func.isRequired,
  clearCourseStats: func.isRequired,
  student: shape({
    courses: arrayOf(
      shape({
        course: shape({
          code: string,
          name: Object
        }),
        credits: integer,
        date: string,
        grade: string,
        passed: bool
      })
    ),
    credits: integer,
    fetched: bool,
    started: string,
    studentNumber: string,
    tags: arrayOf(
      shape({
        programme: shape({ code: string, name: shape({}) }),
        studentnumber: string,
        tag: shape({ studytrack: string, tagname: string })
      })
    )
  }),
  pending: bool.isRequired,
  error: bool.isRequired,
  fetching: bool.isRequired,
  getSemesters: func.isRequired,
  semesters: shape({
    semesters: shape({}),
    years: shape({})
  }).isRequired
}

StudentDetails.defaultProps = {
  student: {},
  studentNumber: ''
}

const mapStateToProps = ({ students, localize, semesters }) => ({
  language: getActiveLanguage(localize).code,
  student: students.data.find(student => student.studentNumber === students.selected),
  pending: students.pending,
  error: students.error,
  semesters: semesters.data,
  fetching: students.fetching
})

const mapDispatchToProps = {
  removeStudentSelection,
  clearCourseStats,
  resetStudent,
  getStudent,
  getSemesters
}

export default withRouter(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(StudentDetails)
)
