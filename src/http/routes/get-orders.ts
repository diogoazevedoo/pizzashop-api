import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { createSelectSchema } from 'drizzle-typebox'
import { orders } from '../../db/schema'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
    }),
  },
)
