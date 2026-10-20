import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(path.resolve(process.env.KOTORI_QA_ROOT||'.','package.json'));
const {parseHTML}=require('linkedom');
const dist=path.resolve('dist'),html=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const {window}=parseHTML(html),document=window.document;
let storage=new Map(),spoken=[];
for(const id of ['modal']){const el=document.getElementById(id);el.showModal=function(){this.open=true;};el.close=function(){this.open=false;};}
const noOp=()=>{};
window.HTMLCanvasElement.prototype.getContext=()=>({clearRect:noOp,beginPath:noOp,lineTo:noOp,moveTo:noOp,stroke:noOp});
const voice={name:'Test Japanese',lang:'ja-JP',localService:true};
const sandbox={window,document,location:{hash:''},history:{replaceState:(_a,_b,s)=>{sandbox.location.hash=s;}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},navigator:{},speechSynthesis:{getVoices:()=>[voice],cancel:noOp,speak:u=>spoken.push(u)},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},console,URL,Blob,setTimeout:()=>1,clearTimeout:noOp,matchMedia:()=>({matches:false}),fetch:async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(dist,'assets/strokes.json'),'utf8'))})};
window.speechSynthesis=sandbox.speechSynthesis;window.scrollTo=noOp;window.MediaRecorder=null;
const context=vm.createContext(sandbox);
for(const file of ['data.js','core.js','app.js'])vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),context,{filename:file});
const app=window.KotoriCheck,D=window.KData,C=window.KCore;
let checks=0;const check=(value,msg)=>{assert.ok(value,msg);checks++;};
const click=async(action,more={})=>app.handleAction({dataset:{action,...more},classList:{toggle:noOp},setAttribute:noOp});
check(D.words.length===104,'104 authored vocabulary entries');
check(D.kana.flat().filter(Boolean).length===46,'46 basic kana');
check(D.extra.length===58,'58 voiced and contracted sounds');
check(D.grammar.length===12&&D.conversations.length===6&&D.readings.length===4,'content coverage');
check(Object.keys(JSON.parse(fs.readFileSync(path.join(dist,'assets/strokes.json')))).length===92,'92 stroke guides');
for(const route of ['home','kana','words','grammar','conversation','reading','upload','games','review']){app.navigate(route);check(document.querySelector('#main')?.innerHTML.length>300,'route '+route);check(document.querySelector('main h1'),route+' title');check(document.querySelectorAll('main').length===1,'single main '+route);}
for(const kind of ['kana','words','listen','grammar']){for(let n=0;n<15;n++){const qs=C.makeQuiz(kind,D);check(qs.length===10,kind+' count');for(const q of qs){assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}}}
for(const [i,g] of D.grammar.entries())check(C.normalize(app.grammarChunks[i].join(''))===C.normalize(g.example),'sorting target '+g.id);
const target=D.words[8];check(C.makeQuiz('words',D,[target])[0].id===target.id,'targeted review keeps target');check(C.makeQuiz('words',D,[target])[0].options.length===4,'review distractors from full dictionary');
app.startQuiz('words');const q=app.getQuiz();app.answerQuiz(q.qs[0].answer);check(q.score===1&&app.getState().xp===10,'correct answer awards 10 XP');app.answerQuiz(q.qs[0].answer);check(q.score===1&&app.getState().xp===10,'double answers do not award twice');
await click('quiz-next');const wrong=q.qs[1];app.answerQuiz(wrong.options.find(o=>o!==wrong.answer));check(q.score===1&&Object.values(app.getState().wrong).some(w=>w.id===wrong.id),'wrong answer saved');
await click('review-wrong',{kind:'words'});check(app.getQuiz().qs.some(x=>x.id===wrong.id),'wrong review includes exact missed question');app.answerQuiz(app.getQuiz().qs[0].answer);check(Object.keys(app.getState().wrong).length===0,'correct review clears missed item');
app.navigate('words');const word=D.words[0];await click('word-rating',{rating:'1'});check(!app.getState().learned[word.id],'cannot rate before revealing meaning');await click('flip');await click('word-rating',{rating:'1'});check(app.getState().learned[word.id]?.level===1,'word marked learned');check(app.getState().learned[word.id].due>Object.keys(app.getState().days)[0],'spaced recall date');
await click('star',{id:word.id});check(app.getState().stars.includes(word.id),'bookmark word');await click('star',{id:word.id});check(!app.getState().stars.includes(word.id),'unbookmark word');
for(const w of D.words.slice(0,4))app.getState().learned[w.id]={level:1,due:'2000-01-01'};
await click('review-due');const recall=app.getQuiz(),recalled=recall.qs[0];app.answerQuiz(recalled.answer);check(app.getState().learned[recalled.id].level===2,'due review advances interval');check(app.getState().learned[recalled.id].due>'2000-01-01','due review rescheduled');
const oldQuiz=app.getQuiz();sandbox.speechSynthesis.getVoices=()=>[];app.startQuiz('listen');check(app.getQuiz()===oldQuiz,'listening requires a Japanese voice');sandbox.speechSynthesis.getVoices=()=>[voice];
check(C.makeQuiz('listen',D).every(q=>D.words.find(w=>w.id===q.id).reading===q.speech),'listening uses authored readings');
check(app.validProgress(JSON.parse(JSON.stringify(app.getState()))),'valid export imports');check(!app.validProgress({version:1,xp:-1}),'malformed import rejected');check(!app.validProgress({...JSON.parse(JSON.stringify(app.getState())),learned:{w0:{level:99,due:'bad'}}}),'bad levels rejected');check(!app.validProgress({...JSON.parse(JSON.stringify(app.getState())),stars:['<script>']}),'unrecognized bookmarks rejected');
check(C.hira('コーヒー')==='こーひー','katakana conversion');check(C.sentences('今日は晴れ。\n明日は雨！').length===2,'sentence splitting');check(!C.escape('<img onerror="bad">').includes('<'),'escape HTML');
check(!app.rubyFromWords('<script>alert(1)</script>').includes('<script>'),'ruby escapes uploaded text');
check(C.grammarMatches('水を飲みます。ここで待ってください。',D.grammar).some(g=>g.id==='g7'),'detect request grammar');
app.setAnalysis({text:'私<script>alert(1)</script>です。',tokens:[{surface_form:'<script>',pos:'名詞',reading:'スクリプト',basic_form:'<script>'},{surface_form:'私',pos:'名詞',reading:'ワタシ',basic_form:'私'}]});
const analysis=app.analysisHTML();check(!analysis.includes('<script>'),'article tokens escaped');check(analysis.includes('我'),'dictionary Chinese meaning');check(analysis.includes('詞庫尚無中文釋義'),'unknown meanings disclosed');
app.navigate('conversation');await click('role',{value:'A'});check(document.querySelectorAll('.reveal-button').length>0,'roleplay hides own lines');await click('reveal-line',{index:'0'});check(document.querySelector('.dialogue').textContent.includes('林です'),'roleplay reveal');
app.navigate('grammar');for(let i=0;i<4;i++)await click('order-pick',{index:String(i)});check(document.querySelectorAll('.order-output .word-tile').length===4,'sorting tiles movable');await click('order-remove',{index:'0'});check(document.querySelectorAll('.order-output .word-tile').length===3,'sorting tiles removable');
app.navigate('reading');await click('reading-answer',{value:D.readings[0].answer});check(document.querySelectorAll('.story-quiz button:disabled').length===4,'reading answer locks choices');
// Real Kuromoji browser bundle and the actual worker, executed with a file-backed XHR transport.
let workerResult,readyResolve,readyReject;
const ready=new Promise((res,rej)=>{readyResolve=res;readyReject=rej;});
const workerContext=vm.createContext({console,Uint8Array,Uint16Array,Uint32Array,Int8Array,Int16Array,Int32Array,Float64Array,ArrayBuffer,DataView,TextDecoder,setTimeout,clearTimeout,XMLHttpRequest:class{
 open(_m,url){this.url=url;}
 send(){fs.readFile(path.join(dist,this.url),(err,buffer)=>{this.status=err?404:200;this.response=err?null:buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength);if(err)this.onerror?.(err);else this.onload?.();});}
},postMessage:m=>{if(m.type==='ready')readyResolve();else if(m.type==='error')readyReject(new Error(m.message));else workerResult=m;}});
workerContext.self=workerContext;
workerContext.importScripts=file=>vm.runInContext(fs.readFileSync(path.join(dist,file),'utf8'),workerContext);
vm.runInContext(fs.readFileSync(path.join(dist,'analyzer-worker.js'),'utf8'),workerContext);
await Promise.race([ready,new Promise((_r,rej)=>setTimeout(()=>rej(new Error('worker timed out')),20000))]);
workerContext.onmessage({data:{id:42,text:'今日はいい天気です。私は友達と公園へ行きました。'}});
check(workerResult.id===42,'worker request IDs');check(workerResult.tokens.map(t=>t.surface_form).join('')==='今日はいい天気です。私は友達と公園へ行きました。','tokenization preserves text');
check(workerResult.tokens.some(t=>t.surface_form==='天気'&&t.reading==='テンキ'),'real dictionary readings');check(workerResult.tokens.some(t=>t.basic_form==='行く'),'real dictionary base forms');
app.setAnalysis({text:'今日はいい天気です。私は友達と公園へ行きました。',tokens:workerResult.tokens});check(app.analysisHTML().includes('天氣'),'real analysis has Chinese lexicon match');
for(const f of ['index.html','manifest.webmanifest','data.js','core.js','app.js','styles.css','sw.js','analyzer-worker.js','assets/icon.svg','assets/strokes.json','assets/kuromoji/LICENSE-2.0.txt','assets/kuromoji/NOTICE.md','assets/licenses/KanjiVG-COPYING.txt'])check(fs.existsSync(path.join(dist,f)),'asset '+f);
console.log(JSON.stringify({checks,content:{kana:46,kanaStrokeGuides:92,extraKana:D.extra.length,words:D.words.length,grammar:D.grammar.length,conversations:D.conversations.length,readings:D.readings.length},tokenizer:'real bundled worker passed',browserQA:'unavailable; DOM and logic verification only'}));
process.exit(0);
