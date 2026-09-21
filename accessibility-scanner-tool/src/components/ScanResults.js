
// ScanResults.jsx
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  Target,
  Globe,
  Code,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { enhancedScanMultipleUrls, enhancedScanUrl_export } from '../utils/enhancedScanner';
import { extractSitemapUrls } from '../utils/enhancedSitemapParser';
import EnhancedReportDownload from './EnhancedReportDownload';
import ScanHistory from './ScanHistory';

const severityTones = {
  critical: {
    panel: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800 border border-red-200'
  },
  serious: {
    panel: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
  },
  moderate: {
    panel: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-800 border border-orange-200'
  },
  minor: {
    panel: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border border-blue-200'
  },
  default: {
    panel: 'bg-gray-50 border-gray-200',
    badge: 'bg-gray-100 text-gray-800 border border-gray-200'
  }
};

function getSummary(result) {
  return (
    result?.overallSummary ||
    result?.summary || {
      totalViolations: 0,
      totalElements: 0,
      passedRules: 0,
      incompleteRules: 0,
      criticalCount: 0,
      seriousCount: 0,
      moderateCount: 0,
      minorCount: 0
    }
  );
}

function getScore(result) {
  const score = result?.averageAccessibilityScore ?? result?.accessibilityScore;
  return typeof score === 'number' ? score : 0;
}

function monitorFrequencyLabel(frequency) {
  const labels = {
    manual: 'On-demand',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly'
  };
  return labels[frequency || 'manual'] || 'On-demand';
}

function nextScanDueLabel(frequency, lastScanned) {
  if (!frequency || frequency === 'manual') return 'On-demand';
  if (!lastScanned) return 'Not yet scanned';
  const last = new Date(lastScanned);
  const days = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;
  const next = new Date(last.getTime() + days * 24 * 60 * 60 * 1000);
  return `Due ${format(next, 'PP')}`;
}

const ScanResults = ({
  website,
  scanResults,
  isScanning,
  onStartScan,
  onScanComplete,
  onBack
}) => {
  const [scanProgress, setScanProgress] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [scanType, setScanType] = useState('single'); // 'single' | 'sitemap'
  const [expandedViolations, setExpandedViolations] = useState(new Set());
  const [showScanHistory, setShowScanHistory] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [scanCounts, setScanCounts] = useState({ total: 0, completed: 0 });

  const currentSummary = scanResults ? getSummary(scanResults) : null;
  const previousScan = website?.scanHistory?.[1];
  const previousSummary = previousScan ? getSummary(previousScan) : null;
  const trend = scanResults?.trend || null;
  const score = scanResults ? getScore(scanResults) : 0;
  const previousScore = previousScan ? getScore(previousScan) : null;
  const scoreDelta =
    trend?.scoreDelta ?? (previousScore !== null ? score - previousScore : null);
  const totalDelta =
    trend?.totalDelta ??
    (previousSummary
      ? (currentSummary?.totalViolations || 0) -
        (previousSummary.totalViolations || 0)
      : null);
  const newIssues = trend?.newIssues ?? null;
  const resolvedIssues = trend?.resolvedIssues ?? null;

  const progressPercent =
    scanCounts.total > 0
      ? Math.min(100, Math.round((scanCounts.completed / scanCounts.total) * 100))
      : 0;

  const totalUrlsScanned = scanResults ? scanResults.totalUrls ?? 1 : 0;
  const successfulScans = scanResults ? scanResults.successfulScans ?? 1 : 0;
  const failedScans = scanResults ? scanResults.failedScans ?? 0 : 0;

  useEffect(() => {
    // Reset any auto-trigger latch when website changes
    setAutoTriggered(false);
    
    // Check if there's a scan in progress for this website and restore state
    const savedScanState = localStorage.getItem(`scan_progress_${website?.id}`);
    if (savedScanState) {
      const state = JSON.parse(savedScanState);
      if (state.isScanning) {
        onStartScan(true);
        setScanProgress(state.progress || 'Scan in progress...');
        setScanCounts(state.counts || { total: 0, completed: 0 });
      }
    }
  }, [website?.id, onStartScan]);

  useEffect(() => {
    if (autoTriggered || isScanning) return;
    if (!website?.monitoring?.autoStart) return;

    const freq = website?.monitoring?.frequency || 'manual';
    const days =
      freq === 'daily' ? 1 : freq === 'weekly' ? 7 : freq === 'monthly' ? 30 : null;
    const last = website?.lastScanned ? new Date(website.lastScanned) : null;
    const now = Date.now();
    const shouldRun =
      days === null ? !last : !last || now - last.getTime() > days * 86400000;

    if (shouldRun) {
      setAutoTriggered(true);
      handleStartScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTriggered, isScanning, website?.monitoring, website?.lastScanned]);

  const handleStartScan = async () => {
    onStartScan(true);
    setScanProgress('Initializing enhanced scanner...');
    setScanCounts({ total: scanType === 'sitemap' ? 0 : 1, completed: 0 });

    // Save scan state to localStorage
    const saveScanState = (progress, counts) => {
      localStorage.setItem(`scan_progress_${website?.id}`, JSON.stringify({
        isScanning: true,
        progress,
        counts,
        timestamp: Date.now()
      }));
    };

    saveScanState('Initializing enhanced scanner...', { total: scanType === 'sitemap' ? 0 : 1, completed: 0 });

    try {
      toast.success(
        `Starting ${scanType === 'sitemap' ? 'full website' : 'single page'} accessibility scan...`
      );

      let results;

      if (scanType === 'sitemap') {
        // Full website scan using sitemap
        const progress1 = 'Discovering sitemap URLs...';
        setScanProgress(progress1);
        saveScanState(progress1, { total: 0, completed: 0 });
        
        const sitemapUrls = await extractSitemapUrls(website.url, setScanProgress);
        const progress2 = `Found ${sitemapUrls.length} URLs, starting enhanced scan...`;
        setScanProgress(progress2);
        setScanCounts({ total: sitemapUrls.length, completed: 0 });
        saveScanState(progress2, { total: sitemapUrls.length, completed: 0 });

        results = await enhancedScanMultipleUrls(sitemapUrls, {
          concurrency: 20,
          delayMs: 0,
          onProgress: (progress) => {
            setScanProgress(progress);
            saveScanState(progress, scanCounts);
          },
          onUrlComplete: (url, urlResult, completed, total) => {
            // If you need per-URL results aggregation, ensure enhancedScanMultipleUrls returns the merged results
            const progress = `Scanned ${completed}/${total}: ${url}`;
            setScanProgress(progress);
            setScanCounts({ total, completed });
            saveScanState(progress, { total, completed });
          }
        });
      } else {
        // Single page scan
        const progress = 'Analyzing page with enhanced rules...';
        setScanProgress(progress);
        setScanCounts({ total: 1, completed: 0 });
        saveScanState(progress, { total: 1, completed: 0 });

        results = await enhancedScanUrl_export(website.url);

        setScanCounts({ total: 1, completed: 1 });
        saveScanState('Scan completed', { total: 1, completed: 1 });
      }

      onScanComplete(results);
      toast.success('Scan completed successfully!');
      
      // Clear scan state from localStorage
      localStorage.removeItem(`scan_progress_${website?.id}`);
    } catch (error) {
      // Ensure error message display is safe
      const message =
        error?.message || 'Scan failed due to an unexpected error.';
      console.error('Scan failed:', error);
      toast.error(`Scan failed: ${message}`);
      
      // Clear scan state from localStorage on error
      localStorage.removeItem(`scan_progress_${website?.id}`);
    } finally {
      onStartScan(false);
      setScanProgress('');
      setScanCounts({ total: 0, completed: 0 });
    }
  };

  const getSeverityTone = severity => severityTones[severity] || severityTones.default;

  const toggleViolationExpansion = violationId => {
    setExpandedViolations(prev => {
      const updated = new Set(prev);
      if (updated.has(violationId)) updated.delete(violationId);
      else updated.add(violationId);
      return updated;
    });
  };

  const getFilteredViolations = () => {
    if (!scanResults) return [];
    if (selectedSeverity === 'all') {
      return [
        ...(scanResults.critical || []),
        ...(scanResults.serious || []),
        ...(scanResults.moderate || []),
        ...(scanResults.minor || [])
      ];
    }
    return scanResults[selectedSeverity] || [];
  };

  const renderViolationCard = violation => {
    const tone = getSeverityTone(violation.severity);
    const isExpanded = expandedViolations.has(violation.id);
    const nodeCount = violation.nodes?.length || 0;

    return (
      <div
        key={violation.id}
        className={`overflow-hidden rounded-2xl border bg-white ${tone.panel}`}
      >
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-gray-500">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
              <span>{violation.severity}</span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${tone.badge}`}
              >
                {nodeCount} element{nodeCount !== 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => toggleViolationExpansion(violation.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                {isExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          <h3 className="text-lg font-semibold leading-snug text-gray-900">{violation.help}</h3>
          <p className="text-sm text-gray-700">{violation.description}</p>

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap gap-2">
              {(violation.tags || []).slice(0, 3).map(tag => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
            {violation.helpUrl && (
              <a
                href={violation.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:text-primary-900"
              >
                Learn more
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 bg-gray-50">
            {violation.recommendation && (
              <div className="border-b border-gray-200 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600" />
                  <h4 className="text-sm font-semibold text-gray-900">How to fix</h4>
                </div>
                <p className="mb-3 text-sm text-gray-700">
                  {violation.recommendation.recommendation}
                </p>

                {violation.recommendation.suggestedCode && (
                  <div className="mb-4">
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-600">
                      <Code className="h-3 w-3" />
                      <span>Suggested code</span>
                    </div>
                    <div className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs font-mono text-gray-100">
                      <pre>{violation.recommendation.suggestedCode}</pre>
                    </div>
                  </div>
                )}

                {violation.recommendation.wcagGuideline && (
                  <div className="text-xs text-gray-600">
                    <strong className="text-gray-900">WCAG guideline:</strong>{' '}
                    {violation.recommendation.wcagGuideline}
                  </div>
                )}
              </div>
            )}

            <div className="p-4">
              <h4 className="mb-3 text-sm font-semibold text-gray-900">
                Affected elements ({nodeCount})
              </h4>
              <div className="space-y-3">
                {(violation.nodes || []).map((node, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div>
                      <span className="text-xs font-medium text-gray-600">Element selector</span>
                      <p className="mt-1 break-all font-mono text-xs text-gray-900">
                        {(node.target || []).join(', ')}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-600">HTML code</span>
                      <div className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs font-mono text-gray-100">
                        <pre>{node.snippet || node.html}</pre>
                      </div>
                    </div>
                    {node.failureSummary && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">
                          Issue details
                        </span>
                        <p className="mt-1 text-xs text-gray-700">{node.failureSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{website?.name}</h1>
              {website?.url && (
                <a
                  href={website.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mt-1"
                >
                  {website.url}
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-xs">
                <span className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                  {monitorFrequencyLabel(website?.monitoring?.frequency)}
                </span>
                <span
                  className={`px-3 py-1 rounded-full border text-gray-700 ${
                    website?.monitoring?.autoStart
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  Auto-start {website?.monitoring?.autoStart ? 'enabled' : 'off'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            <button
              onClick={() => setShowScanHistory(!showScanHistory)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>

            {scanResults && (
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            )}

            <select
              value={scanType}
              onChange={e => setScanType(e.target.value)}
              className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              disabled={isScanning}
            >
              <option value="single">
                Single Page
              </option>
              <option value="sitemap">
                Full Website
              </option>
            </select>

            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              {isScanning ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Scanning</span>
                </>
              ) : (
                <>
                  {scanType === 'sitemap' ? (
                    <Globe className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{scanResults ? 'Rescan' : 'Start scan'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {isScanning && (
          <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Eye className="h-6 w-6 animate-pulse text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Scan in progress</p>
                <p className="text-base font-semibold text-blue-900">
                  {scanProgress || 'Initializing enhanced scanner...'}
                </p>
                <p className="mt-2 text-xs font-semibold text-blue-700">
                  Pages scanned - {scanCounts.completed} / {scanCounts.total}
                </p>
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.max(5, progressPercent)}%` }}
              />
            </div>
          </div>
        )}

        {scanResults ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Accessibility Score</p>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{score}</p>
                {scoreDelta !== null && (
                  <p
                    className={`text-sm font-medium ${
                      scoreDelta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {scoreDelta >= 0 ? '+' : ''}
                    {scoreDelta} vs previous
                  </p>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Total Issues</p>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {currentSummary?.totalViolations || 0}
                </p>
                {totalDelta !== null && (
                  <p
                    className={`text-sm font-medium ${
                      totalDelta <= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {totalDelta > 0 ? '+' : ''}
                    {totalDelta} vs previous
                  </p>
                )}
                {(newIssues !== null || resolvedIssues !== null) && (
                  <div className="flex gap-4 text-xs text-gray-500">
                    {newIssues !== null && <span>New {newIssues}</span>}
                    {resolvedIssues !== null && <span>Resolved {resolvedIssues}</span>}
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">Coverage</p>
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pages scanned</span>
                    <span className="font-medium text-gray-900">{totalUrlsScanned}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Successful</span>
                    <span className="font-medium text-green-600">{successfulScans}</span>
                  </div>
                  {failedScans > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed</span>
                      <span className="font-medium text-red-600">{failedScans}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-600">Monitoring Profile</p>
              <p className="text-base font-semibold text-gray-900">
                {monitorFrequencyLabel(website?.monitoring?.frequency)}
              </p>
              <p className="text-sm text-gray-600">
                {nextScanDueLabel(website?.monitoring?.frequency, website?.lastScanned)}
              </p>
              {website?.monitoring?.autoStart && (
                <p className="text-xs text-green-600">
                  Auto-start enabled while app is open
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total URLs Scanned', value: totalUrlsScanned },
                { label: 'Successful Scans', value: successfulScans },
                { label: 'Failed Scans', value: failedScans }
              ].map(stat => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Critical Issues',
                  value: currentSummary?.criticalCount || 0,
                  bg: 'bg-red-50',
                  border: 'border-red-200',
                  text: 'text-red-800',
                  icon: AlertTriangle
                },
                {
                  label: 'Serious Issues',
                  value: currentSummary?.seriousCount || 0,
                  bg: 'bg-yellow-50',
                  border: 'border-yellow-200',
                  text: 'text-yellow-800',
                  icon: AlertTriangle
                },
                {
                  label: 'Moderate Issues',
                  value: currentSummary?.moderateCount || 0,
                  bg: 'bg-orange-50',
                  border: 'border-orange-200',
                  text: 'text-orange-800',
                  icon: AlertTriangle
                },
                {
                  label: 'Passed Rules',
                  value: currentSummary?.passedRules || 0,
                  bg: 'bg-green-50',
                  border: 'border-green-200',
                  text: 'text-green-800',
                  icon: CheckCircle
                }
              ].map(card => (
                <div
                  key={card.label}
                  className={`${card.bg} ${card.border} border rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">{card.label}</p>
                      <p className={`text-2xl font-bold mt-1 ${card.text}`}>{card.value}</p>
                    </div>
                    <card.icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'overview', label: 'Overview', count: null },
                  {
                    key: 'violations',
                    label: 'Violations',
                    count: currentSummary?.totalViolations || 0
                  },
                  {
                    key: 'passed',
                    label: 'Passed',
                    count: currentSummary?.passedRules || 0
                  }
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        activeTab === tab.key
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Issues by Severity</h4>
                    <div className="space-y-2">
                      {['critical', 'serious', 'moderate', 'minor'].map(level => (
                        <div
                          key={level}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="capitalize text-gray-600">{level}</span>
                          <span className="font-semibold text-gray-900">
                            {currentSummary?.[`${level}Count`] || 0}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Compliance Status</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Passed rules</span>
                        <span className="font-semibold text-green-600">
                          {currentSummary?.passedRules || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed rules</span>
                        <span className="font-semibold text-red-600">
                          {currentSummary?.totalViolations || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Incomplete</span>
                        <span className="font-semibold text-gray-600">
                          {currentSummary?.incompleteRules || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'violations' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="severity-filter" className="text-sm text-gray-700">
                      Filter by severity
                    </label>
                    <select
                      id="severity-filter"
                      value={selectedSeverity}
                      onChange={e => setSelectedSeverity(e.target.value)}
                      className="rounded-2xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">All issues</option>
                      <option value="critical">Critical</option>
                      <option value="serious">Serious</option>
                      <option value="moderate">Moderate</option>
                      <option value="minor">Minor</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    {getFilteredViolations().map(renderViolationCard)}
                  </div>

                  {getFilteredViolations().length === 0 && (
                    <div className="py-10 text-center text-gray-500">
                      <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                      No {selectedSeverity === 'all' ? '' : selectedSeverity} issues found
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'passed' && (
                <div className="space-y-4">
                  {(scanResults?.passed || []).map(rule => (
                    <div
                      key={rule.id}
                      className="border border-white/10 bg-white/5 rounded-2xl p-5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-emerald-300" />
                        <h4 className="font-semibold text-white">{rule.help}</h4>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{rule.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {(rule.tags || []).slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-3 py-1 rounded-full bg-emerald-500/10 text-xs text-emerald-100"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        {rule.helpUrl && (
                          <a
                            href={rule.helpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white"
                          >
                            Learn more
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : !isScanning ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-16 px-8 text-center shadow-sm">
            <Target className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-3 text-2xl font-semibold text-gray-900">No recent scans</h3>
            <p className="mx-auto mb-6 max-w-2xl text-gray-600">
              Kick off an accessibility sweep to capture live WCAG coverage, export
              remediation-ready reports, and benchmark this property.
            </p>
            <button
              onClick={handleStartScan}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <Play className="w-5 h-5" />
              Start accessibility scan
            </button>
          </div>
        ) : null}

        {showScanHistory && (
          <ScanHistory
            website={website}
            onSelectScan={scan => {
              onScanComplete(scan);
              setShowScanHistory(false);
            }}
            onDownloadReport={scan => {
              const currentResults = scanResults;
              onScanComplete(scan);
              setShowReportModal(true);
              // restore the current results after opening modal
              setTimeout(() => onScanComplete(currentResults), 100);
            }}
          />
        )}

        {!showScanHistory &&
          website?.scanHistory &&
          website.scanHistory.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
              {website.scanHistory.slice(0, 3).map((scan, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{format(new Date(scan.timestamp), 'PPp')}</span>
                    {scan.totalUrls && (
                      <span className="px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-xs">
                        {scan.totalUrls} URLs
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-red-600">
                      {scan.overallSummary?.criticalCount ||
                        scan.summary?.criticalCount ||
                        0}{' '}
                      critical
                    </span>
                    <span className="text-yellow-600">
                      {scan.overallSummary?.seriousCount ||
                        scan.summary?.seriousCount ||
                        0}{' '}
                      serious
                    </span>
                    <button
                      onClick={() => {
                        onScanComplete(scan);
                        toast.success('Loaded previous scan results');
                      }}
                      className="text-primary hover:text-primary-dark text-xs font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}

              {website.scanHistory.length > 3 && (
                <button
                  onClick={() => setShowScanHistory(true)}
                  className="w-full text-center text-sm text-gray-600 hover:text-gray-900 py-2"
                >
                  View all {website.scanHistory.length} scans
                </button>
              )}
            </div>
          )}

        {showReportModal && scanResults && (
          <EnhancedReportDownload
            scanResults={scanResults}
            website={website}
            onClose={() => setShowReportModal(false)}
          />
        )}
      </div>
    </>
  );
};

export default ScanResults;

