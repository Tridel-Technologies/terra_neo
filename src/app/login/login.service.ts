import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GlobalConfig } from '../global/app.global';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  private baseUrl = new GlobalConfig().baseUrl;

  constructor(private http: HttpClient) {}
  getUsers() {
    return this.http.get<any[]>(`${this.baseUrl}getuser`);
  }
  checkuser(user_name: any, email_id: any) {
    const body = { user_name, email_id };
    return this.http.post<any[]>(`${this.baseUrl}check`, body);
  }
  signup_user(newdata: {
    user_name: string;
    password: string;
    email_id: string;
  }) {
    return this.http.post<any[]>(`${this.baseUrl}signup`, newdata);
  }
  login_user(user_name: any, password: any) {
    const cred = { user_name, password };
    return this.http.post<any[]>(`${this.baseUrl}login`, cred);
  }
  forget_password(user_name: any, email_id: any) {
    const data = { user_name, email_id };
    return this.http.post<any[]>(`${this.baseUrl}verifyUser`, data);
  }
  change_password(user_name: any, newPassword: any) {
    const newdata = { user_name, newPassword };
    return this.http.post<any[]>(`${this.baseUrl}resetPassword`, newdata);
  }
}
