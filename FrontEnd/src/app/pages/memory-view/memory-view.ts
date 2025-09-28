import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemoryService, Memory } from '../../services/memory.service';

@Component({
  selector: 'app-memory-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './memory-view.html',
  styleUrls: ['./memory-view.css']
})
export class MemoryViewPage implements OnInit {
  memory: Memory | null = null;
  loading: boolean = true;
  error: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private memoryService: MemoryService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const memoryId = params['id'];
      if (memoryId) {
        this.loadMemory(memoryId);
      } else {
        this.error = 'No memory ID provided';
        this.loading = false;
      }
    });
  }

  async loadMemory(id: string) {
    this.loading = true;
    this.error = '';
    
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      this.memory = await this.memoryService.getMemoryById(id);
      
      if (!this.memory) {
        this.error = 'Memory not found';
      }
    } catch (error) {
      console.error('Error loading memory:', error);
      this.error = 'Failed to load memory. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  goBackToMap() {
    this.router.navigate(['/map']);
  }

  viewOnMap() {
    if (this.memory) {
      this.router.navigate(['/map'], {
        queryParams: { 
          lat: this.memory.lat, 
          lng: this.memory.lng,
          zoom: 15
        }
      });
    }
  }

  searchByTag(tag: string) {
    this.router.navigate(['/map'], {
      queryParams: { search: tag }
    });
  }

  addAnotherMemory() {
    if (this.memory) {
      this.router.navigate(['/add-memory'], {
        queryParams: { 
          lat: this.memory.lat, 
          lng: this.memory.lng 
        }
      });
    }
  }

  viewAllMemories() {
    if (this.memory) {
      this.router.navigate(['/memories'], {
        queryParams: { 
          lat: this.memory.lat, 
          lng: this.memory.lng 
        }
      });
    }
  }

  retryLoading() {
    this.route.params.subscribe(params => {
      const memoryId = params['id'];
      if (memoryId) {
        this.loadMemory(memoryId);
      }
    });
  }
}