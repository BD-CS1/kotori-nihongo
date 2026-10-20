importScripts('assets/kuromoji/build/kuromoji.js');
let tokenizer=null;
kuromoji.builder({dicPath:'assets/kuromoji/dict/'}).build((err,built)=>{
 if(err){postMessage({type:'error',message:'日語詞典載入失敗，請確認連線後重試。'});return;}
 tokenizer=built;postMessage({type:'ready'});
});
onmessage=e=>{if(!tokenizer)return;try{postMessage({type:'result',id:e.data.id,tokens:tokenizer.tokenize(e.data.text)});}catch{postMessage({type:'error',message:'文章解析失敗，請縮短文章後再試。'});}};
