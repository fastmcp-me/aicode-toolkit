/**
 * Test script for OpenSpec Liquid template rendering
 *
 * Usage: npx tsx src/specs/test-template.ts
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Liquid } from 'liquidjs';
import type { EnabledMcps } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test scenarios
const testScenarios: Array<{ name: string; data: EnabledMcps }> = [
  {
    name: 'No MCPs enabled',
    data: {
      scaffoldMcp: false,
      architectMcp: false,
      projectType: undefined,
    },
  },
  {
    name: 'Only scaffold-mcp enabled (no project type)',
    data: {
      scaffoldMcp: true,
      architectMcp: false,
      projectType: undefined,
    },
  },
  {
    name: 'Only architect-mcp enabled',
    data: {
      scaffoldMcp: false,
      architectMcp: true,
      projectType: undefined,
    },
  },
  {
    name: 'Both MCPs enabled (no project type)',
    data: {
      scaffoldMcp: true,
      architectMcp: true,
      projectType: undefined,
    },
  },
  {
    name: 'Both MCPs enabled (monolith project)',
    data: {
      scaffoldMcp: true,
      architectMcp: true,
      projectType: 'monolith',
    },
  },
  {
    name: 'Both MCPs enabled (monorepo project)',
    data: {
      scaffoldMcp: true,
      architectMcp: true,
      projectType: 'monorepo',
    },
  },
  {
    name: 'Only scaffold-mcp with monolith',
    data: {
      scaffoldMcp: true,
      architectMcp: false,
      projectType: 'monolith',
    },
  },
  {
    name: 'Only scaffold-mcp with monorepo',
    data: {
      scaffoldMcp: true,
      architectMcp: false,
      projectType: 'monorepo',
    },
  },
];

async function main() {
  // Load template
  const templatePath = path.join(__dirname, '../prompts/specs/openspec.md');
  const templateContent = await fs.readFile(templatePath, 'utf-8');

  const liquid = new Liquid();

  console.log('🧪 Testing OpenSpec Liquid Template\n');
  console.log('='.repeat(80));

  for (const scenario of testScenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`);
    console.log(`   Data: ${JSON.stringify(scenario.data, null, 2)}`);
    console.log('-'.repeat(80));

    try {
      const rendered = await liquid.parseAndRender(templateContent, scenario.data);

      // Verify output
      const lines = rendered.trim().split('\n');
      console.log(`✅ Rendered successfully (${lines.length} lines)`);

      // Show first few lines as preview
      console.log('\n📄 Preview (first 10 lines):');
      console.log(lines.slice(0, 10).join('\n'));

      // Validate key sections
      const validations = [
        { check: rendered.includes('# Spec-Driven Development with OpenSpec'), label: 'Header' },
        { check: rendered.includes('## Overview'), label: 'Overview section' },
        { check: rendered.includes('## Workflow Summary'), label: 'Workflow Summary' },
        { check: rendered.includes('### OpenSpec CLI'), label: 'OpenSpec CLI section' },
      ];

      // Conditional validations
      if (scenario.data.scaffoldMcp) {
        validations.push(
          {
            check: rendered.includes('Create Proposals with scaffold-mcp'),
            label: 'scaffold-mcp section',
          },
          { check: rendered.includes('### scaffold-mcp'), label: 'scaffold-mcp tools reference' },
        );
      }

      if (scenario.data.architectMcp) {
        validations.push(
          {
            check: rendered.includes('Review & Validate with architect-mcp'),
            label: 'architect-mcp section',
          },
          { check: rendered.includes('### architect-mcp'), label: 'architect-mcp tools reference' },
        );
      }

      if (scenario.data.projectType === 'monolith') {
        validations.push(
          { check: rendered.includes('Monolith Project'), label: 'Monolith path mapping' },
          { check: rendered.includes('toolkit.yaml'), label: 'Monolith config file' },
        );
      }

      if (scenario.data.projectType === 'monorepo') {
        validations.push(
          { check: rendered.includes('Monorepo Project'), label: 'Monorepo path mapping' },
          { check: rendered.includes('project.json'), label: 'Monorepo config file' },
        );
      }

      console.log('\n🔍 Validations:');
      let allPassed = true;
      for (const validation of validations) {
        const status = validation.check ? '✅' : '❌';
        console.log(`   ${status} ${validation.label}`);
        if (!validation.check) allPassed = false;
      }

      if (!allPassed) {
        console.log('\n⚠️  Some validations failed!');
        console.log('\n📄 Full output:');
        console.log(rendered);
      }
    } catch (error) {
      console.log(`❌ Failed to render: ${(error as Error).message}`);
      console.log((error as Error).stack);
    }

    console.log('='.repeat(80));
  }

  console.log('\n✨ Test complete!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
