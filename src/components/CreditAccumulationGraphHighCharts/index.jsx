import React, { Component } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import { arrayOf, object, string } from 'prop-types'
import { withRouter } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'
import styles from './creditAccumulationGraphHC.css'
import { clearLoading } from '../../redux/graphSpinner'
import { reformatDate, sortDatesWithFormat } from '../../common'
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants'

boost(Highcharts)

class CreditAccumulationGraphHighCharts extends Component {
  state = {
    studentCreditLines: [],
    timeout: undefined,
    options: [],
    initialLoad: true
  }

  componentDidMount() {
    const { students } = this.props
    const timeout = setTimeout(() => this.getMoreCreditLines(students), 1000)
    const self = this
    const dataOfSelected = this.createStudentCreditLines(students).filter(line =>
      this.props.selectedStudents.includes(line.name))
    const options = {
      chart: {
        height: 1000
      },
      plotOptions: {
        series: {
          point: {
            events: {
              click() {
                self.props.history.push(`/students/${this.series.name}`)
              },
              mouseOver() {
                if (this.series.halo) {
                  this.series.halo
                    .attr({
                      class: 'highcharts-tracker'
                    })
                    .toFront()
                }
              },
              hover: {
                halo: {
                  size: 9,
                  attributes: {
                    fill: Highcharts.getOptions().colors[2],
                    'stroke-width': 2,
                    stroke: Highcharts.getOptions().colors[1]
                  }
                }
              }
            },
            cursor: 'pointer'
          }
        }
      },
      series: dataOfSelected
    }
    this.setState({ timeout, options })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.students) {
      console.log(nextProps)
      const nextStudents = nextProps.students.map(student => student.studentNumber)
      const oldStudents = this.props.students.map(student => student.studentNumber)
      const changed =
        nextStudents.some(student => !oldStudents.includes(student)) ||
        oldStudents.some(student => !nextStudents.includes(student))
      const dataOfSelected = this.state.studentCreditLines.filter(line =>
        nextProps.selectedStudents.includes(line.name))
      const options = { ...this.state.options, yAxis: { max: nextProps.students.maxCredits, title: { text: 'Credits' } }, series: dataOfSelected }

      this.setState({ options })

      if (changed) {
        const { students } = nextProps
        const timeout = setTimeout(() => this.getMoreCreditLines(students), 1000)
        this.setState({ timeout })
      }
    }
  }

  componentDidUpdate() {
    if (this.state.initialLoad) {
      if (
        this.props.selectedStudents &&
        this.state.studentCreditLines.length === this.props.selectedStudents.length
      ) {
        this.setState({ initialLoad: false }) // eslint-disable-line
      }
    }
  }


  componentWillUnmount() {
    if (this.state.timeout) {
      clearInterval(this.state.timeout)
    }
  }
  getXAxisMonth = (date, startDate) =>
    Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

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

  getMoreCreditLines = (students) => {
    const studentCreditLines = this.state.studentCreditLines
      .concat(this.createStudentCreditLines(students))
    this.setState({ studentCreditLines })
  }

  createCombinedStudentData = (students) => {
    const combinedStudentData = [].concat(...students.map(this.getStudentChartData))
    try {
      return combinedStudentData.sort((c1, c2) =>
        sortDatesWithFormat(c1.date, c2.date, DISPLAY_DATE_FORMAT))
    } catch (e) {
      return null
    }
  }

  createStudentCreditLines = students =>
    students.map((student) => {
      let credits = 0
      const points = student.courses.map((course) => {
        if (course.grade !== 'Hyl.') {
          credits += course.credits
        }
        return [new Date(course.date).getTime(), credits]
      })
      return { name: student.studentNumber, data: points, boostThreshold: 500 }
    })

  render() {
    return (
      <div className={styles.graphContainer}>
        <ReactHighstock
          highcharts={Highcharts}
          ref={(HighchartsReact) => {
            this.chart = HighchartsReact
          }}
          constructorType="stockChart"
          config={this.state.options}
        />
      </div>
    )
  }
}
CreditAccumulationGraphHighCharts.propTypes = {
  students: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired
}
const mapStateToProps = state => ({
  spinner: state.graphSpinner
})

export default connect(
  mapStateToProps,
  { clearLoading }
)(withRouter(CreditAccumulationGraphHighCharts))
