import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const out = new URL('../playtest/', import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
await writeFile(out+'run-info.json',JSON.stringify({executedAt:new Date().toISOString(),browser:'Chromium '+browser.version(),mode:'headless, real DOM clicks and keyboard input',humanParticipants:0},null,2));
const results=[];
const routes=[{name:'care',width:1440,height:1000,choices:[0,0,0,1,0,0,1,0,1],end:'한 사람의 무게'}, {name:'facts',width:390,height:844,choices:[1,1,1,0,1,1,0,0,0],end:'사슬을 쥔 손'}, {name:'refusal',width:320,height:740,choices:[1,0,1,0,1,2,0,0,2],end:'말이 없는 자리'}];
try {
for(const route of routes){
 const context=await browser.newContext({viewport:{width:route.width,height:route.height},reducedMotion:'reduce'});
 const page=await context.newPage();const errors=[],failed=[];const transcript=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
 await page.goto('http://127.0.0.1:3000');await page.locator('#start').waitFor();
 await page.screenshot({path:out+route.name+'-cover.png',fullPage:true});
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'true');
 await page.locator('#sound').click();assert.equal(await page.locator('#sound').getAttribute('aria-pressed'),'false');
 // Start using keyboard, then use real clicks for the choices.
 await page.locator('#start').focus();await page.keyboard.press('Enter');
 for(let i=0;i<route.choices.length;i++){
  assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),String(i));
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'H1');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${route.name}/${i}`);
  transcript.push(await page.locator('.reader').innerText());
  if(i===3){
   const before=await page.locator('.reader').innerText();
   assert.match(before,route.choices[1]===0?/서진 대신 근무한 날/:/서진도 현장에 있었다/);
   assert.match(before,route.choices[2]===0?/검사자 명단/:/내일 아침 심사 목록/);
   await page.reload();await page.locator('#resume').click();assert.equal(await page.locator('.reader').innerText(),before);
  }
  if(i===6 && route.choices[1]===1)assert.match(await page.locator('article').innerText(),/사흘 치 일당/);
  await page.locator('#open-records').click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);
  assert.equal(await page.locator('.record').count(),i);
  if(i%2===0)await page.keyboard.press('Escape');else await page.locator('#close-archive').click();
  assert.equal(await page.locator('dialog').evaluate(d=>d.open),false);
  if(i===5)await page.screenshot({path:out+route.name+'-scene.png',fullPage:true});
  const choice=page.locator(`[data-choice="${route.choices[i]}"]`);if(route.name==='refusal'){await choice.focus();await page.keyboard.press('Enter');}else await choice.click();
 }
 assert.equal(await page.locator('h1').innerText(),route.end);
 transcript.push(await page.locator('.reader').innerText());
 await page.screenshot({path:out+route.name+'-ending.png',fullPage:true});
 await page.reload();await page.locator('#resume').click();assert.equal(await page.locator('h1').innerText(),route.end);
 page.once('dialog',d=>d.dismiss());await page.locator('#restart').click();assert.equal(await page.locator('h1').innerText(),route.end);
 page.once('dialog',d=>d.accept());await page.locator('#restart').click();assert.equal(await page.locator('[role=progressbar]').getAttribute('aria-valuenow'),'0');
 await writeFile(out+route.name+'-transcript.txt',transcript.join('\n\n-----\n\n'));
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);results.push({route:route.name,viewport:[route.width,route.height],ending:route.end,passed:true,errors,failedRequests:failed});
 await context.close();
}
const context=await browser.newContext();const page=await context.newPage();
await page.goto('http://127.0.0.1:3000');
await page.evaluate(()=>localStorage.setItem('outside-chain-v1',JSON.stringify({scene:3,records:[],choices:{}})));
await page.reload();results.push({check:'inconsistent save rejected',passed:await page.locator('#resume').count()===0});
await page.evaluate(()=>localStorage.setItem('outside-chain-v1','{broken'));
await page.reload();assert.equal(await page.locator('#resume').count(),0);results.push({check:'invalid JSON rejected',passed:true});
await context.close();
const blocked=await browser.newContext();
await blocked.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','QuotaExceededError');};});
const bp=await blocked.newPage();await bp.goto('http://127.0.0.1:3000');await bp.locator('#start').click();
assert.equal(await bp.locator('#save-notice').isVisible(),true);
await bp.locator('[data-choice="0"]').click();assert.equal(await bp.locator('[role=progressbar]').getAttribute('aria-valuenow'),'1');
assert.match(await bp.locator('.choice-heading').innerText(),/이 창에서만/);
results.push({check:'blocked storage warns and permits play',passed:true});await blocked.close();
}finally{await browser.close();await writeFile(out+'browser-results.json',JSON.stringify(results,null,2));}
console.log(JSON.stringify(results,null,2));
if(results.some(r=>!r.passed))process.exitCode=1;
