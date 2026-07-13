import { Op } from 'sequelize'
import { Banner } from '@oodikone/shared/models/kone'
import { BannerModel } from '../models/kone/banner'
import { SetOptional } from '../types'

export const getActiveBanners = async () =>
  await BannerModel.findAll({
    attributes: ['id', 'text', 'lightness', 'color', 'startDate', 'endDate'],
    where: {
      endDate: {
        [Op.gt]: new Date(),
      },
      startDate: {
        [Op.lt]: new Date(),
      },
    },
    raw: true,
  })

export const getAllBanners = async () => await BannerModel.findAll({ raw: true })

export const saveBanner = async (payload: SetOptional<Banner, 'id'>) => {
  if (!payload.id) {
    await BannerModel.create(payload)
  } else {
    await BannerModel.upsert(payload)
  }
}
