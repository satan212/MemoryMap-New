import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MemoryService } from '../../services/memory.service';

@Component({
  selector: 'app-memory-entry',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './memory-entry.html',
  styleUrls: ['./memory-entry.css']
})
export class MemoryEntryPage implements OnInit {
  memoryForm!: FormGroup;
  lat!: number;
  lng!: number;
  selectedFileName: string = '';
  selectedFile: File | null = null;
  isSubmitting: boolean = false;
  suggestedTags: string[] = [
    'vacation', 'family', 'friends', 'devotional',
    'work', 'celebration', 'nature', 'food'
  ];

  constructor(
    private fb: FormBuilder, 
    private route: ActivatedRoute,
    private router: Router,
    private memoryService: MemoryService
  ) {}

  async ngOnInit(): Promise<void> {
    this.route.queryParams.subscribe(params => {
      this.lat = +params['lat'];
      this.lng = +params['lng'];
    });

    this.memoryForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      uploadedBy: ['', [Validators.required, Validators.minLength(2)]],
      tags: ['']
    });

    // ✅ Await service call
    const existingTags = await this.memoryService.getAllTags();
    this.suggestedTags = [...new Set([...this.suggestedTags, ...existingTags])];
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.selectedFileName = file.name;
    }
  }

  addSuggestedTag(tag: string) {
    const currentTags = this.memoryForm.get('tags')?.value || '';
    const tagsArray = currentTags.split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);

    if (!tagsArray.includes(tag)) {
      tagsArray.push(tag);
      this.memoryForm.patchValue({
        tags: tagsArray.join(', ')
      });
    }
  }

  async onSubmit() {
    if (this.memoryForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const formValue = this.memoryForm.value;
      const tagsArray = formValue.tags ? 
        formValue.tags.split(',')
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag) 
        : [];

      const memoryData = {
        title: formValue.title,
        description: formValue.description,
        uploadedBy: formValue.uploadedBy,
        tags: tagsArray,
        lat: this.lat,
        lng: this.lng,
        fileName: this.selectedFileName,
        fileContent: '' // TODO: convert file to base64 or handle upload
      };

      try {
        // ✅ Await saveMemory since it’s async
        const memoryId = await this.memoryService.saveMemory(memoryData);
        
        setTimeout(() => {
          alert('✅ Memory saved successfully!');
          this.router.navigate(['/view-memory', memoryId]);
        }, 1000);
        
      } catch (error) {
        console.error('Error saving memory:', error);
        alert('❌ Failed to save memory. Please try again.');
        this.isSubmitting = false;
      }
    }
  }

  goBack() {
    this.router.navigate(['/map']);
  }
}
