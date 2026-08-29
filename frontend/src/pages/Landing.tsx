import { Link } from 'react-router-dom';
import { ArrowRight, Activity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-neutral-50 font-sans text-neutral-900 selection:bg-blue-100 overflow-hidden">
      
      {/* Navigation Shell */}
      <nav className="relative z-50 w-full border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-neutral-700" />
              </div>
              <span className="text-sm font-semibold tracking-tight text-neutral-900">SignalLead</span>
            </div>
            <div className="h-4 w-px bg-neutral-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div>
               <span className="text-xs font-medium text-neutral-600">All systems operational</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link to="/auth" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 rounded px-1">
              Sign In
            </Link>
            <Link to="/auth" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-md hover:bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              Go to Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section: Thesis + Live Pipeline Diff */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-neutral-900 leading-[1.1] mb-6">
            Infrastructure for lead capture and enrichment.
          </h1>
          
          <p className="text-lg text-neutral-600 mb-10 leading-relaxed max-w-lg">
            Deploy a domain-locked ingestion widget to any site. SignalLead handles edge validation, real-time geographic enrichment, and asynchronous delivery to your internal webhooks.
          </p>
          
          <Link to="/auth" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
            Start Building <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right: Strict JSON Diff View */}
        <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Payload Transformation</span>
            <span className="text-[11px] font-mono text-neutral-400">42ms latency</span>
          </div>
          
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
             <div className="p-6">
                <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-4">1. Raw Submission</div>
                <pre className="font-mono text-[13px] text-neutral-700 whitespace-pre-wrap">
{`{
  "email": "user@acme.com",
  "name": "Jane Developer"
}`}
                </pre>
             </div>
             
             <div className="p-6 bg-neutral-50/50">
                <div className="text-[11px] font-medium text-blue-600 uppercase tracking-wider mb-4">2. Enriched Webhook</div>
                <pre className="font-mono text-[13px] text-neutral-700 whitespace-pre-wrap">
{`{
  "email": "user@acme.com",
  "name": "Jane Developer",`}
<span className="text-blue-700 bg-blue-50 block px-1 -mx-1">{`  "geo_data": {
    "ip": "198.51.100.1",
    "country": "United States",
    "city": "San Francisco",
    "isp": "Cloudflare, Inc."
  }`}</span>
{`}`}
                </pre>
             </div>
          </div>
        </div>
      </main>

      {/* Security Sequence */}
      <section className="border-t border-neutral-200 bg-white py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Ingress Security Sequence</h2>
            <p className="text-neutral-600 mt-3 text-lg leading-relaxed">Requests are evaluated at the edge boundary. Invalid or malicious traffic is dropped before consuming backend resources.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-6 left-12 right-12 h-px bg-neutral-200 z-0"></div>
            
            {[
              { num: '01', title: 'Origin Validation', desc: 'Strict CORS enforcement validates the request origin against pre-authorized cryptographic keys. Cross-site spoofing is dropped immediately.' },
              { num: '02', title: 'Bot Mitigation', desc: 'Honeypot fields and behavioral heuristics trap headless automated spam scripts before they can initiate processing.' },
              { num: '03', title: 'Traffic Control', desc: 'Rate limits are enforced at the network edge to prevent volumetric abuse and ensure consistent pipeline latency.' }
            ].map((step) => (
              <div key={step.num} className="relative z-10 bg-white border border-neutral-200 rounded-lg p-8 shadow-sm">
                <div className="w-12 h-12 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-900 font-mono font-medium flex items-center justify-center mb-6">
                  {step.num}
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{step.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Console Preview */}
      <section className="border-t border-neutral-200 bg-neutral-50 py-24 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">Unified Control Plane</h2>
            <p className="text-neutral-600 mt-3 text-lg leading-relaxed">Monitor telemetry, configure edge logic, and manage workspace access from a centralized dashboard.</p>
          </div>
          
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden text-left mx-auto max-w-4xl">
             <div className="h-12 border-b border-neutral-200 bg-neutral-50 flex items-center px-4 gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-neutral-900 border-b-2 border-neutral-900 h-12 flex items-center">Telemetry Feed</div>
                  <div className="text-sm font-medium text-neutral-500 h-12 flex items-center">Configuration</div>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-white">
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Workspace</th>
                      <th className="px-6 py-3 text-[11px] font-medium text-neutral-500 uppercase tracking-wider w-full">Payload Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-500">2026-08-29T14:18:22Z</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-900">198.51.100.1</td>
                      <td className="px-6 py-4 text-[13px] text-neutral-700 font-medium">Production</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-500 truncate max-w-[200px]">{"{\"email\":\"user@acme.com\"}"}</td>
                    </tr>
                    <tr className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-500">2026-08-29T14:15:09Z</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-900">203.0.113.4</td>
                      <td className="px-6 py-4 text-[13px] text-neutral-700 font-medium">Beta Site</td>
                      <td className="px-6 py-4 text-[13px] font-mono text-neutral-500 truncate max-w-[200px]">{"{\"email\":\"test@example.com\"}"}</td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/auth" className="inline-flex items-center justify-center px-6 py-2 bg-white border border-neutral-200 text-neutral-900 rounded-md font-medium hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
              Sign In to Console
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border border-neutral-200 bg-neutral-50 flex items-center justify-center">
              <Activity className="w-3 h-3 text-neutral-700" />
            </div>
            <span className="font-semibold text-neutral-900 tracking-tight text-sm">SignalLead</span>
          </div>
          <p className="text-sm text-neutral-500">Infrastructure for lead capture and orchestration.</p>
        </div>
      </footer>

    </div>
  );
}
