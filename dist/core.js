(function(root){
 'use strict';
 const hira=s=>String(s).replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
 const sentences=text=>(String(text).match(/[^。！？\n]+[。！？]?/g)||[]).map(x=>x.trim()).filter(Boolean);
 const normalize=s=>String(s).normalize('NFKC').replace(/[\s。！？、.,!?]/g,'');
 function grammarMatches(text,grammar){return grammar.filter(g=>g.detect&&new RegExp(g.detect,'u').test(text));}
 function makeQuiz(kind,data,source){
  const words=source?.length?source:data.words;
  if(kind==='grammar')return shuffle(source?.length?source:data.grammar).slice(0,10).map(g=>({id:g.id,kind,prompt:g.quiz,answer:g.answer,options:shuffle(g.options),explain:g.explain,speech:g.reading}));
  const kana=data.kana.flat().filter(Boolean);
  const pool=source?.length?source:kind==='kana'?kana:words;
  return shuffle(pool).slice(0,10).map(w=>{
   const answer=kind==='kana'?w.r:w.zh;
   const alternatives=[...new Set((kind==='kana'?kana:data.words).filter(x=>x!==w).map(x=>kind==='kana'?x.r:x.zh))].filter(x=>x!==answer);
   return {id:w.id||w.h,kind,prompt:kind==='kana'?w.h:w.jp,reading:w.reading,answer,options:shuffle([answer,...shuffle(alternatives).slice(0,3)]),speech:kind==='kana'?w.h:w.reading,explain:kind==='kana'?`${w.h} / ${w.k} 的讀音是 ${w.r}`:`${w.jp}（${w.reading}）：${w.zh}`};
  });
 }
 root.KCore={hira,escape,shuffle,sentences,normalize,grammarMatches,makeQuiz};
 if(typeof module!=='undefined')module.exports=root.KCore;
})(typeof window!=='undefined'?window:globalThis);
