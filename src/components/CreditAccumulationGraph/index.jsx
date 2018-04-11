import React, { Component } from 'react'
import { arrayOf, object, string, func, shape } from 'prop-types'
import { ResponsiveContainer, LineChart, XAxis, YAxis, Line, Tooltip, CartesianGrid, Dot } from 'recharts'
import _ from 'lodash'
import moment from 'moment'
import { Header, Segment, Message, Loader } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'

import { DISPLAY_DATE_FORMAT, CHART_COLORS, API_DATE_FORMAT } from '../../constants'
import { reformatDate, sortDatesWithFormat } from '../../common'
import { turquoise } from '../../styles/variables/colors'

import styles from './creditAccumulationGraph.css'
import CreditGraphTooltip from '../CreditGraphTooltip'


class CreditAccumulationGraph extends Component {
  state = {
    combinedStudentData: undefined,
    studentCreditLines: [],
    timeout: undefined,
    loading: true
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
        this.setState({ combinedStudentData, timeout, loading: true })
      }
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
    Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

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
    const { studentNumber, started, courses } = student

    const filteredCourses = courses.filter(c => moment(c.date).isSameOrAfter(moment(started)))

    let totalCredits = 0
    return filteredCourses.map((c) => {
      const {
        course, date, credits, grade, passed
      } = c
      if (passed) {
        totalCredits += credits
      }
      return {
        title: `${course.name} (${course.code})`,
        [studentNumber]: totalCredits,
        credits,
        date: reformatDate(date, DISPLAY_DATE_FORMAT),
        month: this.getXAxisMonth(date, started),
        grade,
        passed
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
      className={styles.dot}
      r={3}
      onClick={() => onClickFn(studentNumber)}
    />
  ))

  getStudentCreditsLine = (student, i, dot) => {
    const { studentNumber } = student
    return (<Line
      key={`graph-${studentNumber}`}
      type="monotone"
      activeDot={{ r: 8 }}
      dot={dot}
      dataKey={studentNumber}
      stroke={CHART_COLORS[i]}
      isAnimationActive={false}
      connectNulls
    />)
  }

  getTooltip = props => (
    <Tooltip
      content={<CreditGraphTooltip {...props} />}
      cursor={false}
    />
  )

  isSingleStudentGraph = students => students.length === 1

  createStudentCreditLines = (students, isSingleStudent) => {
    const pushToHistoryFn = studentNumber => this.props.history.push(`/students/${studentNumber}`)

    return students.map((student, i) => {
      const dot = this.getDot(student.studentNumber, isSingleStudent, pushToHistoryFn)
      return this.getStudentCreditsLine(student, i, dot)
    })
  }

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

  render() {
    const { students, title, translate } = this.props
    const { combinedStudentData, studentCreditLines } = this.state
    if (students.length === 0 || !combinedStudentData) {
      return (
        <Message warning>
          <Message.Header>{title}</Message.Header>
          <p>{translate('common.noResults')}</p>
        </Message>)
    }
    const isSingleStudent = this.isSingleStudentGraph(students)
    const minTick = combinedStudentData[0].month
    const maxTick = Math.ceil(combinedStudentData[combinedStudentData.length - 1].month)
    const referenceLine = isSingleStudent && this.getReferenceLine(translate('graphs.referenceCredits'))
    const toolTip = isSingleStudent && this.getTooltip(this.props)
    return (
      <div className={styles.graphContainer}>
        <Header attached="top" size="large">{title}</Header>
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
              />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              I {toolTip}
              {studentCreditLines}
              {referenceLine}
            </LineChart>
          </ResponsiveContainer>
        </Segment>
      </div>
    )
  }
}

CreditAccumulationGraph.propTypes = {
  translate: func.isRequired,
  students: arrayOf(object).isRequired,
  title: string.isRequired,
  history: shape({}).isRequired
}

export default withRouter(CreditAccumulationGraph)
