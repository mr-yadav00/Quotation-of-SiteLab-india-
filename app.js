const BASE_OPTIONS=[
{id:"landing",label:"Landing Page",desc:"1 page, essentials only · 24–48 hrs",rate:1499},
{id:"single",label:"Single Page Professional",desc:"Full sections, WhatsApp CTA · 72 hrs",rate:2999},
{id:"multi",label:"Multi-Page Business",desc:"3–5 pages, standard design",rate:4999},
{id:"premium",label:"Premium Multi-Page",desc:"Custom Blueprint Studio design",rate:8999}];
const ADDONS=[
["maps","Google Maps Location",199],["gallery","Photo / Video Gallery",349],["contact","Contact Enquiry Form",249],
["seo","SEO Basics (meta, sitemap)",349],["blog","Blog / Articles Section",999],["admin","Easy Content Admin Panel",1999],
["booking","Online Booking / Enquiry",1499],["ecom","E-commerce (Catalog + Cart)",4999],["logo","Logo Design",799],
["gbp","Google Business Profile Setup",399],["content","Content Writing (Hi/En)",499],["rush","Rush Delivery (24–48 hrs)",599]];
const BUSINESS_TYPES=["Clinic / Doctor","Gym / Fitness","Hostel / PG","Photographer","Resort / Hotel","Restaurant / Food","Coaching Institute","Builder / Real Estate","Retail / Shop","Other"];
const $=id=>document.getElementById(id), inr=n=>"₹"+Math.round(Number(n)||0).toLocaleString("en-IN");
let state={baseId:"single",addons:{},customItems:[],quoteId:null,saved:[]};

function init(){
  $("businessType").innerHTML=BUSINESS_TYPES.map(x=>`<option>${x}</option>`).join("");
  $("baseOptions").innerHTML=BASE_OPTIONS.map(b=>`<label class="base-option ${b.id===state.baseId?"selected":""}" data-base="${b.id}">
    <div class="base-left"><input type="radio" name="base" ${b.id===state.baseId?"checked":""}><div><b>${b.label}</b><div class="desc">${b.desc}</div></div></div><span class="price">${inr(b.rate)}</span></label>`).join("");
  document.querySelectorAll(".base-option").forEach(el=>el.onclick=()=>{state.baseId=el.dataset.base;render()});
  $("addons").innerHTML=ADDONS.map(a=>`<div class="addon" data-addon="${a[0]}"><label><input type="checkbox"> ${a[1]}</label><input class="rate-input addon-rate" type="number" value="${a[2]}"></div>`).join("");
  document.querySelectorAll(".addon").forEach(el=>{
    const id=el.dataset.addon, cb=el.querySelector("input[type=checkbox]");
    cb.onchange=()=>{state.addons[id]=cb.checked;render()};
    el.querySelector(".addon-rate").oninput=render;
  });
  bind();
  loadIndex();
  render();
}
function bind(){
  ["businessName","ownerName","whatsapp","city","extraPages","extraPageRate","domainName","domainRate","hosting","hostingRate","discountType","discountValue","advancePercent","validityDays","deliveryDays","notes"].forEach(id=>$(id).addEventListener("input",render));
  $("businessType").onchange=render;
  $("hosting").onchange=()=>{toggleHosting();render()};
  $("careplan").onchange=()=>{$("careplanRate").disabled=!$("careplan").checked;render()};
  $("careplanRate").oninput=render;$("applyGst").onchange=render;
  $("historyBtn").onclick=()=>{$("history").classList.toggle("hidden");renderHistory()};
  $("closeHistory").onclick=()=>$("history").classList.add("hidden");
  $("addCustom").onclick=()=>{state.customItems.push({id:Date.now(),label:"",qty:1,rate:0});renderCustom();render()};
  $("copyBtn").onclick=copyWhatsApp;$("whatsappBtn").onclick=sendWhatsApp;$("pdfBtn").onclick=pdf;
  $("saveBtn").onclick=save;$("newBtn").onclick=reset;
  $("closeModal").onclick=()=>$("manualModal").classList.add("hidden");
  $("manualCopyBtn").onclick=async()=>{if(await copyText($("manualText").value)){$("manualModal").classList.add("hidden");toast("Copy ho gaya ✅")}};
}
function toggleHosting(){$("hostingRate").classList.toggle("hidden",$("hosting").value!=="paid")}
function values(){
  const addons={};document.querySelectorAll(".addon").forEach(el=>{const id=el.dataset.addon,cb=el.querySelector("input[type=checkbox]");addons[id]={on:cb.checked,rate:+el.querySelector(".addon-rate").value||0}});
  return {client:{businessName:$("businessName").value,businessType:$("businessType").value,ownerName:$("ownerName").value,whatsapp:$("whatsapp").value,city:$("city").value},
    baseId:state.baseId,extraPages:+$("extraPages").value||0,extraPageRate:+$("extraPageRate").value||0,addons,
    domainName:$("domainName").value,domainRate:+$("domainRate").value||0,hosting:$("hosting").value,hostingRate:+$("hostingRate").value||0,
    customItems:state.customItems,careplan:$("careplan").checked,careplanRate:+$("careplanRate").value||0,
    discountType:$("discountType").value,discountValue:+$("discountValue").value||0,applyGst:$("applyGst").checked,
    advancePercent:+$("advancePercent").value||0,validityDays:+$("validityDays").value||0,deliveryDays:+$("deliveryDays").value||0,notes:$("notes").value};
}
function lineItems(v){
  const b=BASE_OPTIONS.find(x=>x.id===v.baseId),items=[{label:b.label,note:b.desc,qty:1,rate:b.rate}];
  if(v.extraPages>0)items.push({label:"Extra Pages",qty:v.extraPages,rate:v.extraPageRate});
  ADDONS.forEach(a=>{if(v.addons[a[0]]?.on)items.push({label:a[1],qty:1,rate:v.addons[a[0]].rate})});
  if(v.domainName.trim())items.push({label:`Domain — ${v.domainName.trim()} · 1 Yr`,qty:1,rate:v.domainRate});
  if(v.hosting==="paid")items.push({label:"Hosting Setup · 1 Yr",qty:1,rate:v.hostingRate});
  v.customItems.forEach(c=>items.push({label:c.label||"Custom Item",qty:+c.qty||1,rate:+c.rate||0}));
  return items;
}
function totals(items,v){
  const subtotal=items.reduce((s,i)=>s+i.qty*i.rate,0);
  const discount=v.discountType==="percent"?Math.round(subtotal*v.discountValue/100):v.discountValue;
  const after=Math.max(subtotal-discount,0),gst=v.applyGst?Math.round(after*.18):0,grand=after+gst,advance=Math.round(grand*v.advancePercent/100);
  return {subtotal,discountAmount:discount,gstAmount:gst,grandTotal:grand,advanceAmount:advance,balanceAmount:grand-advance};
}
function render(){
  const v=values(),items=lineItems(v),t=totals(items,v);
  document.querySelectorAll(".base-option").forEach(x=>x.classList.toggle("selected",x.dataset.base===v.baseId));
  document.querySelectorAll(".addon").forEach(x=>{const id=x.dataset.addon;x.classList.toggle("selected",!!v.addons[id]?.on);x.querySelector('input[type=checkbox]').checked=!!v.addons[id]?.on});
  toggleHosting();
  $("previewBusiness").textContent=v.client.businessName||"—";$("previewType").textContent=`${v.client.businessType} · ${v.client.city}`;
  $("previewWhatsapp").textContent=v.client.whatsapp||"";$("previewValidity").textContent=v.validityDays;
  $("quoteNo").textContent=state.quoteId||quoteId();$("quoteDate").textContent=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"});
  $("previewItems").innerHTML=items.map(i=>`<tr><td>${esc(i.label)}${i.note?`<div class="desc">${esc(i.note)}</div>`:""}</td><td>${i.qty}</td><td>${inr(i.rate)}</td><td>${inr(i.qty*i.rate)}</td></tr>`).join("");
  $("subtotal").textContent=inr(t.subtotal);$("discountAmount").textContent="-"+inr(t.discountAmount);$("gstAmount").textContent=inr(t.gstAmount);$("grandTotal").textContent=inr(t.grandTotal);
  $("discountLine").classList.toggle("hidden",t.discountAmount<=0);$("gstLine").classList.toggle("hidden",!t.gstAmount);
  $("advancePercentPreview").textContent=v.advancePercent;$("advanceAmount").textContent=inr(t.advanceAmount);$("balanceAmount").textContent=inr(t.balanceAmount);
  $("deliveryPreview").textContent=v.deliveryDays;$("carePreview").classList.toggle("hidden",!v.careplan);$("careAmount").textContent=inr(v.careplanRate)+"/mo";$("notesPreview").textContent=v.notes;
  renderCustom();renderHistory();return {v,items,t};
}
function renderCustom(){
  $("customItems").innerHTML=state.customItems.map(c=>`<div class="inline-row" data-custom="${c.id}">
    <input placeholder="Item label" value="${esc(c.label)}"><input type="number" min="1" value="${c.qty}" style="width:65px"><input type="number" value="${c.rate}" style="width:85px"><button class="icon-btn" title="Delete">🗑</button></div>`).join("");
  document.querySelectorAll("[data-custom]").forEach(row=>{const id=+row.dataset.custom,find=()=>state.customItems.find(x=>x.id===id);
    const inputs=row.querySelectorAll("input");inputs[0].oninput=e=>{find().label=e.target.value;render()};inputs[1].oninput=e=>{find().qty=+e.target.value||1;render()};inputs[2].oninput=e=>{find().rate=+e.target.value||0;render()};row.querySelector("button").onclick=()=>{state.customItems=state.customItems.filter(x=>x.id!==id);render()}});
}
function quoteId(){const d=new Date(),ymd=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;return`SL-${ymd}-${String(state.saved.length+1).padStart(3,"0")}`}
function validate(){const v=values(),e=[];if(!v.client.businessName.trim())e.push("Business name daaliye");if(v.client.whatsapp.replace(/\D/g,"").length<10)e.push("Client ka WhatsApp number daaliye");return e}
function showErrors(e){$("errors").innerHTML=e.map(x=>`<div>⚠ ${esc(x)}</div>`).join("");$("errors").classList.toggle("hidden",!e.length)}
function waText(){const {v,items,t}=render(),lines=[`🙏 Namaste ${v.client.businessName||"[Business Name]"},`,"","SiteLab India ki taraf se aapka website quotation:","",`*SiteLab India — Website Quotation*`,`Quotation No: ${state.quoteId||quoteId()}`,`Date: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}`,""];items.forEach((i,n)=>lines.push(`${n+1}. ${i.label}${i.qty>1?` x${i.qty}`:""} — ${inr(i.qty*i.rate)}`));lines.push("----------------------------",`Subtotal: ${inr(t.subtotal)}`);if(t.discountAmount)lines.push(`Discount: -${inr(t.discountAmount)}`);if(t.gstAmount)lines.push(`GST (18%): ${inr(t.gstAmount)}`);lines.push(`*Total: ${inr(t.grandTotal)}*`,``,`Advance (${v.advancePercent}%): ${inr(t.advanceAmount)}`,`Balance on delivery: ${inr(t.balanceAmount)}`,``,`Delivery: ${v.deliveryDays} din, advance milne ke baad`,`Quotation valid: ${v.validityDays} din`);if(v.careplan)lines.push(`Optional — Monthly Care Plan: ${inr(v.careplanRate)}/month`);if(v.notes.trim())lines.push("",v.notes.trim());lines.push("","Koi sawaal ho to WhatsApp karein 🙏","— Kapil Ahir, SiteLab India","sitelabindia.in | wa.me/917878574692");return lines.join("\n")}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch(e){try{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();const ok=document.execCommand("copy");ta.remove();return ok}catch(e){return false}}}
async function copyWhatsApp(){const e=validate();showErrors(e);if(e.length)return;const text=waText();if(await copyText(text))toast("Copy ho gaya — WhatsApp me paste kar dijiye ✅");else{$("manualText").value=text;$("manualModal").classList.remove("hidden")}}
function sendWhatsApp(ev){const e=validate();showErrors(e);if(e.length){ev.preventDefault();return}const n=values().client.whatsapp.replace(/\D/g,"");$("whatsappBtn").href=`https://wa.me/${n.length===10?"91"+n:n}?text=${encodeURIComponent(waText())}`}
function save(){const e=validate();showErrors(e);if(e.length){toast("Pehle required fields bhariye");return}const {v,items,t}=render();const id=state.quoteId||quoteId();state.quoteId=id;const record={id,date:new Date().toISOString(),v,items,t};localStorage.setItem("quotation:"+id,JSON.stringify(record));state.saved=[{id,businessName:v.client.businessName,total:t.grandTotal,date:record.date},...state.saved.filter(x=>x.id!==id)];localStorage.setItem("quotations-index",JSON.stringify(state.saved));$("savedCount").textContent=state.saved.length;toast("Quotation save ho gaya ✅");render()}
function loadIndex(){try{state.saved=JSON.parse(localStorage.getItem("quotations-index")||"[]")}catch(e){state.saved=[]}$("savedCount").textContent=state.saved.length;renderHistory()}
function renderHistory(){const list=$("historyList");$("savedCount").textContent=state.saved.length;if(!state.saved.length){list.innerHTML='<div class="muted">Abhi tak koi quotation save nahi hui.</div>';return}list.innerHTML=state.saved.map(s=>`<div class="saved-row"><div><b>${esc(s.businessName||"Untitled")}</b><div class="muted">${s.id} · ${inr(s.total)} · ${new Date(s.date).toLocaleDateString("en-IN")}</div></div><div class="saved-actions"><button data-load="${s.id}">Load</button><button data-del="${s.id}">Delete</button></div></div>`).join("");list.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>loadQuote(b.dataset.load));list.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteQuote(b.dataset.del))}
function loadQuote(id){const r=JSON.parse(localStorage.getItem("quotation:"+id));const v=r.v;state.quoteId=id;state.baseId=v.baseId;state.customItems=v.customItems||[];state.addons={};$("businessName").value=v.client.businessName;$("businessType").value=v.client.businessType;$("ownerName").value=v.client.ownerName;$("whatsapp").value=v.client.whatsapp;$("city").value=v.client.city;
$("extraPages").value=v.extraPages;$("extraPageRate").value=v.extraPageRate;$("domainName").value=v.domainName;$("domainRate").value=v.domainRate;$("hosting").value=v.hosting;$("hostingRate").value=v.hostingRate;$("careplan").checked=v.careplan;$("careplanRate").value=v.careplanRate;$("discountType").value=v.discountType;$("discountValue").value=v.discountValue;$("applyGst").checked=v.applyGst;$("advancePercent").value=v.advancePercent;$("validityDays").value=v.validityDays;$("deliveryDays").value=v.deliveryDays;$("notes").value=v.notes;
document.querySelectorAll(".addon").forEach(el=>{const id=el.dataset.addon,a=v.addons[id]||{};el.querySelector('input[type=checkbox]').checked=!!a.on;if(a.rate!=null)el.querySelector(".addon-rate").value=a.rate});$("history").classList.add("hidden");render();toast("Quotation load ho gaya")}
function deleteQuote(id){localStorage.removeItem("quotation:"+id);state.saved=state.saved.filter(x=>x.id!==id);localStorage.setItem("quotations-index",JSON.stringify(state.saved));renderHistory();toast("Delete ho gaya")}
function reset(){state.quoteId=null;state.customItems=[];state.addons={};document.querySelectorAll("input,textarea").forEach(x=>{if(x.id==="city")x.value="Kota, Rajasthan";else if(x.type==="checkbox")x.checked=false;else if(x.type==="radio"){}else if(["extraPages","discountValue"].includes(x.id))x.value=0});$("businessName").value="";$("ownerName").value="";$("whatsapp").value="";$("domainName").value="";$("domainRate").value=699;$("extraPageRate").value=999;$("hosting").value="free";$("hostingRate").value=999;$("careplanRate").value=299;$("advancePercent").value=50;$("validityDays").value=7;$("deliveryDays").value=3;$("notes").value="";state.baseId="single";document.querySelector('input[name=base][value="single"]');render();toast("Naya quotation shuru kar diya")}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function toast(s){$("toast").textContent=s;$("toast").classList.remove("hidden");clearTimeout(window._toast);window._toast=setTimeout(()=>$("toast").classList.add("hidden"),3200)}
function pdf(){const e=validate();showErrors(e);if(e.length)return;const {v,items,t}=render();if(!window.jspdf){window.print();return}const {jsPDF}=window.jspdf,doc=new jsPDF({unit:"pt",format:"a4"});let y=50,pw=doc.internal.pageSize.getWidth(),pdfInr=n=>"Rs. "+Math.round(n||0).toLocaleString("en-IN");doc.setFont("helvetica","bold");doc.setFontSize(18);doc.setTextColor(30,79,214);doc.text("SITELAB INDIA",40,y);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(100);doc.text("Website Design & Development - Kota, Rajasthan",40,y+14);doc.text(`No: ${state.quoteId||quoteId()}`,pw-40,40,{align:"right"});doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`,pw-40,52,{align:"right"});doc.text(`Valid: ${v.validityDays} days`,pw-40,64,{align:"right"});y+=34;doc.setDrawColor(198,216,241);doc.line(40,y,pw-40,y);y+=16;doc.setTextColor(16,25,46);doc.setFont("helvetica","bold");doc.text((v.client.businessName||"-").slice(0,45),40,y);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(100);doc.text(`${v.client.businessType} - ${v.client.city}`,40,y+12);y+=32;doc.setTextColor(16,25,46);doc.setFontSize(8);doc.text("ITEM",40,y);doc.text("QTY",pw-220,y);doc.text("RATE",pw-150,y);doc.text("AMOUNT",pw-40,y,{align:"right"});y+=20;doc.setFontSize(9);items.forEach(i=>{if(y>740){doc.addPage();y=50}doc.text(String(i.label).slice(0,55),40,y);doc.text(String(i.qty),pw-220,y);doc.text(pdfInr(i.rate),pw-150,y);doc.text(pdfInr(i.qty*i.rate),pw-40,y,{align:"right"});y+=15});y+=5;doc.line(40,y,pw-40,y);y+=16;doc.text("Subtotal",pw-150,y);doc.text(pdfInr(t.subtotal),pw-40,y,{align:"right"});y+=13;if(t.discountAmount){doc.text("Discount",pw-150,y);doc.text("-"+pdfInr(t.discountAmount),pw-40,y,{align:"right"});y+=13}if(t.gstAmount){doc.text("GST 18%",pw-150,y);doc.text(pdfInr(t.gstAmount),pw-40,y,{align:"right"});y+=13}doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(143,110,34);doc.text("Total",pw-150,y);doc.text(pdfInr(t.grandTotal),pw-40,y,{align:"right"});y+=22;doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(100);doc.text(`Advance (${v.advancePercent}%): ${pdfInr(t.advanceAmount)}`,40,y);y+=12;doc.text(`Balance on delivery: ${pdfInr(t.balanceAmount)}`,40,y);y+=20;doc.text(`Delivery: ${v.deliveryDays} days from advance receipt - Revisions: 2 rounds included`,40,y);y+=12;doc.text("Domain & hosting renewal charges apply after year 1 - Prices in INR",40,y);y+=20;doc.setFont("helvetica","bold");doc.text("Kapil Ahir - SiteLab India - wa.me/917878574692",40,y);doc.save(`SiteLab-Quotation-${state.quoteId||quoteId()}.pdf`);toast("PDF download ho gayi ✅")}
init();
