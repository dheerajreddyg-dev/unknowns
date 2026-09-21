# Simple Website Testing

## Usage

Just provide a website name and get instant test results:

```bash
npm test tampax
npm test always
npm test whisper
npm test naturella
```

## Available Websites

- `tampax` - https://www.tampax.com
- `tampax.fr` - https://www.tampax.fr/fr-fr
- `tampax.uk` - https://tampax.co.uk/en-gb
- `tampax.eu` - https://www.tampax.eu
- `always` - https://www.always.com
- `always.de` - https://www.always.de
- `always.fr` - https://www.always.fr
- `always.uk` - https://www.always.co.uk
- `always.eu` - https://www.always.eu
- `alwayslatam` - https://www.alwayslatam.com
- `alwaysbrasil` - https://www.alwaysbrasil.com.br/pt-br
- `alwaysarabia` - https://alwaysarabia.com/en-sa
- `always-africa` - https://always-africa.com
- `alwaysdiscreet` - https://alwaysdiscreet.com
- `alwaysdiscreet.de` - https://www.alwaysdiscreet.de
- `alwaysdiscreet.fr` - https://www.alwaysdiscreet.fr
- `alwaysdiscreet.uk` - https://www.alwaysdiscreet.co.uk
- `alwaysdiscreet.au` - https://www.alwaysdiscreet.com.au
- `alwaysdiscreet.ca` - https://www.alwaysdiscreet.ca/fr-ca
- `naturella` - https://www.naturella.com.mx
- `evaxtampax` - https://www.evaxtampax.es
- `evaxtampax.pt` - https://www.evaxtampax.pt
- `ausonia` - https://www.ausonia.es/es-es
- `ausonia.pt` - https://www.ausonia.pt/pt-pt
- `ausonia.eu` - https://www.ausonia.eu
- `whisper` - https://www.whisper.jp
- `whisper.in` - https://whisper.co.in/en-in
- `mydziewczyny` - https://www.mydziewczyny.pl
- `thisisl` - https://www.thisisl.com

## Example Output

```
🚀 Testing tampax (https://www.tampax.com)
📅 Test Date: 11/18/2025, 4:52:15 PM
==================================================
📡 Loading website...
✅ Status: 200
✅ Load Time: 1250ms
✅ Title: Tampax Products | Feminine Care Products

🔍 Checking critical elements...
  ✅ header found
  ✅ nav found
  ✅ main found
  ✅ footer found

⚡ Performance metrics...
  ✅ DOM Content Loaded: 850ms
  ✅ Load Complete: 1200ms

📱 Mobile responsiveness...
  ✅ Mobile viewport configured

📸 Taking screenshot...
  ✅ Screenshot saved: test-results/screenshots/tampax-1700332335123.png

📊 TEST SUMMARY
==============================
Website: tampax
Status: ✅ PASS
Load Time: 1250ms ✅
Elements: 4/4 found
Mobile: ✅ Responsive

📄 Full report saved: test-results/reports/tampax-1700332335123.json
```

## What Gets Tested

- ✅ Website loads (HTTP status)
- ✅ Load time performance
- ✅ Critical elements (header, nav, main, footer)
- ✅ Page title
- ✅ Mobile responsiveness
- ✅ Screenshot capture
- ✅ JSON report generation

Reports and screenshots are saved in `test-results/` folder.
