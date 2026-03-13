const https = require('https');
const SHEET_URL = 'https://script.google.com/macros/s/AKfycby8untRQ5dYMqUsZXfSnAhITPceGF3Yds-4rPraDQDNbUYfQrCW6hJ5NtHXxVG60Val/exec';

function get(url, hops=0) {
  return new Promise((res,rej)=>{
    if(hops>5)return rej(new Error('redirects'));
    https.get(url, r=>{
      if(r.statusCode>=300&&r.statusCode<400&&r.headers.location) return get(r.headers.location,hops+1).then(res).catch(rej);
      let d=''; r.on('data',c=>d+=c); r.on('end',()=>res(d));
    }).on('error',rej);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Content-Type','application/json');
  if(req.method==='OPTIONS') return res.status(200).end();
  try {
    if(req.method==='GET'){
      const p=new URLSearchParams(req.query||{});
      const data=await get(SHEET_URL+(p.toString()?'?'+p:''));
      return res.status(200).send(data);
    }
    if(req.method==='POST'){
      const b=req.body;
      const p=new URLSearchParams({action:b.action,...(b.match?{data:JSON.stringify(b.match)}:{}),...(b.id?{id:String(b.id)}:{})});
      const data=await get(SHEET_URL+'?'+p);
      return res.status(200).send(data);
    }
  } catch(e){ return res.status(500).json({error:e.message}); }
};
