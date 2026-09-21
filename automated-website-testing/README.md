# Website Testing & Accessibility Analysis Tool

## Quick Website Testing

Test any production website instantly:

```bash
npm test tampax
npm test always
npm test whisper
```

## Accessibility Analysis (NEW!)

Extract comprehensive accessibility data from sitemaps and generate Excel reports:

```bash
npm run analyze tampax
npm run analyze always
npm run analyze whisper
```

## Features

### Basic Website Testing
- ✅ Website loads successfully
- ✅ Load time performance  
- ✅ Critical elements present
- ✅ Mobile responsiveness
- ✅ Screenshot capture
- ✅ JSON report generation

### Accessibility Analysis
- 🗺️ **Loads URLs from sitemap.xml automatically**
- 🖼️ **Extracts all images** (src, alt, width/height, role, aria-*)
- 🔗 **Extracts all links** (href, innerText, rel, target, aria-*, computed name)
- ⚡ **Finds interactive elements** (buttons, inputs, role-bearing elements)
- 🧠 **Implements accessible name algorithm**:
  - `aria-label` → `aria-labelledby` → `alt` → `innerText` → `title`
- 📊 **Generates .xlsx file** with complete accessibility audit

## Available Websites

- `tampax`, `tampax.fr`, `tampax.uk`, `tampax.eu`
- `always`, `always.de`, `always.fr`, `always.uk`, `always.eu`
- `alwaysdiscreet`, `alwaysdiscreet.de`, `alwaysdiscreet.fr`
- `naturella`, `evaxtampax`, `ausonia`, `whisper`
- `mydziewczyny`, `thisisl`
- And all other production sites

## Excel Report Columns

1. **Type** - image, link, or interactive
2. **Page URL** - Source page URL
3. **Image Source** - Absolute image URL
4. **Alt Text** - Image alt attribute
5. **Link** - Absolute link URL  
6. **ARIA Label** - aria-label attribute
7. **Computed Name** - Calculated accessible name
8. **Role** - Element role
9. **Dimensions** - Width/height for images
10. **Additional ARIA** - labelledby, describedby attributes

## Results

- Basic Tests: `test-results/screenshots/`, `test-results/reports/`
- Accessibility: `test-results/accessibility-audit-{website}-{timestamp}.xlsx`
