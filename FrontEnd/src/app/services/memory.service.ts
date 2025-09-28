import { Injectable } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Memory {
  id: string;
  title: string;
  description: string;
  uploadedBy: string;
  tags: string[];
  lat: number;
  lng: number;
  createdAt: Date;
  fileName?: string;
  fileContent?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryService {
  private readonly API_URL = 'http://localhost:3000/api/memories';

  constructor(private http: HttpClient) {}

  async saveMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<string> {
    const newMemory: Memory = {
      ...memory,
      id: this.generateId(),
      createdAt: new Date()
    };

    const res: any = await firstValueFrom(this.http.post(this.API_URL, newMemory));
    return res.id; // backend sends back id
  }

  async getMemories(uploadedBy?: string): Promise<Memory[]> {
    let url = this.API_URL;
    if (uploadedBy) {
      url += `?uploadedBy=${encodeURIComponent(uploadedBy)}`;
    }
    const memories = await firstValueFrom(this.http.get<Memory[]>(url));
    return memories.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt)
    }));
  }

  async getMemoryById(id: string): Promise<Memory | null> {
    const memories = await this.getMemories();
    return memories.find(memory => memory.id === id) || null;
  }

  async getMemoryByLocation(lat: number, lng: number, tolerance: number = 0.001): Promise<Memory[]> {
    const memories = await this.getMemories();
    return memories.filter(memory => 
      Math.abs(memory.lat - lat) < tolerance && 
      Math.abs(memory.lng - lng) < tolerance
    );
  }

  async hasMemoriesNearby(lat: number, lng: number, tolerance: number = 0.01): Promise<boolean> {
    const memories = await this.getMemoryByLocation(lat, lng, tolerance);
    return memories.length > 0;
  }

  async getClosestMemory(lat: number, lng: number): Promise<Memory | null> {
    const memories = await this.getMemories();
    if (memories.length === 0) return null;

    let closestMemory = memories[0];
    let minDistance = this.calculateDistance(lat, lng, closestMemory.lat, closestMemory.lng);

    for (let i = 1; i < memories.length; i++) {
      const distance = this.calculateDistance(lat, lng, memories[i].lat, memories[i].lng);
      if (distance < minDistance) {
        minDistance = distance;
        closestMemory = memories[i];
      }
    }

    return closestMemory;
  }

  async searchMemoriesByTag(tag: string): Promise<Memory[]> {
    const memories = await this.getMemories();
    return memories.filter(memory =>
      memory.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  async getAllTags(): Promise<string[]> {
    const memories = await this.getMemories();
    const allTags = memories.flatMap(memory => memory.tags);
    return [...new Set(allTags)].sort();
  }

  // Helper methods
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
