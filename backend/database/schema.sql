-- Database schema for ConnectingFuture messaging system

-- Users table (enhanced)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auth0_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar VARCHAR(500),
  role VARCHAR(100),
  batch VARCHAR(50),
  status ENUM('online', 'offline', 'away', 'busy') DEFAULT 'offline',
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id VARCHAR(255) NOT NULL,
  receiver_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file', 'voice') DEFAULT 'text',
  file_url VARCHAR(500),
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (sender_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
  INDEX idx_sender_receiver (sender_id, receiver_id),
  INDEX idx_timestamp (timestamp)
);

-- Conversations table (for group chats - future use)
CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  type ENUM('direct', 'group') DEFAULT 'direct',
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(auth0_id) ON DELETE SET NULL
);

-- Conversation participants (for group chats - future use)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  role ENUM('admin', 'member') DEFAULT 'member',
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
  UNIQUE KEY unique_participant (conversation_id, user_id)
);

-- Message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(100),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- User blocked contacts
CREATE TABLE IF NOT EXISTS blocked_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  blocker_id VARCHAR(255) NOT NULL,
  blocked_id VARCHAR(255) NOT NULL,
  blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (blocker_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(auth0_id) ON DELETE CASCADE,
  UNIQUE KEY unique_block (blocker_id, blocked_id)
);

-- Insert sample data
INSERT IGNORE INTO users (auth0_id, email, name, role, batch, avatar) VALUES
('user1', 'sarah.johnson@example.com', 'Sarah Johnson', 'Computer Science Graduate', '2018-2022', 'https://images.unsplash.com/photo-1494790108755-2616c6bfb10e?w=150&h=150&fit=crop&crop=face'),
('user2', 'mike.chen@example.com', 'Mike Chen', 'Software Engineering Student', '2020-2024', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'),
('user3', 'emily.davis@example.com', 'Emily Davis', 'Business Student', '2019-2023', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'),
('user4', 'david.wilson@example.com', 'David Wilson', 'Mechanical Engineering', '2016-2020', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');
