import * as crypto from 'crypto';
import * as fs from 'fs';
import * as nodemailer from 'nodemailer';

/**
 * UserManager class handles everything related to users
 * This is the main class for user operations
 * Warning: This class is very large and does many things
 */
interface Connection {
  query(sql: string, params?: any[]): Promise<any[]>;
  execute(sql: string, params?: any[]): Promise<{ affectedRows: number }>;
}

interface ResultSet {
  rows: any[];
  currentIndex: number;
  next(): boolean;
  getInt(column: string): number;
  getString(column: string): string;
  getBoolean(column: string): boolean;
  getTimestamp(column: string): Date;
}

export class UserManager {
  // Database connection - should probably be in a separate class
  private dbConnection: Connection;
  private static instance: UserManager;

  // Email configuration - hardcoded values, not good
  private SMTP_HOST: string = 'smtp.company.com';
  private SMTP_PORT: string = '587';
  private SMTP_USER: string = 'system@company.com';
  private SMTP_PASS: string = 'hardcodedpassword123'; // TODO: Move to config

  // Password validation regex - maybe should be configurable
  private PASSWORD_REGEX: string =
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$';

  // Singleton pattern - not thread safe!
  public static getInstance(): UserManager {
    if (UserManager.instance == null) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  // Constructor - does too many things
  constructor() {
    try {
      // Database setup - should be injected
      // Simulating: Class.forName("com.mysql.jdbc.Driver");
      this.dbConnection = this.createConnection(
        'jdbc:mysql://localhost:3306/users',
        'root',
        'password123' // Another hardcoded password!
      );

      // Create tables if they don't exist - should be in migration scripts
      this.dbConnection.execute(
        'CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(50), password VARCHAR(255), email VARCHAR(100), created_date TIMESTAMP, last_login TIMESTAMP, failed_login_attempts INT DEFAULT 0, is_locked BOOLEAN DEFAULT FALSE, role VARCHAR(20) DEFAULT \'USER\', profile_data TEXT)'
      );
      this.dbConnection.execute(
        'CREATE TABLE IF NOT EXISTS user_sessions (session_id VARCHAR(255) PRIMARY KEY, user_id INT, created_date TIMESTAMP, expires_date TIMESTAMP)'
      );
      this.dbConnection.execute(
        'CREATE TABLE IF NOT EXISTS audit_log (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT, action VARCHAR(100), timestamp TIMESTAMP, ip_address VARCHAR(45))'
      );
    } catch (e) {
      console.error(e); // Bad error handling
      process.exit(1); // Even worse!
    }
  }

  // Simulating JDBC DriverManager.getConnection
  private createConnection(
    url: string,
    user: string,
    password: string
  ): Connection {
    // This would be replaced with actual database connection logic
    return {
      query: async (sql: string, params?: any[]): Promise<any[]> => {
        // Simulated query execution
        return [];
      },
      execute: async (
        sql: string,
        params?: any[]
      ): Promise<{ affectedRows: number }> => {
        // Simulated execute
        return { affectedRows: 0 };
      },
    };
  }

  // This method does EVERYTHING related to user creation
  public async createUser(
    username: string,
    password: string,
    email: string,
    role: string,
    profileData: Map<string, string>
  ): Promise<string> {
    try {
      // Validation - should be in separate methods
      if (username == null || username.length < 3 || username.length > 20) {
        return 'ERROR: Username must be 3-20 characters';
      }
      if (!new RegExp('^[a-zA-Z0-9_]+$').test(username)) {
        return 'ERROR: Username can only contain letters, numbers and underscores';
      }
      if (password == null || !new RegExp(this.PASSWORD_REGEX).test(password)) {
        return 'ERROR: Password must be at least 8 characters with upper, lower and digit';
      }
      if (email == null || !this.isValidEmail(email)) {
        return 'ERROR: Invalid email format';
      }

      // Check if user already exists - SQL in business logic, bad!
      const checkResult = await this.dbConnection.query(
        'SELECT COUNT(*) as count FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      if (checkResult[0].count > 0) {
        return 'ERROR: Username or email already exists';
      }

      // Hash password - algorithm should be configurable
      const hashedPassword = this.hashPassword(password);

      // Insert user - more SQL in business logic
      const result = await this.dbConnection.execute(
        'INSERT INTO users (username, password, email, created_date, role, profile_data) VALUES (?, ?, ?, NOW(), ?, ?)',
        [
          username,
          hashedPassword,
          email,
          role != null ? role : 'USER',
          this.profileDataToJson(profileData),
        ] // Converting to JSON manually - should use library
      );

      if (result.affectedRows > 0) {
        // Send welcome email - mixing concerns
        this.sendWelcomeEmail(email, username);

        // Log the action - more database code mixed in
        this.logUserAction(
          await this.getUserIdByUsername(username),
          'USER_CREATED',
          this.getClientIP()
        );

        return 'SUCCESS: User created successfully';
      } else {
        return 'ERROR: Failed to create user';
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('SQL')) {
        console.error(e); // Bad error handling again
        return 'ERROR: Database error occurred';
      }
      console.error(e);
      return 'ERROR: Unexpected error occurred';
    }
  }

  // Login method - also does too many things
  public async loginUser(
    username: string,
    password: string,
    ipAddress: string
  ): Promise<Map<string, any>> {
    const result = new Map<string, any>();

    try {
      // Check if user exists and get user data - more SQL
      const rows = await this.dbConnection.query(
        'SELECT id, username, password, email, is_locked, failed_login_attempts, last_login FROM users WHERE username = ?',
        [username]
      );

      if (rows.length === 0) {
        result.set('success', false);
        result.set('message', 'Invalid username or password');
        return result;
      }

      const rs = rows[0];

      // Check if account is locked
      const isLocked: boolean = rs.is_locked;
      let failedAttempts: number = rs.failed_login_attempts;

      if (isLocked) {
        result.set('success', false);
        result.set(
          'message',
          'Account is locked due to too many failed login attempts'
        );
        return result;
      }

      // Verify password
      const storedPassword: string = rs.password;
      if (!this.verifyPassword(password, storedPassword)) {
        // Increment failed attempts - more SQL mixed with business logic
        failedAttempts++;
        await this.dbConnection.execute(
          'UPDATE users SET failed_login_attempts = ?, is_locked = ? WHERE username = ?',
          [failedAttempts, failedAttempts >= 5, username] // Magic number!
        );

        result.set('success', false);
        result.set('message', 'Invalid username or password');
        result.set('attempts_remaining', 5 - failedAttempts);
        return result;
      }

      // Successful login - reset failed attempts and update last login
      const userId: number = rs.id;
      const email: string = rs.email;

      await this.dbConnection.execute(
        'UPDATE users SET failed_login_attempts = 0, last_login = NOW() WHERE id = ?',
        [userId]
      );

      // Create session - should be in separate session manager
      const sessionId = this.generateSessionId();
      await this.dbConnection.execute(
        'INSERT INTO user_sessions (session_id, user_id, created_date, expires_date) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR))',
        [sessionId, userId]
      );

      // Log successful login
      this.logUserAction(userId, 'LOGIN_SUCCESS', ipAddress);

      // Send login notification email - more mixing of concerns
      this.sendLoginNotificationEmail(email, username, ipAddress);

      result.set('success', true);
      result.set('message', 'Login successful');
      result.set('session_id', sessionId);
      result.set('user_id', userId);
      result.set('username', username);
      result.set('email', email);

      return result;
    } catch (e) {
      console.error(e);
      result.set('success', false);
      result.set('message', 'Database error occurred');
      return result;
    }
  }

  // Password hashing - using outdated algorithm
  private hashPassword(password: string): string {
    try {
      const md = crypto.createHash('md5'); // MD5 is not secure!
      const hash = md.update(password).digest();
      let sb = '';
      for (const b of hash) {
        sb += b.toString(16).padStart(2, '0');
      }
      return sb;
    } catch (e) {
      throw new Error('Failed to hash password');
    }
  }

  // Password verification - comparing MD5 hashes
  private verifyPassword(password: string, storedHash: string): boolean {
    return this.hashPassword(password) === storedHash;
  }

  // Email validation - could use library
  private isValidEmail(email: string): boolean {
    const emailRegex =
      '^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$';
    const pattern = new RegExp(emailRegex);
    return pattern.test(email);
  }

  // Profile data to JSON - manual JSON creation, error-prone
  private profileDataToJson(profileData: Map<string, string>): string {
    if (profileData == null || profileData.size === 0) {
      return '{}';
    }

    let json = '{';
    let first = true;
    profileData.forEach((value, key) => {
      if (!first) {
        json += ',';
      }
      // No escaping! This will break with quotes or special chars
      json += '"' + key + '":"' + value + '"';
      first = false;
    });
    json += '}';
    return json;
  }

  // Session ID generation - not cryptographically secure
  private generateSessionId(): string {
    return (
      'session_' + Date.now() + '_' + Math.floor(Math.random() * 10000)
    );
  }

  // Get user ID by username - more SQL in business logic
  private async getUserIdByUsername(username: string): Promise<number> {
    try {
      const rows = await this.dbConnection.query(
        'SELECT id FROM users WHERE username = ?',
        [username]
      );
      if (rows.length > 0) {
        return rows[0].id;
      }
    } catch (e) {
      console.error(e);
    }
    return -1;
  }

  // Logging method - mixing database concerns with business logic
  private async logUserAction(
    userId: number,
    action: string,
    ipAddress: string
  ): Promise<void> {
    try {
      await this.dbConnection.execute(
        'INSERT INTO audit_log (user_id, action, timestamp, ip_address) VALUES (?, ?, NOW(), ?)',
        [userId, action, ipAddress]
      );
    } catch (e) {
      console.error(e); // Logging failure should not break the operation
    }
  }

  // Get client IP - should be injected, not hardcoded
  private getClientIP(): string {
    return '127.0.0.1'; // Obviously fake
  }

  // Email sending - mixing email concerns with user management
  private sendWelcomeEmail(email: string, username: string): void {
    try {
      const transporter = nodemailer.createTransport({
        host: this.SMTP_HOST,
        port: parseInt(this.SMTP_PORT),
        auth: {
          user: this.SMTP_USER,
          pass: this.SMTP_PASS,
        },
        secure: false,
      });

      const mailOptions = {
        from: this.SMTP_USER,
        to: email,
        subject: 'Welcome to Our System!',
        text:
          'Dear ' +
          username +
          ',\n\nWelcome to our system! Your account has been created successfully.\n\nBest regards,\nThe Team',
      };

      transporter.sendMail(mailOptions);
    } catch (e) {
      console.error(e); // Email failure should not break user creation
    }
  }

  // Login notification email - duplicate email code
  private sendLoginNotificationEmail(
    email: string,
    username: string,
    ipAddress: string
  ): void {
    try {
      const transporter = nodemailer.createTransport({
        host: this.SMTP_HOST,
        port: parseInt(this.SMTP_PORT),
        auth: {
          user: this.SMTP_USER,
          pass: this.SMTP_PASS,
        },
        secure: false,
      });

      const loginTime = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

      const mailOptions = {
        from: this.SMTP_USER,
        to: email,
        subject: 'Login Notification',
        text:
          'Dear ' +
          username +
          ',\n\nYou have successfully logged in to our system.\n\nLogin time: ' +
          loginTime +
          '\nIP Address: ' +
          ipAddress +
          "\n\nIf this wasn't you, please contact support immediately.\n\nBest regards,\nThe Team",
      };

      transporter.sendMail(mailOptions);
    } catch (e) {
      console.error(e);
    }
  }

  // Get all users - returns too much data, no pagination
  public async getAllUsers(): Promise<Map<string, any>[]> {
    const users: Map<string, any>[] = [];
    try {
      const rows = await this.dbConnection.query('SELECT * FROM users'); // SELECT * is bad practice

      for (const rs of rows) {
        const user = new Map<string, any>();
        user.set('id', rs.id);
        user.set('username', rs.username);
        user.set('email', rs.email);
        user.set('password', rs.password); // NEVER return passwords!
        user.set('created_date', rs.created_date);
        user.set('last_login', rs.last_login);
        user.set('failed_login_attempts', rs.failed_login_attempts);
        user.set('is_locked', rs.is_locked);
        user.set('role', rs.role);
        user.set('profile_data', rs.profile_data);
        users.push(user);
      }
    } catch (e) {
      console.error(e);
    }
    return users;
  }

  // Update user - no validation, accepts any field changes
  public async updateUser(
    userId: number,
    updates: Map<string, any>
  ): Promise<boolean> {
    try {
      let sql = 'UPDATE users SET ';
      const values: any[] = [];

      // Dynamic SQL building - SQL injection risk!
      let first = true;
      updates.forEach((value, key) => {
        if (!first) {
          sql += ', ';
        }
        sql += key + ' = ?'; // No field validation!
        values.push(value);
        first = false;
      });

      sql += ' WHERE id = ?';
      values.push(userId);

      const result = await this.dbConnection.execute(sql, values);
      return result.affectedRows > 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Delete user - no soft delete, no cascading cleanup
  public async deleteUser(userId: number): Promise<boolean> {
    try {
      const result = await this.dbConnection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      // Should also delete sessions and audit logs, but doesn't!

      return result.affectedRows > 0;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  // Export users to CSV - no access control, includes passwords!
  public async exportUsersToCSV(filename: string): Promise<void> {
    try {
      let content =
        'ID,Username,Email,Password,CreatedDate,LastLogin,FailedAttempts,IsLocked,Role\n';

      const users = await this.getAllUsers();
      for (const user of users) {
        content +=
          user.get('id') +
          ',' +
          user.get('username') +
          ',' +
          user.get('email') +
          ',' +
          user.get('password') +
          ',' + // Exporting passwords!
          user.get('created_date') +
          ',' +
          user.get('last_login') +
          ',' +
          user.get('failed_login_attempts') +
          ',' +
          user.get('is_locked') +
          ',' +
          user.get('role') +
          '\n';
      }
      fs.writeFileSync(filename, content);
    } catch (e) {
      console.error(e);
    }
  }

  // Cleanup old sessions - should be a scheduled job, not manual
  public async cleanupOldSessions(): Promise<void> {
    try {
      await this.dbConnection.execute(
        'DELETE FROM user_sessions WHERE expires_date < NOW()'
      );
    } catch (e) {
      console.error(e);
    }
  }
}
