import React, { useState } from 'react';
import { X, Download, FileText, Table, AlertTriangle, FileJson, CheckCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { generateEnhancedPDFReport, generateEnhancedCSVReport, generateEnhancedJSONReport } from '../utils/enhancedReportGenerator';
import toast from 'react-hot-toast';

const EnhancedReportDownload = ({ scanResults, website, onClose }) => {
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [options, setOptions] = useState({
    includeTableOfContents: true,
    includeCodeExamples: true,
    includeRecommendations: true,
    maxElementsPerIssue: 5
  });

  // Get summary data safely
  const summary = scanResults?.overallSummary || scanResults?.summary || {};
  const accessibilityScore = scanResults?.averageAccessibilityScore ?? scanResults?.accessibilityScore ?? 0;
  const complianceLevel = scanResults?.overallCompliance ?? scanResults?.complianceLevel ?? 'unknown';

  const reportOptions = [
    {
      id: 'all-issues',
      title: 'Complete Report',
      description: 'All accessibility issues with full details',
      icon: FileText,
      color: 'blue',
      count: summary.totalViolations || 0,
      recommended: true
    },
    {
      id: 'critical',
      title: 'Critical Issues Only',
      description: 'Issues requiring immediate attention',
      icon: AlertTriangle,
      color: 'red',
      count: summary.criticalCount || 0
    },
    {
      id: 'serious',
      title: 'Critical + Serious Issues',
      description: 'High priority issues to fix first',
      icon: AlertTriangle,
      color: 'orange',
      count: (summary.criticalCount || 0) + (summary.seriousCount || 0)
    },
    {
      id: 'summary',
      title: 'Executive Summary',
      description: 'High-level overview for stakeholders',
      icon: Table,
      color: 'green',
      count: 1
    }
  ];

  const formatOptions = [
    { id: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted report with charts and styling' },
    { id: 'csv', label: 'CSV', icon: Table, description: 'Spreadsheet format for data analysis' },
    { id: 'json', label: 'JSON', icon: FileJson, description: 'Machine-readable structured data' }
  ];

  const handleReportToggle = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleDownload = async () => {
    if (selectedReports.length === 0) {
      toast.error('Please select at least one report type');
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading('Generating reports...');
    
    try {
      const generatedFiles = [];
      
      for (const reportType of selectedReports) {
        let fileName;
        
        switch (selectedFormat) {
          case 'pdf':
            fileName = await generateEnhancedPDFReport(scanResults, website, reportType, options);
            break;
          case 'csv':
            fileName = await generateEnhancedCSVReport(scanResults, website, reportType);
            break;
          case 'json':
            fileName = await generateEnhancedJSONReport(scanResults, website, reportType);
            break;
          default:
            fileName = await generateEnhancedPDFReport(scanResults, website, reportType, options);
        }
        
        generatedFiles.push(fileName);
      }
      
      toast.success(`${generatedFiles.length} report${generatedFiles.length > 1 ? 's' : ''} generated successfully!`, { id: toastId });
      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(`Failed to generate reports: ${error.message}`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const getColorClasses = (color, selected) => {
    const baseClasses = 'border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 relative';
    
    if (selected) {
      switch (color) {
        case 'blue': return `${baseClasses} border-blue-500 bg-blue-50 ring-2 ring-blue-200`;
        case 'red': return `${baseClasses} border-red-500 bg-red-50 ring-2 ring-red-200`;
        case 'orange': return `${baseClasses} border-orange-500 bg-orange-50 ring-2 ring-orange-200`;
        case 'green': return `${baseClasses} border-green-500 bg-green-50 ring-2 ring-green-200`;
        default: return `${baseClasses} border-gray-500 bg-gray-50`;
      }
    }
    
    return `${baseClasses} border-gray-200 hover:border-gray-300 hover:bg-gray-50`;
  };

  const getIconColor = (color, selected) => {
    if (!selected) return 'text-gray-400';
    
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'red': return 'text-red-600';
      case 'orange': return 'text-orange-600';
      case 'green': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    if (score >= 50) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getComplianceColor = (level) => {
    switch (level) {
      case 'compliant': return 'text-green-700 bg-green-100';
      case 'mostly-compliant': return 'text-blue-700 bg-blue-100';
      case 'partial': return 'text-yellow-700 bg-yellow-100';
      case 'non-compliant': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const formatComplianceLabel = (level) => {
    const labels = {
      'compliant': 'Fully Compliant',
      'mostly-compliant': 'Mostly Compliant',
      'partial': 'Partially Compliant',
      'non-compliant': 'Non-Compliant',
      'unknown': 'Unknown'
    };
    return labels[level] || level;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6 animate-fade-in">
      <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Download Reports</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate accessibility reports for {website.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5 scrollbar-hide">
          {/* Scan Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{summary.totalViolations || 0}</div>
              <div className="text-sm text-blue-600">Total Issues</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{summary.passedRules || 0}</div>
              <div className="text-sm text-green-600">Passed Rules</div>
            </div>
            <div className={`rounded-lg p-4 ${getScoreColor(accessibilityScore)}`}>
              <div className="text-2xl font-bold">{accessibilityScore}/100</div>
              <div className="text-sm">Accessibility Score</div>
            </div>
            <div className={`rounded-lg p-4 ${getComplianceColor(complianceLevel)}`}>
              <div className="text-lg font-bold">{formatComplianceLabel(complianceLevel)}</div>
              <div className="text-sm">Compliance Status</div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <span>Select Report Types</span>
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({selectedReports.length} selected)
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {reportOptions.map((option) => {
                const isSelected = selectedReports.includes(option.id);
                const Icon = option.icon;
                
                return (
                  <div
                    key={option.id}
                    className={getColorClasses(option.color, isSelected)}
                    onClick={() => handleReportToggle(option.id)}
                  >
                    {option.recommended && (
                      <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                        Recommended
                      </span>
                    )}
                    
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <Icon className={`w-5 h-5 ${getIconColor(option.color, isSelected)}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">{option.title}</h4>
                        <p className="text-sm text-gray-600 mt-0.5">{option.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-medium text-gray-700">
                            {option.count} {option.id === 'summary' ? 'page' : 'issues'}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Format</h3>
            <div className="flex flex-wrap gap-3">
              {formatOptions.map((format) => {
                const Icon = format.icon;
                const isSelected = selectedFormat === format.id;
                
                return (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-gray-500">{format.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Options (PDF only) */}
          {selectedFormat === 'pdf' && (
            <div>
              <button
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                {showAdvancedOptions ? (
                  <ChevronUp className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                Advanced Options
              </button>
              
              {showAdvancedOptions && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.includeTableOfContents}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeTableOfContents: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include Table of Contents</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.includeCodeExamples}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeCodeExamples: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include Code Examples</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={options.includeRecommendations}
                      onChange={(e) => setOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include Recommendations Section</span>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Scan Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Info className="w-4 h-4 mr-2 text-gray-500" />
              Scan Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Website</span>
                <span className="font-medium text-gray-900 truncate block">{website.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Scanned</span>
                <span className="font-medium text-gray-900">
                  {scanResults.timestamp ? new Date(scanResults.timestamp).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">URLs Scanned</span>
                <span className="font-medium text-gray-900">{scanResults.totalUrls || 1}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Duration</span>
                <span className="font-medium text-gray-900">
                  {scanResults.scanDuration ? `${Math.round(scanResults.scanDuration / 1000)}s` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Issue Breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <span className="text-gray-500 text-sm block mb-2">Issue Breakdown</span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-red-600 mr-2"></span>
                  <span className="text-sm">{summary.criticalCount || 0} Critical</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                  <span className="text-sm">{summary.seriousCount || 0} Serious</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span>
                  <span className="text-sm">{summary.moderateCount || 0} Moderate</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                  <span className="text-sm">{summary.minorCount || 0} Minor</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:items-center">
          <div className="text-sm text-gray-600">
            {selectedReports.length > 0 ? (
              <span>
                Generating {selectedReports.length} {selectedFormat.toUpperCase()} report{selectedReports.length > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-yellow-600">Select at least one report type</span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              Cancel
            </button>

            <button
              onClick={handleDownload}
              disabled={selectedReports.length === 0 || isGenerating}
              className="inline-flex w-full items-center justify-center space-x-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedReportDownload;
