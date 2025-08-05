-- Alumni Portal Database Schema
-- Run this SQL to create the necessary tables

CREATE DATABASE IF NOT EXISTS alumni_portal;
USE alumni_portal;

-- Users table (Alumni and Students)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    auth0_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    picture TEXT,
    bio TEXT,
    user_type ENUM('alumni', 'student') DEFAULT 'alumni',
    graduation_year INT,
    major VARCHAR(255),
    current_job VARCHAR(255),
    company VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    website_url VARCHAR(500),
    location VARCHAR(255),
    is_mentor BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_auth0_id (auth0_id),
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
);

-- Posts/Blog table
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_auth0_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags JSON,
    is_published BOOLEAN DEFAULT TRUE,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    INDEX idx_user (user_auth0_id),
    INDEX idx_category (category),
    INDEX idx_published (is_published)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_auth0_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    event_date DATETIME NOT NULL,
    location VARCHAR(255),
    event_type VARCHAR(100),
    max_attendees INT,
    current_attendees INT DEFAULT 0,
    is_virtual BOOLEAN DEFAULT FALSE,
    meeting_link VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    INDEX idx_user (user_auth0_id),
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type)
);

-- Event Attendees table
CREATE TABLE IF NOT EXISTS event_attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    user_auth0_id VARCHAR(255) NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attendance_status ENUM('registered', 'attended', 'cancelled') DEFAULT 'registered',
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    UNIQUE KEY unique_event_user (event_id, user_auth0_id)
);

-- Job Postings table
CREATE TABLE IF NOT EXISTS job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_auth0_id VARCHAR(255) NOT NULL,
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    job_type VARCHAR(100),
    salary_range VARCHAR(255),
    application_url VARCHAR(500),
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    INDEX idx_user (user_auth0_id),
    INDEX idx_company (company),
    INDEX idx_active (is_active)
);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_auth0_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    donation_type VARCHAR(100),
    message TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    INDEX idx_user (user_auth0_id),
    INDEX idx_status (payment_status)
);

-- Messages table (for internal messaging)
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_auth0_id VARCHAR(255) NOT NULL,
    receiver_auth0_id VARCHAR(255) NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    message_type VARCHAR(100) DEFAULT 'direct',
    parent_message_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    INDEX idx_sender (sender_auth0_id),
    INDEX idx_receiver (receiver_auth0_id),
    INDEX idx_read_status (is_read)
);

-- Mentorship table
CREATE TABLE IF NOT EXISTS mentorship (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_auth0_id VARCHAR(255) NOT NULL,
    mentee_auth0_id VARCHAR(255) NOT NULL,
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
    start_date DATE,
    end_date DATE,
    meeting_frequency VARCHAR(100),
    focus_areas JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    FOREIGN KEY (mentee_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    UNIQUE KEY unique_mentor_mentee (mentor_auth0_id, mentee_auth0_id),
    INDEX idx_mentor (mentor_auth0_id),
    INDEX idx_mentee (mentee_auth0_id),
    INDEX idx_status (status)
);

-- Career Timeline table
CREATE TABLE IF NOT EXISTS career_timeline (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_auth0_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    timeline_type ENUM('education', 'work', 'achievement', 'other') DEFAULT 'work',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_auth0_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
    INDEX idx_user (user_auth0_id),
    INDEX idx_timeline_type (timeline_type)
);
