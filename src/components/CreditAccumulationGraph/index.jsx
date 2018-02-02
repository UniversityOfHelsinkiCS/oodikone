import React from 'react';
import PropTypes from 'prop-types';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line, Tooltip } from 'recharts';
import _ from 'lodash';
import moment from 'moment';
import { Header, Segment } from 'semantic-ui-react';

import styles from './creditAccumulationGraph.css';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import { reformatDate } from '../../common';
import { red, turquoise } from '../../styles/variables/colors';

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
      dates[displayDate] = { displayDate };
    }

    if (Object.keys(dates).length === 0) {
      dates[displayDate] = { displayDate, referenceCredits };
    }

    const index = studentData.findIndex(course => course.date === displayDate);

    if (index !== -1) {
      const course = studentData[index];
      dates[displayDate] = { displayDate };
      Object.assign(dates[course.date], dates[course.date], course);
    }

    day = moment(day).add(1, 'day');
  }
  const finalDate = day;
  dates[finalDate] = { finalDate, referenceCredits };

  return [...Object.values(dates)];
};

const CreditAccumulationGraph = (props) => {
  const { students, title } = props;

  const firstDate = moment(students[0].started);

  const chartData = getCombinedChartData(students[0].courses, firstDate);
  _.sortBy(chartData, course => moment(course.displayDate));

  return (
    <div className={styles.graphContainer}>
      <Header attached="top" size="large">{title}</Header>
      <Segment attached="bottom">
        <ResponsiveContainer height={400}>
          <LineChart data={chartData}>
            <XAxis dataKey="displayDate" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="totalCredits" stroke={red} connectNulls />
            <Line type="monotone" dot={false} dataKey="referenceCredits" stroke={turquoise} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </Segment>
    </div>
  );
};

const { arrayOf, object, string } = PropTypes;

CreditAccumulationGraph.propTypes = {
  students: arrayOf(object).isRequired,
  title: string.isRequired
};

export default CreditAccumulationGraph;
