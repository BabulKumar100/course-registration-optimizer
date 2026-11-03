/* ---------- scenarios ---------- */
const SCEN = {
  default(){ return {
    pool:['CS101','MA101','CS201','MA201'], done:['CS101','MA101','MA201'], minCr:12, maxCr:16, startCredits:0, waitlist:true, existing:[],
    courses:[
      {code:'CS201',name:'Data Structures',cr:4,pre:['CS101'],seats:18,cap:60,prio:90,want:true,meetings:[M(0,9,10),M(2,9,10)]},
      {code:'CS301',name:'Database Systems',cr:3,pre:['CS101'],seats:12,cap:50,prio:85,want:true,meetings:[M(0,9,10),M(3,11,12)]},
      {code:'CS303',name:'Operating Systems',cr:3,pre:['CS101'],seats:8,cap:45,prio:80,want:true,meetings:[M(1,13,14),M(3,13,14)]},
      {code:'CS305',name:'Computer Networks',cr:3,pre:['CS101'],seats:10,cap:40,prio:70,want:true,meetings:[M(2,9,10),M(4,11,12)]},
      {code:'CS401',name:'Algorithms',cr:3,pre:['CS201'],seats:5,cap:40,prio:88,want:true,meetings:[M(1,10,11),M(3,10,11)]},
      {code:'CS403',name:'Machine Learning',cr:4,pre:['MA201'],seats:3,cap:35,prio:75,want:true,meetings:[M(1,13,15),M(4,13,14)]},
      {code:'CS405',name:'Software Engineering',cr:3,pre:['CS101'],seats:0,cap:40,prio:65,want:true,meetings:[M(0,14,15),M(2,14,15)]},
      {code:'MA301',name:'Probability and Statistics',cr:3,pre:['MA201'],seats:14,cap:60,prio:60,want:true,meetings:[M(1,9,10),M(4,9,10)]},
    ]}; },
  ppt(){ return {
    pool:[], done:[], minCr:0, maxCr:18, startCredits:0, waitlist:true, existing:[],
    courses:[
      {code:'CS201',name:'Data Structures',cr:4,pre:[],seats:18,cap:60,prio:90,want:true,meetings:[M(0,10,11)]},
      {code:'CS301',name:'Database Systems',cr:3,pre:[],seats:12,cap:50,prio:70,want:true,meetings:[M(0,10,11)]},
      {code:'CS303',name:'Operating Systems',cr:4,pre:[],seats:8,cap:45,prio:80,want:true,meetings:[M(1,11,12)]},
      {code:'CS305',name:'Computer Networks',cr:3,pre:[],seats:10,cap:40,prio:60,want:true,meetings:[M(2,10,11)]},
    ]}; },
  dry(){ return {
    pool:[], done:[], minCr:0, maxCr:18, startCredits:3, waitlist:true,
    existing:[{label:'Existing class',d:0,s:10,e:11}],
    courses:[
      {code:'CST-A',name:'Report course A',cr:4,pre:[],seats:2,cap:2,prio:95,want:true,meetings:[M(0,9,10)]},
      {code:'CST-B',name:'Report course B',cr:3,pre:[],seats:1,cap:1,prio:80,want:true,meetings:[M(0,10.5,12)]},
      {code:'CST-C',name:'Report course C',cr:3,pre:[],seats:0,cap:0,prio:70,want:true,meetings:[M(0,13,14)]},
    ]}; },
};

