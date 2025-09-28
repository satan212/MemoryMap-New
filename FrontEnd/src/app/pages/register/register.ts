import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, HttpClientModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';

  constructor(private router: Router, private http: HttpClient) {}

  register() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    this.http.post('http://localhost:3000/api/register', {
      username: this.username,
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        alert(res.message);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err.error?.message || 'Error registering user');
        console.error(err);
      }
    });
  }
}
