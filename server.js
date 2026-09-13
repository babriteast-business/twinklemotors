const express = require('express');
const cors = require('cors');
const compression = require('compression');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'twinkle-secret-2024';

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  const token = (req.headers.authorization||'').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

// PUBLIC
app.get('/api/models', (req,res) => res.json(db.getModels(req.query)));
app.post('/api/appointments', (req,res) => {
  const {name,phone,model,date,message} = req.body;
  if (!name||!phone||!model||!date) return res.status(400).json({error:'Missing fields'});
  res.json({ success:true, id: db.addAppointment({name,phone,model,date,message:message||''}) });
});
app.post('/api/enquiry', (req,res) => {
  const {name,phone,message} = req.body;
  if (!name||!phone) return res.status(400).json({error:'Missing fields'});
  db.addEnquiry({name,phone,message:message||''});
  res.json({success:true});
});

// ADMIN AUTH
app.post('/api/admin/login', (req,res) => {
  const user = db.getAdmin(req.body.username);
  if (!user || !bcrypt.compareSync(req.body.password, user.password))
    return res.status(401).json({error:'Invalid credentials'});
  res.json({ token: jwt.sign({id:user.id,username:user.username}, JWT_SECRET, {expiresIn:'24h'}), username:user.username });
});

// ADMIN
app.get('/api/admin/models',       auth, (req,res) => res.json(db.getAllModels()));
app.post('/api/admin/models',      auth, (req,res) => res.json({success:true, id:db.addModel(req.body)}));
app.put('/api/admin/models/:id',   auth, (req,res) => { db.updateModel(req.params.id, req.body); res.json({success:true}); });
app.delete('/api/admin/models/:id',auth, (req,res) => { db.deleteModel(req.params.id); res.json({success:true}); });
app.get('/api/admin/appointments',      auth, (req,res) => res.json(db.getAppointments()));
app.put('/api/admin/appointments/:id',  auth, (req,res) => { db.updateAppointment(req.params.id, req.body); res.json({success:true}); });
app.get('/api/admin/enquiries', auth, (req,res) => res.json(db.getEnquiries()));
app.get('/api/admin/stats',     auth, (req,res) => res.json(db.getStats()));

app.get('*', (req,res) => res.sendFile(path.join(__dirname, 'public', req.path.includes('admin') ? 'admin.html' : 'index.html')));

app.listen(PORT, () => console.log('Twinkle Showroom on port', PORT));
