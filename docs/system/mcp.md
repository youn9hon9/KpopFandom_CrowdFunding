# Model Context Protocol (MCP) Integration Specification

이 사양서는 Antigravity 에이전트가 데이터베이스, 포트, 로컬 테스트 환경을 모니터링하기 위해 Antigravity 엔진에 탑재하는 실제 Model Context Protocol(MCP) 구성 명세입니다.

실제 설정 파일은 프로젝트 루트의 [.antigravity/mcp-settings.json](file:///c:/Workspace/KpopFandom_CrowdFunding/.antigravity/mcp-settings.json)에 작성되어 에이전트 런타임에 로드됩니다.

---

## ⚙️ MCP Server Configuration Structure

```json
{
  "mcpServers": {
    "sqlite-explorer": {
      "command": "node",
      "args": ["c:/Workspace/KpopFandom_CrowdFunding/.antigravity/mcp/sqlite-mcp-server.js"],
      "env": {
        "DB_PATH": "c:/Workspace/KpopFandom_CrowdFunding/data/duckrowd.db",
        "JOURNAL_MODE": "WAL"
      }
    },
    "figma-explorer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-figma"],
      "env": {
        "FIGMA_PERSONAL_ACCESS_TOKEN": "YOUR_FIGMA_PAT"
      }
    },
    "oauth-debugger": {
      "command": "node",
      "args": ["c:/Workspace/KpopFandom_CrowdFunding/.antigravity/mcp/oauth-mcp-server.js"],
      "env": {
        "REDIRECT_URI_BASE": "http://localhost:3000"
      }
    }
  }
}
```

## 🛠️ Exposed MCP Tools & Specs

### 1. sqlite-explorer
- **sqlite://schema/tables**: 현재 SQLite DB의 전체 릴레이션 스키마와 인덱스 구조 컨텍스트를 읽어옵니다.
- **inspect_db_lock**: 동시성 이슈 발생 시 DB가 데드락이나 `SQLITE_BUSY` 상태인지 락 세션을 추적합니다.

### 2. oauth-debugger
- **oauth://google/config**: Google OAuth callback URL 리다이렉트 화이트리스트 일치성을 점검합니다.
- **oauth://kakao/config**: Kakao Developers API REST 키 자격증명의 포맷 유효성을 진단합니다.

### 3. figma-explorer (피그마 디자인 연동)
- **figma://files/{file_key}**: 지정한 피그마 파일의 모든 페이지, 프레임, 노드 트리 데이터를 JSON으로 읽어옵니다.
- **figma_get_image(file_key, nodeId)**: 특정 피그마 컴포넌트나 프레임을 PNG/SVG 이미지 URL로 렌더링하여 받아옵니다.
- **figma_get_styles(file_key)**: 피그마 내에 설계된 글로벌 디자인 라이브러리(텍스트 스타일, HSL 컬러 스타일) 목록을 컴파일하여 파싱합니다.
