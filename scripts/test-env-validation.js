#!/usr/bin/env node

/**
 * Test script to validate the environment file checking functionality
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Environment File Validation\n');

const rootDir = path.join(__dirname, '..');

// Backup existing env files
const backups = [];
['.env.local', '.env.production'].forEach(file => {
  const filePath = path.join(rootDir, file);
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + '.test-backup';
    fs.copyFileSync(filePath, backupPath);
    backups.push({ original: filePath, backup: backupPath });
    fs.unlinkSync(filePath);
    console.log(`📦 Backed up ${file}`);
  }
});

let allTestsPassed = true;

try {
  // Test 1: Development mode without .env.local should fail
  console.log('\n📋 Test 1: Development mode without .env.local should fail');
  try {
    execSync('npm run check-env:dev', { 
      cwd: rootDir,
      stdio: 'pipe'
    });
    console.log('❌ FAILED: Should have exited with error');
    allTestsPassed = false;
  } catch (error) {
    const output = error.stdout.toString() + error.stderr.toString();
    if (output.includes('ERROR: Required environment file ".env.local" not found')) {
      console.log('✅ PASSED: Correctly detected missing .env.local');
    } else {
      console.log('❌ FAILED: Wrong error message');
      allTestsPassed = false;
    }
  }

  // Test 2: Production mode without .env.production should fail
  console.log('\n📋 Test 2: Production mode without .env.production should fail');
  try {
    execSync('npm run check-env:prod', { 
      cwd: rootDir,
      stdio: 'pipe'
    });
    console.log('❌ FAILED: Should have exited with error');
    allTestsPassed = false;
  } catch (error) {
    const output = error.stdout.toString() + error.stderr.toString();
    if (output.includes('ERROR: Required environment file ".env.production" not found')) {
      console.log('✅ PASSED: Correctly detected missing .env.production');
    } else {
      console.log('❌ FAILED: Wrong error message');
      allTestsPassed = false;
    }
  }

  // Test 3: Create .env.local and verify it passes
  console.log('\n📋 Test 3: Development mode with .env.local should pass');
  fs.copyFileSync(
    path.join(rootDir, '.env.template'),
    path.join(rootDir, '.env.local')
  );
  try {
    const output = execSync('npm run check-env:dev', { 
      cwd: rootDir,
      encoding: 'utf-8'
    });
    if (output.includes('✅ Environment file ".env.local" found successfully')) {
      console.log('✅ PASSED: Correctly validated .env.local');
    } else {
      console.log('❌ FAILED: Did not find expected success message');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAILED: Should have passed');
    console.error(error.message);
    allTestsPassed = false;
  }

  // Test 4: Create .env.production and verify it passes
  console.log('\n📋 Test 4: Production mode with .env.production should pass');
  fs.copyFileSync(
    path.join(rootDir, '.env.template'),
    path.join(rootDir, '.env.production')
  );
  try {
    const output = execSync('npm run check-env:prod', { 
      cwd: rootDir,
      encoding: 'utf-8'
    });
    if (output.includes('✅ Environment file ".env.production" found successfully')) {
      console.log('✅ PASSED: Correctly validated .env.production');
    } else {
      console.log('❌ FAILED: Did not find expected success message');
      allTestsPassed = false;
    }
  } catch (error) {
    console.log('❌ FAILED: Should have passed');
    console.error(error.message);
    allTestsPassed = false;
  }

} finally {
  // Cleanup: Remove test files and restore backups
  console.log('\n🧹 Cleaning up...');
  ['.env.local', '.env.production'].forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed test ${file}`);
    }
  });

  backups.forEach(({ original, backup }) => {
    if (fs.existsSync(backup)) {
      fs.copyFileSync(backup, original);
      fs.unlinkSync(backup);
      console.log(`♻️  Restored ${path.basename(original)}`);
    }
  });
}

console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('✅ All tests PASSED!');
  process.exit(0);
} else {
  console.log('❌ Some tests FAILED!');
  process.exit(1);
}
