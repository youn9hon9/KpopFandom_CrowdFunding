/**
 * Antigravity Custom Skill Tool: css-linter.js
 * 
 * 에이전트가 public/style.css 파일의 심미적 정합성을 검증할 때 호출합니다.
 */

const fs = require('fs');
const path = require('path');

function main() {
  // 에이전트 인풋 파라미터는 CLI 인수로 전달되거나 기본값으로 잡힘
  const cssPath = process.argv[2] || path.join(__dirname, '../../public/style.css');

  if (!fs.existsSync(cssPath)) {
    console.error(JSON.stringify({
      status: "error",
      error: `CSS file not found at path: ${cssPath}`
    }));
    process.exit(1);
  }

  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  const hexPattern = /#([0-9a-fA-F]{3,8})\b/g;
  const rgbPattern = /rgba?\([^)]+\)/g;

  let hexMatches = cssContent.match(hexPattern) || [];
  let rgbMatches = cssContent.match(rgbPattern) || [];

  hexMatches = [...new Set(hexMatches)];
  rgbMatches = [...new Set(rgbMatches)];

  const hasGlass = cssContent.includes('backdrop-filter:');
  const transitionCount = (cssContent.match(/transition:/g) || []).length;

  const result = {
    status: "completed",
    linter_report: {
      css_path: cssPath,
      hex_hardcoding_detected: hexMatches.length > 0,
      hex_codes: hexMatches,
      rgb_hardcoding_detected: rgbMatches.length > 0,
      rgb_codes: rgbMatches,
      glassmorphism_configured: hasGlass,
      transition_elements_count: transitionCount,
      passed_aesthetics: hexMatches.length === 0 && rgbMatches.length === 0 && hasGlass
    }
  };

  // 에이전트가 구조화된 파싱을 할 수 있도록 JSON으로 출력
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main();
