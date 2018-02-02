import React, { Component } from 'react';
import MulticolorBarChart from '../MulticolorBarChart';


const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ text: key, value: data[key] }))) : []);

class CourseStatistics extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    const { stats, selectedCourse } = this.props;
    if (stats !== undefined) {
      const dataAll = createChartData(stats.all);
      const dataPassed = createChartData(stats.pass);
      const dataFailed = createChartData(stats.fail);
      console.log(dataAll);
      console.log(dataPassed);
      console.log(dataFailed);
      return (
        <div>
          <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataAll} />
          <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataPassed} />
          <MulticolorBarChart chartTitle={selectedCourse.name} chartData={dataFailed} />
        </div>
      );
    } else {
      return (
        <div>
          <pre>{JSON.stringify(selectedCourse)}</pre>
          <pre>{JSON.stringify(stats, null, 2)}</pre>
        </div>
      );
    }
  }
}

export default CourseStatistics;
