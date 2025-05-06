"use strict";(()=>{var e={};e.id=101,e.ids=[101],e.modules={145:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},5900:e=>{e.exports=require("pg")},6249:(e,t)=>{Object.defineProperty(t,"l",{enumerable:!0,get:function(){return function e(t,r){return r in t?t[r]:"then"in t&&"function"==typeof t.then?t.then(t=>e(t,r)):"function"==typeof t&&"default"===r?t:void 0}}})},5541:(e,t,r)=>{r.r(t),r.d(t,{config:()=>l,default:()=>u,routeModule:()=>b});var a={};r.r(a),r.d(a,{default:()=>d});var s=r(1802),o=r(7153),n=r(6249);let i=new(r(5900)).Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:!1}});async function d(e,t){let r=await i.connect();try{switch(e.method){case"GET":let a=await r.query(`
            SELECT b.*, COUNT(bv.id) as vote_count
            FROM beers b
            LEFT JOIN beer_votes bv ON b.id = bv.beer_id
            GROUP BY b.id
            ORDER BY b.prijs;
        `);t.status(200).json(a.rows);break;case"POST":let{existingBeers:s,newBeers:o}=e.body;for(let e of s)await r.query(`UPDATE beers
             SET naam = $1, brouwer = $2, type = $3, "alcoholpercentage" = $4,
                 prijs = $5, remark = $6, status = $7, koelkast = $8,
                 gildeavond = $9, "avg_score" = $10
             WHERE id = $11`,[e.naam,e.brouwer,e.type,e.alcoholpercentage,e.prijs,e.remark,e.status,e.koelkast,e.gildeavond,e.avg_score,e.id]);for(let e of o)await r.query(`INSERT INTO beers (naam, brouwer, type, "alcoholpercentage",
                              prijs, remark, status, koelkast, gildeavond, "avg_score")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,[e.naam,e.brouwer,e.type,e.alcoholpercentage,e.prijs,e.remark,e.status,e.koelkast,e.gildeavond,e.avg_score]);t.status(201).json({message:"Beers updated and added successfully"});break;case"PATCH":let{id:n}=e.query,i=e.body;if(0===Object.keys(i).length)return t.status(400).json({error:"No updates provided."});let d=Object.keys(i).map((e,t)=>`"${e}" = $${t+1}`).join(", "),u=await r.query(`UPDATE beers SET ${d} WHERE id = $${Object.keys(i).length+1}
            RETURNING *`,[...Object.values(i),n]);if(0===u.rows.length)return t.status(404).json({error:`Beer with id: ${n} not found`});let l=await r.query(`
              SELECT b.*, COUNT(bv.id) as vote_count
                FROM beers b
                LEFT JOIN beer_votes bv ON b.id = bv.beer_id
                WHERE b.id = $1
                GROUP BY b.id
           `,[n]);t.status(200).json(l.rows[0]);break;case"DELETE":let{id:b}=e.query,c=await r.query("DELETE FROM beers WHERE id = $1 RETURNING *",[b]);if(0===c.rows.length)return t.status(404).json({error:`Beer with id: ${b} not found`});await r.query("DELETE FROM beer_votes WHERE beer_id = $1",[b]),t.status(200).json(c.rows[0]);break;default:t.setHeader("Allow",["GET","POST","PATCH","DELETE"]),t.status(405).end(`Method ${e.method} Not Allowed`)}}catch(e){console.error("Database operation failed:",e),t.status(500).json({error:"Database operation failed",details:e.message})}finally{r.release()}}let u=(0,n.l)(a,"default"),l=(0,n.l)(a,"config"),b=new s.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/beers",pathname:"/api/beers",bundlePath:"",filename:""},userland:a})},7153:(e,t)=>{var r;Object.defineProperty(t,"x",{enumerable:!0,get:function(){return r}}),function(e){e.PAGES="PAGES",e.PAGES_API="PAGES_API",e.APP_PAGE="APP_PAGE",e.APP_ROUTE="APP_ROUTE"}(r||(r={}))},1802:(e,t,r)=>{e.exports=r(145)}};var t=require("../../webpack-api-runtime.js");t.C(e);var r=t(t.s=5541);module.exports=r})();