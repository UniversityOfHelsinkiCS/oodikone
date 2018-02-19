import React, { Component } from 'react';
import { connect } from 'react-redux';
import { func } from 'prop-types';
import moment from 'moment';
import { getTranslate, getActiveLanguage } from 'react-localize-redux';
import { Dimmer, Segment, Header } from 'semantic-ui-react';

import { getDepartmentSuccessAction } from '../../actions';
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
    dispatchGetDepartmentSuccess: func.isRequired,
    translate: func.isRequired
  };

  state = {
    chartData: [],
    selectorDates: [],
    selectedDate: {
      text: FIRST_DATE,
      value: reformatDate(FIRST_DATE, API_DATE_FORMAT)
    },
    isLoading: true
  };

  componentDidMount() {
    const selectorDates = getSelectorDates(FIRST_DATE);
    this.setState(
      { selectorDates, selectedDate: selectorDates[0] },
      () => this.getChartData()
    );
  }

  onDateInputChange = (e, { value }) => {
    this.setState({
      selectedDate: {
        text: reformatDate(value, DISPLAY_DATE_FORMAT),
        value
      },
      isLoading: true
    }, () => this.getChartData());
  };

  onControlLeft = () => {
    this.onControlButtonSwitch(MOVE_LEFT_AMOUNT);
  };

  onControlRight = () => {
    this.onControlButtonSwitch(MOVE_RIGHT_AMOUNT);
  };

  onControlButtonSwitch = (amount) => {
    const { selectorDates, selectedDate } = this.state;
    const index = selectorDates.findIndex(date => date.value === selectedDate.value);
    if (isInArrayLimits(amount, index, selectorDates.length)) {
      this.setState(
        { selectedDate: selectorDates[index + amount], isLoading: true },
        () => this.getChartData()
      );
    }
  };

  getChartData = () => {
    const { selectedDate } = this.state;
    this.props.dispatchGetDepartmentSuccess(selectedDate.value)
      .then(
        (json) => {
          const chartData = createChartData(json.value);
          this.setState({ chartData, isLoading: false });
        },
        () => this.setState({ isLoading: false })
      );
  };

  render() {
    const {
      chartData, selectedDate, selectorDates, isLoading
    } = this.state;
    const { translate } = this.props;

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

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

const mapDispatchToProps = dispatch => ({
  dispatchGetDepartmentSuccess: date =>
    dispatch(getDepartmentSuccessAction(date))
});

export default connect(mapStateToProps, mapDispatchToProps)(DepartmentSuccess);
