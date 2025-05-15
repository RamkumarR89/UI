import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface ReportData {
  reportName: string;
  description?: string;
  sqlMessage?: string;
  sqlResult?: string; // Added SQL result field
  createdDate?: string;
  id?: string;
  sessionId?: string; // Backend session ID
}

export interface CreateSessionResponse {
  Id: string;
  sessionId: string;
  status: string;
  message?: string;
}

export interface UpdateReportNameResponse {
  status: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  // API base URL - make sure this is correct
  private apiBaseUrl = 'http://localhost:5003/api/Chat';
  private currentReportSubject = new BehaviorSubject<ReportData | null>(null);
  currentReport$ = this.currentReportSubject.asObservable();

  constructor(private http: HttpClient) {
    // Load from localStorage on initialization
    this.loadFromStorage();
  }

  setCurrentReport(report: ReportData): void {
    this.currentReportSubject.next(report);
    // Save to localStorage for persistence
    localStorage.setItem('currentReport', JSON.stringify(report));
  }

  getCurrentReport(): ReportData | null {
    return this.currentReportSubject.value;
  }
  private loadFromStorage(): void {
    const savedReport = localStorage.getItem('currentReport');
    if (savedReport) {
      try {
        const reportData = JSON.parse(savedReport);
        this.currentReportSubject.next(reportData);
      } catch (e) {
        console.error('Error parsing saved report data', e);
      }
    }
  }
  /**
   * Create a new session with the backend
   * @param payload Object containing UserId and ReportName
   * @returns Observable with session details
   */
  createSession(payload: { UserId: string; ReportName: string }): Observable<CreateSessionResponse> {
    console.log(`ReportService.createSession called with payload:`, payload);
    const url = `${this.apiBaseUrl}/create-session`;
    console.log(`Making POST request to: ${url}`);
    console.log('Request body:', payload);
    
    // Add debugging to track if the HTTP request is being made
    console.log('About to make HTTP POST request...');
    
    return this.http.post<CreateSessionResponse>(url, payload)
      .pipe(
        tap(response => {
          console.log('createSession API response received:', response);
          // Always check for valid response
          if (response) {
            // Handle the case where the API returns Id instead of sessionId
            if (response.Id && !response.sessionId) {
              response.sessionId = response.Id;
            }
            // Make sure we have a valid session ID before proceeding
            if (response.sessionId) {
              // Store session ID separately for extra safety
              localStorage.setItem('reportSessionId', response.sessionId);
              console.log('Stored session ID in localStorage:', response.sessionId);
              // If there's an active report, update it with the new session ID
              const currentReport = this.getCurrentReport();
              if (currentReport) {
                console.log('Updating existing report with new session ID');
                this.setCurrentReport({
                  ...currentReport,
                  sessionId: response.sessionId
                });
              } else {
                console.log('Creating new report with session ID');
                // Create a new report with just the session ID
                this.setCurrentReport({
                  reportName: payload.ReportName,
                  sessionId: response.sessionId,
                  createdDate: new Date().toISOString()
                });
              }
            } else {
              console.warn('No sessionId found in the API response. Using fallback ID.');
              // If no sessionId in response, create a fallback ID
              const fallbackId = `fallback-${Date.now()}`;
              localStorage.setItem('reportSessionId', fallbackId);
              // Update or create a report with this fallback ID
              const currentReport = this.getCurrentReport();
              if (currentReport) {
                this.setCurrentReport({
                  ...currentReport,
                  sessionId: fallbackId
                });
              } else {
                this.setCurrentReport({
                  reportName: payload.ReportName,
                  sessionId: fallbackId,
                  createdDate: new Date().toISOString()
                });
              }
            }
          } else {
            console.warn('Empty response received from server, but status is OK.');
            // Handle empty response case with fallback ID
            const fallbackId = `empty-${Date.now()}`;
            localStorage.setItem('reportSessionId', fallbackId);
          }
        })
      );
  }
  /**
   * Update the report name with the backend
   * @param reportName The name of the report
   * @returns Observable with update status
   */
  updateReportName(reportName: string): Observable<UpdateReportNameResponse> {
    console.log(`ReportService.updateReportName called with: ${reportName}`);
    const currentReport = this.getCurrentReport();
    
    console.log('Current report:', currentReport);
    
    // Try to get the session ID from multiple sources
    let sessionId = currentReport?.sessionId;
      // If not in the current report, try to get from localStorage
    if (!sessionId) {
      const storedSessionId = localStorage.getItem('reportSessionId');
      if (storedSessionId) {
        sessionId = storedSessionId;
        console.log('Retrieved session ID from localStorage:', sessionId);
      }
    }
      if (!sessionId) {
      console.warn('No active session ID found in current report or localStorage');
      // Create a fallback session ID instead of throwing an error
      sessionId = `fallback-${Date.now()}`;
      localStorage.setItem('reportSessionId', sessionId);
      console.log('Created fallback session ID:', sessionId);
    }

    const url = `${this.apiBaseUrl}/update-report-name`;
    console.log(`Making POST request to: ${url}`);
    console.log('Request payload:', {
      sessionId: sessionId,
      reportName
    });    return this.http.post<UpdateReportNameResponse>(url, {
      sessionId: sessionId,
      reportName    }).pipe(
      tap(response => {
        console.log('updateReportName API response:', response);
        
        // Handle responses with status 200/"OK"
        if (response && (response.status === '200' || response.status === 'OK' || response.status === 'ok')) {
          console.log('Report name updated successfully');
        } else {
          // Even if response doesn't have expected status, continue with local update
          console.log('Proceeding with local update despite unexpected response status');
        }
        
        // Update the local report data, ensuring we keep the sessionId
        const updatedReport = {
          ...(currentReport || {}),
          reportName,
          sessionId: sessionId,
          lastUpdated: new Date().toISOString()
        };
        this.setCurrentReport(updatedReport);
      })
    );
  }

  /**
   * Get all saved reports
   * @returns Array of saved reports
   */
  getAllReports(): ReportData[] {
    try {
      // In a real app, this would be an API call
      // But for now, we'll use localStorage
      const savedReportsJson = localStorage.getItem('savedReports');
      if (savedReportsJson) {
        return JSON.parse(savedReportsJson);
      }
    } catch (e) {
      console.error('Error parsing saved reports', e);
    }
    return [];
  }

  /**
   * Save a report to the collection of reports
   * @param report The report to save
   */
  saveReportToCollection(report: ReportData): void {
    if (!report.id) {
      report.id = Date.now().toString();
    }

    const reports = this.getAllReports();
    const existingIndex = reports.findIndex(r => r.id === report.id);
    
    if (existingIndex >= 0) {
      // Update existing report
      reports[existingIndex] = report;
    } else {
      // Add new report
      reports.push(report);
    }
    
    localStorage.setItem('savedReports', JSON.stringify(reports));
  }

  /**
   * Delete a report from the collection
   * @param reportId ID of the report to delete
   */
  deleteReport(reportId: string): void {
    const reports = this.getAllReports().filter(r => r.id !== reportId);
    localStorage.setItem('savedReports', JSON.stringify(reports));
    
    // If the current report is being deleted, clear it
    const currentReport = this.getCurrentReport();
    if (currentReport?.id === reportId) {
      localStorage.removeItem('currentReport');
      this.currentReportSubject.next(null);
    }
  }
}
