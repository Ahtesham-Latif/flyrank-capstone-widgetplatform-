class WebhookService {
  /**
   * Fires a non-blocking background notification payload to n8n / custom webhooks
   */
  async notify(webhookUrl, payload) {
    if (!webhookUrl) return;

    // Run in background (fire-and-forget)
    setImmediate(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FlyRank-Widget-Platform/1.0'
          },
          body: JSON.stringify({
            event: 'submission.created',
            timestamp: new Date().toISOString(),
            data: payload
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.warn(`[Webhook Service] Failed with status ${response.status} for URL: ${webhookUrl}`);
        } else {
          console.log(`[Webhook Service] Notification successfully delivered to n8n.`);
        }
      } catch (err) {
        console.error(`[Webhook Service] Delivery error: ${err.message}`);
      }
    });
  }
}

export default new WebhookService();