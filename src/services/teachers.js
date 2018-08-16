const { Teacher } = require('../models/index')
const { Op } = require('sequelize')

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

const likefy = terms => `%${terms.join('%')}%`

const nameLike = terms => ({
  name: {
    [Op.like]: likefy(terms)
  }
})

const codeLike = term => {
  return {
    code: {
      [Op.eq]: term
    }
  }
}

const teacherMatchesSearchTerm = searchTerm => {
  const terms = splitByEmptySpace(searchTerm)
  if (terms.length > 1) {
    return {
      [Op.or]: [
        nameLike(terms),
        nameLike([...terms].reverse())
      ]
    }
  }
  return {
    [Op.or]: [
      nameLike(terms),
      codeLike(terms[0])
    ]
  }
}

const bySearchTerm = async term => {
  return Teacher.findAll({ 
    where: teacherMatchesSearchTerm(term)
  })
}

module.exports = {
  bySearchTerm,
  teacherMatchesSearchTerm
}