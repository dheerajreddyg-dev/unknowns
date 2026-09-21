import React from 'react';
import { Plus, Globe, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const getIssuesSummary = (scanHistory = []) => {
  if (scanHistory.length === 0) return null;
  const latest = scanHistory[0];
  return {
    criticalCount: latest.critical?.length || 0,
    seriousCount: latest.serious?.length || 0,
    moderateCount: latest.moderate?.length || 0,
    minorCount: latest.minor?.length || 0
  };
};

const getFrequencyLabel = (website) => {
  const freq = website.monitoring?.frequency || 'manual';
  const labels = {
    manual: 'On-demand',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  };
  return labels[freq] || 'On-demand';
};

const getNextScanDue = (website) => {
  const freq = website.monitoring?.frequency || 'manual';
  if (freq === 'manual') return 'On-demand';
  if (!website.lastScanned) return 'Not yet scanned';
  const last = new Date(website.lastScanned);
  const days = freq === 'daily' ? 1 : freq === 'weekly' ? 7 : 30;
  const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000);
  return `Due ${formatDistanceToNow(next, { addSuffix: true })}`;
};

const getStatusMeta = (website) => {
  // Check for scan in progress
  const savedScanState = localStorage.getItem(`scan_progress_${website?.id}`);
  if (savedScanState) {
    const state = JSON.parse(savedScanState);
    if (state.isScanning && Date.now() - state.timestamp < 30 * 60 * 1000) { // 30 minutes timeout
      return {
        label: 'Scanning',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        icon: <Clock className="w-3 h-3 text-blue-600 animate-spin" />
      };
    } else if (state.isScanning) {
      // Clean up expired scan state
      localStorage.removeItem(`scan_progress_${website?.id}`);
    }
  }

  const lastScan = website.scanHistory?.[0];
  const criticalCount = lastScan?.critical?.length || 0;
  const seriousCount = lastScan?.serious?.length || 0;

  if (!website.lastScanned || !lastScan) {
    return {
      label: 'Not scanned',
      badgeClass: 'bg-gray-50 text-gray-600 border border-gray-200',
      icon: <Clock className="w-3 h-3 text-gray-500" />
    };
  }

  if (criticalCount > 0) {
    return {
      label: 'Critical issues',
      badgeClass: 'bg-red-50 text-red-700 border border-red-200',
      icon: <AlertTriangle className="w-3 h-3 text-red-600" />
    };
  }

  if (seriousCount > 0) {
    return {
      label: 'Issues found',
      badgeClass: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      icon: <AlertTriangle className="w-3 h-3 text-yellow-600" />
    };
  }

  return {
    label: 'Passed',
    badgeClass: 'bg-green-50 text-green-700 border border-green-200',
    icon: <CheckCircle className="w-3 h-3 text-green-600" />
  };
};

const WebsiteList = ({ websites, onSelectWebsite, onAddWebsite }) => {
  const totalSites = websites.length;
  const scannedSites = websites.filter((site) => site.lastScanned).length;
  const sitesWithIssues = websites.filter((site) => {
    const summary = getIssuesSummary(site.scanHistory);
    return summary && (summary.criticalCount > 0 || summary.seriousCount > 0);
  }).length;
  const neverScanned = totalSites - scannedSites;
  
  // Count sites with active scans
  const sitesInProgress = websites.filter((site) => {
    const savedScanState = localStorage.getItem(`scan_progress_${site?.id}`);
    if (savedScanState) {
      const state = JSON.parse(savedScanState);
      return state.isScanning && Date.now() - state.timestamp < 30 * 60 * 1000;
    }
    return false;
  }).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">Websites</h2>
          <p className="text-gray-600 max-w-2xl">
            Monitor and scan your websites for accessibility compliance. Get detailed reports and track improvements over time.
          </p>
        </div>
        <button
          onClick={onAddWebsite}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Website
        </button>
      </div>

      {totalSites > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {[{
            label: 'Total properties', value: totalSites, icon: Globe
          }, {
            label: 'Actively scanned', value: scannedSites, icon: CheckCircle
          }, {
            label: 'Scans in progress', value: sitesInProgress, icon: Clock, highlight: sitesInProgress > 0
          }, {
            label: 'Requires attention', value: sitesWithIssues, icon: AlertTriangle
          }, {
            label: 'Never scanned', value: neverScanned, icon: Clock
          }].map((stat) => {
            const handleStatClick = () => {
              if (stat.label === 'Scans in progress' && stat.value > 0) {
                // Find first website with scan in progress and open it
                const websiteInProgress = websites.find((site) => {
                  const savedScanState = localStorage.getItem(`scan_progress_${site?.id}`);
                  if (savedScanState) {
                    const state = JSON.parse(savedScanState);
                    return state.isScanning && Date.now() - state.timestamp < 30 * 60 * 1000;
                  }
                  return false;
                });
                if (websiteInProgress) {
                  onSelectWebsite(websiteInProgress);
                }
              }
            };

            return (
              <div
                key={stat.label}
                className={`flex items-center justify-between rounded-xl border bg-white px-5 py-4 shadow-sm transition hover:shadow-md ${
                  stat.highlight ? 'ring-2 ring-primary-200 cursor-pointer' : ''
                }`}
                onClick={handleStatClick}
              >
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    stat.highlight ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-500'
                  }`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalSites === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl text-center py-16 px-6 border-dashed">
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <Globe className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">No websites added yet</h3>
          <p className="text-gray-600 max-w-lg mx-auto mb-8">
            Add your first website to start monitoring accessibility compliance and generate detailed reports.
          </p>
          <button
            onClick={onAddWebsite}
            className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Your First Website
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {websites.map((website) => {
            const issuesSummary = getIssuesSummary(website.scanHistory);
            const status = getStatusMeta(website);

            return (
              <div
                key={website.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-primary cursor-pointer transition-all duration-200"
                onClick={() => onSelectWebsite(website)}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{website.name}</h3>
                    <p className="text-sm text-primary break-all">{website.url}</p>
                    {website.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{website.description}</p>
                    )}
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${status.badgeClass}`}>
                    {status.icon}
                    <span>{status.label}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {website.lastScanned ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>Last scan {formatDistanceToNow(new Date(website.lastScanned))} ago</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{getFrequencyLabel(website)} • {getNextScanDue(website)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Never scanned • Click to start first scan</span>
                    </div>
                  )}

                  {issuesSummary && (
                    <div className="grid grid-cols-2 gap-3">
                      {[{
                        label: 'Critical', value: issuesSummary.criticalCount, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200'
                      }, {
                        label: 'Serious', value: issuesSummary.seriousCount, bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200'
                      }].map((item) => (
                        <div key={item.label} className={`${item.bg} ${item.border} border rounded-lg p-3`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-gray-600">{item.label}</p>
                              <p className={`text-lg font-bold ${item.text}`}>{item.value}</p>
                            </div>
                            <AlertTriangle className={`w-4 h-4 ${item.text}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 text-center border-t border-gray-200 pt-4">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{issuesSummary?.moderateCount || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Moderate</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{issuesSummary?.minorCount || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Minor</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-green-600">{website.scanHistory?.[0]?.summary?.passedRules || 0}</p>
                      <p className="text-xs font-medium text-gray-500">Passed</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                  <span>Click to view details</span>
                  <Globe className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WebsiteList;