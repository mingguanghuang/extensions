import axios, { AxiosInstance } from 'axios';
import { getMySqlConfig, MySqlConfig ,initDatabase} from '../utils/getMysql';
import * as mysql from 'mysql2/promise';

export class UserManager { 
  private axiosInstance: AxiosInstance;
  private baseUrl: string = "";
  private token: string | null;
  private dbConfig: MySqlConfig = getMySqlConfig();
  private dbConnection: mysql.Connection | null
  constructor() {
    this.token = null;
    this.dbConnection = null;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // 添加请求拦截器来自动添加token
    this.axiosInstance.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
    
  }

  async initMySqlDatabase(): Promise<void> {
    this.dbConnection = await initDatabase(this.dbConfig);
  }
  /**
   * 设置认证token
   * @param token 认证token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * 清除认证token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * 验证token是否有效
   * @returns Promise<boolean> token是否有效
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.axiosInstance.post('/api/user/verify-token');
      return response.status === 200 && response.data.code === 0;
    } catch (error) {
      console.error('Token验证失败:', error);
      return false;
    }
  }

  /**
   * 获取验证码
   * @param email 用户邮箱
   * @returns Promise<boolean> 是否发送成功
   */
  async getVerificationCode(email: string): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/api/user/verification-code', {
        email,
      });
      
      return response.status === 200;
    } catch (error) {
      console.error('获取验证码失败:', error);
      throw error;
    }
  }

  /**
   * 用户注册
   * @param email 用户邮箱
   * @param password 用户密码
   * @param verificationCode 验证码
   * @returns Promise<{token: string, userId: string}> 注册成功后的用户信息
   */
  async register(email: string, password: string, verificationCode: string): Promise<{token: string, userId: string}> {
    try {
      const response = await this.axiosInstance.post('/api/user/register', {
        email,
        password,
        verification_code: verificationCode,
      });

      if (response.status === 200 && response.data.code === 0) {
        // 如果注册成功，自动设置token
        if (response.data.data.token) {
          this.setToken(response.data.data.token);
        }
        
        // 将用户信息保存到MySQL数据库
        if (this.dbConnection) {
          try {
            await this.dbConnection.execute(
              'INSERT INTO users (email, password, user_id, created_at) VALUES (?, ?, ?, NOW())',
              [email, password, response.data.data.user_id]
            );
            console.log('用户信息已保存到数据库');
          } catch (dbError) {
            console.error('保存用户信息到数据库失败:', dbError);
          }
        }
        
        return {
          token: response.data.data.token,
          userId: response.data.data.user_id,
        };
      } else {
        throw new Error(response.data.message || '注册失败');
      }
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  /**
   * 用户登录
   * @param email 用户邮箱
   * @param password 用户密码
   * @returns Promise<{token: string, userId: string}> 登录成功后的用户信息
   */
  async login(email: string, password: string): Promise<{token: string, userId: string}> {
    try {
      // 先从数据库验证用户信息
      if (this.dbConnection) {
        const [rows]: any = await this.dbConnection.execute(
          'SELECT user_id, email, password FROM users WHERE email = ? AND password = ?',
          [email, password]
        );
        
        if (rows && rows.length > 0) {
          // 数据库验证成功，继续调用API登录
          const response = await this.axiosInstance.post('/api/user/login', {
            email,
            password,
          });

          if (response.status === 200 && response.data.code === 0) {
            // 如果登录成功，自动设置token
            if (response.data.data.token) {
              this.setToken(response.data.data.token);
            }
            return {
              token: response.data.data.token,
              userId: response.data.data.user_id,
            };
          } else {
            throw new Error(response.data.message || '登录失败');
          }
        } else {
          throw new Error('用户名或密码错误');
        }
      } else {
        // 如果没有数据库连接，则直接调用API登录
        const response = await this.axiosInstance.post('/api/user/login', {
          email,
          password,
        });

        if (response.status === 200 && response.data.code === 0) {
          // 如果登录成功，自动设置token
          if (response.data.data.token) {
            this.setToken(response.data.data.token);
          }
          return {
            token: response.data.data.token,
            userId: response.data.data.user_id,
          };
        } else {
          throw new Error(response.data.message || '登录失败');
        }
      }
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  /**
   * 获取当前登录用户的信息
   * @returns Promise<any> 用户信息对象，目前包含用户名，后续可扩展
   */
  public async getCurrentUserInfo(): Promise<any> {
    if (!this.token) {
      throw new Error('用户未登录');
    }

    try {
      const response = await this.axiosInstance.get('/api/user/info');
      
      if (response.status === 200 && response.data.code === 0) {
        // 返回用户信息，目前只包含名称，但结构支持后续扩展
        return {
          name: response.data.data.name || '',
          // 后续可以在这里添加更多用户信息字段
          // email: response.data.data.email,
          // avatar: response.data.data.avatar,
          // etc.
        };
      } else {
        throw new Error(response.data.message || '获取用户信息失败');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

}

