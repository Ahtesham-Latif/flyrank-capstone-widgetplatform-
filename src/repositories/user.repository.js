import db from '../config/db.js';

class UserRepository {
  async findByEmail(email) {
    return await db('users').where({ email }).first();
  }

  async findById(id) {
    return await db('users').where({ id }).first();
  }

  async create(email, passwordHash) {
    const [user] = await db('users')
      .insert({
        email,
        password_hash: passwordHash
      })
      .returning(['id', 'email', 'created_at']);

    return user || (await this.findByEmail(email));
  }
}

export default new UserRepository();