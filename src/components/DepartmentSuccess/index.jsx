import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func, arrayOf, object } from 'prop-types';
import moment from 'moment';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';
import { Dimmer, Segment, Header } from 'semantic-ui-react';

import { getDepartmentSuccess } from '../../redux/department';
import { DISPLAY_DATE_FORMAT, API_DATE_FORMAT } from '../../constants';
import MulticolorBarChart from '../MulticolorBarChart';
import ScrollableDateSelector from '../ScrollableDateSelector';
import { reformatDate } from '../../common';
import SegmentDimmer from '../SegmentDimmer';

import sharedStyles from '../../styles/shared';

const FIRST_DATE = '2005-08-01';
const MOVE_LEFT_AMOUNT = -1;
const MOVE_RIGHT_AMOUNT = 1;

const createChartData = data => (data !== undefined ?
  (Object.keys(data).map(key => ({ text: key, value: data[key] }))) : []);

const getSelectorDates = (startDate) => {
  const dates = [];
  let date = moment(startDate);
  while (date.isBefore(moment.now())) {
    const displayDate = reformatDate(date, DISPLAY_DATE_FORMAT);
    const apiDate = reformatDate(date, API_DATE_FORMAT);
    dates.push({ text: displayDate, value: apiDate });
    date = moment(date).add(1, 'year');
  }
  return dates;
};

const isInArrayLimits = (amount, index, arrayLenght) =>
  !((index === 0 && amount === MOVE_LEFT_AMOUNT)
    || (index === arrayLenght - 1 && amount === MOVE_RIGHT_AMOUNT));

class DepartmentSuccess extends Component {
  static propTypes = {
    chartData: arrayOf(object).isRequired,
    translate: func.isRequired,
    getDepartment: func.isRequired
  };

  state = {
    selectorDates: [],
    selectedDate: {
      text: FIRST_DATE,
      value: reformatDate(FIRST_DATE, API_DATE_FORMAT)
    },
    isLoading: false
  };

  componentDidMount() {
    const selectorDates = getSelectorDates(FIRST_DATE);
    const selectedDate = selectorDates[0];
    this.timeout = undefined;
    this.setLoading({ selectorDates, selectedDate });
    this.getChartData(selectedDate);
  }

  onDateInputChange = (e, { value }) => {
    const selectedDate = {
      text: reformatDate(value, DISPLAY_DATE_FORMAT),
      value
    };
    this.setLoading({ selectedDate });
    this.getChartData(selectedDate);
  };

  onControlLeft = () => {
    this.onControlButtonSwitch(MOVE_LEFT_AMOUNT);
  };

  onControlRight = () => {
    this.onControlButtonSwitch(MOVE_RIGHT_AMOUNT);
  };

  onControlButtonSwitch = (amount) => {
    const { selectorDates, selectedDate: oldDate } = this.state;
    const index = selectorDates.findIndex(date => date.value === oldDate.value);
    if (isInArrayLimits(amount, index, selectorDates.length)) {
      const selectedDate = selectorDates[index + amount];
      this.setLoading({ selectedDate });
      this.getChartData(selectedDate);
    }
  };

  setLoading = (state) => {
    this.setState(state);
    this.timeout = setTimeout(() => {
      this.setState({ isLoading: true });
    }, 250);
  };

  getChartData = (selectedDate) => {
    this.props.getDepartment(selectedDate.value).then(() => {
      clearTimeout(this.timeout);
      this.setState({ isLoading: false });
    });
  };

  render() {
    const {
      selectedDate, selectorDates, isLoading
    } = this.state;
    const { translate, chartData } = this.props;

    const chartTitle = `${translate('departmentSuccess.chartTitle')} ${selectedDate.text}`;

    return (
      <div className={sharedStyles.segmentContainer} >
        <Header className={sharedStyles.segmentTitle} size="large">{translate('departmentSuccess.header')}</Header>
        <Dimmer.Dimmable as={Segment} dimmed={isLoading} className={sharedStyles.contentSegment}>
          <SegmentDimmer translate={translate} isLoading={isLoading} />
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

const mapStateToProps = ({ locale, newReducers }) => ({
  chartData: createChartData(newReducers.department.data),
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  getDepartment: date =>
    dispatch(getDepartmentSuccess(date))
});

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentSuccess);
