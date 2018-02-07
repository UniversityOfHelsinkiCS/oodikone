import React from 'react';
import { jStat } from 'jStat';
import _ from 'lodash';
import PropTypes from 'prop-types';

import SearchResultTable from '../SearchResultTable';
import { getStudentTotalCredits } from '../../common';

const getStudentSampleInSplitQuarters = (students) => {
  const sortedStudents = _.sortBy(students, student => getStudentTotalCredits(student));
  const quarterSize = Math.floor(sortedStudents.length / 4);
  return [
    sortedStudents.slice(0, quarterSize),
    sortedStudents.slice(quarterSize, quarterSize * 2),
    sortedStudents.slice(quarterSize * 2, quarterSize * 3),
    sortedStudents.slice(quarterSize * 3, sortedStudents.length)
  ];
};

const getValues = (students) => {
  const creditsList = students.map(student => getStudentTotalCredits(student));

  return {
    n: creditsList.length,
    min: jStat.min(creditsList),
    max: jStat.max(creditsList),
    average: jStat.mean(creditsList).toFixed(2),
    median: jStat.median(creditsList),
    standardDeviation: jStat.stdev(creditsList).toFixed(2)
  };
};

const getCreditStatsForTable = (students, studentsInQuarters) =>
  [getValues(students), ...studentsInQuarters.map(s => getValues(s))];

const CourseQuarters = (props) => {
  const { translate, sample, title } = props;
  const quarters = getStudentSampleInSplitQuarters(sample);
  const stats = getCreditStatsForTable(sample, quarters);

  const headers = [
    `${title}`,
    `all (n=${stats[0].n})`,
    `q1, bottom (n=${stats[1].n})`,
    `q2 (n=${stats[2].n})`,
    `q3 (n=${stats[3].n})`,
    `q4, top (n=${stats[3].n})`
  ];

  const rows = [
    ['n', ...stats.map(stat => stat.n)],
    ['min', ...stats.map(stat => stat.min)],
    ['max', ...stats.map(stat => stat.max)],
    ['average', ...stats.map(stat => stat.average)],
    ['median', ...stats.map(stat => stat.median)],
    ['standardDeviation', ...stats.map(stat => stat.standardDeviation)]
  ];

  return (<SearchResultTable
    headers={headers}
    rows={rows}
    noResultText={translate('common.noResults')}
    definition
  />);
};

const {
  func, arrayOf, object, string
} = PropTypes;

CourseQuarters.propTypes = {
  translate: func.isRequired,
  sample: arrayOf(object).isRequired,
  title: string.isRequired
};

export default CourseQuarters;
