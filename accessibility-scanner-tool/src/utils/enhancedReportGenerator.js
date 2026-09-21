import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import Papa from 'papaparse';

// Color scheme for reports
const COLORS = {
  primary: [37, 99, 235],      // Blue
  success: [34, 197, 94],      // Green
  warning: [245, 158, 11],     // Amber
  danger: [239, 68, 68],       // Red
  critical: [127, 29, 29],     // Dark Red
  serious: [234, 88, 12],      // Orange
  moderate: [202, 138, 4],     // Yellow
  minor: [107, 114, 128],      // Gray
  dark: [17, 24, 39],          // Near black
  light: [249, 250, 251],      // Near white
  border: [229, 231, 235]      // Light gray
};

// Get color for severity
const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return COLORS.critical;
    case 'serious': return COLORS.serious;
    case 'moderate': return COLORS.moderate;
    case 'minor': return COLORS.minor;
    default: return COLORS.dark;
  }
};

// Enhanced PDF Report Generator
export const generateEnhancedPDFReport = async (scanResults, website, reportType, options = {}) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let currentY = margin;
  let pageNumber = 1;
  
  // Helper: Add new page
  const addNewPage = () => {
    doc.addPage();
    pageNumber++;
    currentY = margin;
    return currentY;
  };
  
  // Helper: Check page break
  const checkPageBreak = (requiredSpace) => {
    if (currentY + requiredSpace > pageHeight - 25) {
      return addNewPage();
    }
    return currentY;
  };
  
  // Helper: Draw colored box
  const drawColoredBox = (x, y, width, height, color, borderRadius = 2) => {
    doc.setFillColor(...color);
    doc.roundedRect(x, y, width, height, borderRadius, borderRadius, 'F');
  };
  
  // ===== COVER PAGE =====
  const addCoverPage = () => {
    // Background header
    drawColoredBox(0, 0, pageWidth, 80, COLORS.primary);
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('Accessibility', margin, 35);
    doc.text('Scan Report', margin, 50);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const reportTitle = getReportTitle(reportType);
    doc.text(reportTitle, margin, 65);
    
    // Reset colors
    doc.setTextColor(...COLORS.dark);
    currentY = 100;
    
    // Website Info Card
    drawColoredBox(margin, currentY, contentWidth, 50, COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.roundedRect(margin, currentY, contentWidth, 50, 2, 2, 'S');
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Website Information', margin + 5, currentY + 10);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${website.name}`, margin + 5, currentY + 22);
    doc.text(`URL: ${website.url}`, margin + 5, currentY + 32);
    doc.text(`Scan Date: ${format(new Date(scanResults.timestamp), 'PPPP')}`, margin + 5, currentY + 42);
    
    currentY += 65;
    
    // Quick Stats
    const stats = getQuickStats(scanResults);
    const statWidth = (contentWidth - 15) / 4;
    
    stats.forEach((stat, index) => {
      const x = margin + (statWidth + 5) * index;
      drawColoredBox(x, currentY, statWidth, 35, stat.bgColor);
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...stat.textColor);
      doc.text(stat.value.toString(), x + statWidth / 2, currentY + 15, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(stat.label, x + statWidth / 2, currentY + 27, { align: 'center' });
    });
    
    doc.setTextColor(...COLORS.dark);
    currentY += 50;
    
    // Accessibility Score Circle
    const score = scanResults.averageAccessibilityScore ?? scanResults.accessibilityScore ?? 0;
    const scoreX = pageWidth / 2;
    const scoreY = currentY + 25;
    const scoreRadius = 20;
    
    // Score circle background
    doc.setFillColor(...getScoreColor(score));
    doc.circle(scoreX, scoreY, scoreRadius, 'F');
    
    // Score text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(score.toString(), scoreX, scoreY + 3, { align: 'center' });
    
    doc.setFontSize(8);
    doc.text('/100', scoreX, scoreY + 12, { align: 'center' });
    
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Accessibility Score', scoreX, scoreY + scoreRadius + 10, { align: 'center' });
    
    // Compliance status
    const compliance = scanResults.overallCompliance ?? scanResults.complianceLevel ?? 'unknown';
    doc.setFontSize(10);
    doc.text(`Compliance Status: ${formatComplianceStatus(compliance)}`, scoreX, scoreY + scoreRadius + 20, { align: 'center' });
    
    currentY += 80;
    
    // Report generated info
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.minor);
    doc.text('Report generated by Accessibility Scanner Tool', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'pp')}`, pageWidth / 2, pageHeight - 14, { align: 'center' });
    
    addNewPage();
  };
  
  // ===== TABLE OF CONTENTS =====
  const addTableOfContents = () => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, currentY);
    currentY += 15;
    
    const tocItems = [
      { title: 'Executive Summary', page: 3 },
      { title: 'Scan Overview', page: 3 },
      { title: 'Issues by Severity', page: 4 }
    ];
    
    if (reportType !== 'summary') {
      tocItems.push(
        { title: 'Critical Issues', page: 5 },
        { title: 'Serious Issues', page: 6 },
        { title: 'Moderate Issues', page: 7 },
        { title: 'Recommendations', page: 8 }
      );
    }
    
    tocItems.push({ title: 'Appendix: WCAG Guidelines', page: 9 });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    tocItems.forEach((item) => {
      doc.text(item.title, margin + 5, currentY);
      doc.text(item.page.toString(), pageWidth - margin - 5, currentY, { align: 'right' });
      
      // Dotted line
      const textWidth = doc.getTextWidth(item.title);
      const endX = pageWidth - margin - 15;
      for (let x = margin + 10 + textWidth; x < endX; x += 3) {
        doc.text('.', x, currentY);
      }
      
      currentY += 8;
    });
    
    addNewPage();
  };
  
  // ===== EXECUTIVE SUMMARY =====
  const addExecutiveSummary = () => {
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', margin, currentY);
    currentY += 12;
    
    const summary = scanResults.overallSummary || scanResults.summary || {};
    const isMultiUrl = scanResults.urlResults && scanResults.urlResults.length > 1;
    
    // Summary paragraph
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    const summaryText = generateSummaryText(scanResults, website);
    const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
    doc.text(splitSummary, margin, currentY);
    currentY += splitSummary.length * 5 + 10;
    
    // Key findings box
    drawColoredBox(margin, currentY, contentWidth, 8, COLORS.primary);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Findings', margin + 5, currentY + 6);
    doc.setTextColor(...COLORS.dark);
    currentY += 12;
    
    // Issues breakdown
    const issueTypes = [
      { label: 'Critical Issues', count: summary.criticalCount || 0, color: COLORS.critical, desc: 'Require immediate attention' },
      { label: 'Serious Issues', count: summary.seriousCount || 0, color: COLORS.serious, desc: 'Should be fixed soon' },
      { label: 'Moderate Issues', count: summary.moderateCount || 0, color: COLORS.moderate, desc: 'Medium priority' },
      { label: 'Minor Issues', count: summary.minorCount || 0, color: COLORS.minor, desc: 'Low priority improvements' }
    ];
    
    issueTypes.forEach((issue) => {
      checkPageBreak(15);
      
      // Color indicator
      drawColoredBox(margin + 5, currentY - 3, 4, 10, issue.color);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${issue.count}`, margin + 12, currentY + 3);
      
      doc.setFont('helvetica', 'normal');
      doc.text(issue.label, margin + 25, currentY + 3);
      
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.minor);
      doc.text(`- ${issue.desc}`, margin + 80, currentY + 3);
      doc.setTextColor(...COLORS.dark);
      
      currentY += 12;
    });
    
    currentY += 10;
    
    // Multi-URL summary if applicable
    if (isMultiUrl) {
      checkPageBreak(40);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('URL Scan Summary', margin, currentY);
      currentY += 8;
      
      const urlData = [
        ['Metric', 'Value'],
        ['Total URLs Scanned', scanResults.totalUrls?.toString() || '0'],
        ['Successful Scans', scanResults.successfulScans?.toString() || '0'],
        ['Failed Scans', scanResults.failedScans?.toString() || '0'],
        ['Average Score', `${scanResults.averageAccessibilityScore || 0}/100`]
      ];
      
      doc.autoTable({
        head: [urlData[0]],
        body: urlData.slice(1),
        startY: currentY,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
        margin: { left: margin, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    }
    
    // Common issues section
    if (scanResults.commonIssues && scanResults.commonIssues.length > 0) {
      checkPageBreak(60);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Most Common Issues', margin, currentY);
      currentY += 8;
      
      const commonData = scanResults.commonIssues.slice(0, 5).map((issue, index) => [
        (index + 1).toString(),
        issue.help || issue.id,
        issue.severity?.toUpperCase() || 'N/A',
        issue.count.toString(),
        issue.pages?.toString() || '1'
      ]);
      
      doc.autoTable({
        head: [['#', 'Issue', 'Severity', 'Occurrences', 'Pages Affected']],
        body: commonData,
        startY: currentY,
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: COLORS.primary, textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 80 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        },
        margin: { left: margin, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;
    }
  };
  
  // ===== DETAILED VIOLATIONS =====
  const addDetailedViolations = (violations, title, severityColor) => {
    if (!violations || violations.length === 0) return;
    
    checkPageBreak(30);
    
    // Section header
    drawColoredBox(margin, currentY, contentWidth, 10, severityColor);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${title} (${violations.length})`, margin + 5, currentY + 7);
    doc.setTextColor(...COLORS.dark);
    currentY += 15;
    
    violations.forEach((violation, index) => {
      checkPageBreak(80);
      
      // Violation header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${violation.help || violation.id}`, margin, currentY);
      currentY += 6;
      
      // Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(violation.description || '', contentWidth - 10);
      doc.text(descLines, margin + 5, currentY);
      currentY += descLines.length * 4 + 5;
      
      // Details table
      const detailsData = [
        ['Rule ID', violation.id],
        ['Severity', (violation.severity || violation.impact || 'unknown').toUpperCase()],
        ['Elements Affected', (violation.nodes?.length || violation.nodeCount || 0).toString()],
        ['WCAG Criteria', (violation.wcagCriteria || extractWcagFromTags(violation.tags))?.join(', ') || 'N/A']
      ];
      
      if (violation.sourceUrl) {
        detailsData.push(['Source URL', violation.sourceUrl]);
      }
      
      doc.autoTable({
        body: detailsData,
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35 },
          1: { cellWidth: contentWidth - 45 }
        },
        margin: { left: margin + 5, right: margin }
      });
      
      currentY = doc.lastAutoTable.finalY + 5;
      
      // Recommendation
      if (violation.recommendation) {
        checkPageBreak(40);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.success);
        doc.text('How to Fix:', margin + 5, currentY);
        doc.setTextColor(...COLORS.dark);
        currentY += 5;
        
        doc.setFont('helvetica', 'normal');
        const recText = violation.recommendation.recommendation || violation.recommendation;
        const recLines = doc.splitTextToSize(recText, contentWidth - 15);
        doc.text(recLines, margin + 10, currentY);
        currentY += recLines.length * 4 + 5;
      }
      
      // Code example (limited)
      if (violation.recommendation?.suggestedCode) {
        checkPageBreak(30);
        
        const codeLines = violation.recommendation.suggestedCode.split('\n').slice(0, 6);
        
        doc.setFillColor(...COLORS.light);
        const codeHeight = codeLines.length * 4 + 6;
        doc.rect(margin + 5, currentY, contentWidth - 10, codeHeight, 'F');
        
        doc.setFontSize(8);
        doc.setFont('courier', 'normal');
        codeLines.forEach((line, i) => {
          const truncatedLine = line.length > 80 ? line.substring(0, 77) + '...' : line;
          doc.text(truncatedLine, margin + 8, currentY + 5 + i * 4);
        });
        
        currentY += codeHeight + 5;
      }
      
      // Affected elements (first 3)
      if (violation.nodes && violation.nodes.length > 0) {
        checkPageBreak(25);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Affected Elements:', margin + 5, currentY);
        currentY += 5;
        
        doc.setFont('helvetica', 'normal');
        violation.nodes.slice(0, 3).forEach((node) => {
          checkPageBreak(15);
          
          const selector = Array.isArray(node.target) ? node.target.join(' > ') : node.target;
          const selectorLines = doc.splitTextToSize(`• ${selector}`, contentWidth - 15);
          doc.text(selectorLines, margin + 10, currentY);
          currentY += selectorLines.length * 4 + 2;
        });
        
        if (violation.nodes.length > 3) {
          doc.setTextColor(...COLORS.minor);
          doc.text(`... and ${violation.nodes.length - 3} more elements`, margin + 10, currentY);
          doc.setTextColor(...COLORS.dark);
          currentY += 5;
        }
      }
      
      // Help link
      if (violation.helpUrl) {
        doc.setFontSize(8);
        doc.setTextColor(...COLORS.primary);
        doc.textWithLink('Learn more →', margin + 5, currentY, { url: violation.helpUrl });
        doc.setTextColor(...COLORS.dark);
        currentY += 8;
      }
      
      // Separator
      currentY += 5;
      doc.setDrawColor(...COLORS.border);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
    });
  };
  
  // ===== RECOMMENDATIONS SECTION =====
  const addRecommendations = () => {
    checkPageBreak(50);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Remediation Recommendations', margin, currentY);
    currentY += 12;
    
    const recommendations = [
      {
        priority: 'Immediate',
        color: COLORS.critical,
        items: [
          'Address all critical accessibility issues first',
          'Fix missing alt text on images',
          'Add labels to all form inputs',
          'Ensure keyboard navigation works throughout'
        ]
      },
      {
        priority: 'Short-term',
        color: COLORS.serious,
        items: [
          'Fix color contrast issues',
          'Add proper heading hierarchy',
          'Implement skip navigation links',
          'Add ARIA labels where needed'
        ]
      },
      {
        priority: 'Long-term',
        color: COLORS.moderate,
        items: [
          'Conduct regular accessibility audits',
          'Train development team on WCAG guidelines',
          'Implement accessibility testing in CI/CD',
          'Create accessibility design guidelines'
        ]
      }
    ];
    
    recommendations.forEach((rec) => {
      checkPageBreak(40);
      
      drawColoredBox(margin, currentY, 4, 25, rec.color);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${rec.priority} Actions`, margin + 8, currentY + 5);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      rec.items.forEach((item, i) => {
        doc.text(`• ${item}`, margin + 10, currentY + 12 + i * 5);
      });
      
      currentY += 35;
    });
  };
  
  // ===== FOOTER =====
  const addFooter = () => {
    const totalPages = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Footer line
      doc.setDrawColor(...COLORS.border);
      doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
      
      // Page number
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.minor);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
      
      // Generated by
      doc.text('Accessibility Scanner Tool', margin, pageHeight - 8);
      doc.text(format(new Date(), 'PP'), pageWidth - margin, pageHeight - 8, { align: 'right' });
    }
  };
  
  // ===== BUILD REPORT =====
  addCoverPage();
  
  if (options.includeTableOfContents !== false) {
    addTableOfContents();
  }
  
  addExecutiveSummary();
  
  if (reportType !== 'summary') {
    const allViolations = collectViolations(scanResults, reportType);
    
    if (allViolations.critical.length > 0) {
      addDetailedViolations(allViolations.critical, 'Critical Issues', COLORS.critical);
    }
    
    if (reportType === 'all-issues' || reportType === 'serious') {
      if (allViolations.serious.length > 0) {
        addDetailedViolations(allViolations.serious, 'Serious Issues', COLORS.serious);
      }
    }
    
    if (reportType === 'all-issues') {
      if (allViolations.moderate.length > 0) {
        addDetailedViolations(allViolations.moderate, 'Moderate Issues', COLORS.moderate);
      }
      if (allViolations.minor.length > 0) {
        addDetailedViolations(allViolations.minor, 'Minor Issues', COLORS.minor);
      }
    }
    
    addRecommendations();
  }
  
  addFooter();
  
  // Save PDF
  const fileName = generateFileName(website.name, reportType, 'pdf');
  doc.save(fileName);
  
  return fileName;
};

// ===== ENHANCED CSV REPORT =====
export const generateEnhancedCSVReport = async (scanResults, website, reportType) => {
  const violations = collectViolations(scanResults, reportType);
  const allViolations = [
    ...violations.critical,
    ...violations.serious,
    ...violations.moderate,
    ...violations.minor
  ];
  
  // Flatten data for CSV
  const rows = [];
  
  allViolations.forEach((violation) => {
    violation.nodes?.forEach((node, nodeIndex) => {
      rows.push({
        'Scan Date': format(new Date(scanResults.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        'Website': website.name,
        'Page URL': violation.sourceUrl || scanResults.url || website.url,
        'Rule ID': violation.id,
        'Issue Title': violation.help,
        'Description': violation.description,
        'Severity': (violation.severity || violation.impact || 'unknown').toUpperCase(),
        'Impact': violation.impact || violation.severity,
        'WCAG Criteria': (violation.wcagCriteria || extractWcagFromTags(violation.tags))?.join('; ') || '',
        'Element Index': nodeIndex + 1,
        'Total Elements': violation.nodes?.length || 1,
        'Element Selector': Array.isArray(node.target) ? node.target.join(' > ') : node.target,
        'HTML Snippet': cleanForCSV(node.html || node.snippet || ''),
        'Failure Summary': cleanForCSV(node.failureSummary || ''),
        'Recommendation': cleanForCSV(violation.recommendation?.recommendation || ''),
        'WCAG Level': violation.recommendation?.wcagLevel || extractWcagLevel(violation.tags) || '',
        'Priority': violation.recommendation?.priority || getPriorityFromSeverity(violation.severity),
        'Effort to Fix': violation.recommendation?.effort || 'medium',
        'Help URL': violation.helpUrl || ''
      });
    });
  });
  
  // Add summary row
  const summary = scanResults.overallSummary || scanResults.summary || {};
  
  // Generate CSV
  const csv = Papa.unparse(rows, {
    quotes: true,
    quoteChar: '"',
    escapeChar: '"',
    header: true
  });
  
  // Add BOM for Excel compatibility
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;
  
  // Download
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', generateFileName(website.name, reportType, 'csv'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return generateFileName(website.name, reportType, 'csv');
};

// ===== JSON REPORT =====
export const generateEnhancedJSONReport = async (scanResults, website, reportType) => {
  const violations = collectViolations(scanResults, reportType);
  
  const report = {
    meta: {
      generatedAt: new Date().toISOString(),
      generatedBy: 'Accessibility Scanner Tool',
      reportType: reportType,
      version: '2.0'
    },
    website: {
      name: website.name,
      url: website.url,
      description: website.description || ''
    },
    scan: {
      timestamp: scanResults.timestamp,
      duration: scanResults.scanDuration || null,
      accessibilityScore: scanResults.averageAccessibilityScore ?? scanResults.accessibilityScore ?? null,
      complianceLevel: scanResults.overallCompliance ?? scanResults.complianceLevel ?? 'unknown'
    },
    summary: {
      totalUrls: scanResults.totalUrls || 1,
      successfulScans: scanResults.successfulScans || 1,
      failedScans: scanResults.failedScans || 0,
      totalViolations: (scanResults.overallSummary || scanResults.summary)?.totalViolations || 0,
      totalElements: (scanResults.overallSummary || scanResults.summary)?.totalElements || 0,
      passedRules: (scanResults.overallSummary || scanResults.summary)?.passedRules || 0,
      breakdown: {
        critical: violations.critical.length,
        serious: violations.serious.length,
        moderate: violations.moderate.length,
        minor: violations.minor.length
      }
    },
    violations: {
      critical: violations.critical,
      serious: violations.serious,
      moderate: violations.moderate,
      minor: violations.minor
    },
    commonIssues: scanResults.commonIssues || [],
    urlResults: scanResults.urlResults || null
  };
  
  const jsonString = JSON.stringify(report, null, 2);
  
  const blob = new Blob([jsonString], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', generateFileName(website.name, reportType, 'json'));
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return generateFileName(website.name, reportType, 'json');
};

// ===== HELPER FUNCTIONS =====

const getReportTitle = (reportType) => {
  const titles = {
    'all-issues': 'Complete Accessibility Report',
    'critical': 'Critical Issues Report',
    'serious': 'Serious Issues Report',
    'summary': 'Executive Summary Report'
  };
  return titles[reportType] || 'Accessibility Report';
};

const getQuickStats = (scanResults) => {
  const summary = scanResults.overallSummary || scanResults.summary || {};
  return [
    { label: 'Critical', value: summary.criticalCount || 0, bgColor: COLORS.critical, textColor: [255, 255, 255] },
    { label: 'Serious', value: summary.seriousCount || 0, bgColor: COLORS.serious, textColor: [255, 255, 255] },
    { label: 'Moderate', value: summary.moderateCount || 0, bgColor: COLORS.moderate, textColor: [255, 255, 255] },
    { label: 'Passed', value: summary.passedRules || 0, bgColor: COLORS.success, textColor: [255, 255, 255] }
  ];
};

const getScoreColor = (score) => {
  if (score >= 90) return COLORS.success;
  if (score >= 70) return COLORS.moderate;
  if (score >= 50) return COLORS.serious;
  return COLORS.critical;
};

const formatComplianceStatus = (status) => {
  const statusMap = {
    'compliant': 'Fully Compliant',
    'mostly-compliant': 'Mostly Compliant',
    'partial': 'Partially Compliant',
    'non-compliant': 'Non-Compliant',
    'unknown': 'Unknown'
  };
  return statusMap[status] || status;
};

const generateSummaryText = (scanResults, website) => {
  const summary = scanResults.overallSummary || scanResults.summary || {};
  const total = summary.totalViolations || 0;
  const critical = summary.criticalCount || 0;
  const serious = summary.seriousCount || 0;
  const score = scanResults.averageAccessibilityScore ?? scanResults.accessibilityScore ?? 0;
  
  if (total === 0) {
    return `Congratulations! The accessibility scan of ${website.name} found no violations. The website appears to be compliant with WCAG 2.1 Level AA guidelines based on automated testing. Manual testing is still recommended for complete accessibility verification.`;
  }
  
  return `The accessibility scan of ${website.name} identified ${total} accessibility issue${total > 1 ? 's' : ''} across the tested page${scanResults.totalUrls > 1 ? 's' : ''}. ${critical > 0 ? `${critical} critical issue${critical > 1 ? 's require' : ' requires'} immediate attention. ` : ''}${serious > 0 ? `${serious} serious issue${serious > 1 ? 's should' : ' should'} be addressed soon. ` : ''}The overall accessibility score is ${score}/100. This report provides detailed findings and recommendations for remediation.`;
};

const collectViolations = (scanResults, reportType) => {
  let critical = [];
  let serious = [];
  let moderate = [];
  let minor = [];
  
  if (scanResults.urlResults && scanResults.urlResults.length > 0) {
    // Multi-URL results
    scanResults.urlResults.forEach((result) => {
      if (result.error) return;
      
      critical.push(...(result.critical || []).map(v => ({ ...v, sourceUrl: result.url })));
      serious.push(...(result.serious || []).map(v => ({ ...v, sourceUrl: result.url })));
      moderate.push(...(result.moderate || []).map(v => ({ ...v, sourceUrl: result.url })));
      minor.push(...(result.minor || []).map(v => ({ ...v, sourceUrl: result.url })));
    });
  } else {
    // Single URL results
    critical = scanResults.critical || [];
    serious = scanResults.serious || [];
    moderate = scanResults.moderate || [];
    minor = scanResults.minor || [];
  }
  
  // Filter by report type
  switch (reportType) {
    case 'critical':
      return { critical, serious: [], moderate: [], minor: [] };
    case 'serious':
      return { critical, serious, moderate: [], minor: [] };
    case 'summary':
      return { critical: [], serious: [], moderate: [], minor: [] };
    default:
      return { critical, serious, moderate, minor };
  }
};

const extractWcagFromTags = (tags) => {
  if (!tags) return [];
  return tags
    .filter(t => t.startsWith('wcag'))
    .map(t => {
      const match = t.match(/wcag(\d)(\d)(\d+)/);
      if (match) return `${match[1]}.${match[2]}.${match[3]}`;
      return t;
    });
};

const extractWcagLevel = (tags) => {
  if (!tags) return 'A';
  if (tags.some(t => t.includes('aaa'))) return 'AAA';
  if (tags.some(t => t.includes('aa'))) return 'AA';
  return 'A';
};

const getPriorityFromSeverity = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 1;
    case 'serious': return 2;
    case 'moderate': return 3;
    case 'minor': return 4;
    default: return 3;
  }
};

const cleanForCSV = (text) => {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 500);
};

const generateFileName = (websiteName, reportType, extension) => {
  const cleanName = websiteName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const dateStr = format(new Date(), 'yyyy-MM-dd');
  return `accessibility-${reportType}-${cleanName}-${dateStr}.${extension}`;
};

// Export old function names for backward compatibility
export const generatePDFReport = generateEnhancedPDFReport;
export const generateCSVReport = generateEnhancedCSVReport;
export const generateJSONReport = generateEnhancedJSONReport;
