const express = require("express");
const router = express.Router();
const db = require("../connection");
const excelJS = require('exceljs');

router.get("/", (req, res) => {
  res.render("user/index");
});

router.get("/services", (req, res) => {
  db.query("SELECT * FROM services", (err, services) => {
    if (err) return res.send("DB Error");
    res.render("user/services", { services });
  });
});

router.get("/portfolio", (req, res) => {
  db.query("SELECT * FROM portfolio ORDER BY id DESC", (err, projects) => {
    if (err) return res.send("DB Error");
    res.render("user/portfolio", { projects });
  });
});

router.get("/about", (req, res) => {
  res.render("user/about", { admin: req.session.admin });
});

router.get("/contact", (req, res) => {
  res.render("user/contact", { admin: req.session.admin });
});

router.post("/contact", (req, res) => {
  const { name, email, phone, message } = req.body;

  const sql = "INSERT INTO leads (name, email, phone, message, status, created_at) VALUES (?, ?, ?, ?, 'New', NOW())";
  
  db.query(sql, [name, email, phone, message], (err, result) => {
    if(err) return res.send("DB Error: " + err);

    res.send("Thanks! Your lead has been added successfully.");
  });
});

router.get("/admin/login", (req, res) => {
  res.render("admin/login");
});

router.post("/admin/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password],
    (err, result) => {
      if (err) return res.send("DB Error");
      if (result.length === 0) return res.send("Invalid Login");

      req.session.admin = true;
      req.session.user = result[0];
      res.redirect("/admin/dashboard");
    }
  );
});

router.get("/admin/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

router.get("/admin/dashboard", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT COUNT(*) AS total FROM contacts", (err, leads) => {
    if (err) return res.send("DB Error");

    db.query("SELECT COUNT(*) AS total FROM users", (err, clients) => {
      if (err) return res.send("DB Error");

      res.render("admin/dashboard", {
        user: req.session.user,
        totalLeads: leads[0].total,
        totalEnquiries: leads[0].total,
        activeClients: clients[0].total
      });
    });
  });
});

router.get("/admin/users", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT id, name, email, role, created_at FROM users", (err, users) => {
    if (err) return res.send("DB Error");
    res.render("admin/users", { users });
  });
});

router.get("/admin/services", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT * FROM services", (err, services) => {
    if (err) return res.send("DB Error");
    res.render("admin/services", { services });
  });
});

router.post('/admin/services/add', (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  const { title, icon, description, price } = req.body;
  const sql = "INSERT INTO services (title, icon, description, price, created_at) VALUES (?, ?, ?, ?, NOW())";
  db.query(sql, [title, icon, description, price], (err) => {
    if (err) return res.send("DB Error");
    res.redirect('/admin/services');
  });
});

router.get('/admin/services/edit/:id', (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("SELECT * FROM services WHERE id = ?", [id], (err, results) => {
    if (err) return res.send("DB Error");
    res.render('admin/edit_service', { service: results[0], admin: req.session.admin });
  });
});

router.post('/admin/services/edit/:id', (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  const { title, icon, description, price } = req.body;
  const sql = "UPDATE services SET title=?, icon=?, description=?, price=? WHERE id=?";
  db.query(sql, [title, icon, description, price, id], (err) => {
    if (err) return res.send("DB Error");
    res.redirect('/admin/services');
  });
});

router.get('/admin/services/delete/:id', (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("DELETE FROM services WHERE id=?", [id], (err) => {
    if (err) return res.send("DB Error");
    res.redirect('/admin/services');
  });
});

router.get("/admin/leads", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT * FROM leads ORDER BY created_at DESC", (err, leads) => {
    if (err) return res.send("DB Error");
    res.render("admin/leads", { leads, admin: req.session.admin });
  });
});

router.post("/admin/leads/update/:id", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  const { status } = req.body;
  db.query("UPDATE leads SET status=? WHERE id=?", [status, id], (err) => {
    if (err) return res.send("DB Error");
    res.redirect("/admin/leads");
  });
});

router.get("/admin/leads/export", async (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT * FROM leads", async (err, leads) => {
    if (err) return res.send("DB Error");

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Leads");

    worksheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Message", key: "message", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Created At", key: "created_at", width: 20 }
    ];

    worksheet.addRows(leads);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leads.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  });
});

router.get("/admin/portfolio", (req, res) => {
  if (!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT * FROM portfolio ORDER BY created_at DESC", (err, projects) => {
    if (err) return res.send("DB Error");
    res.render("admin/portfolio", { projects, admin: req.session.admin });
  });
});

router.post("/admin/portfolio/add", (req, res) => {
  if(!req.session.admin) return res.redirect("/admin/login");

  const { title, description, category, image } = req.body;
  db.query("INSERT INTO portfolio (title, description, category, image, created_at) VALUES (?, ?, ?, ?, NOW())",
    [title, description, category, image], (err) => {
      if(err) return res.send("DB Error");
      res.redirect("/admin/portfolio");
    });
});

router.get("/admin/portfolio/edit/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("SELECT * FROM portfolio WHERE id=?", [id], (err, project)=>{
    if(err) return res.send("DB Error");
    res.render("admin/edit_portfolio", { project, admin: req.session.admin });
  });
});

router.post("/admin/portfolio/edit/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  const { title, description, category, image } = req.body;
  db.query("UPDATE portfolio SET title=?, description=?, category=?, image=? WHERE id=?", 
    [title, description, category, image, id], (err)=>{
      if(err) return res.send("DB Error");
      res.redirect("/admin/portfolio");
    });
});

router.get("/admin/portfolio/delete/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("DELETE FROM portfolio WHERE id=?", [id], (err)=>{
    if(err) return res.send("DB Error");
    res.redirect("/admin/portfolio");
  });
});

router.get("/admin/blogs", (req, res) => {
  if(!req.session.admin) return res.redirect("/admin/login");

  db.query("SELECT * FROM blogs ORDER BY created_at DESC", (err, blogs) => {
    if(err) return res.send("DB Error");
    res.render("admin/blogs", { blogs, admin: req.session.admin });
  });
});

router.post("/admin/blogs/add", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const { title, content, seo_keywords, image } = req.body;
  db.query("INSERT INTO blogs (title, content, seo_keywords, image, created_at) VALUES (?, ?, ?, ?, NOW())",
    [title, content, seo_keywords, image], (err)=>{
      if(err) return res.send("DB Error");
      res.redirect("/admin/blogs");
    });
});

router.get("/admin/blogs/edit/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("SELECT * FROM blogs WHERE id=?", [id], (err,blog)=>{
    if(err) return res.send("DB Error");
    res.render("admin/edit_blog", { blog, admin: req.session.admin });
  });
});

router.post("/admin/blogs/edit/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  const { title, content, seo_keywords, image } = req.body;
  db.query("UPDATE blogs SET title=?, content=?, seo_keywords=?, image=? WHERE id=?", 
    [title, content, seo_keywords, image, id], (err)=>{
      if(err) return res.send("DB Error");
      res.redirect("/admin/blogs");
    });
});

router.get("/admin/blogs/delete/:id", (req,res)=>{
  if(!req.session.admin) return res.redirect("/admin/login");

  const id = req.params.id;
  db.query("DELETE FROM blogs WHERE id=?", [id], (err)=>{
    if(err) return res.send("DB Error");
    res.redirect("/admin/blogs");
  });
});
/* ========= SEO PAGES ========= */

router.get("/seo/ai-seo", (req, res) => {
  res.render("seo/ai-seo");
});

router.get("/seo/b2b-seo", (req, res) => {
  res.render("seo/b2b-seo");
});

router.get("/seo/local-seo", (req, res) => {
  res.render("seo/local-seo");
});

router.get("/seo/youtube-seo", (req, res) => {
  res.render("seo/youtube-seo");
});

router.get("/seo/wordpress-seo", (req, res) => {
  res.render("seo/wordpress-seo");
});

router.get("/seo/ecommerce-seo", (req, res) => {
  res.render("seo/ecommerce-seo");
});

router.get("/seo/international-seo", (req, res) => {
  res.render("seo/international-seo");
});
router.get("/sem/google-ads", (req, res) => {
  res.render("sem/google-ads");
});

router.get("/sem/youtube-ads", (req, res) => {
  res.render("sem/youtube-ads");
});

router.get("/sem/instagram-ads", (req, res) => {
  res.render("sem/instagram-ads");
});

router.get("/sem/facebook-ads", (req, res) => {
  res.render("sem/facebook-ads");
});
/* ======================
   SMO PAGES
====================== */

router.get("/smo/youtube", (req, res) => {
  res.render("smo/youtube-marketing");
});

router.get("/smo/linkedin", (req, res) => {
  res.render("smo/linkedin-marketing");
});

router.get("/smo/instagram", (req, res) => {
  res.render("smo/instagram-marketing");
});

router.get("/smo/facebook", (req, res) => {
  res.render("smo/facebook-marketing");
});

router.get("/smo/twitter", (req, res) => {
  res.render("smo/twitter-marketing");
});

module.exports = router;
