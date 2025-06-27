import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { NgModel } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { number } from 'echarts';
import { LoginService } from './login.service';
import { UnitService, UnitSettings } from '../settings/unit.service';
import { DialogModule } from 'primeng/dialog';

// import { CommonModule} from '@angular/forms';
@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    FormsModule,
    HttpClientModule,
    RouterModule,
    CommonModule,
    DialogModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  providers: [LoginService],
})
export class LoginComponent {
  constructor(
    private http: HttpClient,
    private router: Router,
    private toastr: ToastrService,
    private loginservice: LoginService,
    private unitService: UnitService
  ) {
    this.licenseExpired = this.loginservice.check();
  }

  signup_form: boolean = false;
  login_form: boolean = true;
  forget_password_form: boolean = false;
  emailVerified: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = false;
  emailInvalid: boolean = false;
  passwordInvalid: boolean = false;
  passwordInvalids: boolean = false;
  username_exists = false;
  email_exists = false;
  userName_signup = '';
  password_signup = '';
  Email_id_signup = '';
  userName_forget = '';
  password_forget = '';
  Email_id_forget = '';
  userName = '';
  password = '';
  Email_id = '';
  errorMsg = '';
  successMsg = '';
  counts: number = 0;
  confirm_password_forget = '';
  confirm_password_signup = '';
  password_forget_invalid: boolean | null = null;
  licenseExpired: boolean = false;

  //For remember me functionality

  // ngOnInit() {
  //   const rememberedUsername = localStorage.getItem('rememberedUsername');
  //   const rememberedPassword = localStorage.getItem('rememberedPassword');

  //   if (rememberedUsername && rememberedPassword) {
  //     this.userName = rememberedUsername;
  //     this.password = rememberedPassword;
  //     this.rememberMe = true;
  //   }
  // }

  //Eye button on password
  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  //Show the signup form
  showSignUpForm(event: Event) {
    event.preventDefault();
    // this.login_form=false;
    // this.signup_form = true;
    this.adminonly();
    this.resetform();
  }

  //To show the forget password form
  showForgetPasswordForm(event: Event) {
    event.preventDefault();
    this.forget_password_form = true;
    this.signup_form = false;
    this.login_form = false;
    this.resetform();
    // this.forget_password();
  }
  //To show the login form
  showLogInForm(event: Event) {
    event.preventDefault();
    this.forget_password_form = false;
    this.signup_form = false;
    this.login_form = true;
    this.emailVerified = false;
    this.username_exists = false;
    this.email_exists = false;
    this.resetform();
    // this.forget_password();
  }

  //To validate the password while typing
  onPasswordChange(value: string, ngModelRef: NgModel) {
    this.password_forget = value;
    this.validateEmail(); // your existing logic
    this.password_forget_invalid = this.passwordInvalids;
  }

  // Regex email validation method
  validateEmail(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailInvalid = !emailRegex.test(this.Email_id_signup);
    // const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]).{7,15}$/;
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    this.passwordInvalid = !passwordRegex.test(this.password_signup);
    this.passwordInvalids = !passwordRegex.test(this.password_forget);
    this.checkusername();
  }

  //To check the user name is in use or not while sign up
  checkusername() {
    const user_name = this.userName_signup;
    const email_id = this.Email_id_signup;
    console.log(user_name, email_id);
    this.loginservice.checkuser(user_name, email_id).subscribe({
      next: (res: any) => {
        console.log('responsecheck', res);
        console.log('responsecheck', res);

        this.username_exists = res.usernameExists === true;
        this.email_exists = res.emailExists === true;
      },
      error: (err) => {
        console.error('Error', err);
        alert('Failed to load data from server');
      },
    });
  }

  // To count the exixting user and limit the signup
  adminonly() {
    this.loginservice.getUsers().subscribe({
      next: (res: any) => {
        console.log('response', res);
        this.counts = parseInt(res[0]?.count || '0', 10);
        if (this.counts == 1) {
          this.toastr.error('Adding user limit exists', 'Validation Error');
          this.signup_form = false;
          this.login_form = true;
        } else {
          this.signup_form = true;
        }
      },
      error: (err) => {
        console.error('Error', err);
        alert('Failed to load data from server');
      },
    });
  }

  //To add the user
  signup() {
    if (this.password_signup !== this.confirm_password_signup) {
      return;
    }

    if (this.userName_signup && this.Email_id_signup && this.password_signup) {
      const newdata = {
        user_name: this.userName_signup,
        password: this.password_signup,
        email_id: this.Email_id_signup,
      };

      this.loginservice.signup_user(newdata).subscribe({
        next: (res) => {
          console.log('Data sent to server:', res);
          this.toastr.success('Data successfully sent to server!', 'Success');
          this.signup_form = false;
          this.login_form = true;
        },
        error: (err) => {
          if (err.status === 201) {
            console.warn('Created');
            this.toastr.success('Form submitted successfully!', 'Success');
            this.signup_form = false;
            this.login_form = true;
            this.resetform();
          } else {
            console.error('API error:', err);
            this.toastr.error(
              'Something went wrong while sending data to the server',
              'Validation Error'
            );
          }
        },
      });
      // this.signin()
    } else {
      this.toastr.error('All Fields Are Required', 'Validation Error');
    }
  }

  //To allow the user by checking the username and password
  login() {
    if (!this.userName && !this.password) {
      this.toastr.error(
        '❌ All Fields Are Required, please try again.',
        'Access Denied',
        {
          positionClass: 'toast-bottom-right',
          progressBar: true,
          timeOut: 3500,
        }
      );
    } else {
      const user_name = this.userName;
      const password = this.password;
      this.loginservice.login_user(user_name, password).subscribe({
        next: (res: any) => {
          console.log('Login success:', res);
          this.toastr.success('Login successful', 'Success');
          this.errorMsg = '';
          localStorage.setItem('user', JSON.stringify(res.user));

          if (this.rememberMe) {
            localStorage.setItem('rememberedUsername', user_name);
            localStorage.setItem('rememberedPassword', password);
          } else {
            localStorage.removeItem('rememberedUsername');
            localStorage.removeItem('rememberedPassword');
          }
          const loginTime = new Date().getTime();
          localStorage.setItem('loginTime', loginTime.toString());
          this.unitService.setDefaultUnits();
          this.router.navigate(['/base']);
        },
        error: (error) => {
          if (error.status === 401) {
            const message = error.error?.message;

            if (message === 'Invalid password') {
              this.errorMsg = message;
              this.toastr.error(
                '❌ Wrong password, please try again.',
                'Access Denied',
                {
                  positionClass: 'toast-bottom-right',
                  progressBar: true,
                  timeOut: 3500,
                }
              );
            } else if (message === 'User not found') {
              this.errorMsg = message;
              this.toastr.error(
                '❌ User not found. Please check your credentials.',
                'Access Denied',
                {
                  positionClass: 'toast-bottom-right',
                  progressBar: true,
                  timeOut: 3500,
                }
              );
            } else {
              this.errorMsg = 'Unauthorized access.';
            }
          } else {
            this.errorMsg = 'Something went wrong. Please try again.';
            this.toastr.error(this.errorMsg, `Error ${error}`, {
              positionClass: 'toast-bottom-right',
              progressBar: true,
              timeOut: 3500,
            });
          }
        },
      });
    }
  }

  //To verify the username and email exists on the database to reset the password
  forget_password() {
    this.login_form = false;
    const user_name = this.userName_forget;
    const email_id = this.Email_id_forget;
    if (!this.userName_forget && !this.Email_id_forget) {
      this.toastr.error('Please Fill All Fields', 'Validation Error');
    } else if (!this.emailVerified) {
      // Step 1: Verify username and email against the backend
      this.loginservice.forget_password(user_name, email_id).subscribe({
        next: (res: any) => {
          if (res.valid) {
            this.emailVerified = true;
          } else {
            if (res.reason === 'username') {
              this.toastr.error(
                '❌ Username does not exists',
                'Validation Error'
              );
            } else if (res.reason === 'email') {
              this.toastr.error(
                '❌ Email_id does not exists',
                'Validation Error'
              );
            } else {
              this.toastr.error('❌ Invalid Credential', 'Validation Error');
            }
          }
        },
        error: (err) => {
          console.error('Verification error:', err);
          this.toastr.error('Error verifying user.', 'Validation Error');
        },
      });
    } else {
      console.log('this.passsword', this.password_forget);
      const user_name = this.userName_forget;
      const newPassword = this.password_forget;
      this.loginservice.change_password(user_name, newPassword).subscribe({
        next: (res: any) => {
          console.log('response', res);
          this.toastr.success('Password reset successfully!', 'Success');
          this.emailVerified = false;
          this.password_forget = '';
        },
        error: (err) => {
          console.error('Reset error:', err);
          this.toastr.error('Failed to reset password', 'Validation Error');
        },
      });
      this.forget_password_form = false;
      this.login_form = true;
    }
  }

  //Refresh the forms
  resetform() {
    this.userName_signup = '';
    this.Email_id_signup = '';
    this.password_signup = '';
    this.confirm_password_signup = '';
    this.userName_forget = '';
    this.Email_id_forget = '';
    this.password_forget = '';
    this.confirm_password_forget = '';
    this.userName = '';
    this.password = '';
  }
}
