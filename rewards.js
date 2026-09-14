/* A local DEMO lock, not server-side identity or anti-cheat. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DivooleeRewards=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';const KEY='divoolee-ascent-campaign-01-claim';
function read(store){try{const raw=store.getItem(KEY);if(!raw)return null;const c=JSON.parse(raw);if(typeof c.prize!=='string'||typeof c.code!=='string')return {prize:'unknown',code:'DEMO-LOCKED'};return c}catch{return {prize:'unknown',code:'DEMO-LOCKED'}}}
function claim(store,game,id,code,album=null){if(read(store))throw Error('already_claimed');// Eligibility is checked by the shared game action below.
 if(game.state!=='over'||!game.result)throw Error('run_not_finished');
 const previous=game.state;if(!game.takeReward(id))throw Error('ineligible');
 const receipt={prize:id,code,score:game.result.score,album,date:new Date().toISOString(),demo:true};
 try{store.setItem(KEY,JSON.stringify(receipt))}catch{game.state=previous;game.events=game.events.filter(e=>e.type!=='win');throw Error('storage_unavailable')}
 return receipt;
}
return{KEY,read,claim};
});
