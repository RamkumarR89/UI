import { Injectable } from '@angular/core';
import { ReportService } from './report.service';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private menuClickSubject = new BehaviorSubject<string | null>(null);
  menuClick$ = this.menuClickSubject.asObservable();
  
  constructor(
    private reportService: ReportService,
    private router: Router
  ) {
    console.log('NavigationService initialized');
  }

  /**
   * Handle New Report menu click
   * Creates a new session and navigates to report details
   */  handleNewReportClick(): void {
    console.log('NavigationService.handleNewReportClick called');
    
    // Clean up any existing report data
    console.log('Removing currentReport from localStorage');
    localStorage.removeItem('currentReport');
    
    // Create a new session
    console.log('Calling reportService.createSession()');
    const userId = 1;
    const reportName = 'Untitled Report';
    const payload = { UserId: userId.toString(), ReportName: reportName };
    this.reportService.createSession(payload).subscribe({      next: (response) => {
        console.log('New report session created successfully:', response);
        alert(`Session created successfully! Session ID: ${response.sessionId}`);
        
        // Navigate to report details page
        console.log('Navigating to /report-details');
        this.router.navigate(['/report-details'])
          .then(success => {
            console.log('Navigation result:', success ? 'Success' : 'Failed');
            if (!success) {
              alert('Navigation to report details failed. Check console for errors.');
            }
          })
          .catch(err => {
            console.error('Navigation error:', err);
            alert(`Navigation error: ${err.message}`);
          });
      },
      error: (error) => {
        console.error('Error creating new report session:', error);
        
        // More detailed error logging
        if (error.error) {
          console.error('Error details:', error.error);
        }
        
        if (error.status) {
          console.error('Error status code:', error.status);
        }
        
        alert(`Failed to create a new report. Error: ${error.message || 'Unknown error'}`);
      }
    });
  }
}
