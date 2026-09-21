# Accessibility Scanner Tool

A comprehensive web accessibility scanning tool that helps teams identify WCAG compliance issues across multiple websites. Built with React and Tailwind CSS.

## Features

- **Multi-Website Management**: Add and manage multiple websites for accessibility monitoring
- **WCAG Compliance Scanning**: Comprehensive scanning based on WCAG 2.1 AA/AAA standards using axe-core
- **Full Website Scanning**: Automatically discover and scan all URLs from website sitemaps
- **Single Page Scanning**: Test individual web pages for accessibility issues
- **Detailed Issue Reporting**: Categorizes issues by severity (Critical, Serious, Moderate, Minor)
- **Code Snippets & Fix Recommendations**: View exact HTML problems with specific fix suggestions
- **Interactive Dashboard**: Modern, responsive UI with expandable violation cards
- **Report Generation**: Download detailed PDF and CSV reports for different issue types
- **Scan History**: Track accessibility improvements over time with historical data
- **Real-time Scanning**: Live scanning progress with detailed status updates
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## Technology Stack

- **Frontend**: React 18, Tailwind CSS
- **Accessibility Engine**: axe-core 4.8+
- **Report Generation**: jsPDF, jsPDF-AutoTable
- **State Management**: React Hooks + localStorage
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Notifications**: React Hot Toast

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd accessibility-scanner-tool
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

### Adding Websites

1. Click the "Add Website" button on the dashboard
2. Enter the website name, URL, and optional description
3. The tool will validate the URL format
4. Click "Add Website" to save

### Running Scans

1. Select a website from the dashboard
2. Choose scan type:
   - **Single Page**: Scan just the homepage
   - **Full Website**: Automatically discover and scan all URLs from sitemap
3. Click "Start Scan" or "Rescan" button
4. Watch the real-time progress as the scan runs
5. Review results categorized by severity level

#### Full Website Scanning
The tool automatically:
- Discovers sitemap.xml files (checks common locations)
- Extracts all URLs from the sitemap
- Scans each page for accessibility issues
- Provides comprehensive website-wide reporting

### Viewing Results

The scan results display:

- **Overview Tab**: Summary statistics and quick insights
- **Violations Tab**: Detailed list of accessibility issues with:
  - Severity level (Critical, Serious, Moderate, Minor)
  - WCAG guideline references
  - Affected HTML elements with code snippets
  - Specific failure descriptions
  - Fix recommendations with suggested code changes
  - Links to remediation guides and WCAG documentation
- **Passed Tab**: Rules that passed compliance checks
- **Expandable Details**: Click "More" on any violation to see complete information
- **Multi-URL Results**: For full website scans, see results organized by page

### Generating Reports

1. After completing a scan, click "Download Reports"
2. Select report types:
   - **Complete Accessibility Report**: All issues found
   - **Critical Issues Report**: Only critical violations
   - **Serious Issues Report**: Only serious violations
   - **Executive Summary**: High-level statistics
3. Choose format (PDF or CSV)
4. Click download to generate and save reports

## WCAG Compliance Coverage

The tool scans for compliance with:

- **WCAG 2.1 Level A**: Basic accessibility requirements
- **WCAG 2.1 Level AA**: Standard accessibility requirements
- **Specific Rule Categories**:
  - Color and contrast
  - Keyboard navigation
  - Screen reader compatibility
  - Form accessibility
  - Image alternative text
  - Document structure
  - Focus management
  - Error identification

## Browser Compatibility

- **Supported Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Support**: Responsive design works on tablets and phones
- **JavaScript Required**: The application requires JavaScript to function

## Limitations

- **CORS Restrictions**: Some websites may block cross-origin scanning (demo data provided for testing)
- **Dynamic Content**: JavaScript-heavy sites may require additional load time
- **Authentication**: Cannot scan password-protected pages
- **Sitemap Discovery**: Relies on standard sitemap.xml locations and robots.txt
- **Large Websites**: Full website scans may take time for sites with many pages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### Common Issues

1. **"Failed to load website" error**:
   - Check if the URL is correct and accessible
   - Some sites block cross-origin requests (CORS)
   - Try adding `https://` prefix if missing

2. **Scan timeout**:
   - Website may be slow to load
   - Check network connectivity
   - Try scanning a simpler page first

3. **No issues found**:
   - Website may have good accessibility
   - Check if the page has sufficient content
   - Verify the URL loads correctly

### Development Issues

1. **Dependencies not installing**:
   ```bash
   npm cache clean --force
   npm install
   ```

2. **Tailwind styles not applying**:
   - Ensure `postcss.config.js` and `tailwind.config.js` are present
   - Restart the development server

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the WCAG documentation for accessibility guidelines

## Acknowledgments

- [axe-core](https://github.com/dequelabs/axe-core) for the accessibility testing engine
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) for accessibility standards
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling