import { z } from 'zod';
import widgetRepository from '../repositories/widget.repository.js';
import submissionRepository from '../repositories/submission.repository.js';
import userRepository from '../repositories/user.repository.js';
import geoIPService from '../services/geoip.service.js';
import webhookService from '../services/webhook.service.js';

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

      // 2. Fetch the Owner to get their email address for Webhooks
      const owner = await userRepository.findById(widget.user_id);

      // 3. Security Check: Strict Origin Validation
      const requestOrigin = req.headers.origin || req.headers.referer;
      console.log(`[DEBUG] Attempting submission for Key: ${public_api_key} | Origin: ${requestOrigin}`); 
      let allowedOrigins = [];
      try {
        allowedOrigins = JSON.parse(widget.allowed_origins || '[]');
      } catch (e) {
        allowedOrigins = [];
      }
      console.log("DEBUG ORIGINS:", { requestOrigin, allowedOrigins });

      const isWildcard = allowedOrigins.includes('*') || allowedOrigins.length === 0;

      // If specific origins are configured, strictly enforce them
      if (!isWildcard) {
        // If they specify origins, we MUST have an origin/referer to check against
        if (!requestOrigin) {
          return res.status(403).json({ error: 'Forbidden: Missing Origin/Referer header' });
        }

        const isAllowed = allowedOrigins.some((allowed) => {
          try {
            const allowedHost = new URL(allowed).origin;
            const requestHost = new URL(requestOrigin).origin;
            return allowedHost === requestHost;
          } catch {
            return allowed === requestOrigin;
          }
        });

        if (!isAllowed) {
          return res.status(403).json({ error: 'Forbidden: Origin domain not authorized' });
        }
      }

      // 4. Security Check: Honeypot Trap
      // If a bot populated the hidden honeypot field, fake success but discard data
      if (req.body.website_hp_check && req.body.website_hp_check.trim() !== '') {
        return res.status(201).json({ message: 'Submission received successfully' });
      }

      // 5. Payload Validation via Zod
      const parseResult = submissionSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.flatten().fieldErrors
        });
      }

      // Clean payload (Remove honeypot string from saved payload)
      const { website_hp_check, ...cleanData } = parseResult.data;

      // 6. Resolve Geo Location and Save Lead to Database
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const cleanIp = typeof clientIp === 'string' ? clientIp.split(',')[0].trim() : clientIp;

      // Fetch location details
      const geoData = await geoIPService.lookup(cleanIp);

      const submission = await submissionRepository.create({
        widget_id: widget.id,
        data: cleanData,
        ip_address: cleanIp,
        geo_data: geoData
      });

      // 7. Optional: Trigger n8n Webhook / Email Notification
      let n8nWebhookUrl = widget.webhook_url;
      console.log("--- DEBUG WEBHOOK ---");                                                          
          console.log("Widget URL:", n8nWebhookUrl);                                                     
          console.log("ENV Variables:", process.env.N8N_HOST, process.env.N8N_PORT, process.env.         
     N8N_WEBHOOK_PATH);


      if (!n8nWebhookUrl && process.env.N8N_HOST && process.env.N8N_PORT && process.env.N8N_WEBHOOK_PATH) {
        n8nWebhookUrl = `http://${process.env.N8N_HOST}:${process.env.N8N_PORT}${process.env.N8N_WEBHOOK_PATH}`;
      }
      if (n8nWebhookUrl) {
        // Fire and forget webhook request (no await)
        webhookService.notify(n8nWebhookUrl, {
          // Existing fields for backward compatibility
          submission_id: submission.id,
          widget_title: widget.title,
          owner_email: owner ? owner.email : null,
          lead: cleanData,
          ip_address: cleanIp,
          geo_data: geoData,
          // New added fields
          id: submission.id,
          widget_id: widget.id,
          data: cleanData,
          created_at: submission.created_at || new Date().toISOString().replace('T', ' ').substring(0, 19)
        });
      }

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