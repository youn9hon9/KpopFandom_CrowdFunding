/**
 * Antigravity Custom Skill Tool: env-guard.js
 * 
 * 에이전트가 로컬 실행 포트 및 환경변수 오설정 문제를 탐지할 때 수행합니다.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '../../.env');

function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function main() {
  let envConfig = {};
  let envExists = false;

  if (fs.existsSync(envPath)) {
    envExists = true;
    envConfig = dotenv.parse(fs.readFileSync(envPath));
  } else {
    dotenv.config(); // 시스템 환경변수 fallback
  }

  const requiredKeys = ['GOOGLE_CLIENT_ID', 'KAKAO_CLIENT_ID', 'REDIRECT_URI_BASE'];
  let missingKeys = [];
  
  requiredKeys.forEach(key => {
    const value = envConfig[key] || process.env[key];
    if (!value || value.trim() === '') {
      missingKeys.push(key);
    }
  });

  const targetPort = parseInt(process.env.PORT || envConfig.PORT || '3000', 10);
  const isPortAvailable = await checkPortAvailable(targetPort);

  const report = {
    status: isPortAvailable ? "completed" : "failed",
    env_report: {
      env_file_exists: envExists,
      missing_oauth_keys: missingKeys,
      oauth_ready: missingKeys.length === 0,
      target_port: targetPort,
      port_is_available: isPortAvailable
    }
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(isPortAvailable ? 0 : 1);
}

main();
