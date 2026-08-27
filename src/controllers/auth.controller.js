import bcrypt from 'bcryptjs';
import userRepository from '../repositories/user.repository.js';

class AuthController {
  async register(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password || password.length < 8) {
        return res.status(400).json({ error: 'Email and password (min 6 chars) are required' });
      }

      const existingUser = await userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 10); // Hash the password with a salt round of 10
      const newUser = await userRepository.create(email, passwordHash);

      req.session.userId = newUser.id; 

      return res.status(201).json({
        message: 'User registered successfully',
        user: { id: newUser.id, email: newUser.email }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      const user = await userRepository.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      req.session.userId = user.id;

      return res.status(200).json({
        message: 'Logged in successfully',
        user: { id: user.id, email: user.email }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Logout failed' });
      }
      res.clearCookie('sid');
      return res.status(200).json({ message: 'Logged out successfully' });
    });
  }
}

export default new AuthController();