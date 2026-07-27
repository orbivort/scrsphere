#!/usr/bin/env node

/**
 * Fix Glossary Violations - Comprehensive
 *
 * Maps known translations to glossary terms and fixes them.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'node:path';

const GLOSSARY_PATH = join(process.cwd(), 'packages/shared/i18n/glossary.json');
const LOCALES_DIR = join(process.cwd(), 'packages/frontend/public/locales');

// Load glossary
const glossary = JSON.parse(readFileSync(GLOSSARY_PATH, 'utf-8'));

// Known translations mapping for each locale
const TRANSLATION_MAPS = {
  de: {
    'Produktziel': 'Product Goal',
    'Produkt-Ziel': 'Product Goal',
    'Sprint-Ziel': 'Sprint Goal',
    'Hindernis': 'Impediment',
    'Retrospective': 'Sprint Retrospective',
    'Sprint-Backlog': 'Sprint Backlog',
  },
  fr: {
    'Objectif de Produit': 'Product Goal',
    'Objectif de Sprint': 'Sprint Goal',
    'Obstacle': 'Impediment',
    'Retrospective': 'Sprint Retrospective',
  },
  es: {
    'Objetivo de Producto': 'Product Goal',
    'Objetivo del Producto': 'Product Goal',
    'Objetivo Sprint': 'Sprint Goal',
    'Objetivo del Sprint': 'Sprint Goal',
    'Pila del producto': 'Product Backlog',
    'Pila del Sprint': 'Sprint Backlog',
    'Scrum diario': 'Daily Scrum',
    'Impedimento': 'Impediment',
    'Retrospectiva': 'Sprint Retrospective',
    'Retrospectiva del Sprint': 'Sprint Retrospective',
    'Planificación de Sprint': 'Sprint Planning',
    'Revisión del Sprint': 'Sprint Review',
  },
  it: {
    'Obiettivo di Prodotto': 'Product Goal',
    'Obiettivo dello Sprint': 'Sprint Goal',
    'Impedimento': 'Impediment',
    'Retrospective': 'Sprint Retrospective',
    'Incremento': 'Increment',
  },
};

console.log('Fixing glossary violations...\n');

let totalFixes = 0;
const localeFixCounts = {};

for (const [locale, translationMap] of Object.entries(TRANSLATION_MAPS)) {
  localeFixCounts[locale] = 0;
  
  const localeDir = join(LOCALES_DIR, locale);
  if (!existsSync(localeDir)) continue;
  
  const files = readdirSync(localeDir).filter((f) => f.endsWith('.json'));
  
  for (const file of files) {
    const filePath = join(localeDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    
    let modified = false;
    
    // Recursive function to fix values
    const fixValues = (obj, path = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (typeof obj[key] === 'string') {
          const value = obj[key];
          
          // Check if this value matches a known translation
          if (translationMap[value]) {
            const correct = translationMap[value];
            console.log(`${locale}/${file}: ${currentPath}: "${value}" → "${correct}"`);
            obj[key] = correct;
            modified = true;
            totalFixes++;
            localeFixCounts[locale]++;
          }
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          fixValues(obj[key], currentPath);
        }
      }
    };
    
    fixValues(json);
    
    if (modified) {
      writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8');
    }
  }
}

console.log('\n📊 Fix Summary:');
for (const [locale, count] of Object.entries(localeFixCounts)) {
  if (count > 0) {
    console.log(`  ${locale}: ${count} fixes`);
  }
}
console.log(`\n✅ Total: ${totalFixes} glossary violations fixed`);