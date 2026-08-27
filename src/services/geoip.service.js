class GeoIPService {
  async lookup(ip) {
    // Skip lookup for localhost / private IPs
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Localhost',
        city: 'Development Environment',
        region: 'Local',
        isp: 'Internal'
      };
    }

    try {
      // Primary Lookup: ip-api.com
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,isp`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          return {
            country: data.country,
            city: data.city,
            region: data.regionName,
            isp: data.isp
          };
        }
      }
    } catch (err) {
      console.error('[GeoIP Service] Primary lookup failed:', err.message);
    }

    // Fallback if primary fails
    return { country: 'Unknown', city: 'Unknown' };
  }
}

export default new GeoIPService();