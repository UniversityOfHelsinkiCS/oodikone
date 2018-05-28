import React, { Component } from 'react'
import { render } from 'react-dom'
import Highcharts from 'highcharts/highstock'
import HighchartsReact from 'highcharts-react-official'
import styles from './creditAccumulationGraphHC.css'

import { arrayOf, object, string, func, shape, number, bool } from 'prop-types'

import _ from 'lodash'
import moment from 'moment'
import { withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { clearLoading } from '../../redux/graphSpinner'
import { reformatDate, sortDatesWithFormat } from '../../common'
import { DISPLAY_DATE_FORMAT, CHART_COLORS, API_DATE_FORMAT } from '../../constants'

import CreditGraphTooltip from '../CreditGraphTooltip'

class CreditAccumulationGraphHighCharts extends Component {
  state = {
    combinedStudentData: [],
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
      const changed =
        nextStudents.some(student => !oldStudents.includes(student)) ||
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
      if (
        this.props.selectedStudents &&
        this.state.studentCreditLines.length === this.props.selectedStudents.length
      ) {
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
  getXAxisMonth = (date, startDate) =>
    Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

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
  getStudentCourseData = (student) => {
    const { studentNumber, courses, studyrightStart, started } = student

    const startDate = this.props.selectedStudents.length === 1 ? started : studyrightStart

    const filteredCourses = courses.filter(c => moment(c.date).isSameOrAfter(moment(startDate)))

    let totalCredits = 0
    return filteredCourses.map((c) => {
      const { course, date, credits, grade, passed } = c
      if (passed) {
        totalCredits += credits
      }
      return {
        title: `${course.name} (${course.code})`,
        [studentNumber]: totalCredits,
        credits,
        date: reformatDate(date, DISPLAY_DATE_FORMAT),
        month: this.getXAxisMonth(date, startDate),
        grade,
        passed
      }
    })
  }
  isSingleStudentGraph = students => students.length === 1

  getMoreCreditLines = (students) => {
    const studentCreditLines = this.state.studentCreditLines.concat(this.createStudentCreditLines(students, this.isSingleStudentGraph(students)))

    this.setState({ studentCreditLines, loading: false })
  }

  createStudentCreditLines = (students, isSingleStudent) =>
    students.map((student, i) => {
      const startDate = student.studyrightStart
      const points = []

      let credits = 0
      student.courses.map((course) => {
        if (course.grade !== 'Hyl.') {
          credits += course.credits
        }
        points.push([new Date(course.date).getTime(), credits])
      })
      return { name: student.studentNumber, data: points }
    })

  getTooltip = props => <Tooltip content={<CreditGraphTooltip {...props} />} cursor={false} />

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

  render() {
    const { students, translate, maxCredits } = this.props
    const { combinedStudentData, studentCreditLines } = this.state
    console.log(combinedStudentData)
    const minTick =
      combinedStudentData && combinedStudentData.length > 0 ? combinedStudentData[0].month : 0
    const maxTick =
      combinedStudentData && combinedStudentData.length > 0
        ? Math.ceil(combinedStudentData[combinedStudentData.length - 1].month)
        : 8

    const options = {
      chart: {
        height: 600
      },
      title: {
        text: 'KÄYRIÄ'
      },
      series: studentCreditLines
    }
    if (studentCreditLines.length === 0) return null
    return (
      <div className={styles.graphContainer}>
        <HighchartsReact highcharts={Highcharts} constructorType="stockChart" options={options} />
      </div>
    )
  }
}

const mapStateToProps = state => ({})

export default connect(mapStateToProps, { clearLoading })(withRouter(CreditAccumulationGraphHighCharts))
