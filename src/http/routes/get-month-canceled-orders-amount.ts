import { Elysia } from 'elysia'
import dayjs from 'dayjs'
import { auth } from '../auth'
import { UnauthorizedError } from '../errors/unauthorized-error'
import { db } from '../../db/connection'
import { orders } from '../../db/schema'
import { and, eq, gte, sql, count } from 'drizzle-orm'

export const getMonthCanceledOrdersAmount = new Elysia()
  .use(auth)
  .get('/metrics/month-canceled-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    const today = dayjs()
    const lastMonth = today.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month')

    const ordersCanceledPerMonth = await db
      .select({
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          eq(orders.status, 'canceled'),
          gte(orders.createdAt, startOfLastMonth.toDate()),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = today.format('YYYY-MM')

    const currentMonthCanceledOrdersAmount = ordersCanceledPerMonth.find(
      (orderCanceledPerMonth) => {
        return orderCanceledPerMonth.monthWithYear === currentMonthWithYear
      },
    )

    const lastMonthCanceledOrdersAmount = ordersCanceledPerMonth.find(
      (orderCanceledPerMonth) => {
        return orderCanceledPerMonth.monthWithYear === lastMonthWithYear
      },
    )

    const diffFromLastMonth =
      currentMonthCanceledOrdersAmount && lastMonthCanceledOrdersAmount
        ? (currentMonthCanceledOrdersAmount.amount * 100) /
          lastMonthCanceledOrdersAmount.amount
        : null

    return {
      amount: currentMonthCanceledOrdersAmount?.amount,
      diffFromLastMonth: diffFromLastMonth
        ? Number((diffFromLastMonth - 100).toFixed(2))
        : 0,
    }
  })
