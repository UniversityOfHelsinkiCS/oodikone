const Sequelize = require('sequelize')
const { sequelize, migrationPromise } = require('../database/connection')

const ElementDetails = sequelize.define('element_details',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: { type: Sequelize.JSONB },
    type: { type: Sequelize.INTEGER }
  },
  {
    tablename: 'element_details'
  }
)

const AccessGroup = sequelize.define('access_group',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },
    group_code: {
      type: Sequelize.STRING,
      unique: true
    },
    group_info: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    },
    updatedAt: {
      type: Sequelize.DATE
    }
  })


const User = sequelize.define('users',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },
    full_name: { type: Sequelize.STRING },
    username: {
      type: Sequelize.STRING,
      unique: true
    },
    email: { type: Sequelize.STRING },
    language: { type: Sequelize.STRING }
  },
  {
    tableName: 'users',
    timestamps: false,
  }
)
const HyGroup = sequelize.define('hy_group',
  {
    id: {
      primaryKey:true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },

    code: { type: Sequelize.STRING },

    createdAt: {
      type: Sequelize.DATE
    },

    updatedAt: {
      type: Sequelize.DATE
    }

  })

  const Affiliation = sequelize.define('affiliations',
  {
    id: {
      primaryKey:true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },

    code: { type: Sequelize.STRING },

    createdAt: {
      type: Sequelize.DATE
    },

    updatedAt: {
      type: Sequelize.DATE
    }

  })

const Migration = sequelize.define('migrations', {
  name: {
    type: Sequelize.STRING,
    primaryKey: true
  }
}, {
    tablename: 'migrations',
    timestamps: false
  })


User.belongsToMany(ElementDetails, { through: 'user_elementdetails', as: 'elementdetails' })
ElementDetails.belongsToMany(User, { through: 'user_elementdetails' })

User.belongsToMany(AccessGroup, { through: 'user_accessgroup', as: 'accessgroup' })
AccessGroup.belongsToMany(User, { through: 'user_accessgroup' })

User.belongsToMany(HyGroup, { through: 'user_hy_group', as: 'hy_group' })
HyGroup.belongsToMany(User, { through: 'user_hy_group' })

User.belongsToMany(Affiliation, { through: 'user_affiliation', as: 'affiliation' })
Affiliation.belongsToMany(User, { through: 'user_affiliation' })

module.exports = {
  User,
  ElementDetails,
  Migration,
  AccessGroup,
  HyGroup,
  Affiliation
}