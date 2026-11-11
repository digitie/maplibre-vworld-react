import { test, expect } from "@playwright/test";
test("명시 스타일은 키 없이 마운트하고 스타일 교체에 지도 인스턴스를 보존한다",async({page})=>{
 const external:string[]=[];
 page.on("request",request=>{const url=new URL(request.url());if(url.protocol.startsWith("http")&&url.hostname!=="127.0.0.1")external.push(request.url());});
 await page.goto("/map-style-regression.html");
 await expect.poll(()=>page.evaluate(()=>window.styleProbe.loads)).toBe(1);
 await expect(page.getByRole("button",{name:"로컬 마커"})).toBeVisible();
 expect(await page.evaluate(()=>window.styleProbe.map!.getMaxZoom())).toBe(22);
 await page.getByRole("button",{name:"스타일 변경"}).click();
 await expect.poll(()=>page.evaluate(()=>window.styleProbe.map!.getStyle().layers?.[0]?.paint?.["background-color"])).toBe("#ddeeff");
 expect(await page.evaluate(()=>window.styleProbe.map===window.styleProbe.firstMap)).toBe(true);
 expect(await page.evaluate(()=>window.styleProbe.loads)).toBe(1);
 expect(external).toEqual([]);
});
test("명시 스타일이 없으면 기존 missing-api-key 계약을 유지한다",async({page})=>{
 await page.goto("/map-style-regression.html");
 await expect(page.getByRole("status")).toHaveText("missing-api-key");
 await expect(page.locator(".maplibregl-map")).toHaveCount(1);
});
