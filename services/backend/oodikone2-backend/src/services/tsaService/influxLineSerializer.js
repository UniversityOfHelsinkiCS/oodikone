// InfluxDB line protocol serializer
// timestamps in ms precision

// escape spec:
// https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/#special-characters-and-keywords

const backslashEscape = (str, regexp) => {
  return str.replace(regexp, charToEscape => '\\' + charToEscape)
}

const escapeTagOrFieldKey = str => {
  // Escape for tag keys, tag values and field keys
  // escape commas (,), equal signs (=) and spaces ( )
  return backslashEscape(str, /[,= ]/g)
}

const escapeMeasurement = str => {
  // escape commas (,) and spaces ( )
  return backslashEscape(str, /[, ]/g)
}

const escapeStringFieldValue = str => {
  // escape double quotes (") and backslashes (\)
  // technically backslash does not need to be escaped, but if the value
  // ends in \, it will escape the closing double quote so better to just escape
  return backslashEscape(str, /["\\]/g)
}

const serializeFieldValue = value => {
  switch (typeof value) {
    case 'number':
      // just make em all floats
      return `${value}`
    case 'string':
      return `"${escapeStringFieldValue(value)}"`
    case 'boolean':
      return value ? 't' : 'f'
    case 'undefined':
      return '"undefined"'
    default:
      // what the fuck? just serialize it as json I guess
      return `"${escapeStringFieldValue(JSON.stringify(value))}"`
  }
}

// ms precision
// influxdb has a load of different timestamp precisions but let's just
// use ms cos it's supported out of the box by js
const serializeTimestamp = ts => `${ts.getTime()}`

const isTruthy = x => !!x

/**
 * @param {{measurement: string, fields: {[key]: any}, tags?: {[key]: string}, timestamp?: Date }} param0
 */
const serialize = ({ measurement, tags, fields, timestamp }) => {
  // https://docs.influxdata.com/influxdb/v1.7/write_protocols/line_protocol_tutorial/#data-types
  //
  // measurement,tag1=tagValue1,tagN=tagValueN field1=123,fieldN=321 timestamp
  //
  // field value types:
  // 123   - float
  // 123i  - integer
  // "123" - string
  // t/T/true/True/TRUE/f/F/false/False/FALSE - boolean
  const measurementString = escapeMeasurement(measurement)
  // all numbers are serialized as floats for now
  const fieldString = Object.entries(fields)
    .map(([key, value]) => `${escapeTagOrFieldKey(key)}=${serializeFieldValue(value)}`)
    .join(',')

  let header = measurementString
  if (tags) {
    // measurement and tags are separated by comma
    // tags are optional
    const tagString = Object.entries(tags)
      .map(([key, value]) => `${escapeTagOrFieldKey(key)}=${escapeTagOrFieldKey(value)}`)
      .join(',')
    header = [measurementString, tagString].join(',')
  }

  // measurement+tags, fields, and timestamp are separated by spaces
  // timestamp is optional
  return [header, fieldString, timestamp && serializeTimestamp(timestamp)].filter(isTruthy).join(' ')
}

module.exports = { serialize }
