import { Component, AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemoryService, Memory } from '../../services/memory.service';

declare var google: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapPage implements AfterViewInit, OnDestroy, OnInit {
  map!: google.maps.Map;
  markers: google.maps.Marker[] = [];
  infoWindow!: google.maps.InfoWindow;
  searchTag: string = '';
  availableTags: string[] = [];
  filteredMemoriesCount: number = 0;
  hoverTimeout: any;
  temporaryMarker: google.maps.Marker | null = null;

  constructor(
    private router: Router, 
    private route: ActivatedRoute,
    private memoryService: MemoryService
  ) {}

  ngOnInit() {
    // Check for query parameters from navigation
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchTag = params['search'];
      }
      
      // Handle zoom and center from memory view
      if (params['lat'] && params['lng']) {
        setTimeout(() => {
          if (this.map) {
            const center = new google.maps.LatLng(+params['lat'], +params['lng']);
            this.map.setCenter(center);
            if (params['zoom']) {
              this.map.setZoom(+params['zoom']);
            }
          }
        }, 500);
      }
    });
  }

  ngAfterViewInit() {
    this.loadGoogleMaps().then(() => {
      this.initMap();
      this.loadExistingMemories();
      this.loadAvailableTags();
    }).catch(err => {
      console.error('Google Maps failed to load', err);
      // Show fallback message
      const mapElement = document.getElementById('map');
      if (mapElement) {
        mapElement.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f7f0; color: #2d5a2d; text-align: center; padding: 20px;">
            <div>
              <h3>🗺️ Map Loading...</h3>
              <p>Please make sure to replace YOUR_API_KEY with a valid Google Maps API key</p>
            </div>
          </div>
        `;
      }
    });
  }

  ngOnDestroy() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
  }

  loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      // Replace YOUR_API_KEY with your actual Google Maps API key
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD5AcVisuxafK_0MAABnp277sXz4LmK_-k';
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = (err) => reject(err);

      document.body.appendChild(script);
    });
  }

  initMap() {
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: { lat: 20.5937, lng: 78.9629 }, // India center
      zoom: 5,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#f8fdf8' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#a8d5a8' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f9f5' }]
        }
      ]
    });

    this.infoWindow = new google.maps.InfoWindow();

    this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.handleMapClick(event.latLng);
      }
    });
  }

  async handleMapClick(location: google.maps.LatLng) {
    const lat = location.lat();
    const lng = location.lng();
    
    try {
      // Check if there are existing memories at this location with a tolerance
      const existingMemories = await this.memoryService.getMemoryByLocation(lat, lng, 0.01); // Increased tolerance
      
      if (existingMemories.length > 0) {
        // If memories exist, show them
        this.showMemories(existingMemories, location);
      } else {
        // If no memories exist, add a temporary marker and go to memory entry
        this.addTemporaryMarker(location);

        const confirmAdd = confirm(
          ` Do you want to add a memory at this location?\nLatitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`
        );
        
        // Navigate to memory entry page
        if(confirmAdd){
          this.router.navigate(['/add-memory'], {
            queryParams: { lat, lng }
          });
        }
      }
    } catch (error) {
      console.error('Error checking existing memories:', error);
      // Still allow adding new memory even if check fails
      this.addTemporaryMarker(location);
      const confirmAdd = confirm(
        ` Do you want to add a memory at this location?\nLatitude: ${lat.toFixed(4)}, Longitude: ${lng.toFixed(4)}`
      );
      
      if(confirmAdd){
        this.router.navigate(['/add-memory'], {
          queryParams: { lat, lng }
        });
      }
    }
  }

  addTemporaryMarker(location: google.maps.LatLng) {
    // Remove any existing temporary marker
    if (this.temporaryMarker) {
      this.temporaryMarker.setMap(null);
      this.temporaryMarker = null;
    }

    // Add a temporary marker to show where the user clicked
    this.temporaryMarker = new google.maps.Marker({
      position: location,
      map: this.map,
      title: 'New Memory Location',
      icon: {
        path: 'M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7Z',
        fillColor: '#ff4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 2.5, // Bigger size
        anchor: new google.maps.Point(12, 22) // Point to the tip of the marker
      },
      animation: google.maps.Animation.BOUNCE
    });
  }

  showMemories(memories: Memory[], location: google.maps.LatLng) {
    if (memories.length === 1) {
      this.router.navigate(['/view-memory', memories[0].id]);
    } else {
      this.router.navigate(['/memories'], {
        queryParams: { 
          lat: location.lat(), 
          lng: location.lng() 
        }
      });
    }
  }

  async loadExistingMemories() {
    this.clearMarkers();
    
    try {
      let memories: Memory[];
      if (this.searchTag.trim()) {
        memories = await this.memoryService.searchMemoriesByTag(this.searchTag);
      } else {
        memories = await this.memoryService.getMemories();
      }

      this.filteredMemoriesCount = memories.length;

      memories.forEach(memory => {
        this.addExistingMarker(memory);
      });
    } catch (error) {
      console.error('Error loading memories:', error);
      this.filteredMemoriesCount = 0;
    }
  }

  async loadAvailableTags() {
    try {
      this.availableTags = await this.memoryService.getAllTags();
    } catch (error) {
      console.error('Error loading tags:', error);
      this.availableTags = [];
    }
  }

  addExistingMarker(memory: Memory) {
    const marker = new google.maps.Marker({
      position: { lat: memory.lat, lng: memory.lng },
      map: this.map,
      title: memory.title,
      icon: {
        path: 'M12,2C8.13,2 5,5.13 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9C19,5.13 15.87,2 12,2M12,7A2,2 0 0,1 14,9A2,2 0 0,1 12,11A2,2 0 0,1 10,9A2,2 0 0,1 12,7Z',
        fillColor: '#ff4444', // Green color for existing memories
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: 2, // Slightly smaller than temporary marker
        anchor: new google.maps.Point(12, 22) // Point to the tip of the marker
      },
      animation: google.maps.Animation.DROP
    });

    // Hover event for showing memory abstract after 2 seconds
    marker.addListener('mouseover', () => {
      this.hoverTimeout = setTimeout(() => {
        const content = `
          <div style="max-width: 280px; font-family: 'Segoe UI', sans-serif; padding: 5px;">
            <h4 style="margin: 0 0 10px 0; color: #2d5a2d; font-size: 18px;">${memory.title}</h4>
            <p style="margin: 0 0 10px 0; color: #555; font-size: 14px; line-height: 1.4;">
              ${memory.description.length > 120 ? memory.description.substring(0, 120) + '...' : memory.description}
            </p>
            <div style="margin-bottom: 8px;">
              ${memory.tags.slice(0, 3).map(tag => 
                `<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-right: 4px;">${tag}</span>`
              ).join('')}
            </div>
            <div style="color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 8px;">
              <strong>By:</strong> ${memory.uploadedBy} | <strong>Date:</strong> ${new Date(memory.createdAt).toLocaleDateString()}
            </div>
          </div>
        `;
        this.infoWindow.setContent(content);
        this.infoWindow.open(this.map, marker);
      }, 2000);
    });

    marker.addListener('mouseout', () => {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      this.infoWindow.close();
    });

    // Click event
    marker.addListener('click', () => {
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      this.infoWindow.close();
      this.router.navigate(['/view-memory', memory.id]);
    });

    this.markers.push(marker);
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    
    // Also clear temporary marker when clearing all markers
    if (this.temporaryMarker) {
      this.temporaryMarker.setMap(null);
      this.temporaryMarker = null;
    }
  }

  searchMemories() {
    this.loadExistingMemories();
    // Clear URL params if any
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }

  searchByTag(tag: string) {
    this.searchTag = tag;
    this.searchMemories();
  }

  clearSearch() {
    this.searchTag = '';
    this.loadExistingMemories();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {}
    });
  }
}