import Elysia, { t } from 'elysia'
import { auth } from '../auth'
import { db } from '../../db/connection'
import { restaurants } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { UnauthorizedError } from '../errors/unauthorized-error'

export const updateProfile = new Elysia().use(auth).put(
  '/profile',
  async ({ getCurrentUser, set, body }) => {
    const { restaurantId } = await getCurrentUser()
    const { name, description } = body

    if (!restaurantId) {
      throw new UnauthorizedError()
    }

    await db
      .update(restaurants)
      .set({
        name,
        description,
      })
      .where(eq(restaurants.id, restaurantId))

    set.status = 204
  },
  {
    body: t.Object({
      name: t.String(),
      description: t.String(),
    }),
  },
)
