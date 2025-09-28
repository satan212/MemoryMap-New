import { Component,signal } from '@angular/core';
import { RouterOutlet, RouterModule,RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from 'express';

/*
@Component({
  selector: 'app-root',
  imports: [RouterOutlet,RouterLink,ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('memoryMap');
}
*/


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule,RouterLink,CommonModule,ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  title = 'memory-map';
}