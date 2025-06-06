#!/usr/bin/env node

/**
 * Generate Cursor deeplink for Ethics Check MCP
 * Based on: https://docs.cursor.com/deeplinks
 */

// MCP Configuration for Ethics Check
const mcpConfig = {
  command: "npx",
  args: ["ethics-check-mcp"],
  env: {
    GEMINI_API_KEY: "your_actual_gemini_api_key_here"
  }
};

// Generate the deeplink
function generateCursorDeeplink() {
  const name = "ethics-check";
  const configJson = JSON.stringify(mcpConfig);
  const base64Config = Buffer.from(configJson).toString('base64');
  
  const deeplink = `cursor://anysphere.cursor-deeplink/mcp/install?name=${name}&config=${base64Config}`;
  
  console.log('🔗 Cursor Deeplink Generated!');
  console.log('');
  console.log('Deeplink URL:');
  console.log(deeplink);
  console.log('');
  console.log('Markdown Button:');
  console.log(`[![Add Ethics Check MCP to Cursor](https://img.shields.io/badge/Add_to-Cursor-blue?style=for-the-badge&logo=cursor)](${deeplink})`);
  console.log('');
  console.log('HTML Button:');
  console.log(`<a href="${deeplink}"><img src="https://img.shields.io/badge/Add_to-Cursor-blue?style=for-the-badge&logo=cursor" alt="Add Ethics Check MCP to Cursor"></a>`);
  console.log('');
  console.log('Configuration will be:');
  console.log(JSON.stringify(mcpConfig, null, 2));
  
  return deeplink;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateCursorDeeplink();
}

export { generateCursorDeeplink, mcpConfig }; 