import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SidebarNavComponent,
  CardComponent,
  CardHeaderComponent,
  CardBodyComponent,
  ButtonDirective,
  CardFooterComponent,
  AlertComponent
} from '@coreui/angular';
import { ReportService } from '../../services/report.service';
import { NavigationService } from '../../services/navigation.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-nav',
  standalone: true,  imports: [
    CommonModule,
    SidebarNavComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    ButtonDirective,
    AlertComponent,
    FormsModule
  ],
  template: `
    <div class="test-navigation container mt-4">
      <h2>Test API Navigation</h2>
      
      <c-card class="mb-4">
        <c-card-header>
          <strong>Test Sidebar Navigation</strong>
        </c-card-header>
        <c-card-body>
          <c-sidebar-nav 
            [navItems]="testNavItems" 
            dropdownMode="close" 
            compact 
            (navItemClicked)="onTestNavItemClick($event)" />
        </c-card-body>
      </c-card>
      
      <c-card class="mb-4">
        <c-card-header>
          <strong>Direct API Testing</strong>
        </c-card-header>
        <c-card-body>
          <c-alert *ngIf="apiResponse" [color]="apiSuccess ? 'success' : 'danger'">
            <pre>{{ apiResponse | json }}</pre>
          </c-alert>
          
          <div class="mb-3">
            <label for="userId" class="form-label">User ID:</label>
            <input type="number" class="form-control" id="userId" [(ngModel)]="userId">
          </div>
          
          <button cButton color="primary" (click)="testCreateSession()">
            Test Create Session API
          </button>
        </c-card-body>
      </c-card>
    </div>
  `
})
export class TestNavComponent implements OnInit {
  // API testing properties
  userId = 1;
  apiResponse: any;
  apiSuccess = false;
  sessionId: string | null = null;

  // Simple test navigation items
  testNavItems = [
    {
      name: 'Test Create Session',
      url: 'javascript:void(0);',
      iconComponent: { name: 'cil-notes' },
      attributes: { 
        'data-action': 'test-create-session'
      }
    },
    {
      name: 'Test Update Report Name',
      url: 'javascript:void(0);',
      iconComponent: { name: 'cil-pencil' },
      attributes: { 
        'data-action': 'test-update-report-name'
      }
    }
  ];
  
  constructor(
    private reportService: ReportService,
    private navigationService: NavigationService
  ) {}
  
  ngOnInit(): void {
    console.log('TestNavComponent initialized');
    this.checkExistingSession();
  }
  
  checkExistingSession(): void {
    const currentReport = this.reportService.getCurrentReport();
    if (currentReport && currentReport.sessionId) {
      this.sessionId = currentReport.sessionId;
      console.log('Found existing session ID:', this.sessionId);
    }
  }
  
  onTestNavItemClick(event: any): void {
    if (event && event.item) {
      const navItem = event.item;
      console.log('TEST - Nav item clicked:', navItem);
      console.log('TEST - Nav item name:', navItem.name);
      
      // Prevent the default navigation
      if (event.event) {
        event.event.preventDefault();
      }
      
      // Handle different test actions
      if (navItem.name === 'Test Create Session') {
        this.testCreateSession();
      } else if (navItem.name === 'Test Update Report Name') {
        this.testUpdateReportName();
      }
    }
  }
  
  testCreateSession(): void {
    console.log(`Testing createSession API with userId: ${this.userId}`);
    this.apiResponse = null;
    
    this.reportService.createSession({ UserId: this.userId.toString(), ReportName: 'Test Report' }).subscribe({
      next: (response) => {
        console.log('Create session response:', response);
        this.apiResponse = response;
        this.apiSuccess = true;
        this.sessionId = response.sessionId;
      },
      error: (error) => {
        console.error('Error creating session:', error);
        this.apiResponse = error;
        this.apiSuccess = false;
      }
    });
  }
  
  testUpdateReportName(): void {
    if (!this.sessionId) {
      alert('No session ID available. Please create a session first.');
      return;
    }
    
    const reportName = `Test Report - ${new Date().toLocaleTimeString()}`;
    console.log(`Testing updateReportName API with name: ${reportName}`);
    this.apiResponse = null;
    
    this.reportService.updateReportName(reportName).subscribe({
      next: (response) => {
        console.log('Update report name response:', response);
        this.apiResponse = response;
        this.apiSuccess = true;
      },
      error: (error) => {
        console.error('Error updating report name:', error);
        this.apiResponse = error;
        this.apiSuccess = false;
      }
    });
  }
}
