import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrls: ['./login-page.css']
})
export class Login {
  username = '';
  password = '';

  constructor(private router: Router, private http: HttpClient) {}

  login() {
    if (!this.username || !this.password) {
      alert('Please enter username and password');
      return;
    }

    this.http.post('http://localhost:3000/api/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert(err.error?.message || 'Invalid credentials');
        console.error(err);
      }
    });
  }
}
