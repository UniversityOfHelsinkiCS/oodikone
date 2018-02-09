import React from 'react';
import { string, arrayOf } from 'prop-types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

import { graphDataType } from '../../constants/types';
import { violet, orange, lime, mellowBlue, turquoise } from '../../styles/variables/colors';
import styles from './multicolorBarChart.css';

const BAR_COLOR_OPTIONS = [orange, lime, mellowBlue, turquoise];

const MulticolorBarChart = (props) => {
  const { chartTitle, chartData } = props;
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
              <Bar dataKey="value" fill={violet}>
                {
                  chartData.map((entry, index) => <Cell key={`color-cell-${entry.name}`} fill={BAR_COLOR_OPTIONS[index]} />)
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }
  return null;
};

MulticolorBarChart.propTypes = {
  chartTitle: string.isRequired,
  chartData: arrayOf(graphDataType).isRequired
};

export default MulticolorBarChart;
