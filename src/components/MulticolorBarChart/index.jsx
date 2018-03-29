import React from 'react'
import { string, arrayOf } from 'prop-types'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts'

import { graphDataType } from '../../constants/types'
import { red, green, blue, purple, turquoise } from '../../styles/variables/colors'
import styles from './multicolorBarChart.css'

const BAR_COLOR_OPTIONS = [red, purple, green, blue, turquoise]

const getColor = (number, max) => {
  if (max < 6) {
    return BAR_COLOR_OPTIONS[number]
  }
  const gap = 16777217 / max
  const color = Math.floor(gap * number).toString(16)
  return '#000000'.slice(0, -color.length) + color
}

const MulticolorBarChart = (props) => {
  const { chartTitle, chartData } = props
  if (chartData.length > 0) {
    return (
      <div>
        <div className={styles.chartTitle}>{chartTitle}</div>
        <div className={styles.chartContainer}>
          <ResponsiveContainer height={400}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Bar dataKey="value" fill={purple}>
                {
                  chartData.map((entry, index) => (
                    <Cell
                      key={`color-cell-${entry.name}`}
                      fill={getColor(index, chartData.length)}
                    />
                  ))
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }
  return null
}

MulticolorBarChart.propTypes = {
  chartTitle: string.isRequired,
  chartData: arrayOf(graphDataType).isRequired
}

export default MulticolorBarChart
