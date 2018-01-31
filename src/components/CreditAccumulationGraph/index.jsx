import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line, Tooltip } from 'recharts';
import _ from 'lodash';
import moment from 'moment';

import styles from './creditAccumulationGraph.css';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import { reformatDate } from '../../common';


const getReferenceDates = (startDate, lastDate) => {
  const dates = [];
  let date = startDate;
  let credits = 0;
  while (date.isBefore(lastDate)) {
    dates.push({ credits, date: reformatDate(date, DISPLAY_DATE_FORMAT) });
    date = moment(date).add(6, 'month');
    credits += 36;
  }
  return dates;
};

const CreditAccumulationGraph = (props) => {
  const { students } = props;
  let totalCredits = 0;
  const chartData = students[0].courses.map((c) => {
    const { course, date, credits } = c;
    totalCredits += credits;
    return {
      title: `${course.name} (${course.code})`,
      totalCredits,
      date: reformatDate(date, DISPLAY_DATE_FORMAT)
    };
  });

  const firstDate = moment(_.minBy(students[0].courses, course => moment(course.date)).date);
  const lastDate = moment(_.maxBy(students[0].courses, course => moment(course.date)).date);
  const reference = getReferenceDates(firstDate, lastDate);


  return (
    <div className={styles.graphContainer}>
      <ResponsiveContainer height={400}>
        <LineChart>
          <XAxis dataKey="date" allowDuplicateCategory={false} />
          <YAxis dataKey="credits" />
          <Tooltip />
          <Legend />
          <Line type="monotone" data={chartData} dataKey="totalCredits" stroke="#8884d8" />
          <Line type="monotone" dot={false} data={reference} dataKey="credits" stroke="#435345" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const { arrayOf, object } = PropTypes;

CreditAccumulationGraph.propTypes = {
  students: arrayOf(object).isRequired
};

export default CreditAccumulationGraph;
