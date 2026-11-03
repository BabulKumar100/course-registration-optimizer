const S = {key:'default', sc:null, view:'greedy', objective:'score', tab:'planner', pos:{}, sim:{n:300,k:5,cap:80,seed:7}, bench:null, benchT:40, G:null, B:null, rp:{step:0,timer:null}, pref:{tod:'none',free:-1}, E:null, combos:{list:[],total:0}, altRes:null, altRank:0};
const cur = () => S.view==='greedy' ? S.G : S.view==='bt' ? S.B : S.altRes;
const idx = code => S.sc.courses.findIndex(c=>c.code===code);

