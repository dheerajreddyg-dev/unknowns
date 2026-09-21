import React, { useState } from 'react';
import { Clock, FileText, Download, Eye, CheckCircle, Globe, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

const ScanHistory = ({ website, onSelectScan, onDownloadReport }) => {
  const [expandedScan, setExpandedScan] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const scanHistory = website.scanHistory || [];

  // Filter and sort scan history
  const filteredHistory = scanHistory
    .filter(scan => {
      if (filterSeverity === 'all') return true;
      if (filterSeverity === 'issues') return scan.summary.totalViolations > 0;
      if (filterSeverity === 'clean') return scan.summary.totalViolations === 0;
      return false;
    })
    .filter(scan => {
      if (!searchQuery) return true;
      return scan.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
             scan.urlResults?.some(result => 
               result.url?.toLowerCase().includes(searchQuery.toLowerCase())
             );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp);
        case 'issues':
          return b.summary.totalViolations - a.summary.totalViolations;
        case 'critical':
          return b.summary.criticalCount - a.summary.criticalCount;
        default:
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

  const getSeverityBadge = (count, type) => {
    if (count === 0) return null;
    
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      serious: 'bg-orange-100 text-orange-800 border-orange-200',
      moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      minor: 'bg-green-100 text-green-800 border-green-200'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colors[type]}`}>
        {count} {type}
      </span>
    );
  };

  const renderScanSummary = (scan) => {
    const isMultiUrl = scan.urlResults && scan.urlResults.length > 1;
    const summary = isMultiUrl ? scan.overallSummary : scan.summary;

    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {format(new Date(scan.timestamp), 'PPp')}
                </span>
                <span className="text-xs text-gray-400">
                  ({formatDistanceToNow(new Date(scan.timestamp))} ago)
                </span>
              </div>
              
              {isMultiUrl ? (
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Full Website Scan - {scan.totalUrls} URLs
                  </span>
                  <span className="text-sm text-gray-600">
                    ({scan.successfulScans} successful, {scan.failedScans} failed)
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">Single Page Scan</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onSelectScan(scan)}
                className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </button>
              
              <button
                onClick={() => onDownloadReport(scan)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => setExpandedScan(expandedScan === scan.timestamp ? null : scan.timestamp)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-700"
              >
                {expandedScan === scan.timestamp ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summary.totalViolations}</div>
              <div className="text-xs text-gray-600">Total Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.criticalCount}</div>
              <div className="text-xs text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.seriousCount}</div>
              <div className="text-xs text-gray-600">Serious</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.moderateCount}</div>
              <div className="text-xs text-gray-600">Moderate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.passedRules}</div>
              <div className="text-xs text-gray-600">Passed</div>
            </div>
          </div>

          {/* Issue Badges */}
          <div className="flex flex-wrap gap-2">
            {getSeverityBadge(summary.criticalCount, 'critical')}
            {getSeverityBadge(summary.seriousCount, 'serious')}
            {getSeverityBadge(summary.moderateCount, 'moderate')}
            {getSeverityBadge(summary.minorCount, 'minor')}
            {summary.totalViolations === 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                <CheckCircle className="w-4 h-4 mr-1" />
                No Issues Found
              </span>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expandedScan === scan.timestamp && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            {isMultiUrl ? (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 mb-3">URLs Scanned:</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {scan.urlResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.url}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-1">Error: {result.error}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <div className="flex space-x-2">
                          {result.summary?.criticalCount > 0 && (
                            <span className="text-xs text-red-600 font-medium">
                              {result.summary.criticalCount}C
                            </span>
                          )}
                          {result.summary?.seriousCount > 0 && (
                            <span className="text-xs text-orange-600 font-medium">
                              {result.summary.seriousCount}S
                            </span>
                          )}
                          {result.summary?.totalViolations === 0 && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Scan Details:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">URL:</span>
                    <p className="font-medium text-gray-900 break-all">{scan.url}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Elements Checked:</span>
                    <p className="font-medium text-gray-900">{scan.summary.totalElements}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Incomplete Tests:</span>
                    <p className="font-medium text-gray-900">{scan.summary.incompleteRules}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (scanHistory.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Scan History</h3>
        <p className="text-gray-600">
          No previous scans found for this website. Start a new scan to begin tracking accessibility issues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Scan History</h3>
          <p className="text-sm text-gray-600">
            {scanHistory.length} previous scan{scanHistory.length !== 1 ? 's' : ''} for {website.name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search scans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Scans</option>
                <option value="issues">With Issues</option>
                <option value="clean">Clean Scans</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="date">Date</option>
              <option value="issues">Total Issues</option>
              <option value="critical">Critical Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-600">No scans match your current filters.</p>
          </div>
        ) : (
          filteredHistory.map((scan) => (
            <div key={scan.timestamp}>
              {renderScanSummary(scan)}
            </div>
          ))
        )}
      </div>

      {filteredHistory.length > 0 && (
        <div className="text-center text-sm text-gray-600">
          Showing {filteredHistory.length} of {scanHistory.length} scans
        </div>
      )}
    </div>
  );
};

export default ScanHistory;