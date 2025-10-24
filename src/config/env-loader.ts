import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Load environment variables from the appropriate .env file based on NODE_ENV
 * - production: uses .env.production
 * - development: uses .env.local
 * Exits the process if the required file is not found.
 */
export function loadEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const envFile = isProduction ? '.env.production' : '.env.local';
  const envPath = path.resolve(process.cwd(), envFile);

  console.log(`\n🔧 Loading environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📄 Environment file: ${envFile}`);

  if (!fs.existsSync(envPath)) {
    console.error(`\n❌ ERROR: Required environment file "${envFile}" not found!`);
    console.error(`\n📝 Please create the file "${envFile}" in the project root.`);
    console.error(`💡 You can use ".env.template" as a reference.\n`);
    
    const templatePath = path.resolve(process.cwd(), '.env.template');
    if (fs.existsSync(templatePath)) {
      console.error(`ℹ️  A template file exists at: .env.template`);
      console.error(`   You can copy it using: cp .env.template ${envFile}\n`);
    }
    
    process.exit(1);
  }

  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.error(`\n❌ ERROR: Failed to load environment file "${envFile}"`);
    console.error(result.error);
    process.exit(1);
  }

  console.log(`✅ Environment loaded successfully from "${envFile}"\n`);
}
