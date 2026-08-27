import db from '../config/db.js';

class WidgetRepository {
  // Enforces strict tenant scoping via userId
  async findByUserId(userId) {
    return await db('widgets').where({ user_id: userId });
  }

  async findByIdAndUserId(id, userId) {
    return await db('widgets').where({ id, user_id: userId }).first();
  }

  async create(widgetData) {
    const [widget] = await db('widgets')
      .insert(widgetData)
      .returning('*');

    return widget || (await this.findByIdAndUserId(widgetData.id, widgetData.user_id));
  }

  async delete(id, userId) {
    return await db('widgets')
      .where({ id, user_id: userId })
      .del();
  }

  // Public lookup for script & submission delivery (unauthenticated)
  async findByApiKey(publicApiKey) {
    return await db('widgets').where({ public_api_key: publicApiKey }).first();
  }
}

export default new WidgetRepository();