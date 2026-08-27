import { z } from 'zod';
import widgetRepository from '../repositories/widget.repository.js';
import submissionRepository from '../repositories/submission.repository.js';

// Schema for raw payload validation
const submissionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  website_hp_check: z.string().optional()
}).passthrough(); // Allows extra custom form fields while enforcing core rules

class SubmissionController {
  // POST /api/submissions/:public_api_key
  async handleSubmission(req, res) {
    try {
      const { public_api_key } = req.params;

      // 1. Resolve Widget by Key
      const widget = await widgetRepository.findByApiKey(public_api_key);
      if (!widget) {
        return res.status(404).json({ error: 'Widget key not found or inactive' });
      }

      // 2. Security Check: Strict Origin Validation
      const requestOrigin = req.headers.origin || req.headers.referer;
      const allowedOrigins = JSON.parse(widget.allowed_origins || '[]');

      // If allowed_origins is specified, enforce strictly
      if (allowedOrigins.length > 0 && requestOrigin) {
        const isAllowed = allowedOrigins.some((allowed) => {
          try {
            const allowedHost = new URL(allowed).origin;
            const requestHost = new URL(requestOrigin).origin;
            return allowedHost === requestHost;
          } catch {
            return false;
          }
        });

        if (!isAllowed) {
          return res.status(403).json({ error: 'Forbidden: Origin domain not authorized' });
        }
      }

      // 3. Security Check: Honeypot Trap
      // If a bot populated the hidden honeypot field, fake success but discard data
      if (req.body.website_hp_check && req.body.website_hp_check.trim() !== '') {
        return res.status(201).json({ message: 'Submission received successfully' });
      }

      // 4. Payload Validation via Zod
      const parseResult = submissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors
        });
      }

      // Clean payload (Remove honeypot string from saved payload)
      const { website_hp_check, ...cleanData } = parseResult.data;

      // 5. Save Lead to Database
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      const submission = await submissionRepository.create({
        widget_id: widget.id,
        data: cleanData,
        ip_address: typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : clientIp
      });

      return res.status(201).json({
        message: 'Submission received successfully',
        submission_id: submission.id
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/submissions (Tenant Dashboard Feed)
  async getMySubmissions(req, res) {
    try {
      const userId = req.session.userId;
      const submissions = await submissionRepository.findByUserId(userId);
      return res.status(200).json({ submissions });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new SubmissionController();