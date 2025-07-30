import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
async function getDbConnection() {
  return await mysql.createConnection({
    host: process.env.MYSQL_HOST || '127.0.0.1',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'Vijay@123',
    database: process.env.MYSQL_DATABASE || 'ConnectingFuture'
  });
}

export async function POST(request: Request) {
  let connection;
  
  try {
    const userData = await request.json();
    
    // Validate required fields
    if (!userData.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Connect to MySQL database
    connection = await getDbConnection();
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [userData.email]
    );
    
    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      // Update existing user
      await connection.execute(
        `UPDATE users SET 
         fullName = ?, 
         phone = ?,
         occupation = ?,
         interests = ?,
         skills = ?,
         auth0Id = ?,
         updatedAt = NOW()
         WHERE email = ?`,
        [
          userData.fullName || null,
          userData.phone || null,
          userData.occupation || null,
          userData.interests ? JSON.stringify(userData.interests) : null,
          userData.skills ? JSON.stringify(userData.skills) : null,
          userData.auth0Id || null,
          userData.email
        ]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'User updated successfully',
        user: userData 
      }, { status: 200 });
    } else {
      // Insert new user
      await connection.execute(
        `INSERT INTO users (
          email, 
          fullName, 
          phone, 
          occupation,
          interests,
          skills,
          auth0Id,
          createdAt,
          updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userData.email,
          userData.fullName || null,
          userData.phone || null,
          userData.occupation || null,
          userData.interests ? JSON.stringify(userData.interests) : null,
          userData.skills ? JSON.stringify(userData.skills) : null,
          userData.auth0Id || null
        ]
      );
      
      return NextResponse.json({ 
        success: true, 
        message: 'User created successfully',
        user: userData 
      }, { status: 201 });
    }
  } catch (error) {
    console.error('Error saving user data:', error);
    
    // Handle specific database errors
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save user data' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      // Close the database connection
      await connection.end();
    }
  }
}

// Add GET handler to retrieve user data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  let connection;
  
  try {
    // Check if email is provided
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }
    
    // Connect to MySQL database
    connection = await getDbConnection();
    
    // Retrieve user by email
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    // Check if user exists
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Parse JSON fields
    const user = rows[0];
    if (user.interests) user.interests = JSON.parse(user.interests);
    if (user.skills) user.skills = JSON.parse(user.skills);
    
    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving user data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user data' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      // Close the database connection
      await connection.end();
    }
  }
}
