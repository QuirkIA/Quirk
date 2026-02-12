#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Check if the required environment file exists for the current environment
 * @param {string} envMode - The environment mode ('development' or 'production')
 * @returns {boolean} - Returns true if env file exists, exits process if not
 */
function checkEnvFile(envMode) {
  const envFiles = {
    development: '.env.local',
    production: '.env.production'
  };

  const requiredEnvFile = envFiles[envMode];
  const envFilePath = path.join(process.cwd(), requiredEnvFile);

  console.log(`\n🔍 Checking environment configuration for ${envMode} mode...`);
  console.log(`📁 Looking for: ${requiredEnvFile}`);

  if (!fs.existsSync(envFilePath)) {
    console.error(`\n❌ ERROR: Required environment file "${requiredEnvFile}" not found!`);
    console.error(`\n📝 Please create the file "${requiredEnvFile}" in the project root.`);
    console.error(`💡 You can use ".env.template" as a reference.\n`);
    
    const templatePath = path.join(process.cwd(), '.env.template');
    if (fs.existsSync(templatePath)) {
      console.error(`ℹ️  A template file exists at: .env.template`);
      console.error(`   You can copy it using: cp .env.template ${requiredEnvFile}\n`);
    }
    
    process.exit(1);
  }

  console.log(`✅ Environment file "${requiredEnvFile}" found successfully!\n`);
  return true;
}

// Get environment mode from command line argument or NODE_ENV
const envMode = process.argv[2] || process.env.NODE_ENV || 'development';

if (!['development', 'production'].includes(envMode)) {
  console.error(`\n❌ ERROR: Invalid environment mode "${envMode}"`);
  console.error(`   Valid options: development, production\n`);
  process.exit(1);
}

checkEnvFile(envMode);
