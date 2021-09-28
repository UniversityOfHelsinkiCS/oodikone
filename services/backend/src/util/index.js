const validateParamLength = (param, minLength) => param && param.trim().length >= minLength

module.exports = {
  validateParamLength,
}
