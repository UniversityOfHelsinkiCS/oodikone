import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line, Tooltip } from 'recharts';
import _ from 'lodash';
import moment from 'moment';

import styles from './creditAccumulationGraph.css';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import { reformatDate } from '../../common';

const getStudentData = (courses) => {
  let totalCredits = 0;
  return courses.map((c) => {
    const { course, date, credits } = c;
    totalCredits += credits;
    return {
      title: `${course.name} (${course.code})`,
      totalCredits,
      credits,
      date: reformatDate(date, DISPLAY_DATE_FORMAT)
    };
  });
};

const getCombinedChartData = (courses, startDate) => {
  const lastDate = moment(_.maxBy(courses, course => moment(course.date)).date);


  const studentData = getStudentData(courses);

  const dates = {};
  let day = moment(startDate);
  let lastReferenceDay = moment(startDate);
  let referenceCredits = 0;
  while (!day.isAfter(lastDate)) {
    const displayDate = reformatDate(day, DISPLAY_DATE_FORMAT);

    if (day.isSame(moment(lastReferenceDay).add(6, 'month'))) {
      referenceCredits += 6;
      lastReferenceDay = day;
    }

    if (Object.keys(dates).length === 0 || day.isSame(lastDate)) {
      dates[displayDate] = { referenceCredits };
    } else {
      dates[displayDate] = { };
    }


    const index = studentData.findIndex(course => course.date === displayDate);

    if (index !== -1) {
      const course = studentData[index];
      Object.assign(dates[course.date], dates[course.date], course);
    }

    day = moment(day).add(1, 'day');
  }

  return [...Object.values(dates)];
};

const CreditAccumulationGraph = (props) => {
  const { students } = props;

  const firstDate = moment(students[0].started);

  const chartData = getCombinedChartData(students[0].courses, firstDate);

  return (
    <div className={styles.graphContainer}>
      <ResponsiveContainer height={400}>
        <LineChart data={chartData}>
          <XAxis dataKey="displayDate" />
          <YAxis dataKey="referenceCredits" />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="totalCredits" stroke="#435345" connectNulls />
          <Line type="monotone" dot={false} dataKey="referenceCredits" stroke="#435345" connectNulls />
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
