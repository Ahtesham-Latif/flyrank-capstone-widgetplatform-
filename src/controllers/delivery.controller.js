import widgetRepository from '../repositories/widget.repository.js';

class DeliveryController {
  // GET /api/widgets/:public_api_key/config
  async getConfig(req, res) {
    try {
      const { public_api_key } = req.params;
      const widget = await widgetRepository.findByApiKey(public_api_key);

      if (!widget) {
        return res.status(404).json({ error: 'Widget key not found' });
      }

      // Short-lived HTTP cache header for CDN/Browser optimization
      res.setHeader('Cache-Control', 'public, max-age=60');

    // Clean response (zero security internal data leaked, 
    // AI was suggesting to send allowed_origins to a public endpoint, which is a security risk)
      return res.status(200).json({
        title: widget.title
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /widget.js
  getWidgetScript(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const jsBundle = `
(function() {
  const script = document.currentScript;
  const apiKey = script ? script.getAttribute('data-api-key') : null;
  const baseUrl = window.location.origin;

  if (!apiKey) {
    console.error('[FlyRank Widget] Missing data-api-key attribute on script tag.');
    return;
  }

  async function initWidget() {
    try {
      const res = await fetch(\`\${baseUrl}/api/widgets/\${apiKey}/config\`);
      if (!res.ok) throw new Error('Failed to load widget configuration');
      const config = await res.json();

      const container = document.createElement('div');
      container.id = 'flyrank-widget-root';
      container.style.cssText = 'border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px; max-width: 400px; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);';

      container.innerHTML = \`
        <h3 style="margin-top:0;">\${config.title}</h3>
        <form id="flyrank-widget-form">
          <!-- Hidden Spam Trap / Honeypot Field -->
          <input type="text" name="website_hp_check" style="display:none !important;" tabindex="-1" autocomplete="off" />
          
          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom: 4px; font-size: 14px;">Name</label>
            <input type="text" name="name" required style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;" />
          </div>

          <div style="margin-bottom: 12px;">
            <label style="display:block; margin-bottom: 4px; font-size: 14px;">Email</label>
            <input type="email" name="email" required style="width: 100%; padding: 8px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px;" />
          </div>

          <button type="submit" style="background: #007bff; color: white; border: none; padding: 10px 16px; border-radius: 4px; cursor: pointer; width: 100%;">
            Submit
          </button>
        </form>
      \`;

      document.body.appendChild(container);

      document.getElementById('flyrank-widget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());

        try {
          const submitRes = await fetch(\`\${baseUrl}/api/submissions/\${apiKey}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (submitRes.ok) {
            alert('Submission received! Thank you.');
            e.target.reset();
          } else {
            const errData = await submitRes.json();
            alert('Submission failed: ' + (errData.error || 'Unknown error'));
          }
        } catch (err) {
          console.error('[FlyRank Widget] Submission Error:', err);
        }
      });

    } catch (err) {
      console.error('[FlyRank Widget] Setup Error:', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
`;

    return res.status(200).send(jsBundle);
  }
}

export default new DeliveryController();