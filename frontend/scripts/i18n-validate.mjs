import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const localesDir = fileURLToPath(new URL('../src/content/locales/', import.meta.url));
const enDir = join(localesDir, 'en');
const trDir = join(localesDir, 'tr');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enFiles = readdirSync(enDir).filter(f => f.endsWith('.json') && f !== 'ui.json');
let hasMismatch = false;
const report = [];

let legalAudit = null;

for (const file of enFiles) {
  const enContent = JSON.parse(readFileSync(join(enDir, file), 'utf8'));
  let trContent = {};
  try {
    trContent = JSON.parse(readFileSync(join(trDir, file), 'utf8'));
  } catch {
    report.push(`[MISSING_FILE] Turkish locale file missing: ${file}`);
    hasMismatch = true;
    continue;
  }

  if (file === 'legal.json') {
    // Distinguish UI chrome keys from canonical legal body keys
    const enUiChromeKeys = getKeys({
      chrome: enContent.chrome,
      termsTitle: enContent.terms?.title,
      termsLastUpdated: enContent.terms?.lastUpdated,
      privacyTitle: enContent.privacy?.title,
      privacyLastUpdated: enContent.privacy?.lastUpdated,
      refundTitle: enContent.refund?.title,
      refundLastUpdated: enContent.refund?.lastUpdated
    });

    const trUiChromeKeys = new Set(getKeys({
      chrome: trContent.chrome,
      termsTitle: trContent.terms?.title,
      termsLastUpdated: trContent.terms?.lastUpdated,
      privacyTitle: trContent.privacy?.title,
      privacyLastUpdated: trContent.privacy?.lastUpdated,
      refundTitle: trContent.refund?.title,
      refundLastUpdated: trContent.refund?.lastUpdated
    }));

    const missingLegalUiKeysInTr = enUiChromeKeys.filter(k => !trUiChromeKeys.has(k));
    if (missingLegalUiKeysInTr.length > 0) {
      report.push(`[KEY_GAP] In legal.json UI chrome: Missing in TR: ${missingLegalUiKeysInTr.join(', ')}`);
      hasMismatch = true;
    }

    // Count canonical EN sections and blocks
    const docs = ['terms', 'privacy', 'refund'];
    let enSectionsCount = 0;
    let enBlocksCount = 0;
    let trSectionsCount = 0;
    let trBlocksCount = 0;

    for (const doc of docs) {
      const enSecs = enContent[doc]?.sections || [];
      enSectionsCount += enSecs.length;
      for (const s of enSecs) {
        enBlocksCount += (s.blocks?.length || 0);
      }

      const trSecs = trContent[doc]?.sections || [];
      trSectionsCount += trSecs.length;
      for (const s of trSecs) {
        trBlocksCount += (s.blocks?.length || 0);
      }
    }

    legalAudit = {
      uiParity: missingLegalUiKeysInTr.length === 0 ? 'PASS' : 'FAIL',
      enSectionsCount,
      enBlocksCount,
      trSectionsCount,
      trBlocksCount,
      fallbackSections: enSectionsCount - trSectionsCount,
      fallbackBlocks: enBlocksCount - trBlocksCount
    };
    continue;
  }

  const enKeys = new Set(getKeys(enContent));
  const trKeys = new Set(getKeys(trContent));

  const missingInTr = [...enKeys].filter(k => !trKeys.has(k));
  const missingInEn = [...trKeys].filter(k => !enKeys.has(k));

  if (missingInTr.length > 0) {
    report.push(`[KEY_GAP] In ${file}: Missing in TR (${missingInTr.length}):\n  - ${missingInTr.slice(0, 10).join('\n  - ')}${missingInTr.length > 10 ? '\n  ... and ' + (missingInTr.length - 10) + ' more' : ''}`);
    hasMismatch = true;
  }
  if (missingInEn.length > 0) {
    report.push(`[KEY_GAP] In ${file}: Missing in EN (${missingInEn.length}):\n  - ${missingInEn.slice(0, 10).join('\n  - ')}${missingInEn.length > 10 ? '\n  ... and ' + (missingInEn.length - 10) + ' more' : ''}`);
    hasMismatch = true;
  }
}

console.log('================================================================');
console.log('                 SEENLY i18n VALIDATION REPORT                  ');
console.log('================================================================');

if (legalAudit) {
  console.log(`Legal UI key parity:                      ${legalAudit.uiParity}`);
  console.log(`Legal body canonical EN sections:         ${legalAudit.enSectionsCount} (${legalAudit.enBlocksCount} clauses)`);
  console.log(`Approved TR legal body sections:          ${legalAudit.trSectionsCount} (${legalAudit.trBlocksCount} clauses)`);
  console.log(`TR legal body fallback-to-EN sections:    ${legalAudit.fallbackSections} (${legalAudit.fallbackBlocks} clauses)`);
  console.log('----------------------------------------------------------------');
}

for (const line of report) {
  console.log(line);
}

if (hasMismatch) {
  console.error('\n[FAIL] Key symmetry check failed.');
  process.exit(1);
} else {
  console.log('[PASS] All required UI namespace keys are symmetrical between EN and TR.');
  console.log('================================================================');
}
