const { Teacher } = require('../models/index')
const { Op } = require('sequelize')

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

const likefy = term => `%${term}%`

const nameLike = terms => ({
  name: {
    [Op.and]: terms.map(term => ({ [Op.like]: likefy(term) }))
  }
})

const codeLike = terms => {
  if (terms.length !== 1) {
    return undefined
  }
  return {
    code: {
      [Op.eq]: terms[0]
    }
  }
}

const bySearchTerm = async searchTerm => {
  const terms = splitByEmptySpace(searchTerm)
  return Teacher.findAll({
    where: {
      [Op.or]: [
        nameLike(terms),
        codeLike(terms)
      ]
    }
  })
}

module.exports = {
  bySearchTerm
}