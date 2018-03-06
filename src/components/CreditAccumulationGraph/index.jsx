import React from 'react';
import { arrayOf, object, string, func, shape } from 'prop-types';
import { ResponsiveContainer, LineChart, XAxis, YAxis, Legend, Line, Tooltip, CartesianGrid, Dot } from 'recharts';
import _ from 'lodash';
import moment from 'moment';
import { Header, Segment, Message } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';

import { DISPLAY_DATE_FORMAT, CHART_COLORS, API_DATE_FORMAT } from '../../constants';
import { reformatDate, sortDatesWithFormat } from '../../common';
import { turquoise } from '../../styles/variables/colors';

import styles from './creditAccumulationGraph.css';
import CreditGraphTooltip from '../CreditGraphTooltip';


const getXAxisMonth = (date, startDate) =>
  Math.max(moment(date, API_DATE_FORMAT).diff(moment(startDate, API_DATE_FORMAT), 'days') / 30, 0);

const getReferenceLineForStudent = (student) => {
  const { courses, started } = student;
  const lastDate = moment(_.maxBy(courses, course => moment(course.date)).date);
  const lastMonth = Math.ceil(getXAxisMonth(lastDate, started));
  const lastCredits = lastMonth * (55 / 12);

  return [{
    month: 0,
    referenceCredits: 0,
    date: reformatDate(started, DISPLAY_DATE_FORMAT)
  },
  {
    month: lastMonth,
    referenceCredits: lastCredits,
    date: reformatDate(lastDate, DISPLAY_DATE_FORMAT)
  }];
};

const isSingleStudentGraph = students => students.length === 1;

const getReferenceLine = title => (<Line
  type="monotone"
  activeDot={false}
  dot={false}
  isAnimationActive={false}
  name={title}
  dataKey="referenceCredits"
  stroke={turquoise}
  connectNulls
/>);


const getStudentCourseData = (student) => {
  const { studentNumber, started, courses } = student;

  const filteredCourses = courses.filter(c => moment(c.date).isSameOrAfter(moment(started)));

  let totalCredits = 0;
  return filteredCourses.map((c) => {
    const {
      course, date, credits, grade, passed
    } = c;
    totalCredits += credits;
    return {
      title: `${course.name} (${course.code})`,
      [studentNumber]: totalCredits,
      credits,
      date: reformatDate(date, DISPLAY_DATE_FORMAT),
      month: getXAxisMonth(date, started),
      grade,
      passed
    };
  });
};

const getStudentChartData = (student) => {
  const { studentNumber, started } = student;
  return [
    ...getStudentCourseData(student),
    {
      title: '',
      [studentNumber]: 0,
      credits: 0,
      date: reformatDate(started, DISPLAY_DATE_FORMAT),
      month: 0
    }
  ];
};

const getDot = (studentNumber, isSingleStudent, onClickFn) => (isSingleStudent ? <Dot r={4} /> : (
  <Dot
    className={styles.dot}
    r={3}
    onClick={() => onClickFn(studentNumber)}
  />
));

const getStudentCreditsLine = (student, i, dot) => {
  const { studentNumber } = student;
  return (<Line
    key={`graph-${studentNumber}`}
    type="monotone"
    activeDot={{ r: 8 }}
    dot={dot}
    dataKey={studentNumber}
    stroke={CHART_COLORS[i]}
    isAnimationActive={false}
    connectNulls
  />);
};

const getTooltip = props => (
  <Tooltip
    content={<CreditGraphTooltip {...props} />}
    cursor={false}
  />
);


const CreditAccumulationGraph = (props) => {
  const {
    students, title, translate, history
  } = props;

  if (students.length === 0) {
    return (
      <Message warning>
        <Message.Header>{title}</Message.Header>
        <p>{translate('common.noResults')}</p>
      </Message>);
  }

  let combinedStudentData = [].concat(...students.map(getStudentChartData));

  const isSingleStudent = isSingleStudentGraph(students);

  if (isSingleStudent) {
    const referenceData = getReferenceLineForStudent(students[0]);
    combinedStudentData = combinedStudentData.concat(referenceData);
  }

  combinedStudentData.sort((c1, c2) =>
    sortDatesWithFormat(c1.date, c2.date, DISPLAY_DATE_FORMAT));

  const minTick = combinedStudentData[0].month;
  const maxTick = Math.ceil(combinedStudentData[combinedStudentData.length - 1].month);

  const pushToHistoryFn = studentNumber => history.push(`/students/${studentNumber}`);

  return (
    <div className={styles.graphContainer}>
      <Header attached="top" size="large">{title}</Header>
      <Segment attached="bottom">
        <ResponsiveContainer height={400}>
          <LineChart data={combinedStudentData}>
            <XAxis
              dataKey="month"
              type="number"
              allowDecimals={false}
              domain={[minTick, maxTick]}
              tick={{ fontSize: '15' }}
              tickCount={20}
            />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
           I {
              isSingleStudent && getTooltip(props)
            }
            {
              students.map((student, i) => {
                const dot = getDot(student.studentNumber, isSingleStudent, pushToHistoryFn);
                return getStudentCreditsLine(student, i, dot);
              })
            }
            {
              isSingleStudent && getReferenceLine(translate('graphs.referenceCredits'))
            }
          </LineChart>
        </ResponsiveContainer>
      </Segment>
    </div>
  );
};

CreditAccumulationGraph.propTypes = {
  translate: func.isRequired,
  students: arrayOf(object).isRequired,
  title: string.isRequired,
  history: shape(object).isRequired
};

export default withRouter(CreditAccumulationGraph);
