const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database connection pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'velaskara_assessment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function connectDB() {
  try {
    pool = mysql.createPool(dbConfig);
    // test connection
    const connection = await pool.getConnection();
    console.log('Connected to MySQL Database.');
    connection.release();
  } catch (error) {
    console.error('MySQL Database Connection failed:', error);
    process.exit(1);
  }
}

connectDB();

// ----------------------------------------------------
// Helper Functions
// ----------------------------------------------------

// JWT Sign Helper
function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role, outlet_id: user.outlet_id },
    process.env.JWT_SECRET || 'velaskara_jwt_secret_key_2026_change_this',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Mailer Transporter Helper
function getMailTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || '',
      pass: process.env.EMAIL_PASS || ''
    }
  });
}

// ----------------------------------------------------
// Middlewares
// ----------------------------------------------------

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[2] ? authHeader.split(' ')[2] : (authHeader && authHeader.split(' ')[1]);
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'velaskara_jwt_secret_key_2026_change_this');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized access for this role' });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------

// Admin & Auditor Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet_id: user.outlet_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Request OTP (For Manager Secure Access)
app.post('/api/auth/manager/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // 1. Check if user exists and is a manager
    const [userRows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "manager"', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager email not registered' });
    }

    // 2. Generate 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresMinutes = parseInt(process.env.OTP_EXPIRES_MINUTES || '10');
    const expiresAt = new Date(Date.now() + expiresMinutes * 60000);

    // 3. Save to otp_tokens table
    await pool.query(
      'INSERT INTO otp_tokens (email, otp_code, expires_at) VALUES (?, ?, ?)',
      [email, otpCode, expiresAt]
    );

    // 4. Send email if configuration exists (TEMPORARILY DISABLED)
    /*
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const transporter = getMailTransporter();
        const mailOptions = {
          from: process.env.EMAIL_FROM || '"Velaskara Kopay" <your_email@gmail.com>',
          to: email,
          subject: '[Velaskara Audit] Kode OTP Akses Manager',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
              <h2 style="color: #6d4c41; text-align: center;">Velaskara Kopay</h2>
              <h3 style="color: #3e2723; text-align: center; border-bottom: 2px solid #6d4c41; padding-bottom: 10px;">Kode OTP Akses Manager</h3>
              <p>Halo Manager,</p>
              <p>Berikut adalah kode OTP untuk login ke Sistem Audit Velaskara Kopay Anda:</p>
              <div style="text-align: center; margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; tracking: 5px; background: #f5f5f5; padding: 10px 20px; border-radius: 8px; border: 1px solid #ddd; font-family: monospace;">\${otpCode}</span>
              </div>
              <p>Kode OTP ini berlaku selama <strong>\${expiresMinutes} menit</strong>. Jangan bagikan kode ini kepada siapa pun.</p>
              <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">Laporan Audit Operasional & Kepatuhan Velaskara</p>
            </div>
          `
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to manager: \${email}`);
      } catch (mailErr) {
        console.error('Failed to send OTP email:', mailErr);
      }
    }
    */

    // Always return the OTP in response in dev/test mode for manual login helper
    res.json({
      success: true,
      message: 'OTP code sent successfully',
      otp_code: otpCode
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during OTP request' });
  }
});

// Verify OTP & Generate Token
app.post('/api/auth/manager/verify-otp', async (req, res) => {
  const { email, otp_code } = req.body;
  if (!email || !otp_code) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
  }

  try {
    // 1. Fetch active unused OTP code
    const [otpRows] = await pool.query(
      'SELECT * FROM otp_tokens WHERE email = ? AND otp_code = ? AND is_used = FALSE AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email, otp_code]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP code' });
    }

    const otpToken = otpRows[0];

    // 2. Mark OTP as used
    await pool.query('UPDATE otp_tokens SET is_used = TRUE WHERE id = ?', [otpToken.id]);

    // 3. Fetch manager details
    const [userRows] = await pool.query('SELECT * FROM users WHERE email = ? AND role = "manager"', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }

    const user = userRows[0];
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        outlet_id: user.outlet_id
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});



// Get User Profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, outlet_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ----------------------------------------------------
// DYNAMIC CRITERIA ROUTES
// ----------------------------------------------------

// Get Criteria (Supports Pagination, Search, limit)
app.get('/api/criteria', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM criteria c 
      JOIN criteria_categories cat ON c.category_id = cat.id 
      WHERE c.is_active = TRUE
    `;
    let queryParams = [];

    if (search) {
      countQuery += ` AND (c.name LIKE ? OR cat.name LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    let selectQuery = `
      SELECT c.*, cat.name as category_name, cat.weight_percentage 
      FROM criteria c
      JOIN criteria_categories cat ON c.category_id = cat.id
      WHERE c.is_active = TRUE
    `;
    let selectParams = [];

    if (search) {
      selectQuery += ` AND (c.name LIKE ? OR cat.name LIKE ?)`;
      selectParams.push(`%${search}%`, `%${search}%`);
    }

    selectQuery += ` ORDER BY c.category_id ASC, c.id ASC LIMIT ? OFFSET ?`;
    selectParams.push(limit, offset);

    const [data] = await pool.query(selectQuery, selectParams);
    
    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Categories
app.get('/api/criteria/categories', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM criteria_categories ORDER BY id ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add Criteria
app.post('/api/criteria', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { category_id, name, weight } = req.body;

  if (!category_id || !name || !weight) {
    return res.status(400).json({ success: false, message: 'Category ID, name, and weight are required' });
  }

  let weightValue = 0;
  if (weight === 'critical') weightValue = 5;
  else if (weight === 'standard') weightValue = 2;
  else if (weight === 'informational') weightValue = 0;

  try {
    const [result] = await pool.query(
      'INSERT INTO criteria (category_id, name, weight, weight_value) VALUES (?, ?, ?, ?)',
      [category_id, name, weight, weightValue]
    );

    res.status(201).json({
      success: true,
      message: 'Criteria added successfully',
      data: {
        id: result.insertId,
        category_id,
        name,
        weight,
        weight_value: weightValue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Edit Criteria
app.put('/api/criteria/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { category_id, name, weight } = req.body;
  const { id } = req.params;

  if (!category_id || !name || !weight) {
    return res.status(400).json({ success: false, message: 'Category ID, name, and weight are required' });
  }

  let weightValue = 0;
  if (weight === 'critical') weightValue = 5;
  else if (weight === 'standard') weightValue = 2;
  else if (weight === 'informational') weightValue = 0;

  try {
    const [result] = await pool.query(
      'UPDATE criteria SET category_id = ?, name = ?, weight = ?, weight_value = ? WHERE id = ?',
      [category_id, name, weight, weightValue, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Criteria not found' });
    }

    res.json({
      success: true,
      message: 'Criteria updated successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete Criteria (Soft delete/mark as inactive so old audits don't break)
app.delete('/api/criteria/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('UPDATE criteria SET is_active = FALSE WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Criteria not found' });
    }

    res.json({
      success: true,
      message: 'Criteria deleted successfully (archived)'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ----------------------------------------------------
// AUDIT MANAGEMENT ROUTES
// ----------------------------------------------------

// Submit Audit Assessment Form (Admin or Auditor)
app.post('/api/audits', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  const {
    outlet_id,
    audit_date,
    shift,
    
    // Cold storage
    rtd_temp,
    rtd_status,
    milk_temp,
    milk_status,
    freezer_temp,
    freezer_status,
    
    // Espresso calibration
    espresso_dose,
    espresso_pressure,
    espresso_start_sec,
    espresso_finish_sec,
    espresso_yield,
    espresso_color,
    espresso_crema_layers,
    espresso_taste_sweetness,
    espresso_taste_acidity,
    espresso_taste_bitterness,
    espresso_taste_body,
    espresso_taste_aftertaste,
    espresso_calibration_status,
    
    // Financial performance
    target_revenue,
    actual_revenue,
    transaction_count,
    average_ticket_size,
    
    // Audit compliance answers list of: { criteria_id, answer_value: '1'|'0'|'N/A' }
    answers
  } = req.body;

  if (!outlet_id || !audit_date || !shift || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'Missing required fields or invalid answers structure' });
  }

  const auditor_id = req.user.id;
  const accessToken = require('crypto').randomBytes(16).toString('hex'); // Unique link for report

  // Financial calculations
  const actualRevNum = parseFloat(actual_revenue || 0);
  const targetRevNum = parseFloat(target_revenue || 0);
  const achievement_percentage = targetRevNum > 0 ? (actualRevNum / targetRevNum) * 100 : 0;
  const revenue_variance = actualRevNum - targetRevNum;
  const revenue_status = actualRevNum >= targetRevNum ? 'PASS' : 'FAIL';
  
  const trxCount = parseInt(transaction_count || 0);
  const avgTicketSize = parseFloat(average_ticket_size || 0);
  const revenue_per_transaction = trxCount > 0 ? (actualRevNum / trxCount) : 0;
  
  // Basic financial checks
  const revenueKPI = actualRevNum >= targetRevNum ? 'PASS' : 'FAIL';
  const transactionKPI = trxCount > 0 ? 'PASS' : 'FAIL';
  const ticketSizeKPI = avgTicketSize > 0 ? 'PASS' : 'FAIL';
  const financial_overall_status = (revenueKPI === 'PASS' && transactionKPI === 'PASS' && ticketSizeKPI === 'PASS') ? 'EXCELLENT' : 'NEEDS IMPROVEMENT';

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Fetch criteria definition to calculate scores correctly on server side
    const [criteriaList] = await connection.query('SELECT id, weight_value FROM criteria WHERE is_active = TRUE');
    const criteriaMap = new Map(criteriaList.map(c => [c.id, c.weight_value]));

    let totalItemsChecked = 0;
    let totalItemsPassed = 0;
    let totalScoreObtained = 0;
    let totalScoreMax = 0;

    const preparedAnswers = [];

    for (const ans of answers) {
      const criteriaId = parseInt(ans.criteria_id);
      const val = ans.answer_value; // '1', '0', 'N/A'
      const note = ans.note || null;

      if (!criteriaMap.has(criteriaId)) continue;
      const weightVal = criteriaMap.get(criteriaId);

      let scoreObtained = 0;
      let scoreMax = 0;

      if (val !== 'N/A') {
        totalItemsChecked++;
        scoreMax = weightVal;
        totalScoreMax += weightVal;
        
        if (val === '1') {
          totalItemsPassed++;
          scoreObtained = weightVal;
          totalScoreObtained += weightVal;
        }
      }

      preparedAnswers.push({
        criteria_id: criteriaId,
        answer_value: val,
        score_obtained: scoreObtained,
        score_max: scoreMax,
        note: note
      });
    }

    const compliance_percentage = totalScoreMax > 0 ? (totalScoreObtained / totalScoreMax) * 100 : 0;

    // 2. Insert into audits
    const insertAuditQuery = `
      INSERT INTO audits (
        outlet_id, auditor_id, audit_date, shift,
        rtd_temp, rtd_status, milk_temp, milk_status, freezer_temp, freezer_status,
        espresso_dose, espresso_pressure, espresso_start_sec, espresso_finish_sec, espresso_yield,
        espresso_color, espresso_crema_layers, espresso_taste_sweetness, espresso_taste_acidity,
        espresso_taste_bitterness, espresso_taste_body, espresso_taste_aftertaste, espresso_calibration_status,
        target_revenue, actual_revenue, achievement_percentage, revenue_variance, revenue_status,
        transaction_count, average_ticket_size, revenue_per_transaction, financial_overall_status,
        total_items_checked, total_items_passed, total_score_obtained, total_score_max, compliance_percentage,
        access_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const auditParams = [
      outlet_id, auditor_id, audit_date, shift,
      rtd_temp, rtd_status, milk_temp, milk_status, freezer_temp, freezer_status,
      espresso_dose, espresso_pressure, espresso_start_sec, espresso_finish_sec, espresso_yield,
      espresso_color, espresso_crema_layers, espresso_taste_sweetness, espresso_taste_acidity,
      espresso_taste_bitterness, espresso_taste_body, espresso_taste_aftertaste, espresso_calibration_status,
      target_revenue, actual_revenue, achievement_percentage, revenue_variance, revenue_status,
      transaction_count, average_ticket_size, revenue_per_transaction, financial_overall_status,
      totalItemsChecked, totalItemsPassed, totalScoreObtained, totalScoreMax, compliance_percentage,
      accessToken
    ];

    const [auditResult] = await connection.query(insertAuditQuery, auditParams);
    const auditId = auditResult.insertId;

    // 3. Insert into audit_answers
    const insertAnswerQuery = `
      INSERT INTO audit_answers (audit_id, criteria_id, answer_value, score_obtained, score_max, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const pAns of preparedAnswers) {
      await connection.query(insertAnswerQuery, [
        auditId,
        pAns.criteria_id,
        pAns.answer_value,
        pAns.score_obtained,
        pAns.score_max,
        pAns.note
      ]);
    }

    await connection.commit();
    connection.release();

    // 4. Send notification email to manager (TEMPORARILY DISABLED)
    /*
    const [outletRows] = await pool.query('SELECT * FROM outlets WHERE id = ?', [outlet_id]);
    if (outletRows.length > 0) {
      const outlet = outletRows[0];
      const managerEmail = outlet.manager_email;
      
      const threshold = parseInt(process.env.PAYMENT_THRESHOLD || '70');
      const requiresPayment = compliance_percentage < threshold;
      const costStr = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(parseInt(process.env.ACCESS_PRICE || '50000'));
      const reportLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/report/${accessToken}`;

      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = getMailTransporter();
          const emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
              <h2 style="color: #6d4c41; text-align: center;">Velaskara Kopay</h2>
              <h3 style="color: #3e2723; text-align: center; border-bottom: 2px solid #6d4c41; padding-bottom: 10px;">Laporan Audit Operasional Baru</h3>
              <p>Halo Manager Outlet <strong>${outlet.name}</strong>,</p>
              <p>Audit operasional dan evaluasi standar layanan telah selesai dilaksanakan pada cabang Anda.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Tanggal:</td><td style="padding: 8px;">${audit_date}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Shift:</td><td style="padding: 8px;">${shift}</td></tr>
                <tr style="background: #f9f9f9;"><td style="padding: 8px; font-weight: bold;">Score Kepatuhan:</td><td style="padding: 8px; font-weight: bold; color: ${compliance_percentage >= threshold ? '#2e7d32' : '#c62828'}">${compliance_percentage.toFixed(2)}%</td></tr>
              </table>

              \${requiresPayment ? `
                <div style="background: #ffebee; border-left: 4px solid #c62828; padding: 15px; margin: 15px 0; border-radius: 4px;">
                  <strong style="color: #c62828;">Perhatian:</strong> Nilai kepatuhan berada di bawah rata-rata standar minimal (\${threshold}%). Sesuai kebijakan pertanggungjawaban operasional, Anda diharuskan membayar biaya akses laporan sebesar <strong>\${costStr}</strong> untuk dapat membaca rincian temuan serta menandatangani form audit.
                </div>
              ` : `
                <div style="background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; margin: 15px 0; border-radius: 4px;">
                  <strong style="color: #2e7d32;">Selamat!</strong> Nilai kepatuhan outlet Anda memenuhi standar rata-rata (\${threshold}%). Akses laporan audit ini GRATIS dan dapat segera Anda tandatangani.
                </div>
              `}

              <div style="text-align: center; margin: 30px 0;">
                <a href="\${reportLink}" style="background: #6d4c41; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
                  \${requiresPayment ? 'Bayar & Lihat Laporan' : 'Lihat & Tandatangani Laporan'}
                </a>
              </div>

              <p style="font-size: 12px; color: #888; text-align: center;">Jangan bagikan link ini kepada pihak manapun. Tautan ini bersifat privat untuk manager outlet.</p>
            </div>
          `;

          await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Velaskara Kopay" <your_email@gmail.com>',
            to: managerEmail,
            subject: `[Audit Velaskara] \${outlet.name} - \${audit_date} (\${compliance_percentage.toFixed(0)}%)`,
            html: emailBody
          });
          console.log(`Notification email sent to manager: \${managerEmail}`);
        } catch (mailErr) {
          console.error('Failed to send manager audit notification email:', mailErr);
        }
      }
    }
    */

    res.json({
      success: true,
      message: 'Audit submitted successfully',
      audit_id: auditId,
      access_token: accessToken,
      compliance_percentage
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during submission' });
  }
});

// Edit Audit Assessment (Admin Only)
app.put('/api/audits/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const {
    outlet_id,
    audit_date,
    shift,
    
    // Cold storage
    rtd_temp,
    rtd_status,
    milk_temp,
    milk_status,
    freezer_temp,
    freezer_status,
    
    // Espresso calibration
    espresso_dose,
    espresso_pressure,
    espresso_start_sec,
    espresso_finish_sec,
    espresso_yield,
    espresso_color,
    espresso_crema_layers,
    espresso_taste_sweetness,
    espresso_taste_acidity,
    espresso_taste_bitterness,
    espresso_taste_body,
    espresso_taste_aftertaste,
    espresso_calibration_status,
    
    // Financial performance
    target_revenue,
    actual_revenue,
    transaction_count,
    average_ticket_size,
    
    answers
  } = req.body;

  if (!outlet_id || !audit_date || !shift || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ success: false, message: 'Missing required fields or invalid answers structure' });
  }

  const actualRevNum = parseFloat(actual_revenue || 0);
  const targetRevNum = parseFloat(target_revenue || 0);
  const achievement_percentage = targetRevNum > 0 ? (actualRevNum / targetRevNum) * 100 : 0;
  const revenue_variance = actualRevNum - targetRevNum;
  const revenue_status = actualRevNum >= targetRevNum ? 'PASS' : 'FAIL';
  
  const trxCount = parseInt(transaction_count || 0);
  const avgTicketSize = parseFloat(average_ticket_size || 0);
  const revenue_per_transaction = trxCount > 0 ? (actualRevNum / trxCount) : 0;
  
  const revenueKPI = actualRevNum >= targetRevNum ? 'PASS' : 'FAIL';
  const transactionKPI = trxCount > 0 ? 'PASS' : 'FAIL';
  const ticketSizeKPI = avgTicketSize > 0 ? 'PASS' : 'FAIL';
  const financial_overall_status = (revenueKPI === 'PASS' && transactionKPI === 'PASS' && ticketSizeKPI === 'PASS') ? 'EXCELLENT' : 'NEEDS IMPROVEMENT';

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [criteriaList] = await connection.query('SELECT id, weight_value FROM criteria WHERE is_active = TRUE');
    const criteriaMap = new Map(criteriaList.map(c => [c.id, c.weight_value]));

    let totalItemsChecked = 0;
    let totalItemsPassed = 0;
    let totalScoreObtained = 0;
    let totalScoreMax = 0;

    const preparedAnswers = [];

    for (const ans of answers) {
      const criteriaId = parseInt(ans.criteria_id);
      const val = ans.answer_value;
      const note = ans.note || null;

      if (!criteriaMap.has(criteriaId)) continue;
      const weightVal = criteriaMap.get(criteriaId);

      let scoreObtained = 0;
      let scoreMax = 0;

      if (val !== 'N/A') {
        totalItemsChecked++;
        scoreMax = weightVal;
        totalScoreMax += weightVal;
        
        if (val === '1') {
          totalItemsPassed++;
          scoreObtained = weightVal;
          totalScoreObtained += weightVal;
        }
      }

      preparedAnswers.push({
        criteria_id: criteriaId,
        answer_value: val,
        score_obtained: scoreObtained,
        score_max: scoreMax,
        note: note
      });
    }

    const compliance_percentage = totalScoreMax > 0 ? (totalScoreObtained / totalScoreMax) * 100 : 0;

    const updateAuditQuery = `
      UPDATE audits SET
        outlet_id = ?, audit_date = ?, shift = ?,
        rtd_temp = ?, rtd_status = ?, milk_temp = ?, milk_status = ?, freezer_temp = ?, freezer_status = ?,
        espresso_dose = ?, espresso_pressure = ?, espresso_start_sec = ?, espresso_finish_sec = ?, espresso_yield = ?,
        espresso_color = ?, espresso_crema_layers = ?, espresso_taste_sweetness = ?, espresso_taste_acidity = ?,
        espresso_taste_bitterness = ?, espresso_taste_body = ?, espresso_taste_aftertaste = ?, espresso_calibration_status = ?,
        target_revenue = ?, actual_revenue = ?, achievement_percentage = ?, revenue_variance = ?, revenue_status = ?,
        transaction_count = ?, average_ticket_size = ?, revenue_per_transaction = ?, financial_overall_status = ?,
        total_items_checked = ?, total_items_passed = ?, total_score_obtained = ?, total_score_max = ?, compliance_percentage = ?
      WHERE id = ?
    `;

    const auditParams = [
      outlet_id, audit_date, shift,
      rtd_temp, rtd_status, milk_temp, milk_status, freezer_temp, freezer_status,
      espresso_dose, espresso_pressure, espresso_start_sec, espresso_finish_sec, espresso_yield,
      espresso_color, espresso_crema_layers, espresso_taste_sweetness, espresso_taste_acidity,
      espresso_taste_bitterness, espresso_taste_body, espresso_taste_aftertaste, espresso_calibration_status,
      target_revenue, actual_revenue, achievement_percentage, revenue_variance, revenue_status,
      transaction_count, average_ticket_size, revenue_per_transaction, financial_overall_status,
      totalItemsChecked, totalItemsPassed, totalScoreObtained, totalScoreMax, compliance_percentage,
      id
    ];

    await connection.query(updateAuditQuery, auditParams);

    await connection.query('DELETE FROM audit_answers WHERE audit_id = ?', [id]);

    const insertAnswerQuery = `
      INSERT INTO audit_answers (audit_id, criteria_id, answer_value, score_obtained, score_max, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const pAns of preparedAnswers) {
      await connection.query(insertAnswerQuery, [
        id,
        pAns.criteria_id,
        pAns.answer_value,
        pAns.score_obtained,
        pAns.score_max,
        pAns.note
      ]);
    }

    await connection.commit();
    connection.release();

    res.json({
      success: true,
      message: 'Audit updated successfully',
      compliance_percentage
    });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during audit update' });
  }
});

// Delete Audit Assessment (Admin Only)
app.delete('/api/audits/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('DELETE FROM audit_answers WHERE audit_id = ?', [id]);

    const [result] = await connection.query('DELETE FROM audits WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Audit deleted successfully' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error during deletion' });
  }
});

// Get raw audit details by ID (Admin or Auditor) for editing
app.get('/api/audits/:id', authenticateToken, requireRole(['admin', 'auditor']), async (req, res) => {
  const { id } = req.params;
  try {
    const [auditRows] = await pool.query('SELECT * FROM audits WHERE id = ?', [id]);
    if (auditRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }
    
    const [answerRows] = await pool.query('SELECT criteria_id, answer_value, note FROM audit_answers WHERE audit_id = ?', [id]);
    
    res.json({
      success: true,
      audit: auditRows[0],
      answers: answerRows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Audit List (Supports Pagination, Search, limit, filtering by outlet or date)
app.get('/api/audits', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const search = req.query.search || '';
    const outletId = req.query.outlet_id || '';
    const offset = (page - 1) * limit;

    let countQuery = `
      SELECT COUNT(*) as total 
      FROM audits a
      JOIN outlets o ON a.outlet_id = o.id
      JOIN users u ON a.auditor_id = u.id
      WHERE 1=1
    `;
    let queryParams = [];

    // Filter by access if manager
    if (req.user.role === 'manager') {
      countQuery = `
        SELECT COUNT(*) as total 
        FROM audits a
        JOIN outlets o ON a.outlet_id = o.id
        JOIN users u ON a.auditor_id = u.id
        JOIN audit_access ac ON a.id = ac.audit_id
        WHERE ac.user_id = ?
      `;
      queryParams.push(req.user.id);
    } else if (outletId) {
      countQuery += ` AND a.outlet_id = ?`;
      queryParams.push(outletId);
    }

    if (search) {
      countQuery += ` AND (o.name LIKE ? OR u.name LIKE ? OR a.shift LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(countQuery, queryParams);
    const total = countResult[0].total;

    let selectQuery = `
      SELECT a.*, o.name as outlet_name, u.name as auditor_name
      FROM audits a
      JOIN outlets o ON a.outlet_id = o.id
      JOIN users u ON a.auditor_id = u.id
      WHERE 1=1
    `;
    let selectParams = [];

    if (req.user.role === 'manager') {
      selectQuery = `
        SELECT a.*, o.name as outlet_name, u.name as auditor_name
        FROM audits a
        JOIN outlets o ON a.outlet_id = o.id
        JOIN users u ON a.auditor_id = u.id
        JOIN audit_access ac ON a.id = ac.audit_id
        WHERE ac.user_id = ?
      `;
      selectParams.push(req.user.id);
    } else if (outletId) {
      selectQuery += ` AND a.outlet_id = ?`;
      selectParams.push(outletId);
    }

    if (search) {
      selectQuery += ` AND (o.name LIKE ? OR u.name LIKE ? OR a.shift LIKE ?)`;
      selectParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    selectQuery += ` ORDER BY a.audit_date DESC, a.id DESC LIMIT ? OFFSET ?`;
    selectParams.push(limit, offset);

    const [data] = await pool.query(selectQuery, selectParams);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get Audit Report Detail (Accessible via Access Token, with authentication checks)
app.get('/api/audits/report/:token', authenticateToken, async (req, res) => {
  const { token } = req.params;

  try {
    const [auditRows] = await pool.query(
      `SELECT a.*, o.name as outlet_name, o.address as outlet_address, u.name as auditor_name 
       FROM audits a
       JOIN outlets o ON a.outlet_id = o.id
       JOIN users u ON a.auditor_id = u.id
       WHERE a.access_token = ?`,
      [token]
    );

    if (auditRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit report not found' });
    }

    const audit = auditRows[0];

    // Enforce access control for managers
    if (req.user.role === 'manager') {
      const [accessRows] = await pool.query(
        'SELECT 1 FROM audit_access WHERE audit_id = ? AND user_id = ?',
        [audit.id, req.user.id]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses ke laporan audit ini' });
      }
    }

    // Get answers
    const [answers] = await pool.query(
      `SELECT aa.*, c.name as criteria_name, c.weight, c.weight_value, cat.name as category_name
       FROM audit_answers aa
       JOIN criteria c ON aa.criteria_id = c.id
       JOIN criteria_categories cat ON c.category_id = cat.id
       WHERE aa.audit_id = ?
       ORDER BY cat.id ASC, c.id ASC`,
      [audit.id]
    );

    res.json({
      success: true,
      payment_required: false,
      audit,
      answers
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Pay Audit Report (Simulate Payment Gateway response - Mocked)
app.post('/api/payment/pay', async (req, res) => {
  const { audit_id } = req.body;
  if (!audit_id) {
    return res.status(400).json({ success: false, message: 'Audit ID is required' });
  }
  try {
    const paymentRef = 'VK-PAY-' + Math.floor(100000 + Math.random() * 900000);
    await pool.query(
      'UPDATE audits SET is_paid = TRUE, payment_ref = ? WHERE id = ?',
      [paymentRef, audit_id]
    );
    res.json({
      success: true,
      message: 'Payment simulated successfully',
      payment_ref: paymentRef
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Submit Online Signature (From Manager)
app.post('/api/audits/report/:token/sign', authenticateToken, async (req, res) => {
  const { token } = req.params;
  const { signature_data, ip_address } = req.body;

  if (!signature_data) {
    return res.status(400).json({ success: false, message: 'Signature data is required' });
  }

  try {
    // Check if report exists and matches
    const [auditRows] = await pool.query('SELECT * FROM audits WHERE access_token = ?', [token]);
    if (auditRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit not found' });
    }

    const audit = auditRows[0];

    // Enforce access control for managers
    if (req.user.role === 'manager') {
      const [accessRows] = await pool.query(
        'SELECT 1 FROM audit_access WHERE audit_id = ? AND user_id = ?',
        [audit.id, req.user.id]
      );
      if (accessRows.length === 0) {
        return res.status(403).json({ success: false, message: 'Anda tidak memiliki akses untuk menandatangani laporan ini' });
      }
    }

    // Save signature
    await pool.query(
      'UPDATE audits SET signature_data = ?, signed_at = NOW(), ip_address = ? WHERE id = ?',
      [signature_data, ip_address || req.ip, audit.id]
    );

    res.json({
      success: true,
      message: 'Audit report signed successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET list of managers and access details for an audit (Admin Only)
app.get('/api/audits/:id/access', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  try {
    const [managers] = await pool.query('SELECT id, name, email FROM users WHERE role = "manager" ORDER BY name ASC');
    const [access] = await pool.query('SELECT user_id FROM audit_access WHERE audit_id = ?', [id]);
    const accessIds = new Set(access.map(row => row.user_id));

    const result = managers.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      has_access: accessIds.has(m.id)
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error fetching audit access list' });
  }
});

// POST update manager access for an audit (Admin Only)
app.post('/api/audits/:id/access', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { manager_ids } = req.body; // Array of manager user IDs

  if (!Array.isArray(manager_ids)) {
    return res.status(400).json({ success: false, message: 'manager_ids must be an array' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Remove existing assignments
    await connection.query('DELETE FROM audit_access WHERE audit_id = ?', [id]);

    // Insert new assignments
    if (manager_ids.length > 0) {
      const insertQuery = 'INSERT INTO audit_access (audit_id, user_id) VALUES (?, ?)';
      for (const managerId of manager_ids) {
        await connection.query(insertQuery, [id, managerId]);
      }
    }

    await connection.commit();
    connection.release();

    res.json({ success: true, message: 'Audit access updated successfully' });
  } catch (err) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error updating audit access' });
  }
});


// ----------------------------------------------------
// OUTLETS MANAGEMENT ROUTES
// ----------------------------------------------------

app.get('/api/outlets', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM outlets ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/outlets', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { name, address, manager_email } = req.body;
  if (!name || !manager_email) {
    return res.status(400).json({ success: false, message: 'Outlet name and manager email are required' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO outlets (name, address, manager_email) VALUES (?, ?, ?)',
      [name, address, manager_email]
    );
    res.json({ success: true, message: 'Outlet created successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ----------------------------------------------------
// USERS MANAGEMENT ROUTES
// ----------------------------------------------------

app.get('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, outlet_id, created_at FROM users ORDER BY name ASC');
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/users', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { name, email, password, role, outlet_id } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, outlet_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, outlet_id || null]
    );
    res.json({ success: true, message: 'User created successfully', id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.put('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, outlet_id } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ success: false, message: 'Name, email, and role are required' });
  }

  try {
    let query = 'UPDATE users SET name = ?, email = ?, role = ?, outlet_id = ?';
    let params = [name, email, role, outlet_id ? parseInt(outlet_id) : null];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = ?';
      params.push(hashedPassword);
    }

    query += ' WHERE id = ?';
    params.push(id);

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  const { id } = req.params;

  if (parseInt(id) === parseInt(req.user.id)) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
  }

  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ----------------------------------------------------
// SYSTEM HEALTHCHECK
// ----------------------------------------------------
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
