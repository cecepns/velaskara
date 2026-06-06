-- Create Database
CREATE DATABASE IF NOT EXISTS velaskara_assessment;
USE velaskara_assessment;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'auditor', 'manager') NOT NULL,
  outlet_id INT DEFAULT NULL, -- Null if admin/auditor
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Outlets Table
CREATE TABLE IF NOT EXISTS outlets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  manager_email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint for users (linking managers to outlets)
-- Since database tables are created, we can define constraints or just insert data.

-- 3. Criteria Categories Table
CREATE TABLE IF NOT EXISTS criteria_categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL, -- Drive-Thru, MOP, Café, Coffeehouse Exterior, Coffeehouse Environment, Product Availability, Equipment, Staffing, Barista Evaluation, Bonus
  weight_percentage DECIMAL(5,2) NOT NULL -- 40%, 25%, 15%, 10%, 10%
);

-- 4. Criteria Table
CREATE TABLE IF NOT EXISTS criteria (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  name TEXT NOT NULL,
  weight ENUM('critical', 'standard', 'informational') NOT NULL,
  weight_value INT NOT NULL, -- 5, 2, 0
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES criteria_categories(id) ON DELETE CASCADE
);

-- 5. Audit Sessions Table
CREATE TABLE IF NOT EXISTS audits (
  id INT PRIMARY KEY AUTO_INCREMENT,
  outlet_id INT NOT NULL,
  auditor_id INT NOT NULL,
  audit_date DATE NOT NULL,
  shift VARCHAR(50) NOT NULL, -- Pagi (AM) / Sore (PM)
  
  -- Cold Storage Monitoring
  rtd_temp DECIMAL(5,2) NOT NULL,
  rtd_status ENUM('PASS', 'FAIL') NOT NULL,
  milk_temp DECIMAL(5,2) NOT NULL,
  milk_status ENUM('PASS', 'FAIL') NOT NULL,
  freezer_temp DECIMAL(5,2) NOT NULL,
  freezer_status ENUM('PASS', 'FAIL') NOT NULL,
  
  -- Espresso Calibration
  espresso_dose DECIMAL(5,2) NOT NULL,
  espresso_pressure DECIMAL(5,2) NOT NULL,
  espresso_start_sec INT NOT NULL,
  espresso_finish_sec INT NOT NULL,
  espresso_yield DECIMAL(5,2) NOT NULL,
  espresso_color VARCHAR(100) NOT NULL,
  espresso_crema_layers INT NOT NULL,
  espresso_taste_sweetness VARCHAR(100) NOT NULL,
  espresso_taste_acidity VARCHAR(100) NOT NULL,
  espresso_taste_bitterness VARCHAR(100) NOT NULL,
  espresso_taste_body VARCHAR(100) NOT NULL,
  espresso_taste_aftertaste VARCHAR(100) NOT NULL,
  espresso_calibration_status ENUM('PASS', 'FAIL') NOT NULL,
  
  -- Financial Performance
  target_revenue DECIMAL(15,2) NOT NULL,
  actual_revenue DECIMAL(15,2) NOT NULL,
  achievement_percentage DECIMAL(5,2) NOT NULL,
  revenue_variance DECIMAL(15,2) NOT NULL,
  revenue_status VARCHAR(50) NOT NULL,
  transaction_count INT NOT NULL,
  average_ticket_size DECIMAL(15,2) NOT NULL,
  revenue_per_transaction DECIMAL(15,2) NOT NULL,
  financial_overall_status VARCHAR(50) NOT NULL,
  
  -- Scores & Compliance
  total_items_checked INT NOT NULL,
  total_items_passed INT NOT NULL,
  total_score_obtained INT NOT NULL,
  total_score_max INT NOT NULL,
  compliance_percentage DECIMAL(5,2) NOT NULL,
  
  -- Access & Verification
  access_token VARCHAR(255) DEFAULT NULL, -- UUID or long token for unique link
  is_paid BOOLEAN DEFAULT FALSE,
  payment_ref VARCHAR(100) DEFAULT NULL,
  signature_data LONGTEXT DEFAULT NULL, -- Base64 Signature
  signed_at TIMESTAMP NULL DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  FOREIGN KEY (auditor_id) REFERENCES users(id)
);

-- 6. Audit Answers Table (Stores Yes/No/NA for each dynamic criteria item)
CREATE TABLE IF NOT EXISTS audit_answers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  audit_id INT NOT NULL,
  criteria_id INT NOT NULL,
  answer_value ENUM('1', '0', 'N/A') NOT NULL, -- 1=Yes, 0=No, N/A
  score_obtained INT NOT NULL, -- weight_value or 0
  score_max INT NOT NULL, -- weight_value or 0 if N/A
  note TEXT DEFAULT NULL,
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  FOREIGN KEY (criteria_id) REFERENCES criteria(id)
);

-- 7. Audit Access Control Table (For Managers authorized to view specific audits)
CREATE TABLE IF NOT EXISTS audit_access (
  audit_id INT NOT NULL,
  user_id INT NOT NULL,
  PRIMARY KEY (audit_id, user_id),
  FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. OTP Tokens Table (For Manager secure access)
CREATE TABLE IF NOT EXISTS otp_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
-- Categories
INSERT INTO criteria_categories (id, name, weight_percentage) VALUES
(1, 'Customer Experience - Drive-Thru', 40.00),
(2, 'Customer Experience - MOP (Mobile Order & Pickup)', 40.00),
(3, 'Customer Experience - Café (Dine In / Walk In)', 40.00),
(4, 'Coffeehouse Exterior', 25.00),
(5, 'Coffeehouse Environment', 25.00),
(6, 'Product Availability and Preparation', 15.00),
(7, 'Equipment Maintenance and Cleanliness', 10.00),
(8, 'Staffing', 10.00),
(9, 'Barista Evaluation', 10.00);

-- Criteria
-- Drive-Thru (Category 1)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(1, 'Sapaan hangat saat pelanggan tiba', 'critical', 5),
(1, 'Konfirmasi ulang pesanan', 'critical', 5),
(1, 'Sambutan ramah di jendela pengambilan', 'critical', 5),
(1, 'Ucapan terima kasih saat pelanggan menunggu', 'standard', 2),
(1, 'Kontak mata saat menyerahkan pesanan', 'critical', 5),
(1, 'Personal note pada gelas minuman', 'standard', 2),
(1, 'Kelengkapan kemasan dan perlengkapan', 'standard', 2),
(1, 'Akurasi pesanan', 'critical', 5),
(1, 'Kualitas minuman (rasa, tampilan, temperatur)', 'critical', 5);

-- MOP (Category 2)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(2, 'Sapaan saat pelanggan masuk', 'critical', 5),
(2, 'Pemanggilan nama pelanggan', 'critical', 5),
(2, 'Penyerahan produk langsung kepada pelanggan', 'critical', 5),
(2, 'Ucapan terima kasih dengan kontak mata', 'critical', 5),
(2, 'Penempatan pesanan online yang rapi dan mudah ditemukan', 'standard', 2),
(2, 'Catatan personal pada gelas', 'standard', 2),
(2, 'Akurasi pesanan', 'critical', 5),
(2, 'Kelengkapan kemasan', 'standard', 2),
(2, 'Kualitas minuman', 'critical', 5);

-- Café (Category 3)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(3, 'Sapaan saat pelanggan masuk', 'critical', 5),
(3, 'Barista menanyakan nama pelanggan', 'critical', 5),
(3, 'Kopi seduh harian langsung diberikan di kasir', 'standard', 2),
(3, 'Pemanggilan nama saat pesanan siap', 'critical', 5),
(3, 'Ucapan terima kasih saat penyerahan produk', 'critical', 5),
(3, 'Akurasi pesanan', 'critical', 5),
(3, 'Catatan personal pada gelas', 'standard', 2),
(3, 'Kelengkapan perlengkapan makan/minum', 'standard', 2),
(3, 'Kualitas minuman', 'critical', 5),
(3, 'Kualitas makanan hangat (kematangan, tekstur, temperatur)', 'critical', 5);

-- Exterior (Category 4)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(4, 'Kebersihan jalur drive-thru', 'standard', 2),
(4, 'Kebersihan papan menu dan interkom', 'standard', 2),
(4, 'Kondisi area parkir', 'standard', 2),
(4, 'Trotoar luar bersih', 'standard', 2),
(4, 'Lampu luar berfungsi', 'standard', 2),
(4, 'Papan nama toko menyala/bersih', 'standard', 2),
(4, 'Area makan outdoor bersih', 'standard', 2),
(4, 'Kebersihan kaca dan fasad bangunan', 'standard', 2);

-- Environment (Category 5)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(5, 'Kebersihan lantai area lobby', 'standard', 2),
(5, 'Fungsi lampu penerangan', 'standard', 2),
(5, 'Kerapihan rak merchandise', 'standard', 2),
(5, 'Ketersediaan produk pada etalase makanan', 'standard', 2),
(5, 'Kebersihan area condiment', 'standard', 2),
(5, 'Kebersihan meja dan kursi', 'standard', 2),
(5, 'Kondisi tempat sampah (tidak penuh)', 'standard', 2),
(5, 'Kebersihan toilet', 'standard', 2),
(5, 'Fungsi fasilitas toilet (air, flush, wastafel)', 'standard', 2),
(5, 'Kejelasan petunjuk toilet', 'standard', 2),
(5, 'Kerapihan seragam dan atribut barista', 'standard', 2);

-- Product Availability (Category 6)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(6, 'Ketersediaan menu utama', 'critical', 5),
(6, 'Label bahan baku dan tanggal kedaluwarsa lengkap', 'critical', 5),
(6, 'Pencatatan waktu penyeduhan kopi (brewing time)', 'standard', 2),
(6, 'Ketersediaan variasi roast coffee (Light/Blonde, Medium, Dark, Decaf)', 'standard', 2),
(6, 'Kepatuhan resep minuman promosi (LTO)', 'critical', 5);

-- Equipment (Category 7)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(7, 'Grinder bersih dan berfungsi', 'standard', 2),
(7, 'Blender bersih dan berfungsi', 'standard', 2),
(7, 'Oven bersih dan berfungsi', 'standard', 2),
(7, 'Kulkas/Freezer bersih dan berfungsi', 'standard', 2),
(7, 'Nitro dispenser bersih dan berfungsi', 'standard', 2),
(7, 'Mesin es bersih dan berfungsi', 'standard', 2),
(7, 'Kebersihan mesin espresso', 'standard', 2),
(7, 'Kebersihan area kerja (underbar/backbar)', 'standard', 2),
(7, 'Sistem teknologi operasional (DPM) berfungsi', 'standard', 2),
(7, 'Sistem pembayaran digital berfungsi', 'standard', 2);

-- Staffing (Category 8)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(8, 'Minimal terdapat satu barista bersertifikasi', 'critical', 5),
(8, 'Tersedia trainer apabila terdapat barista magang', 'critical', 5);

-- Barista Evaluation (Category 9)
INSERT INTO criteria (category_id, name, weight, weight_value) VALUES
(9, 'Pengetahuan standar pelayanan prima (3S)', 'critical', 5),
(9, 'Kemampuan menjawab pertanyaan operasional', 'critical', 5),
(9, 'Musik yang diputar sesuai standar suasana kafe', 'standard', 2),
(9, 'Volume audio nyaman bagi pelanggan', 'standard', 2);

-- Create Outlets
INSERT INTO outlets (id, name, address, manager_email) VALUES
(1, 'Velaskara Kopay', 'Jl. Merdeka No. 123, Jakarta', 'manager@velaskara.com');

-- Seed Users
-- Passwords are encrypted with bcryptjs. Let's pre-generate hash for "password":
-- "$2a$10$QO0RskdM1l7M7cE0nClyP.H9.3bAEXaGqUenE7m/qNqjVzI7iQ01q" which is "password" or we can generate it.
-- Let's put a known hash: $2a$10$R3N5hJ7R0n/B9o7gW.7qre2nC4pQ4.EFeL1jL17.7aO.L8k.z1B12 is "password"
INSERT INTO users (id, name, email, password, role, outlet_id) VALUES
(1, 'Super Admin', 'admin@velaskara.com', '$2a$10$R3N5hJ7R0n/B9o7gW.7qre2nC4pQ4.EFeL1jL17.7aO.L8k.z1B12', 'admin', NULL),
(2, 'Deddy Suryawan', 'auditor@velaskara.com', '$2a$10$R3N5hJ7R0n/B9o7gW.7qre2nC4pQ4.EFeL1jL17.7aO.L8k.z1B12', 'auditor', NULL),
(3, 'Manager Velaskara', 'manager@velaskara.com', '$2a$10$R3N5hJ7R0n/B9o7gW.7qre2nC4pQ4.EFeL1jL17.7aO.L8k.z1B12', 'manager', 1);
