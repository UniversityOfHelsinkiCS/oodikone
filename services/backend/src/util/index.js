const validateParamLength = (param, minLength) => param && param.trim().length >= minLength

const isNewHYStudyProgramme = code => !!(code && code.match(/^[A-Z]*[0-9]*_[0-9]*$/))

module.exports = {
  validateParamLength,
  isNewHYStudyProgramme,
}
