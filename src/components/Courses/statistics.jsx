import React, { Component } from 'react';
import { Grid, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import MulticolorBarChart from '../MulticolorBarChart';

const { shape, object, string } = PropTypes;

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ text: key, value: data[key] }))) : []);

const sortByValue = (a, b) => (a.value - b.value);

const tableRow = (title, values) => (
  <Table.Row>
    <Table.Cell>{title}</Table.Cell>
    {values.map(val => <Table.Cell>{val}</Table.Cell>)}
  </Table.Row>);

const calculateAve = (data) => {
  let sum = 0;
  data.forEach((item) => { sum += item.value; });
  return sum / data.length;
};

const calculateStd = (ave, data) => {
  let variation = 0;
  data.forEach((item) => { variation += (ave - item.value) ** 2; });
  variation /= data.length;
  return Math.sqrt(variation);
};

class CourseStatistics extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { stats, selectedCourse } = this.props;
    if (stats !== undefined) {
      const dataAll = createChartData(stats.all).sort(sortByValue);
      const dataPassed = createChartData(stats.pass).sort(sortByValue);
      const dataFailed = createChartData(stats.fail).sort(sortByValue);
      const mins = [dataAll[0].value,
        dataPassed[0].value,
        dataFailed[0].value];
      const maxs = [dataAll[dataAll.length - 1].value,
        dataPassed[dataPassed.length - 1].value,
        dataFailed[dataFailed.length - 1].value];
      const medians = [dataAll[Math.floor(dataAll.length / 2)].value,
        dataPassed[Math.floor(dataPassed.length / 2)].value,
        dataFailed[Math.floor(dataFailed.length / 2)].value];
      const aves = [calculateAve(dataAll),
        calculateAve(dataPassed),
        calculateAve(dataFailed)];
      const stds = [calculateStd(aves[0], dataAll),
        calculateStd(aves[1], dataPassed),
        calculateStd(aves[2], dataFailed)];
      return (
        <Grid columns="equal">
          <Grid.Row>
            <Grid.Column>
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell />
                    <Table.HeaderCell>
                      All
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                      Passed
                    </Table.HeaderCell>
                    <Table.HeaderCell>
                      Failed
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {tableRow('minimum', mins)}
                  {tableRow('maximum', maxs)}
                  {tableRow('average', aves)}
                  {tableRow('median', medians)}
                  {tableRow('standard deviations', stds)}
                </Table.Body>
              </Table>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column key="1">
              <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataAll} />
            </Grid.Column>
            <Grid.Column key="2">
              <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataPassed} />
            </Grid.Column>
            <Grid.Column key="3">
              <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataFailed} />
            </Grid.Column>
          </Grid.Row>
        </Grid>
      );
    }
    return (
      <div>
        <pre>{JSON.stringify(selectedCourse)}</pre>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>
    );
  }
}

CourseStatistics.propTypes = {
  stats: shape({
    all: object.isRequired,
    pass: object.isRequired,
    fail: object.isRequired,
    startYear: object.isRequired
  }).isRequired,
  selectedCourse: shape({
    name: string.isRequired,
    code: string.isRequired
  }).isRequired
};

export default CourseStatistics;
