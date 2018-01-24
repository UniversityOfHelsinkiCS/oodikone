import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import moment from 'moment';

import { Dimmer, Segment, Loader } from 'semantic-ui-react';

import { addError, getDepartmentSuccessAction } from '../../actions';
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants';

import styles from './departmentSuccess.css';
import MulticolorBarChart from '../MulticolorBarChart';
import ScrollableDateSelector from '../ScrollableDateSelector';

const FIRST_DATE = '2005-08-01';
const MOVE_LEFT_AMOUNT = -1;
const MOVE_RIGHT_AMOUNT = 1;

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ name: key, value: data[key] }))) : []);

const reformatDate = (date, dateFormat) => moment(date).format(dateFormat);

const getSelectorDates = (startDate) => {
  const dates = [];
  let date = moment(startDate);
  while (date.isBefore(moment.now())) {
    const displayDate = reformatDate(date, DISPLAY_DATE_FORMAT);
    dates.push({ text: displayDate, value: date });
    date = moment(date).add(1, 'year');
  }
  return dates;
};

const isInArrayLimits = (amount, index, arrayLenght) =>
  !((index === 0 && amount === MOVE_LEFT_AMOUNT) || (index === arrayLenght && amount === MOVE_RIGHT_AMOUNT));

class DepartmentSuccess extends Component {
  constructor(props) {
    super(props);

    this.onDateInputChange = this.onDateInputChange.bind(this);
    this.onControlLeft = this.onControlLeft.bind(this);
    this.onControlRight = this.onControlRight.bind(this);
    this.onControlButtonSwitch = this.onControlButtonSwitch.bind(this);
    this.fetchChartData = this.fetchChartData.bind(this);

    this.state = {
      departmentSuccess: {
        value: {}
      },
      selectorDates: getSelectorDates(FIRST_DATE),
      selectedDate: {
        text: reformatDate(FIRST_DATE, DISPLAY_DATE_FORMAT),
        value: moment(FIRST_DATE)
      },
      loading: true
    };
  }

  componentDidMount() {
    this.fetchChartData();
  }

  onDateInputChange(e, data) {
    this.setState({
      selectedDate: {
        text: reformatDate(data.value, DISPLAY_DATE_FORMAT),
        value: data.value
      }
    });
    this.fetchChartData();
  }

  onControlLeft() {
    this.onControlButtonSwitch(MOVE_LEFT_AMOUNT);
  }

  onControlRight() {
    this.onControlButtonSwitch(MOVE_RIGHT_AMOUNT);
  }

  onControlButtonSwitch(amount) {
    const { selectorDates, selectedDate } = this.state;
    const index = selectorDates.findIndex(value => value === selectedDate);
    if (isInArrayLimits(amount, index, selectorDates.length)) {
      this.setState({ selectedDate: selectorDates[index + amount] });
      this.fetchChartData();
    }
  }

  fetchChartData() {
    const { selectedDate } = this.state;
    this.setState({ loading: true });
    this.props.dispatchGetDepartmentSuccess(reformatDate(selectedDate.value, API_DATE_FORMAT))
      .then(
        json => this.setState({ departmentSuccess: json, loading: false }),
        err => this.props.dispatchAddError(err)
      );
  }

  render() {
    const {
      departmentSuccess, selectedDate, selectorDates, loading
    } = this.state;

    const chartData = createChartData(departmentSuccess.value);
    const chartTitle = `Average credit gains after 13 months for BSc students starting ${selectedDate.text}`;

    return (
      <div className={styles.container} >
        <Dimmer.Dimmable as={Segment} dimmed={loading} className={styles.chartSegment}>
          <Dimmer active={loading} inverted>
            <Loader>Loading</Loader>
          </Dimmer>
          <MulticolorBarChart chartTitle={chartTitle} chartData={chartData} />
          <ScrollableDateSelector
            selectedDate={selectedDate}
            selectorDates={selectorDates}
            onDateInputChange={this.onDateInputChange}
            onControlLeft={this.onControlLeft}
            onControlRight={this.onControlRight}
          />
        </Dimmer.Dimmable>
      </div>
    );
  }
}

const { func } = PropTypes;

DepartmentSuccess.propTypes = {
  dispatchGetDepartmentSuccess: func.isRequired,
  dispatchAddError: func.isRequired
};

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch => ({
  dispatchGetDepartmentSuccess: date =>
    dispatch(getDepartmentSuccessAction(date)),
  dispatchAddError: err => dispatch(addError(err))
});

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentSuccess);
