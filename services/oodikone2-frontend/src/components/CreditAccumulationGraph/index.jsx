import React, { Component } from 'react'
import { arrayOf, object, string, func, shape, number, bool } from 'prop-types'
import { ResponsiveContainer, LineChart, XAxis, YAxis, Line, Tooltip, CartesianGrid, Dot } from 'recharts'
import _ from 'lodash'
import moment from 'moment'
import { Segment, Loader } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { clearLoading } from '../../redux/graphSpinner'

import { DISPLAY_DATE_FORMAT, CHART_COLORS } from '../../constants'
import { reformatDate, sortDatesWithFormat, getTextIn } from '../../common'
import { turquoise } from '../../styles/variables/colors'

import './creditAccumulationGraph.css'
import CreditGraphTooltip from '../CreditGraphTooltip'
import OodikoneLine from './OodikoneLine'

class CreditAccumulationGraph extends Component {
  state = {
    combinedStudentData: undefined,
    studentCreditLines: [],
    timeout: undefined,
    loading: true,
    initialLoad: true
  }

  componentDidMount() {
    const { students } = this.props

    const combinedStudentData = this.createCombinedStudentData(students)
    const timeout = setTimeout(() => this.getMoreCreditLines(students), 1000)
    this.setState({ combinedStudentData, timeout, loading: true })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.students) {
      const nextStudents = nextProps.students.map(student => student.studentNumber)
      const oldStudents = this.props.students.map(student => student.studentNumber)
      const changed = nextStudents.some(student => !oldStudents.includes(student)) ||
        oldStudents.some(student => !nextStudents.includes(student))
      if (changed) {
        const { students } = nextProps
        const timeout = setTimeout(() => this.getMoreCreditLines(students), 1000)
        const combinedStudentData = this.createCombinedStudentData(students)
        this.setState({ combinedStudentData, timeout })
      }
    }

    const loading = nextProps.spinner

    this.setState({ loading })
  }

  componentDidUpdate(prevProps) {
    if (this.state.initialLoad) {
      if (this.props.selectedStudents &&
        (this.state.studentCreditLines.length === this.props.selectedStudents.length)) {
        this.setState({ initialLoad: false }) // eslint-disable-line
        this.props.clearLoading()
      }
    } else if (this.props.spinner && prevProps.selectedStudents !== this.props.selectedStudents) {
      this.props.clearLoading()
    }
  }

  componentWillUnmount() {
    if (this.state.timeout) {
      clearInterval(this.state.timeout)
    }
  }

  getMoreCreditLines = (students) => {
    const studentCreditLines = this.state.studentCreditLines.concat(this.createStudentCreditLines(
      students,
      this.isSingleStudentGraph(students)
    ))

    this.setState({ studentCreditLines, loading: false })
  }

  getXAxisMonth = (date, startDate) =>
    Math.max(moment.utc(date).diff(moment.utc(startDate), 'days') / 30, 0)

  getReferenceLineForStudent = (student) => {
    try {
      const { courses, started } = student
      const lastDate = moment(_.maxBy(courses, course => moment(course.date)).date)
      const lastMonth = Math.ceil(this.getXAxisMonth(lastDate, started))
      const lastCredits = lastMonth * (55 / 12)

      return [{
        month: 0,
        referenceCredits: 0,
        date: reformatDate(started, DISPLAY_DATE_FORMAT)
      },
      {
        month: lastMonth,
        referenceCredits: lastCredits,
        date: reformatDate(lastDate, DISPLAY_DATE_FORMAT)
      }]
    } catch (e) {
      return null
    }
  }

  getReferenceLine = title => (
    <Line
      type="monotone"
      activeDot={false}
      dot={false}
      isAnimationActive={false}
      name={title}
      dataKey="referenceCredits"
      stroke={turquoise}
      connectNulls
    />
  )

  getStudentCourseData = (student) => {
    const { studentNumber, courses, studyrightStart, started } = student
    const { language } = this.props

    const startDate = this.props.selectedStudents.length === 1 ? started : studyrightStart

    const filteredCourses = courses
      .filter(c => moment(c.date).isSameOrAfter(moment(startDate)))

    let totalCredits = 0
    return filteredCourses.map((c) => {
      const {
        course, date, credits, grade, passed, isStudyModuleCredit
      } = c
      if (passed && !isStudyModuleCredit) {
        totalCredits += credits
      }
      return {
        title: `${getTextIn(course.name, language)} (${course.code})`,
        [studentNumber]: totalCredits,
        credits,
        date: reformatDate(date, DISPLAY_DATE_FORMAT),
        month: this.getXAxisMonth(date, startDate),
        grade,
        passed,
        isStudyModuleCredit
      }
    })
  }

  getStudentChartData = (student) => {
    const { studentNumber, started } = student
    return [
      ...this.getStudentCourseData(student),
      {
        title: '',
        [studentNumber]: 0,
        credits: 0,
        date: reformatDate(started, DISPLAY_DATE_FORMAT),
        month: 0
      }
    ]
  }

  getDot = (studentNumber, isSingleStudent, onClickFn) => (isSingleStudent ? <Dot r={4} /> : (
    <Dot
      className="dot"
      r={3}
      onClick={() => onClickFn(studentNumber)}
    />
  ))

  getStudentCreditsLine = (student, i, dot, hide) => {
    const { studentNumber } = student
    return (<OodikoneLine
      key={`graph-${studentNumber}`}
      type="monotone"
      activeDot={{ r: 8 }}
      dot={dot}
      dataKey={studentNumber}
      stroke={CHART_COLORS[i]}
      isAnimationActive={false}
      hide={hide}
      connectNulls
    />)
  }

  getTooltip = props => (
    <Tooltip
      content={<CreditGraphTooltip {...props} />}
      cursor={false}
    />
  )

  getStudent(id) {
    const i = this.props.students.indexOf(s => s.studentNumber === id)
    const student = this.props.students.find(s => s.studentNumber === id)
    return {
      i,
      student
    }
  }

  getStudentCreditLines() {
    return this.state.studentCreditLines.map((studentCreditLine) => {
      const studentNumber = studentCreditLine.props.dataKey

      if (this.props.selectedStudents && !this.props.selectedStudents.includes(studentNumber)) {
        const isSingleStudent = this.props.selectedStudents.length === 1
        const dot = this.getDot(studentNumber, isSingleStudent, this.pushToHistoryFn)
        const { student, i } = this.getStudent(studentNumber)

        return student ? this.getStudentCreditsLine(student, i, dot, true) : null
      }
      return studentCreditLine
    })
  }

  isSingleStudentGraph = students => students.length === 1

  pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

  createStudentCreditLines = (students, isSingleStudent) =>
    students.map((student, i) => {
      const dot = this.getDot(student.studentNumber, isSingleStudent, this.pushToHistoryFn)
      return this.getStudentCreditsLine(student, i, dot, false)
    })

  createCombinedStudentData = (students) => {
    let combinedStudentData = [].concat(...students.map(this.getStudentChartData))
    if (this.isSingleStudentGraph(students)) {
      const referenceData = this.getReferenceLineForStudent(students[0])
      combinedStudentData = combinedStudentData.concat(referenceData)
    }
    try {
      return combinedStudentData.sort((c1, c2) =>
        sortDatesWithFormat(c1.date, c2.date, DISPLAY_DATE_FORMAT))
    } catch (e) {
      return null
    }
  }

  xAxisFormatter = (startDate, month) => (moment(startDate).add(month, 'months').format('MMM YY'))

  render() {
    const { students, translate, maxCredits } = this.props
    const { combinedStudentData } = this.state
    const isSingleStudent = this.isSingleStudentGraph(students)
    if (!isSingleStudent) {
      return null
    }
    const minTick = combinedStudentData && combinedStudentData.length > 0 ?
      combinedStudentData[0].month : 0
    const maxTick = combinedStudentData && combinedStudentData.length > 0 ?
      Math.ceil(combinedStudentData[combinedStudentData.length - 1].month) : 8
    const referenceLine = isSingleStudent && this.getReferenceLine(translate('graphs.referenceCredits'))
    const toolTip = isSingleStudent && this.getTooltip(this.props)
    let firstDate = moment()
    if (isSingleStudent) {
      firstDate = moment(students[0].started)
    }
    return (
      <div className="graphContainer">
        <Segment attached="bottom">
          <Loader active={this.state.loading} />
          <ResponsiveContainer height={400}>
            <LineChart data={combinedStudentData}>
              <XAxis
                dataKey="month"
                type="number"
                allowDecimals={false}
                domain={[minTick, maxTick]}
                tick={{ fontSize: '15' }}
                tickCount={20}
                tickFormatter={tick => this.xAxisFormatter(firstDate, tick)}
              />
              <YAxis
                type="number"
                domain={[0, maxCredits]}
                tickFormatter={tick => Math.round(tick)}
              />
              <CartesianGrid strokeDasharray="3 3" />
              I {toolTip}
              {this.getStudentCreditLines()}
              {referenceLine}
            </LineChart>
          </ResponsiveContainer>
        </Segment>
      </div>
    )
  }
}

CreditAccumulationGraph.propTypes = {
  language: string.isRequired,
  translate: func.isRequired,
  students: arrayOf(object).isRequired,
  title: string.isRequired,
  history: shape({}).isRequired,
  maxCredits: number.isRequired,
  selectedStudents: arrayOf(string).isRequired,
  spinner: bool.isRequired,
  clearLoading: func.isRequired
}

const mapStateToProps = state => ({
  language: state.settings.language,
  spinner: state.graphSpinner
})

export default connect(
  mapStateToProps,
  { clearLoading }
)(withRouter(CreditAccumulationGraph))
