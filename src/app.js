import {initial, scenes, choose, ending, restore} from './story.js';
const main = document.querySelector('#main');
const key = 'outside-chain-v1';
let state = initial();
let saved = null;
let saveAvailable = true;
try { const raw = localStorage.getItem(key); try { saved = restore(JSON.parse(raw)); } catch {} } catch { saveAvailable = false; }
const updateSaveNotice = () => { document.querySelector('#save-notice').hidden = saveAvailable; };
const save = () => { try {localStorage.setItem(key, JSON.stringify(state)); saveAvailable = true;} catch { saveAvailable = false; } updateSaveNotice(); };
updateSaveNotice();
const escape = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function scrollTop(){window.scrollTo({top:0,behavior:'instant'}); main.querySelector('h1')?.focus({preventScroll:true});}
function home(){
 main.innerHTML=`<section class="cover"><div class="cover-copy"><p class="eyebrow">AN ORIGINAL STORY INSPIRED BY ABSURDISM</p><p class="intro">선의는 어디에서<br>죄가 되는가.</p><h1 tabindex="-1">사슬의<br><em>바깥</em><span class="period">.</span></h1><p class="description">한 번의 서명. 한 사람의 죽음.<br>그리고 서로의 이유에 묶인 사람들.<br>당신은 이 도시의 기록원입니다.</p><div class="start-actions"><button class="primary" id="start">${saved?'처음부터 시작':'이야기 시작'} <span>↗</span></button>${saved?'<button class="secondary" id="resume">이어하기 →</button>':''}</div><p class="meta">약 15–25분 · 9개 장면 · 3개의 결말<br>죽음, 애도, 제도적 폭력에 관한 이야기를 담고 있습니다.</p></div><div class="cover-art" aria-hidden="true"><div class="sun"></div><div class="chain"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="horizon"></div><span class="art-caption">해안, 어느 여름의 기록<br>ARCHIVE Nº 0001</span><span class="vertical">THE WORLD DOES NOT ANSWER.</span></div></section><section class="cover-note"><span>작품에 관하여</span><p>알베르 카뮈의 《이방인》이 던진 질문에서 출발한 독립적인 이야기입니다. 원작의 인물과 사건을 재현하지 않습니다. 정답을 고르는 대신, 당신이 남긴 말과 그 말이 닿은 사람들을 기억해 주세요.</p></section>`;
 document.querySelector('#start').onclick=()=>{if(saved && !confirm('저장된 진행을 지우고 처음부터 시작할까요?'))return;state=initial();save();render();};
 document.querySelector('#resume')?.addEventListener('click',()=>{state=structuredClone(saved);render();});
}
function toolbar(){return `<nav class="story-nav"><span class="eyebrow">${state.scene<scenes.length?scenes[state.scene].chapter:'EPILOGUE / 남은 사람들'}</span><button id="open-records">기록 ${String(state.records.length).padStart(2,'0')} <span>↗</span></button></nav><div class="progress" role="progressbar" aria-label="이야기 진행" aria-valuemin="0" aria-valuemax="9" aria-valuenow="${state.scene}"><span style="width:${state.scene/9*100}%"></span></div>`;}
function render(){
 if(state.scene>=scenes.length){finish();return;}
 const scene=scenes[state.scene];const paragraphs=typeof scene.paragraphs==='function'?scene.paragraphs(state):scene.paragraphs;
 main.innerHTML=`<section class="reader">${toolbar()}<div class="scene-meta"><span>${scene.location}</span><span>${scene.time}</span></div><h1 tabindex="-1">${scene.title}</h1><article>${paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}</article>${state.scene===8?`<aside class="evidence"><p class="eyebrow">당신이 남긴 기록</p>${state.records.slice(0,7).map(r=>`<p>${escape(r.text)}</p>`).join('')}</aside>`:''}<div class="choice-heading"><span>당신은 어떻게 하겠습니까?</span><span>${saveAvailable?'선택은 자동으로 기록됩니다':'현재 진행은 이 창에서만 유지됩니다'}</span></div><div class="choices">${scene.choices.map((c,i)=>`<button class="choice" data-choice="${i}"><span class="choice-number">0${i+1}</span><span><strong>${escape(c.label)}</strong><small>${escape(c.hint)}</small></span><span class="arrow">↗</span></button>`).join('')}</div></section>`;
 main.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{state=choose(state,Number(b.dataset.choice));save();render();});bindArchive();scrollTop();
}
function finish(){const end=ending(state);main.innerHTML=`<section class="reader ending">${toolbar()}<p class="eyebrow ending-label">ENDING ${end.number} / 3</p><h1 tabindex="-1">${end.name}</h1><p class="ending-lead">${end.lead}</p><article>${end.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}</article><div class="end-mark">○</div><p class="end-note">이 이야기는 당신의 선택을 점수로 매기지 않습니다.<br>남은 것은 기록과, 그 기록보다 큰 사람들입니다.</p><button class="primary" id="restart">다른 선택으로 다시 시작 <span>↗</span></button><p class="credits">사슬의 바깥 · 독립 창작 인터랙티브 픽션<br>부조리, 책임, 그리고 함께 살아가는 일에 관하여</p></section>`;document.querySelector('#restart').onclick=()=>{if(!confirm('현재 결말을 지우고 새 이야기를 시작할까요?'))return;state=initial();save();render();};bindArchive();scrollTop();}
function bindArchive(){document.querySelector('#open-records').onclick=()=>{document.querySelector('#records').innerHTML=state.records.length?state.records.map(r=>`<section class="record"><span class="eyebrow">${escape(r.chapter)}</span><p>${escape(r.text)}</p></section>`).join(''):'<p>아직 기록이 없습니다.</p>';document.querySelector('#archive').showModal();};}
document.querySelector('#close-archive').onclick=()=>document.querySelector('#archive').close();
let audio, oscillators=[], gain;
document.querySelector('#sound').onclick=async()=>{const button=document.querySelector('#sound');if(!audio){const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){button.textContent='소리 미지원';return;}audio=new Audio();gain=audio.createGain();gain.gain.value=0;gain.connect(audio.destination);[110,164.81,220.3].forEach(freq=>{const o=audio.createOscillator();o.frequency.value=freq;o.connect(gain);o.start();oscillators.push(o);});}await audio.resume();const active=button.getAttribute('aria-pressed')==='true';gain.gain.setTargetAtTime(active?0:0.012,audio.currentTime,0.6);button.setAttribute('aria-pressed',String(!active));button.textContent=active?'소리 꺼짐':'소리 켜짐';};
home();
