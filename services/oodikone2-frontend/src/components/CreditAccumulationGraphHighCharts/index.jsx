import React, { Component } from 'react'
import { renderToString } from 'react-dom/server'
import { connect } from 'react-redux'
import moment from 'moment'
import { arrayOf, object, string, func, number } from 'prop-types'
import { withRouter } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import { Button } from 'semantic-ui-react'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'
import './creditAccumulationGraphHC.css'
import CreditGraphTooltip from '../CreditGraphTooltip'
import { clearLoading } from '../../redux/graphSpinner'
import { setChartHeight } from '../../redux/settings'
import { reformatDate } from '../../common'
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

    this.createGraphOptions(
      students,
      this.props.selectedStudents,
      this.props.currentGraphSize
    )
  }

  async componentWillReceiveProps(nextProps) {
    if (nextProps.students) {
      const nextStudents = nextProps.students.map(student => student.studentNumber)
      const oldStudents = this.props.students.map(student => student.studentNumber)

      const changed =
        nextStudents.some(student => !oldStudents.includes(student)) ||
        oldStudents.some(student => !nextStudents.includes(student))


      this.createGraphOptions(
        nextProps.students,
        nextProps.selectedStudents,
        nextProps.currentGraphSize
      )

      if (changed) {
        const { students } = nextProps
        await this.getMoreCreditLines(students)
      }
    }
  }

  getMoreCreditLines = async (students) => {
    const studentCreditLines = this.state.studentCreditLines
      .concat(this.createStudentCreditLines(students))
    this.setState({ studentCreditLines })
  }

  getXAxisMonth = (date, startDate) =>
    Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

  sortCoursesByDate = courses => courses.sort((a, b) => (
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ))

  filterCoursesByDate = (courses, date) => courses.filter(c => (
    moment(c.date).isSameOrAfter(moment(date))
  ))

  createTooltip = ({ points }) => {
    const { students, language, translate } = this.props
    const targetCourse = this.sortCoursesByDate(students[0].courses)
      .find(c => c.course.code === points[0].key)

    if (!targetCourse) return ''

    const payload = [{
      name: students[0].studentNumber,
      payload: {
        ...targetCourse,
        date: reformatDate(targetCourse.date, DISPLAY_DATE_FORMAT),
        title: targetCourse.course.name[language]
      }
    }]

    return renderToString(<CreditGraphTooltip payload={payload} active translate={translate} />)
  }

  createGraphOptions = (students, selectedStudents, graphSize) => {
    const dataOfSelected = this.state.studentCreditLines.filter(line =>
      selectedStudents.includes(line.name))

    let lastCredits = null
    if (this.isSingleStudentGraph()) {
      const started = moment(students[0].started)
      const lastDate = moment(students.maxDate)
      const lastMonth = Math.floor(this.getXAxisMonth(lastDate, started))
      lastCredits = Math.floor(lastMonth * (55 / 12))

      dataOfSelected.push({
        data: [
          [students.minDate, 0],
          [students.maxDate, lastCredits]
        ],
        seriesThreshold: 150,
        color: '#96d7c3',
        marker: {
          enabled: false
        }
      })
    }
    const self = this

    const tooltipOptions = this.isSingleStudentGraph() ?
      {
        formatter() {
          return self.createTooltip(this)
        },
        shared: false,
        useHTML: true,
        style: {
          all: 'unset',
          display: 'none'
        }
      } : {}

    const options = {
      plotOptions: {
        series: {
          point: {
            events: {
              click() {
                if (!self.isSingleStudentGraph()) {
                  self.props.history.push(`/students/${this.series.name}`)
                }
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
      yAxis: {
        max: (lastCredits && lastCredits > students.maxCredits) ? lastCredits : students.maxCredits,
        title: { text: 'Credits' }
      },
      xAxis: {
        max: students.maxDate,
        min: students.minDate,
        ordinal: false
      },
      series: dataOfSelected,
      chart: {
        height: graphSize
      },
      tooltip: {
        ...tooltipOptions
      }
    }

    this.setState({ options })
  }

  isSingleStudentGraph = () => this.props.students.length === 1

  createStudentCreditLines = students =>
    students.map((student) => {
      const { started, studyrightStart } = student
      const startDate = this.props.selectedStudents.length === 1 ? started : studyrightStart
      let credits = 0
      let points = this.filterCoursesByDate(
        this.sortCoursesByDate(student.courses),
        startDate
      ).map((course) => {
        if (course.passed && !course.isStudyModuleCredit) {
          credits += course.credits
        }
        const defaultPointOptions = this.isSingleStudentGraph() ? { name: course.course.code } : {}
        return {
          ...defaultPointOptions,
          x: new Date(course.date).getTime(),
          y: credits
        }
      })
      if (points.length < 2) {
        points = [[students.minDate, 0], ...points]
      }
      return {
        name: student.studentNumber,
        data: points,
        seriesThreshold: 150,
        marker: {
          enabled: this.isSingleStudentGraph(),
          radius: 4
        }
      }
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
  currentGraphSize: number.isRequired,
  language: string.isRequired,
  translate: func.isRequired
}
const mapStateToProps = state => ({
  language: state.settings.language,
  spinner: state.graphSpinner,
  currentGraphSize: state.settings.chartHeight
})

export default connect(
  mapStateToProps,
  { clearLoading, setChartHeight }
)(withRouter(CreditAccumulationGraphHighCharts))
