const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db.json');

const SEED = {
  admin_users: [],
  models: [
    { id:1,  name:'Splendor Plus',   type:'bike',    engine:'97.2cc',  mileage:'60 kmpl', weight:'102 kg', price:'₹74,900',   price_num:74900,  color:'#E8001D', badge:'Bestseller',  featured:true,  available:true },
    { id:2,  name:'HF Deluxe',       type:'bike',    engine:'97.2cc',  mileage:'65 kmpl', weight:'111 kg', price:'₹64,900',   price_num:64900,  color:'#1a1a2e', badge:'Value',        featured:false, available:true },
    { id:3,  name:'Passion Pro',     type:'bike',    engine:'113cc',   mileage:'58 kmpl', weight:'120 kg', price:'₹79,500',   price_num:79500,  color:'#0f3460', badge:'Comfort',      featured:false, available:true },
    { id:4,  name:'Super Splendor',  type:'bike',    engine:'124.7cc', mileage:'55 kmpl', weight:'126 kg', price:'₹87,900',   price_num:87900,  color:'#16213e', badge:'Popular',      featured:true,  available:true },
    { id:5,  name:'Glamour',         type:'bike',    engine:'124.7cc', mileage:'52 kmpl', weight:'125 kg', price:'₹89,500',   price_num:89500,  color:'#1b1b2f', badge:'Style',        featured:false, available:true },
    { id:6,  name:'Xtreme 160R',     type:'bike',    engine:'163cc',   mileage:'45 kmpl', weight:'146 kg', price:'₹1,22,900', price_num:122900, color:'#2c003e', badge:'Performance',  featured:true,  available:true },
    { id:7,  name:'Karizma XMR',     type:'bike',    engine:'210cc',   mileage:'35 kmpl', weight:'158 kg', price:'₹1,75,000', price_num:175000, color:'#0d0d0d', badge:'Legend',       featured:true,  available:true },
    { id:8,  name:'Destini 125',     type:'scooter', engine:'124.6cc', mileage:'51 kmpl', weight:'110 kg', price:'₹82,900',   price_num:82900,  color:'#6a0572', badge:'Premium',      featured:false, available:true },
    { id:9,  name:'Pleasure+ 110',   type:'scooter', engine:'110cc',   mileage:'55 kmpl', weight:'99 kg',  price:'₹68,900',   price_num:68900,  color:'#c0392b', badge:'Trendy',       featured:false, available:true },
    { id:10, name:'Maestro Edge 125',type:'scooter', engine:'124.6cc', mileage:'50 kmpl', weight:'108 kg', price:'₹84,500',   price_num:84500,  color:'#154360', badge:'Smart',        featured:true,  available:true },
    { id:11, name:'Xoom 110',        type:'scooter', engine:'110cc',   mileage:'54 kmpl', weight:'103 kg', price:'₹72,000',   price_num:72000,  color:'#1a5276', badge:'New',          featured:false, available:true },
  ],
  appointments: [],
  enquiries: []
};

function load() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch(e) {}
  const data = JSON.parse(JSON.stringify(SEED));
  data.admin_users = [{ id:1, username:'admin', password: bcrypt.hashSync(process.env.ADMIN_PASSWORD||'twinkle2024',10) }];
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  console.log('✅ DB initialized');
  return data;
}

function save(data) { fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2)); }

function nextId(arr) { return arr.length ? Math.max(...arr.map(x=>x.id))+1 : 1; }

module.exports = {
  getModels(f={}) {
    let m = load().models.filter(x=>x.available);
    if(f.type) m=m.filter(x=>x.type===f.type);
    if(f.featured) m=m.filter(x=>x.featured);
    return m.sort((a,b)=>(b.featured?1:0)-(a.featured?1:0)||a.price_num-b.price_num);
  },
  getAllModels() { return [...load().models].sort((a,b)=>b.id-a.id); },
  addModel(d) { const data=load(); const id=nextId(data.models); data.models.push({...d,id,available:true,created_at:new Date().toISOString()}); save(data); return id; },
  updateModel(id,d) { const data=load(); const i=data.models.findIndex(x=>x.id===+id); if(i<0)return false; data.models[i]={...data.models[i],...d,id:+id}; save(data); return true; },
  deleteModel(id) { const data=load(); data.models=data.models.filter(x=>x.id!==+id); save(data); },
  addAppointment(d) { const data=load(); const id=nextId(data.appointments); data.appointments.push({...d,id,status:'pending',created_at:new Date().toISOString()}); save(data); return id; },
  getAppointments() { return [...load().appointments].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); },
  updateAppointment(id,d) { const data=load(); const i=data.appointments.findIndex(x=>x.id===+id); if(i<0)return; data.appointments[i]={...data.appointments[i],...d}; save(data); },
  addEnquiry(d) { const data=load(); data.enquiries.push({...d,id:nextId(data.enquiries),created_at:new Date().toISOString()}); save(data); },
  getEnquiries() { return [...load().enquiries].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); },
  getAdmin(u) { return load().admin_users.find(x=>x.username===u)||null; },
  getStats() {
    const data=load(), today=new Date().toISOString().split('T')[0];
    return { total_models:data.models.length, active_models:data.models.filter(x=>x.available).length, appointments_total:data.appointments.length, appointments_pending:data.appointments.filter(x=>x.status==='pending').length, appointments_today:data.appointments.filter(x=>x.date===today).length, enquiries:data.enquiries.length };
  }
};
