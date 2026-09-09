(() => {
  const U="https://mqfipqpmsuapfctotjzo.supabase.co";
  const K="sb_publishable_4sFZXYku2HwgJ7wvHWwKLA_tN-nKxk-";
  const $=id=>document.getElementById(id);
  const set=(id,v)=>{const e=$(id);if(e)e.textContent=v};

  async function req(path, body) {
    const c=new AbortController(), timer=setTimeout(()=>c.abort(),15000);
    try {
      const r=await fetch(U+"/auth/v1/"+path,{
        method:"POST",headers:{apikey:K,"Content-Type":"application/json"},
        body:JSON.stringify(body),cache:"no-store",signal:c.signal
      });
      const t=await r.text(); let d={}; try{d=JSON.parse(t)}catch{}
      if(!r.ok) throw new Error(d.error_description||d.msg||d.message||t||"Login gagal");
      return d;
    } finally { clearTimeout(timer); }
  }

  async function doLogin(ev){
    if(ev)ev.preventDefault();
    const b=$("loginBtn"),m=$("loginMsg"),email=$("email")?.value.trim(),password=$("password")?.value;
    if(!b||!m)return;
    b.disabled=true;m.textContent="Memproses login...";
    try{
      if(!email||!password)throw new Error("Email dan password wajib diisi.");
      const d=await req("token?grant_type=password",{email,password});
      if(!d.access_token)throw new Error("Token login tidak diterima.");
      sessionStorage.setItem("bsc_admin_token",d.access_token);
      if(d.refresh_token)sessionStorage.setItem("bsc_admin_refresh",d.refresh_token);
      location.reload();
    }catch(e){
      m.textContent=e.name==="AbortError"?"Koneksi timeout. Coba lagi.":(e.message||"Login gagal");
    }finally{b.disabled=false}
  }

  function bind(){
    const b=$("loginBtn");
    if(!b)return;
    b.onclick=doLogin;
    $("password")?.addEventListener("keydown",e=>{if(e.key==="Enter")doLogin(e)});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();
