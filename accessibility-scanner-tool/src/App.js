import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Footer from './components/Footer';
import WebsiteList from './components/WebsiteList';
import ScanResults from './components/ScanResults';
import AddWebsiteModal from './components/AddWebsiteModal';
import { getStoredWebsites, saveWebsite, saveScanResult } from './utils/storage';

const getSummaryFromResult = (result = {}) => {
  return result.overallSummary || result.summary || {
    totalViolations: 0,
    totalElements: 0,
    passedRules: 0,
    incompleteRules: 0,
    criticalCount: 0,
    seriousCount: 0,
    moderateCount: 0,
    minorCount: 0
  };
};

const getScoreFromResult = (result = {}) => {
  const score = result.averageAccessibilityScore ?? result.accessibilityScore;
  return typeof score === 'number' ? score : 0;
};

const buildTrend = (currentResult, previousResult) => {
  if (!previousResult) return null;
  const currentSummary = getSummaryFromResult(currentResult);
  const previousSummary = getSummaryFromResult(previousResult);

  const collectIssues = (result) => {
    const issues = [
      ...(result.critical || []),
      ...(result.serious || []),
      ...(result.moderate || []),
      ...(result.minor || [])
    ];
    return new Set(issues.map(v => `${v.id}|${v.sourceUrl || result.url || ''}`));
  };

  const currentIssues = collectIssues(currentResult);
  const previousIssues = collectIssues(previousResult);

  const newIssues = [...currentIssues].filter(key => !previousIssues.has(key)).length;
  const resolvedIssues = [...previousIssues].filter(key => !currentIssues.has(key)).length;

  return {
    totalDelta: (currentSummary.totalViolations || 0) - (previousSummary.totalViolations || 0),
    criticalDelta: (currentSummary.criticalCount || 0) - (previousSummary.criticalCount || 0),
    seriousDelta: (currentSummary.seriousCount || 0) - (previousSummary.seriousCount || 0),
    scoreDelta: getScoreFromResult(currentResult) - getScoreFromResult(previousResult),
    newIssues,
    resolvedIssues,
    baselineTimestamp: previousResult.timestamp || null
  };
};

function App() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const loadWebsites = async () => {
      const stored = await getStoredWebsites();
      const normalized = stored.map(site => ({
        ...site,
        monitoring: site.monitoring || { frequency: 'weekly', autoStart: false }
      }));
      setWebsites(normalized);
    };

    loadWebsites();
  }, []);

  const handleAddWebsite = async (websiteData) => {
    const monitoring = websiteData.monitoring || { frequency: 'weekly', autoStart: false };
    const newWebsite = {
      id: Date.now().toString(),
      ...websiteData,
      createdAt: new Date().toISOString(),
      lastScanned: null,
      scanHistory: [],
      monitoring
    };
    
    const updatedWebsites = [...websites, newWebsite];
    setWebsites(updatedWebsites);
    await saveWebsite(newWebsite);
    setShowAddModal(false);
  };

  const handleSelectWebsite = (website) => {
    setSelectedWebsite(website);
    setScanResults(null);
  };

  const handleScanComplete = async (results) => {
    const previousScan = selectedWebsite.scanHistory?.[0];
    const enrichedResults = {
      ...results,
      trend: buildTrend(results, previousScan)
    };

    setScanResults(enrichedResults);
    setIsScanning(false);
    
    const updatedWebsite = {
      ...selectedWebsite,
      lastScanned: new Date().toISOString(),
      scanHistory: [enrichedResults, ...(selectedWebsite.scanHistory || []).slice(0, 19)] // Keep last 20 scans
    };
    
    const updatedWebsites = websites.map(w => 
      w.id === selectedWebsite.id ? updatedWebsite : w
    );
    setWebsites(updatedWebsites);
    setSelectedWebsite(updatedWebsite);

    // Persist scan result via API/SQLite
    await saveScanResult(selectedWebsite.id, enrichedResults);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex flex-col">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#ffffff',
            },
          },
        }}
      />
      
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {!selectedWebsite ? (
          <WebsiteList 
            websites={websites}
            onSelectWebsite={handleSelectWebsite}
            onAddWebsite={() => setShowAddModal(true)}
          />
        ) : (
          <ScanResults 
            website={selectedWebsite}
            scanResults={scanResults}
            isScanning={isScanning}
            onStartScan={setIsScanning}
            onScanComplete={handleScanComplete}
            onBack={() => setSelectedWebsite(null)}
          />
        )}
      </main>

      <Footer />

      {showAddModal && (
        <AddWebsiteModal 
          onClose={() => setShowAddModal(false)}
          onSave={handleAddWebsite}
        />
      )}
    </div>
  );
}

export default App;