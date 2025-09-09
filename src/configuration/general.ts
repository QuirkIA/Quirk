import path from "path";
import fs from "fs";
require("dotenv").config();

interface GeneralConfig {
  BOT_NAME: string;
  PREFIX: string;
  PREFIX_EMOJI: string;
  COMMANDS_DIR: string;
  TEMP_DIR: string;
  CACHE_DIR: string;
  TIMEOUT_IN_MILLISECONDS_BY_EVENT: number;
  NUMBERS_HOSTS: string[];
  NUMBER_BOT: string;
  OPENAI_API_KEY: string | undefined;
  GROUP_SECURE: string[];
}

const getProjectRoot = (): string => {
  let currentDir = __dirname;

  while (!fs.existsSync(path.join(currentDir, "package.json"))) {
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return currentDir;
};

const ensureDirectoryExists = (dirPath: string): string => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const projectRoot = getProjectRoot();
const isProduction = process.env.NODE_ENV === "production";

console.log(`🔧 Environment: NODE_ENV = "${process.env.NODE_ENV}"`);
console.log(`🔧 Is Production: ${isProduction}`);
console.log(`🔧 Project Root: ${projectRoot}`);

const getCommandsDir = (): string => {
  if (isProduction) {
    const commandsDir = path.join(__dirname, "..", "commands");
    console.log(`🔧 Production mode - Commands directory: ${commandsDir}`);
    console.log(`🔧 __dirname: ${__dirname}`);
    console.log(`🔧 Directory exists: ${fs.existsSync(commandsDir)}`);
    return commandsDir;
  } else {
    const commandsDir = path.join(projectRoot, "src", "commands");
    console.log(`🔧 Development mode - Commands directory: ${commandsDir}`);
    console.log(`🔧 Project root: ${projectRoot}`);
    console.log(`🔧 Directory exists: ${fs.existsSync(commandsDir)}`);
    return commandsDir;
  }
};

export const general: GeneralConfig = {
  BOT_NAME: "Quirk",
  PREFIX: "/",
  PREFIX_EMOJI: "🤖",
  COMMANDS_DIR: getCommandsDir(),
  TEMP_DIR: ensureDirectoryExists(path.join(projectRoot, "assets", "temp")),
  CACHE_DIR: ensureDirectoryExists(path.join(projectRoot, "cache")),
  TIMEOUT_IN_MILLISECONDS_BY_EVENT: 15000,
  NUMBERS_HOSTS: process.env.NUMBER_HOST ? JSON.parse(process.env.NUMBER_HOST.replace(/'/g, '"')) : [],
  NUMBER_BOT: process.env.NUMBER_BOT ? `${process.env.NUMBER_BOT}@s.whatsapp.net` : "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GROUP_SECURE: [
    "120363360525817583@g.us",
    "5519987529732-1625550643@g.us",
    "120363126503356308@g.us",
    "5519987207781-1552075231@g.us",
    "120363166422910155@g.us",
  ],
};

try {
  if (fs.existsSync(general.COMMANDS_DIR)) {
    const commandFiles = fs.readdirSync(general.COMMANDS_DIR, { recursive: true });
    console.log(`🔧 Files found in commands directory:`, commandFiles);
  } else {
    console.log(`❌ Commands directory does not exist: ${general.COMMANDS_DIR}`);
  }
} catch (error) {
  console.log(`❌ Error reading commands directory:`, error);
}
