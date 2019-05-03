import React, { Component } from 'react'
import { connect } from 'react-redux'
import moment from 'moment'
import { arrayOf, object, string, func, number } from 'prop-types'
import { withRouter } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import { Button } from 'semantic-ui-react'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'
import './creditAccumulationGraphHC.css'
import { clearLoading } from '../../redux/graphSpinner'
import { setChartHeight } from '../../redux/settings'
import { reformatDate, sortDatesWithFormat } from '../../common'
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants'

boost(Highcharts)

class CreditAccumulationGraphHighCharts extends Component {
  constructor(props) {
    super(props)
    this.state = {
      studentCreditLines: [],
      options: []
    }
  }

  async componentDidMount() {
    const { students } = this.props
    await this.getMoreCreditLines(students)
    const self = this
    const dataOfSelected = this.createStudentCreditLines(students).filter(line =>
      this.props.selectedStudents.includes(line.name))

    const options = {
      chart: {
        height: this.props.currentGraphSize
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
      series: dataOfSelected,
      xAxis: {
        ordinal: false,
        max: students.maxDate,
        min: students.minDate
      }
    }
    this.setState({ options })
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.students) {
      const nextStudents = nextProps.students.map(student => student.studentNumber)
      const oldStudents = this.props.students.map(student => student.studentNumber)

      const changed =
        nextStudents.some(student => !oldStudents.includes(student)) ||
        oldStudents.some(student => !nextStudents.includes(student))
      const dataOfSelected = this.state.studentCreditLines.filter(line =>
        nextProps.selectedStudents.includes(line.name))

      const options = {
        ...this.state.options,
        yAxis: {
          max: nextProps.students.maxCredits,
          title: { text: 'Credits' }
        },
        xAxis: {
          max: nextProps.students.maxDate,
          min: nextProps.students.minDate
        },
        series: dataOfSelected,
        chart: {
          height: nextProps.currentGraphSize
        }
      }
      this.setState({ options })
      if (changed) {
        const { students } = nextProps
        await this.getMoreCreditLines(students)
      }
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
      const { course, date, credits, grade, passed, isStudyModuleCredit } = c
      if (passed && !isStudyModuleCredit) {
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

  getMoreCreditLines = async (students) => {
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
      let points = student.courses.map((course) => {
        if (course.passed && !course.isStudyModuleCredit) {
          credits += course.credits
        }
        return [new Date(course.date).getTime(), credits]
      })
      if (points.length < 2) {
        points = [[students.minDate, 0], ...points]
      }
      return { name: student.studentNumber, data: points, seriesThreshold: 150 }
    })

  resizeChart = (size) => {
    if (this.chart) {
      this.props.setChartHeight(size)
    }
  }

  render() {
    return (
      <div>
        <div className="graphContainer">
          <div className="graphOptions">
            <Button
              active={this.props.currentGraphSize === 400}
              onClick={() => this.resizeChart(400)}
              content="Small"
            />
            <Button
              active={this.props.currentGraphSize === 600}
              onClick={() => this.resizeChart(600)}
              content="Medium"
            />
            <Button
              active={this.props.currentGraphSize === 1000}
              onClick={() => this.resizeChart(1000)}
              content="Large"
            />
          </div>
          <ReactHighstock
            highcharts={Highcharts}
            ref={(HighchartsReact) => {
              this.chart = HighchartsReact
            }}
            constructorType="stockChart"
            config={this.state.options}
          />
        </div>
      </div>
    )
  }
}
CreditAccumulationGraphHighCharts.propTypes = {
  students: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setChartHeight: func.isRequired,
  currentGraphSize: number.isRequired
}
const mapStateToProps = state => ({
  spinner: state.graphSpinner,
  currentGraphSize: state.settings.chartHeight
})

export default connect(
  mapStateToProps,
  { clearLoading, setChartHeight }
)(withRouter(CreditAccumulationGraphHighCharts))
