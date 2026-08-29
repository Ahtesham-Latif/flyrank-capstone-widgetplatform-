import crypto from 'crypto';
import widgetRepository from '../repositories/widget.repository.js';

class WidgetController {
  async createWidget(req, res) {
    try {
      const { title, allowed_origins } = req.body;
      const userId = req.session.userId;

      if (!title || !allowed_origins || !Array.isArray(allowed_origins) || allowed_origins.length === 0) {
        return res.status(400).json({
          error: 'Title and at least one allowed origin (array of URLs) are required'
        });
      }

      if (allowed_origins.includes('*')) {
        return res.status(400).json({
          error: 'Wildcard (*) origins are not allowed for security reasons'
        });
      }

      // Generate unique public API key (e.g. key_a1b2c3d4...)
      const publicApiKey = `key_${crypto.randomBytes(12).toString('hex')}`;

      const widget = await widgetRepository.create({
        user_id: userId,
        public_api_key: publicApiKey,
        title,
        allowed_origins: JSON.stringify(allowed_origins)
      });

      return res.status(201).json({
        message: 'Widget created successfully',
        widget: {
          ...widget,
          allowed_origins: JSON.parse(widget.allowed_origins || '[]')
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async getMyWidgets(req, res) {
    try {
      const userId = req.session.userId;
      const widgets = await widgetRepository.findByUserId(userId);

      const formattedWidgets = widgets.map((w) => ({
        ...w,
        allowed_origins: JSON.parse(w.allowed_origins || '[]')
      }));

      return res.status(200).json({ widgets: formattedWidgets });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async deleteWidget(req, res) {
    try {
      const { id } = req.params;
      const userId = req.session.userId;

      const deleted = await widgetRepository.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Widget not found or unauthorized' });
      }

      return res.status(200).json({ message: 'Widget deleted successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  async updateWidget(req, res) {
    try {
      const { id } = req.params;
      const { title, allowed_origins, webhook_url } = req.body;
      const userId = req.session.userId;

      const updateData = {};
      if (title) updateData.title = title;
      if (allowed_origins !== undefined) {
        if (!Array.isArray(allowed_origins) || allowed_origins.length === 0) {
          return res.status(400).json({ error: 'allowed_origins must be a non-empty array of URLs' });
        }
        if (allowed_origins.includes('*')) {
          return res.status(400).json({ error: 'Wildcard (*) origins are not allowed for security reasons' });
        }
        updateData.allowed_origins = JSON.stringify(allowed_origins);
      }
      if (webhook_url !== undefined) {
        updateData.webhook_url = webhook_url;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No data provided to update' });
      }

      const widget = await widgetRepository.update(id, userId, updateData);
      
      if (!widget) {
        return res.status(404).json({ error: 'Widget not found or unauthorized' });
      }

      return res.status(200).json({
        message: 'Widget updated successfully',
        widget: {
          ...widget,
          allowed_origins: JSON.parse(widget.allowed_origins || '[]')
        }
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new WidgetController();