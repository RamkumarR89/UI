import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ButtonDirective,
  ButtonModule,
  TableDirective,
  TableModule
} from '@coreui/angular';
import { IconDirective, IconModule } from '@coreui/icons-angular';
import { ReportService, ReportData } from '../../services/report.service';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss'],
  standalone: true,  imports: [
    CommonModule,
    ButtonModule,
    ButtonDirective,
    TableModule,
    TableDirective,
    IconModule,
    IconDirective
  ]
})
export class ReportListComponent implements OnInit {
  reports: ReportData[] = [];
  isLoading = false;

  constructor(
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }
  /**
   * Loads reports from the service or local storage
   */
  loadReports(): void {
    this.isLoading = true;
    
    // Get all saved reports
    this.reports = this.reportService.getAllReports();
    
    // Add the current report to the top of the list if it exists and isn't already in the list
    const currentReport = this.reportService.getCurrentReport();
    if (currentReport && !this.reports.some(r => r.id === currentReport.id)) {
      this.reports.unshift(currentReport);
    }
    
    this.isLoading = false;
    
    // In a real application with an API:
    // this.reportService.fetchAllReports().subscribe({
    //   next: (reports) => {
    //     this.reports = reports;
    //     this.isLoading = false;
    //   },
    //   error: (error) => {
    //     console.error('Error fetching reports', error);
    //     this.isLoading = false;
    //   }
    // });
  }
  
  /**
   * Creates a new report
   */  
  createNewReport(event?: Event): void {
    // Prevent default behavior if event is provided
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('Creating new report - redirecting directly...');
    
    // Clear any existing report data
    localStorage.removeItem('currentReport');
    localStorage.removeItem('reportSessionId');
    
    // Create a fallback session ID
    const fallbackId = `fallback-${Date.now()}`;
    localStorage.setItem('reportSessionId', fallbackId);
    
    // Create a new report with minimal data
    const newReport = {
      reportName: 'Untitled Report',
      sessionId: fallbackId,
      createdDate: new Date().toISOString(),
      id: Date.now().toString()
    };
    
    // Set as current report
    this.reportService.setCurrentReport(newReport);
    
    // Navigate directly to the report details page
    this.router.navigate(['/report-details']);
  }

  /**
   * Saves a report by calling the create-session API
   */
  saveReport(report: ReportData): void {
    console.log('Saving report with create-session API...');
    
    // Call the API to create a new session
    const userId = 1;
    const reportName = report.reportName || 'Untitled Report';
    const payload = { UserId: userId.toString(), ReportName: reportName };
    
    console.log('Calling createSession API with payload:', payload);
    
    this.reportService.createSession(payload).subscribe({
      next: (response) => {
        console.log('Session created successfully:', response);
        
        // Update the report with the new session ID
        const updatedReport = {
          ...report,
          sessionId: response.sessionId
        };
        
        // Save the updated report
        this.reportService.setCurrentReport(updatedReport);
        this.reportService.saveReportToCollection(updatedReport);
        
        alert('Report saved successfully!');
      },
      error: (error) => {
        console.error('Error creating session:', error);
        
        if (error && (error.status === 200 || error.statusText === 'OK')) {
          console.log('200 OK status received in error handler, treating as success');
          
          // Create a fallback session ID
          const fallbackId = `fallback-${Date.now()}`;
          
          // Update report with fallback ID
          const updatedReport = {
            ...report,
            sessionId: fallbackId
          };
          
          localStorage.setItem('reportSessionId', fallbackId);
          this.reportService.setCurrentReport(updatedReport);
          this.reportService.saveReportToCollection(updatedReport);
          
          alert('Report saved successfully!');
        } else {
          alert('Failed to save report. Please try again.');
        }
      }
    });
  }
    /**
   * Opens an existing report for editing
   */
  openReport(report: ReportData): void {
    // Check if the report has a valid session ID
    if (!report.sessionId) {
      console.warn('Report has no session ID. Creating a new session...');
      
      // Create a new session and update the report
      const userId = 1;
      const reportName = report.reportName || 'Untitled Report';
      const payload = { UserId: userId.toString(), ReportName: reportName };
      this.reportService.createSession(payload).subscribe({
        next: (response) => {
          console.log('New session created for existing report:', response);
          
          // Update the report with the new session ID
          const updatedReport = {
            ...report,
            sessionId: response.sessionId
          };
          
          // Set the current report in the service
          this.reportService.setCurrentReport(updatedReport);
          
          // Also update in the saved reports collection
          this.reportService.saveReportToCollection(updatedReport);
          
          // Navigate to the report details page
          this.router.navigate(['/report-details']);
        },        error: (error) => {
          console.error('Error creating session for existing report:', error);
          
          // Check if this is actually a 200/OK status being treated as error
          if (error && (error.status === 200 || error.statusText === 'OK')) {
            console.log('200 OK status received in error handler, treating as success');
            
            // Create a fallback session ID and update the report
            const fallbackId = `fallback-${Date.now()}`;
            
            // Update the report with the fallback session ID
            const updatedReport = {
              ...report,
              sessionId: fallbackId
            };
            
            localStorage.setItem('reportSessionId', fallbackId);
            this.reportService.setCurrentReport(updatedReport);
            this.reportService.saveReportToCollection(updatedReport);
            
            // Navigate to the report details page
            this.router.navigate(['/report-details']);
          } else {
            alert('Failed to open report. Please try again.');
          }
        }
      });
    } else {
      console.log('Opening report with existing session ID:', report.sessionId);
      
      // Store session ID in localStorage for redundancy
      localStorage.setItem('reportSessionId', report.sessionId);
      
      // Set the current report in the service
      this.reportService.setCurrentReport(report);
      
      // Navigate to the report details page
      this.router.navigate(['/report-details']);
    }
  }
    /**
   * Deletes a report
   */
  deleteReport(id: string, event: Event): void {
    event.stopPropagation();
    
    if (confirm('Are you sure you want to delete this report?')) {
      console.log('Deleting report:', id);
      
      // Use the service to delete the report
      this.reportService.deleteReport(id);
      
      // Refresh the list
      this.loadReports();
      
      // In a real app, also call an API to delete it from the backend
    }
  }
  
  /**
   * Formats a date for display
   */
  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Opens a dialog to create and save a new report
   */
  openSaveReportDialog(): void {
    // Create a new draft report
    const reportName = prompt('Enter report name:');
    
    if (reportName) {
      // Create a basic report with just the name
      const newReport: ReportData = {
        reportName: reportName,
        createdDate: new Date().toISOString(),
        id: Date.now().toString()
      };
      
      // Call saveReport to create a session
      this.saveReport(newReport);
    }
  }
}
