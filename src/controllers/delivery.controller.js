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
  
  // Use the origin of the script tag itself (the backend server)
  // rather than window.location.origin (the site it's embedded on)
  const baseUrl = script && script.src ? new URL(script.src).origin : 'http://localhost:3000';

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

      container.innerHTML = \`
        <h3 class="fr-title">\${config.title}</h3>
        <p class="fr-subtitle">Leave your details below and we'll get in touch.</p>
        <form id="flyrank-widget-form">
          <!-- Hidden Spam Trap / Honeypot Field -->
          <input type="text" name="website_hp_check" style="display:none !important;" tabindex="-1" autocomplete="off" />

          <div class="fr-field">
            <label>Full Name</label>
            <input type="text" name="name" required placeholder="John Doe" />
          </div>

          <div class="fr-field">
            <label>Email Address</label>
            <input type="email" name="email" required placeholder="john@example.com" />
          </div>

          <button type="submit">
            Send Message
          </button>
        </form>
      \`;

      // Scoped styles for the injected widget.
      // Single accent color (#09090b) used consistently across button, focus ring,
      // and active states. Errors use monospace — they're real backend output, not UI copy.
      // Success icon stays semantic green (#10B981), a status color, not the brand accent.
      const style = document.createElement('style');
      style.innerHTML = \`
        #flyrank-widget-root {
          position: fixed !important;
          bottom: 24px !important;
          right: 24px !important;
          z-index: 2147483647 !important;
          width: calc(100% - 48px) !important;
          max-width: 340px !important;
          background: #ffffff !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 20px !important;
          box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0,0,0,0.05) !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          padding: 24px !important;
          box-sizing: border-box !important;
        }

        @media (prefers-reduced-motion: no-preference) {
          #flyrank-widget-root {
            animation: fr-slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
        }

        @keyframes fr-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        #flyrank-widget-root * {
          box-sizing: border-box !important;
          margin: 0;
          padding: 0;
        }

        #flyrank-widget-root .fr-title {
          font-size: 18px !important;
          font-weight: 700 !important;
          color: #09090b !important;
          margin-bottom: 6px !important;
          line-height: 1.3 !important;
        }

        #flyrank-widget-root .fr-subtitle {
          font-size: 13px !important;
          color: #71717a !important;
          margin-bottom: 20px !important;
          line-height: 1.4 !important;
        }

        #flyrank-widget-root .fr-field {
          margin-bottom: 16px !important;
        }

        #flyrank-widget-root label {
          display: block !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          color: #3f3f46 !important;
          margin-bottom: 6px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.02em !important;
        }

        #flyrank-widget-root input {
          width: 100% !important;
          padding: 10px 14px !important;
          border: 1px solid #e4e4e7 !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          color: #09090b !important;
          background: #fafafa !important;
          transition: all 0.2s ease !important;
          outline: none !important;
        }

        #flyrank-widget-root input::placeholder {
          color: #a1a1aa !important;
        }

        #flyrank-widget-root input:focus {
          border-color: #09090b !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 3px rgba(9, 9, 11, 0.06) !important;
        }

        #flyrank-widget-root button {
          width: 100% !important;
          padding: 12px !important;
          background: #09090b !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 10px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          margin-top: 4px !important;
        }

        #flyrank-widget-root button:hover {
          background: #27272a !important;
        }

        #flyrank-widget-root button:active {
          transform: translateY(1px) !important;
        }

        #flyrank-widget-root button:focus-visible {
          outline: 2px solid #09090b !important;
          outline-offset: 2px !important;
        }

        #flyrank-widget-root button:disabled {
          opacity: 0.6 !important;
          cursor: not-allowed !important;
        }

        #flyrank-widget-root .fr-error {
          color: #DC2626 !important;
          font-size: 12px !important;
          margin-top: 12px !important;
          text-align: center !important;
          font-weight: 500 !important;
          font-family: ui-monospace, "Cascadia Code", "SF Mono", monospace !important;
          line-height: 1.5 !important;
        }

        #flyrank-widget-root .fr-success-icon {
          width: 40px !important;
          height: 40px !important;
          border-radius: 20px !important;
          background: #10B981 !important;
          color: #ffffff !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0 auto 16px !important;
          font-size: 20px !important;
        }
      \`;
      document.head.appendChild(style);

      const existing = document.getElementById('flyrank-widget-root');
      if (existing) existing.remove();

      document.body.appendChild(container);

      const formEl = container.querySelector('#flyrank-widget-form');
      formEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());

        const submitButton = formEl.querySelector('button[type="submit"]');
        const originalText = submitButton.innerText;

        try {
          submitButton.innerText = 'Sending...';
          submitButton.disabled = true;

          const submitRes = await fetch(\`\${baseUrl}/api/submissions/\${apiKey}\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (submitRes.ok) {
            container.innerHTML = \`
              <div style="text-align: center; padding: 20px 0;">
                <div class="fr-success-icon">✓</div>
                <h3 class="fr-title">Message sent</h3>
                <p class="fr-subtitle" style="margin-bottom: 0;">We've received your submission.</p>
              </div>
            \`;
          } else {
            const errData = await submitRes.json();
            const existingError = formEl.querySelector('.fr-error');
            if (existingError) existingError.remove();

            const errorMsg = document.createElement('div');
            errorMsg.className = 'fr-error';
            errorMsg.innerText = 'Failed: ' + (errData.error || 'Unknown error');
            formEl.appendChild(errorMsg);

            submitButton.innerText = originalText;
            submitButton.disabled = false;
          }
        } catch (err) {
          console.error('[FlyRank Widget] Submission Error:', err);
          const existingError = formEl.querySelector('.fr-error');
          if (existingError) existingError.remove();

          const errorMsg = document.createElement('div');
          errorMsg.className = 'fr-error';
          errorMsg.innerText = 'Failed: Origin not allowed (CORS) or network error';
          formEl.appendChild(errorMsg);

          submitButton.innerText = originalText;
          submitButton.disabled = false;
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