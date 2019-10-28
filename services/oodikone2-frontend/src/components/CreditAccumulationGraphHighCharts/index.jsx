import React, { Component } from 'react'
import { renderToString } from 'react-dom/server'
import { connect } from 'react-redux'
import { getActiveLanguage } from 'react-localize-redux'
import moment from 'moment'
import { arrayOf, object, string, func, number, shape } from 'prop-types'
import { withRouter } from 'react-router-dom'
import Highcharts from 'highcharts/highstock'
import { Button } from 'semantic-ui-react'
import boostcanvas from 'highcharts/modules/boost-canvas'
import boost from 'highcharts/modules/boost'
import ReactHighstock from 'react-highcharts/ReactHighstock'
import './creditAccumulationGraphHC.css'
import CreditGraphTooltip from '../CreditGraphTooltip'
import { clearLoading } from '../../redux/graphSpinner'
import { setChartHeight } from '../../redux/settings'
import { reformatDate } from '../../common'
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants'

// boost canvas needed because tests break with large population
// https://www.highcharts.com/errors/26/
boostcanvas(Highcharts)
boost(Highcharts)

class CreditAccumulationGraphHighCharts extends Component {
  constructor(props) {
    super(props)
    this.state = {
      studentCreditLines: [],
      options: [],
      updateGraph: false
    }
  }

  componentDidMount() {
    const { students } = this.props
    this.getMoreCreditLines(students)
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.students) {
      const nextStudents = nextProps.students.map(student => student.studentNumber)
      const oldStudents = this.props.students.map(student => student.studentNumber)
      const nextMinDate = nextProps.students.minDate
      const oldMinDate = this.props.students.minDate
      const clear = nextMinDate !== oldMinDate
      const changedStudentAmount = nextProps.selectedStudents.length !== this.props.selectedStudents.length
      const changedGraphSize = nextProps.currentGraphSize !== this.props.currentGraphSize

      const changed =
        nextStudents.some(student => !oldStudents.includes(student)) ||
        oldStudents.some(student => !nextStudents.includes(student)) ||
        clear

      if (changed) {
        const { students } = nextProps
        this.getMoreCreditLines(students, clear)
      } else if (changedStudentAmount || changedGraphSize) {
        this.createGraphOptions(nextProps.students, nextProps.selectedStudents, nextProps.currentGraphSize)
      }
    }
  }

  componentDidUpdate() {
    const { updateGraph } = this.state
    const { students, selectedStudents, currentGraphSize } = this.props

    if (updateGraph) {
      this.createGraphOptions(students, selectedStudents, currentGraphSize)
    }
  }

  getMoreCreditLines = (students, clear) => {
    if (clear) {
      // eslint-disable-next-line react/no-access-state-in-setstate
      const removed = this.state.studentCreditLines.splice(0, 0)
      const studentCreditLines = removed.concat(this.createStudentCreditLines(students))
      this.setState({ studentCreditLines, updateGraph: true })
    } else {
      // eslint-disable-next-line react/no-access-state-in-setstate
      const studentCreditLines = this.state.studentCreditLines.concat(this.createStudentCreditLines(students))
      this.setState({ studentCreditLines, updateGraph: true })
    }
  }

  getXAxisMonth = (date, startDate) =>
    Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0)

  sortCoursesByDate = courses => courses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  filterCoursesByDate = (courses, date) => courses.filter(c => moment(c.date).isSameOrAfter(moment(date)))

  createTooltip = point => {
    const { students, language, translate } = this.props
    const targetCourse = this.sortCoursesByDate(students[0].courses).find(
      c => point.key === c.course.code && point.x === new Date(c.date).getTime()
    )

    if (!targetCourse) return ''

    const payload = [
      {
        name: students[0].studentNumber,
        payload: {
          ...targetCourse,
          date: reformatDate(targetCourse.date, DISPLAY_DATE_FORMAT),
          title: targetCourse.course.name[language]
        }
      }
    ]

    return renderToString(<CreditGraphTooltip payload={payload} active translate={translate} />)
  }

  createGraphOptions = (students, selectedStudents, graphSize) => {
    const dataOfSelected = this.state.studentCreditLines.filter(line => selectedStudents.includes(line.name))
    let lastCredits = null
    if (this.isSingleStudentGraph() && !['/custompopulation', '/coursepopulation'].includes(window.location.pathname)) {
      const started = moment(students.minDate)
      const lastDate = moment(students.maxDate)
      const lastMonth = Math.ceil(this.getXAxisMonth(lastDate, started))

      let totalAbsenceMonths = 0
      const absencePoints = this.props.absences
        .filter(a => a.startdate >= started || (a.startdate <= started && a.enddate >= started))
        .reduce((res, { startdate, enddate }) => {
          const targetCreditsBeforeAbsence =
            (Math.ceil(this.getXAxisMonth(moment(startdate), started)) - totalAbsenceMonths) * (55 / 12)
          if (enddate < students.maxDate) {
            res.push([startdate, targetCreditsBeforeAbsence])
            res.push([enddate, targetCreditsBeforeAbsence])
            totalAbsenceMonths += moment(enddate).diff(moment(startdate), 'months')
          }
          return res
        }, [])

      const zoneStart = absencePoints.length ? [absencePoints[0][0]] : []
      const zones = absencePoints.reduce(
        (acc, [start], i) => [...acc, { value: start, color: i % 2 === 0 ? '#96d7c3' : 'red' }],
        zoneStart
      )

      lastCredits = (lastMonth - totalAbsenceMonths) * (55 / 12)
      dataOfSelected.push({
        data: [
          ...[[students.minDate, 0], ...absencePoints, [students.maxDate, lastCredits]].sort((a, b) => a[0] - b[0])
        ],
        seriesThreshold: 150,
        color: '#96d7c3',
        marker: {
          enabled: false
        },
        zones,
        zoneAxis: 'x'
      })
    }
    const self = this

    const tooltipOptions = this.isSingleStudentGraph()
      ? {
          formatter() {
            return self.createTooltip(this)
          },
          shared: false,
          useHTML: true,
          style: {
            all: 'unset',
            display: 'none'
          },
          split: false
        }
      : {
          shared: false,
          split: false
        }
    const options = {
      plotOptions: {
        series: {
          findNearestPointBy: 'xy',
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
        max: lastCredits && lastCredits > students.maxCredits ? lastCredits : students.maxCredits,
        title: { text: 'Credits' }
      },
      xAxis: {
        max: students.maxDate,
        min: students.minDateWithCredits || students.minDate,
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

    this.setState({ options, updateGraph: false })
  }

  isSingleStudentGraph = () => this.props.students.length === 1

  createStudentCreditLines = students =>
    students.map(student => {
      const { started, studyrightStart } = student

      const startDate = this.props.selectedStudents.length === 1 ? started : studyrightStart
      let credits = 0
      let points = this.filterCoursesByDate(this.sortCoursesByDate(student.courses), startDate).map(course => {
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

  resizeChart = size => {
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
            ref={HighchartsReact => {
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

CreditAccumulationGraphHighCharts.defaultProps = {
  absences: []
}

CreditAccumulationGraphHighCharts.propTypes = {
  students: arrayOf(object).isRequired,
  selectedStudents: arrayOf(string).isRequired,
  setChartHeight: func.isRequired,
  currentGraphSize: number.isRequired,
  language: string.isRequired,
  translate: func.isRequired,
  absences: arrayOf(shape({}))
}

const mapStateToProps = state => ({
  language: getActiveLanguage(state.localize).code,
  spinner: state.graphSpinner,
  currentGraphSize: state.settings.chartHeight
})

export default connect(
  mapStateToProps,
  { clearLoading, setChartHeight }
)(withRouter(CreditAccumulationGraphHighCharts))
