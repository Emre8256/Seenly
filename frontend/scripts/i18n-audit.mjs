import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const srcDir = fileURLToPath(new URL('../src/', import.meta.url));

function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'test' && file !== '__tests__' && file !== 'node_modules') {
        getAllFiles(fullPath, fileList);
      }
    } else {
      const ext = extname(file);
      if (['.jsx', '.js'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

const files = getAllFiles(srcDir);

const findings = {
  forbiddenDirectImports: [],
  legacyUiCalls: [],
  componentFallbacks: [],
  copyTernaries: [],
  unlocalizedDialogs: [],
  unlocalizedThrows: [],
  suspiciousAttributes: [],
  suspiciousJsxText: [],
  allowedTechnicalLiterals: []
};

// Known technical allowlists
const ALLOWED_BRAND_NAMES = new Set([
  '10Signal',
  '10Signal Plus',
  'Signal Plus',
  'Instagram',
  'TikTok',
  'X',
  'WhatsApp',
  'App Store',
  'Google Play'
]);

const ALLOWED_JSX_PUNCTUATION = /^[\s\d+*/%=&|^~<>()\[\]{}:;,.?!@#$_`"'·•—–→←↑↓✓✕©®™💡🔒✦➔×$€£₺\\-]*$/u;

for (const filePath of files) {
  const relPath = relative(srcDir, filePath).replace(/\\/g, '/');
  // Skip locale files themselves
  if (relPath.startsWith('content/locales/')) continue;
  // Skip test files
  if (relPath.includes('.test.') || relPath.includes('.spec.')) continue;

  const code = readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });
  } catch (err) {
    console.error(`Failed to parse AST for: ${relPath}`, err);
    continue;
  }

  traverse(ast, {
    // 1. Direct locale JSON import check
    ImportDeclaration(path) {
      const source = path.node.source.value;
      if (/locales\/(en|tr)\/.*\.json/i.test(source) || /locales\/.*\.json/i.test(source)) {
        if (!relPath.startsWith('context/LocaleContext') && !relPath.startsWith('content/locales/')) {
          findings.forbiddenDirectImports.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            text: `Direct import of locale dictionary: "${source}"`
          });
        }
      }
    },

    // 2. Legacy t('ui', ...) call check
    CallExpression(path) {
      const callee = path.node.callee;
      const args = path.node.arguments;

      // Check t('ui', ...)
      if (callee.type === 'Identifier' && (callee.name === 't' || callee.name === 'tr')) {
        if (args.length >= 1 && args[0].type === 'StringLiteral' && args[0].value === 'ui') {
          findings.legacyUiCalls.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            text: `Legacy t('ui', '${args[1]?.value}')`
          });
        }
      }

      // Check alert(...) or window.confirm(...) with string literal
      if (
        (callee.type === 'Identifier' && (callee.name === 'alert' || callee.name === 'confirm')) ||
        (callee.type === 'MemberExpression' && callee.object?.name === 'window' && (callee.property?.name === 'alert' || callee.property?.name === 'confirm'))
      ) {
        if (args.length > 0 && args[0].type === 'StringLiteral') {
          findings.unlocalizedDialogs.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            text: `${callee.name || callee.property.name}("${args[0].value}")`
          });
        }
      }
    },

    // 3. Fallback anti-pattern check: t(...) || "fallback"
    LogicalExpression(path) {
      if (path.node.operator === '||') {
        const left = path.node.left;
        const right = path.node.right;
        if (left.type === 'CallExpression' && left.callee.type === 'Identifier' && (left.callee.name === 't' || left.callee.name === 'tr')) {
          if (right.type === 'StringLiteral' || (right.type === 'TemplateLiteral' && right.quasis.some(q => q.value.raw.trim().length > 0))) {
            findings.componentFallbacks.push({
              file: relPath,
              line: path.node.loc?.start.line || 0,
              text: `t(...) || "${right.value || right.quasis[0].value.raw}"`
            });
          }
        }
      }
    },

    // 4. Language-specific copy branching check in components
    ConditionalExpression(path) {
      const test = path.node.test;
      const testCode = code.slice(test.start, test.end);
      if (/(lang|locale|langCode|language)\s*===?\s*['"][a-z]+['"]/i.test(testCode)) {
        const cons = path.node.consequent;
        const alt = path.node.alternate;
        const consIsText = cons.type === 'StringLiteral' && cons.value.length > 2 && /[A-Za-zğüşıöçĞÜŞİÖÇ]/.test(cons.value);
        const altIsText = alt.type === 'StringLiteral' && alt.value.length > 2 && /[A-Za-zğüşıöçĞÜŞİÖÇ]/.test(alt.value);

        if (consIsText || altIsText) {
          // Exclude central i18n infrastructure files
          if (!relPath.startsWith('context/LocaleContext') && !relPath.startsWith('content/locales/')) {
            // Check if it is a CSS class or technical token
            const val = cons.value || alt.value;
            if (val.startsWith('#') || val.startsWith('tensignal-') || val.startsWith('lang-') || val.includes('active')) {
              findings.allowedTechnicalLiterals.push({
                file: relPath,
                line: path.node.loc?.start.line || 0,
                classification: 'CSS_TOKEN',
                reason: 'Language selector active state class name',
                literal: val
              });
            } else {
              findings.copyTernaries.push({
                file: relPath,
                line: path.node.loc?.start.line || 0,
                text: `${testCode} ? "${cons.value}" : "${alt.value}"`
              });
            }
          }
        }
      }
    },

    // 5. Thrown unlocalized errors in components/pages
    ThrowStatement(path) {
      if (relPath.startsWith('components/') || relPath.startsWith('pages/')) {
        const arg = path.node.argument;
        if (arg.type === 'NewExpression' && arg.callee.name === 'Error') {
          if (arg.arguments.length > 0 && arg.arguments[0].type === 'StringLiteral') {
            findings.unlocalizedThrows.push({
              file: relPath,
              line: path.node.loc?.start.line || 0,
              text: `throw new Error("${arg.arguments[0].value}")`
            });
          }
        }
      }
    },

    // 6. JSX Attributes (placeholder, title, alt, aria-label, etc.)
    JSXAttribute(path) {
      const attrName = path.node.name?.name;
      const trackedAttrs = ['placeholder', 'title', 'alt', 'aria-label', 'aria-description'];

      if (trackedAttrs.includes(attrName)) {
        const valNode = path.node.value;
        if (valNode && valNode.type === 'StringLiteral') {
          const val = valNode.value.trim();
          if (ALLOWED_BRAND_NAMES.has(val)) {
            findings.allowedTechnicalLiterals.push({
              file: relPath,
              line: path.node.loc?.start.line || 0,
              classification: 'BRAND_NAME',
              reason: 'Proper brand/app name allowed in static attributes',
              literal: `${attrName}="${val}"`
            });
          } else if (val.length > 0) {
            findings.suspiciousAttributes.push({
              file: relPath,
              line: path.node.loc?.start.line || 0,
              text: `${attrName}="${val}"`
            });
          }
        }
      }
    },

    // 7. JSX Text nodes
    JSXText(path) {
      const rawText = path.node.value;
      const trimmed = rawText.trim();
      if (!trimmed) return;

      if (!ALLOWED_JSX_PUNCTUATION.test(trimmed)) {
        if (ALLOWED_BRAND_NAMES.has(trimmed)) {
          findings.allowedTechnicalLiterals.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            classification: 'BRAND_NAME',
            reason: 'Proper brand name rendered as logo / title',
            literal: trimmed
          });
        } else if (trimmed === 's' || trimmed === '--.-s') {
          findings.allowedTechnicalLiterals.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            classification: 'METRIC_UNIT',
            reason: 'Metric second unit symbol for latency display',
            literal: trimmed
          });
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          findings.allowedTechnicalLiterals.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            classification: 'CONTACT_EMAIL',
            reason: 'Support contact email address',
            literal: trimmed
          });
        } else {
          // Check if parent is a script or style
          const parentTag = path.parent?.openingElement?.name?.name;
          if (parentTag === 'style' || parentTag === 'script') return;

          findings.suspiciousJsxText.push({
            file: relPath,
            line: path.node.loc?.start.line || 0,
            text: trimmed
          });
        }
      }
    }
  });
}

const totalSuspicious =
  findings.forbiddenDirectImports.length +
  findings.legacyUiCalls.length +
  findings.componentFallbacks.length +
  findings.copyTernaries.length +
  findings.unlocalizedDialogs.length +
  findings.unlocalizedThrows.length +
  findings.suspiciousAttributes.length +
  findings.suspiciousJsxText.length;

console.log('================================================================');
console.log('            10SIGNAL AST-BASED HARDCODED-STRING AUDIT             ');
console.log('================================================================');
console.log(`Source files analyzed: ${files.length}`);
console.log('----------------------------------------------------------------');
console.log(`1. Forbidden direct locale JSON imports:    ${findings.forbiddenDirectImports.length}`);
findings.forbiddenDirectImports.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`2. Legacy t('ui', ...) calls:               ${findings.legacyUiCalls.length}`);
findings.legacyUiCalls.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`3. Component fallback arguments (t() || '..'): ${findings.componentFallbacks.length}`);
findings.componentFallbacks.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`4. Language copy-branching ternaries:       ${findings.copyTernaries.length}`);
findings.copyTernaries.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`5. Unlocalized alert / confirm dialogs:     ${findings.unlocalizedDialogs.length}`);
findings.unlocalizedDialogs.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`6. Component-level unlocalized throws:      ${findings.unlocalizedThrows.length}`);
findings.unlocalizedThrows.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`7. Hardcoded JSX attributes (placeholder, etc): ${findings.suspiciousAttributes.length}`);
findings.suspiciousAttributes.forEach(i => console.log(`   - [${i.file}:${i.line}] ${i.text}`));

console.log(`8. Untranslated raw JSXText nodes:          ${findings.suspiciousJsxText.length}`);
findings.suspiciousJsxText.forEach(i => console.log(`   - [${i.file}:${i.line}] "${i.text}"`));

console.log('----------------------------------------------------------------');
console.log(`Allowed technical / brand literals:         ${findings.allowedTechnicalLiterals.length}`);
findings.allowedTechnicalLiterals.forEach(i => {
  console.log(`   * [${i.file}:${i.line}] [${i.classification}] ${i.literal} (${i.reason})`);
});

console.log('----------------------------------------------------------------');
console.log(`suspicious / must still be migrated = ${totalSuspicious}`);
console.log('================================================================');

if (totalSuspicious > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
