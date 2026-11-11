// SPDX-License-Identifier: GPL-3.0-only
// 패키지 배포 시 라이선스·소스 동봉을 실제 npm pack 목록에서 검사한다.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
for (const name of ["core", "web", "rn"]) {
  const path="packages/vworld-map-"+name;
  const manifest=JSON.parse(readFileSync(path+"/package.json","utf8"));
  assert.equal(manifest.license,"GPL-3.0-only");
  const result=spawnSync("npm",["pack","--workspace",path,"--dry-run","--ignore-scripts","--json"],{encoding:"utf8"});
  assert.equal(result.status,0,result.stderr);
  const files=new Set(JSON.parse(result.stdout)[0].files.map(file=>file.path));
  for (const file of ["LICENSE","NOTICE","src/index.ts","tsconfig.json","dist/index.js"])
    assert.ok(files.has(file),name+": "+file+" 동봉 누락");
  console.log(manifest.name+": 라이선스·원 소스·빌드 설정 동봉 확인");
}
