# Antigravity MCP 설정

Antigravity(2.0)는 **워크스페이스(프로젝트) 단위의 MCP 설정을 아직 지원하지 않는다.** MCP 서버는
전역 파일 하나에서만 읽는다(per-workspace MCP는 공개된 기능 요청 상태). 따라서 이 디렉터리의
[`mcp_config.json`](./mcp_config.json)은 **자동 로드되지 않는 템플릿**이며, 아래 전역 파일에 직접 병합해야 한다.

## 적용 방법

1. 전역 MCP 설정 파일을 연다 (Antigravity: Settings → Customizations → *Open MCP Config*):
   - Windows: `C:\Users\<사용자>\.gemini\config\mcp_config.json`
   - macOS/Linux: `~/.gemini/config/mcp_config.json`
   - (구버전 설치본은 `~/.gemini/antigravity/mcp_config.json` 일 수 있음)
2. 이 폴더의 `mcp_config.json` 안 `mcpServers` 항목을 전역 파일의 `mcpServers`에 병합한다.
3. `filesystem` 서버의 허용 디렉터리(absolute path)를 **본인 머신의 이 저장소 경로**로 수정한다.
   전역에서 실행되므로 상대경로 `.` 는 동작하지 않는다 — 반드시 절대경로를 쓴다.
   (예: `F:/dev/maplibre-vworld-react`. Windows에서는 `/` 또는 `\\` 모두 가능)
4. Antigravity에서 MCP 서버를 새로고침하거나 에디터를 재시작한다.

## 참고

- 스킬/룰/워크플로는 워크스페이스 단위로 지원된다 — 이 저장소의 `.agents/`(예: `agents.md`)와
  루트 `AGENTS.md`는 Antigravity가 자동으로 읽는다.
- Codex / Claude Code / OpenCode 용 MCP 설정은 각각 `.codex/config.toml`, `.mcp.json`,
  `opencode.json` 에 프로젝트 단위로 커밋되어 있다(이쪽은 상대경로 `.` 사용).
