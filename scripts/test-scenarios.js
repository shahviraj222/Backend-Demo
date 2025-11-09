#!/usr/bin/env node

/**
 * Test Scenario Runner
 * 
 * This script provides easy commands to run specific test scenarios
 * that match common MangoMint workflows.
 */

const { spawn } = require('child_process');
const path = require('path');

const testScenarios = {
  // Quick smoke tests
  'smoke': [
    'auth.test.ts',
    'business.test.ts'
  ],
  
  // Core salon management features
  'core': [
    'business.test.ts',
    'services.test.ts',
    'staff.test.ts',
    'customers.test.ts'
  ],
  
  // Appointment booking workflow
  'appointments': [
    'appointments.test.ts',
    'calendar.test.ts'
  ],
  
  // Complete business management
  'business-mgmt': [
    'business.test.ts',
    'staff.test.ts',
    'services.test.ts'
  ],
  
  // Customer relationship management
  'crm': [
    'customers.test.ts',
    'appointments.test.ts',
    'auth.test.ts'
  ],
  
  // Full integration test
  'full': [
    'integration.test.ts'
  ],
  
  // All tests
  'all': [
    'auth.test.ts',
    'business.test.ts',
    'services.test.ts',
    'staff.test.ts',
    'customers.test.ts',
    'appointments.test.ts',
    'integration.test.ts'
  ]
};

function runTests(testFiles) {
  console.log(`\n🧪 Running test scenario: ${testFiles.join(', ')}\n`);
  
  const testPattern = testFiles.map(file => `--testPathPattern=${file}`).join(' ');
  const command = `npm test ${testPattern}`;
  
  const child = spawn('npm', ['test', ...testFiles.map(f => `--testPathPattern=${f}`)], {
    stdio: 'inherit',
    shell: true,
    cwd: process.cwd()
  });
  
  child.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed.');
      process.exit(code);
    }
  });
  
  child.on('error', (error) => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
}

function showHelp() {
  console.log(`
🧪 Sojo API Test Scenario Runner

Usage: node scripts/test-scenarios.js <scenario>

Available scenarios:
${Object.keys(testScenarios).map(key => 
  `  ${key.padEnd(15)} - ${getScenarioDescription(key)}`
).join('\n')}

Examples:
  node scripts/test-scenarios.js smoke        # Quick smoke tests
  node scripts/test-scenarios.js appointments # Test appointment booking
  node scripts/test-scenarios.js full         # Complete integration test
  node scripts/test-scenarios.js all          # Run all tests

MangoMint Feature Parity Scenarios:
  node scripts/test-scenarios.js core         # Core salon features
  node scripts/test-scenarios.js business-mgmt # Business management
  node scripts/test-scenarios.js crm          # Customer management
`);
}

function getScenarioDescription(scenario) {
  const descriptions = {
    'smoke': 'Quick smoke tests for basic functionality',
    'core': 'Core salon management features',
    'appointments': 'Appointment booking and scheduling',
    'business-mgmt': 'Business and staff management',
    'crm': 'Customer relationship management',
    'full': 'Complete end-to-end integration test',
    'all': 'Run all test suites'
  };
  return descriptions[scenario] || 'Custom test scenario';
}

// Main execution
const scenario = process.argv[2];

if (!scenario || scenario === 'help' || scenario === '--help' || scenario === '-h') {
  showHelp();
  process.exit(0);
}

if (!testScenarios[scenario]) {
  console.error(`❌ Unknown test scenario: ${scenario}`);
  console.log('Run "node scripts/test-scenarios.js help" to see available scenarios.');
  process.exit(1);
}

runTests(testScenarios[scenario]);
