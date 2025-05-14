import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ButtonDirective,
  AlertComponent
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { ReportService, ReportData } from '../../services/report.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-report-details',
  templateUrl: './report-details.component.html',
  styleUrls: ['./report-details.component.scss'],
  standalone: true,  imports: [
    CommonModule,
    ButtonDirective,
    ReactiveFormsModule,
    AlertComponent,
    IconDirective
  ]
})
export class ReportDetailsComponent implements OnInit {
  reportForm: FormGroup;
  chartConfigForm: FormGroup;
  savedSuccess = false;
  currentStep = 1;
  totalSteps = 3;
  
  // Track completion status of each step
  step1Completed = false;
  step2Completed = false;
  step3Completed = false;
  step4Completed = false;
  
  // Flag to track if API call is in progress
  isSaving = false;
  
  // Flag to control Next Step button enablement
  isNextStepEnabled = false;
  
  // Track which steps have been visited
  visitedSteps: Set<number> = new Set<number>();
  
  // Report name suggestions that users can click on
  reportNameSuggestions = [
    'Monthly Sales Report',
    'Customer Analytics Dashboard',
    'Inventory Status Summary',
    'Financial Performance Q2',
    'Marketing Campaign Results',
    'Employee Productivity Metrics'
  ];
  sqlResult: string | null = null;
    constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute, // Add ActivatedRoute for query params
    private reportService: ReportService,
    private http: HttpClient
  ) {    this.reportForm = this.fb.group({
      reportName: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      sqlMessage: [''],
      sqlResult: ['']
    });

    this.chartConfigForm = this.fb.group({
      type: [3, Validators.required],
      xAxisField: ['Category', Validators.required],
      yAxisField: ['Percentage', Validators.required],
      optionsJson: [
        '{"showLegend":true,"donut":false,"innerRadius":0,"title":"Market Share","showDataLabels":true,"colors":["#4e73df","#1cc88a","#36b9cc","#f6c23e","#e74a3b"]}',
        Validators.required
      ],
      filtersJson: [
        '{"minPercentage":5,"categories":["Category A","Category B","Category C","Category D"]}',
        Validators.required
      ]
    });
  }
  
  get reportName() {
    return this.reportForm.get('reportName') as FormControl;
  }
    get description() {
    return this.reportForm.get('description') as FormControl;
  }
  
  get sqlMessage() {
    return this.reportForm.get('sqlMessage') as FormControl;
  }ngOnInit(): void {
    console.log('ReportDetailsComponent initialized');
    
    // Load previously visited steps from local storage
    this.loadVisitedSteps();
    
    // Mark current step as visited
    this.markStepAsVisited(this.currentStep);
    
    // Listen for query params to set the step
    this.route.queryParams.subscribe(params => {
      console.log('Route query params:', params);
      if (params['step']) {
        const step = +params['step'];
        if (step >= 1 && step <= this.totalSteps) {
          this.currentStep = step;
          console.log('Set current step to:', step);
          
          // Mark current step as visited
          this.markStepAsVisited(step);
          
          // Load step completion status from storage for this step
          this.loadStepCompletionStatus();
        }
      }
    });
      // Subscribe to report service to get current report
    const currentReport = this.reportService.getCurrentReport();
    console.log('Current report from service:', currentReport);
    
    if (currentReport) {
      this.reportForm.patchValue({
        reportName: currentReport.reportName || '',
        description: currentReport.description || ''
      });
      console.log('Patched form with current report data');
      
      // If we have a valid report, restore the step completion states
      this.loadStepCompletionStatus();
      
      // If SQL was generated, mark step 2 as complete too
      if (currentReport.sqlMessage) {
        this.step2Completed = true;
      }
    } else {
      console.warn('No current report data available');
      // Do not automatically create a session on component init
      // Session will be created by Save Report if needed
    }
  }
  getStepTitle(): string {
    switch (this.currentStep) {
      case 1:
        return 'Step 1: Enter Report Name';
      case 2:
        return 'Step 2: Message With GenerateSql';
      case 3:
        return 'Step 3: Chart Configuration';
      case 4:
        return 'Step 4: Review & Submit';
      default:
        return 'Step 1: Enter Report Name';
    }
  }
  
  /**
   * Helper method to update the status of the current step
   * @param completed Whether the step is completed
   */
  private updateCurrentStepStatus(completed: boolean): void {
    switch (this.currentStep) {
      case 1:
        this.step1Completed = completed;
        break;
      case 2:
        this.step2Completed = completed;
        break;
      case 3:
        this.step3Completed = completed;
        break;
      case 4:
        this.step4Completed = completed;
        break;
    }
  }

  /**
   * Navigate to the next step in the wizard
   */
  nextStep(): void {
    // Validate current step
    if (this.currentStep === 1) {
      if (this.reportForm.get('reportName')?.invalid) {
        this.reportForm.get('reportName')?.markAsTouched();
        return;
      }
    } else if (this.currentStep === 2) {
      if (this.reportForm.get('sqlMessage')?.invalid) {
        this.reportForm.get('sqlMessage')?.markAsTouched();
        return;
      }
    } else if (this.currentStep === 3) {
      if (this.chartConfigForm.invalid) {
        this.chartConfigForm.markAllAsTouched();
        return;
      }
    }

    // Move to the next step if not at the last step
    if (this.currentStep < 4) {
      // Mark the current step as visited before moving to next
      this.markStepAsVisited(this.currentStep);
      
      // Also store completion status
      this.saveStepCompletionStatus();
      
      // Move to next step
      this.currentStep++;
      
      // Mark the new step as visited
      this.markStepAsVisited(this.currentStep);
    }
  }

  /**
   * Navigate to the previous step in the wizard
   */
  prevStep(): void {
    // Move to the previous step if not at the first step
    if (this.currentStep > 1) {
      this.currentStep--;
      
      // Mark this step as visited again
      this.markStepAsVisited(this.currentStep);
      
      // Update next button state for this step
      this.updateNextButtonState();
    }
  }
  
  /**
   * Reload report data from the service
   * Useful after a new session is created
   */  reloadReportData(): void {
    console.log('Reloading report data from service');
    const currentReport = this.reportService.getCurrentReport();
    
    if (currentReport) {
      console.log('Reloaded report data:', currentReport);
      this.reportForm.patchValue({
        reportName: currentReport.reportName || '',
        description: currentReport.description || '',
        sqlMessage: currentReport.sqlMessage || '',
        sqlResult: currentReport.sqlResult || ''
      });
      
      // Update completion status based on the reloaded data
      this.step1Completed = !!(currentReport.reportName && currentReport.reportName.length >= 3);
      this.step2Completed = !!currentReport.sqlMessage;
    } else {
      console.warn('No report data available after reload attempt');
    }
  }
  saveReport(): void {
    // Validate form before proceeding
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }
    
    // Set saving flag to true to show loading state
    this.isSaving = true;
    
    // Disable Next Step button during API call
    this.isNextStepEnabled = false;
    
    const currentReport = this.reportService.getCurrentReport();
    let sessionId = currentReport?.sessionId;
    if (!sessionId) {
      const storedSessionId = localStorage.getItem('reportSessionId');
      if (storedSessionId) {
        sessionId = storedSessionId;
        console.log('Retrieved session ID from localStorage:', sessionId);
      }
    }
    
    // Create the report data from form
    const reportData: ReportData = {
      reportName: this.reportForm.get('reportName')?.value || 'Untitled Report',
      description: this.reportForm.get('description')?.value || '',
      sessionId: sessionId,
      sqlMessage: this.reportForm.get('sqlMessage')?.value || '',
      sqlResult: this.reportForm.get('sqlResult')?.value || '',
      createdDate: currentReport?.createdDate || new Date().toISOString(),
      id: currentReport?.id || Date.now().toString()
    };
    
    // Always call create-session API regardless of whether we have a session ID
    const userId = 1; // Default admin user
    const reportName = reportData.reportName;
    const payload = {
      UserId: userId.toString(),
      ReportName: reportName
    };
    
    console.log('Creating new session with payload:', payload);
    
    this.reportService.createSession(payload).subscribe({
      next: (response) => {
        console.log('New session created during save report:', response);
        
        // Update the report with new sessionId
        reportData.sessionId = response.sessionId;
        
        // Save the updated report
        this.reportService.setCurrentReport(reportData);
        this.reportService.saveReportToCollection(reportData);
        
        // Mark step as completed based on current step
        this.updateCurrentStepStatus(true);
        
        // Enable Next Step button
        this.isNextStepEnabled = true;
        
        // Save step completion status to persist across page refreshes
        this.saveStepCompletionStatus();
        
        // Reset loading state
        this.isSaving = false;
        
        // Show success message
        this.savedSuccess = true;
        setTimeout(() => {
          this.savedSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error creating a new session during save:', error);
        
        // Check if this is actually a 200/OK status being treated as error
        if (error && (error.status === 200 || error.statusText === 'OK')) {
          console.log('200 OK status received in error handler, treating as success');
          
          // Create a fallback session ID
          const fallbackId = `fallback-${Date.now()}`;
          reportData.sessionId = fallbackId;
          localStorage.setItem('reportSessionId', fallbackId);
          
          // Save the report
          this.reportService.setCurrentReport(reportData);
          this.reportService.saveReportToCollection(reportData);
          
          // Mark step as completed based on current step
          this.updateCurrentStepStatus(true);
          
          // Enable Next Step button
          this.isNextStepEnabled = true;
          
          // Save step completion status to persist across page refreshes
          this.saveStepCompletionStatus();
          
          // Reset loading state
          this.isSaving = false;
          
          // Show success message
          this.savedSuccess = true;
          setTimeout(() => {
            this.savedSuccess = false;
          }, 3000);
        } else {
          // Reset loading state
          this.isSaving = false;
          
          // Keep Next Step button disabled
          this.isNextStepEnabled = false;
          
          // Show error message
          alert('Failed to create a session. Please try creating a new report from the menu.');
        }
      }
    });
  }
  
  /**
   * Navigates to the report-stepper view with the current report name
   */
  onViewReport(): void {
    // Navigate to the stepper with the report name pre-populated
    this.router.navigate(['/report-stepper'], { 
      queryParams: { 
        step: '1',
        reportName: this.reportForm.get('reportName')?.value
      } 
    });
  }
    /**
   * Sets the selected report name in the form
   * @param reportName The report name to set
   */
  selectReportName(reportName: string): void {
    this.reportForm.patchValue({
      reportName: reportName
    });
    
    // Show a confirmation that the name was selected
    console.log('Selected report name:', reportName);
    
    // If the report name is valid, we can visually indicate success
    if (this.reportName.valid) {
      // Save to report service and update via API
      this.saveReport();
    }
  }
  
  /**
   * Navigates to the report-stepper component
   */
  onNavigateToStepper(): void {
    if (this.reportForm.valid) {
      // Save current data
      this.saveReport();
      
      // Mark step 1 as completed
      this.step1Completed = true;
      
      // Navigate to the next step (report-stepper with step=2)
      this.router.navigate(['/report-stepper'], { 
        queryParams: { 
          step: '2',
          from: 'details'
        } 
      });
    } else {
      // Validate form
      this.reportName.markAsTouched();
    }
  }  /**
   * Gets the current session ID from all possible sources
   * @returns The current session ID or null
   */
  getCurrentSessionId(): string | null {
    // First try to get from current report
    const currentReport = this.reportService.getCurrentReport();
    if (currentReport?.sessionId) {
      return currentReport.sessionId;
    }
    
    // If not in report, try localStorage
    const storedSessionId = localStorage.getItem('reportSessionId');
    if (storedSessionId) {
      console.log('Retrieved session ID from localStorage:', storedSessionId);
      return storedSessionId;
    }
    
    return null;
  }

  /**
   * Submits the final report to the backend
   */
  submitReport(): void {
    // Save the report first
    this.saveReport();
    // Get the current report data
    const currentReport = this.reportService.getCurrentReport();
    // Check if we have all required data
    if (!currentReport?.sessionId) {
      alert('No active session. Please start a new report.');
      return;
    }
    console.log('Submitting report with data:', currentReport);
    // In a real application, we would call an API to submit the report
    // For now, just show a success message
    alert('Report submitted successfully!');
    this.step4Completed = true;
    // Navigate to the reports list
    this.router.navigate(['/reports']);
  }

  /**
   * Navigates to the stepper component
   */
  navigateToStepper(): void {
    // Save the report first
    this.saveReport();
    
    // Navigate to the stepper component
    this.router.navigate(['/report-stepper'], { 
      queryParams: { 
        step: '1',
        reportName: this.reportForm.get('reportName')?.value
      } 
    });
  }

  onGenerateSql() {
    if (this.reportForm.invalid) {
      return;
    }
  
    const sqlMessage = this.reportForm.get('sqlMessage')?.value;
    const sessionId = this.getCurrentSessionId(); // Assuming this method exists to fetch the session ID
  
    const payload = {
      SessionId: sessionId,
      Message: sqlMessage
    };
  
    this.http.post('https://localhost:5002/api/Chat/send-message', payload).subscribe(
      (response: any) => {
        // Ensure sqlResult is always a string
        this.sqlResult = typeof response.generatedSql === 'string' ? response.generatedSql : 'select * from products';
        console.log('Generated SQL:', this.sqlResult);
      },
      (error) => {
        console.error('Error generating SQL:', error);
        this.sqlResult = 'Error generating SQL. Please try again.'; // Display an error message in the read-only field
      }
    );
  }

  saveSql() {
    if (this.reportForm.invalid) {
      return;
    }
  
    const sqlMessage = this.reportForm.get('sqlMessage')?.value;
    const sessionId = this.getCurrentSessionId(); // Assuming this method exists to fetch the session ID
  
    const payload = {
      SessionId: sessionId,
      GeneratedSql: typeof this.sqlResult === 'string' && this.sqlResult.trim() ? this.sqlResult : 'select * from products', // Ensure GeneratedSql is a string and defaults to 'select * from products'
      Message: sqlMessage
    };
  
    this.http.post('https://localhost:5002/api/Chat/update-message-or-generated-sql', payload, { responseType: 'text' }).subscribe(
      (response: any) => {
        console.log('SQL saved successfully:', response);
        alert('SQL has been saved successfully!');
      },
      (error) => {
        console.error('Error saving SQL:', error);
        alert('Failed to save SQL. Please try again.');
      }
    );
  }

  saveChartConfig() {
    if (this.chartConfigForm.invalid) {
      this.chartConfigForm.markAllAsTouched();
      return;
    }
    const chartTypeMap: any = { 1: 'Bar', 2: 'Line', 3: 'Pie' };
    const formValue = this.chartConfigForm.value;
    const sessionId = this.getCurrentSessionId();
    let options = {};
    let filters = {};
    try {
      options = JSON.parse(formValue.optionsJson);
    } catch (e) {
      options = {};
    }
    try {
      filters = JSON.parse(formValue.filtersJson);
    } catch (e) {
      filters = {};
    }
    const payload = {
      Id: 0,
      ChatSessionId: sessionId || 0,
      Type: chartTypeMap[formValue.type] || 'Bar',
      XaxisField: formValue.xAxisField || '',
      YaxisField: formValue.yAxisField || '',
      SeriesField: '',
      SizeField: '',
      ColorField: '',
      Options: options,
      Filters: filters
    };
    this.http.post('https://localhost:5002/api/Chat/update-chart', payload).subscribe(
      (response: any) => {
        alert('Chart configuration saved successfully!');
      },
      (error) => {
        alert('Failed to save chart configuration.');
        console.error('Chart config save error:', error);
      }
    );
  }

  /**
   * Mark a step as visited and save to localStorage
   * @param step The step number to mark as visited
   */
  private markStepAsVisited(step: number): void {
    // Add step to visited steps set
    this.visitedSteps.add(step);
    
    // Save visited steps to localStorage
    this.saveVisitedSteps();
    
    // Update UI state based on visited steps
    this.updateNextButtonState();
  }
  
  /**
   * Save visited steps to localStorage
   */
  private saveVisitedSteps(): void {
    const reportId = this.reportService.getCurrentReport()?.id;
    
    if (reportId) {
      // Convert Set to Array for storage
      const visitedStepsArray = Array.from(this.visitedSteps);
      const storageKey = `reportVisitedSteps_${reportId}`;
      localStorage.setItem(storageKey, JSON.stringify(visitedStepsArray));
      console.log('Saved visited steps to localStorage:', visitedStepsArray);
    }
  }
  
  /**
   * Load visited steps from localStorage
   */
  private loadVisitedSteps(): void {
    const reportId = this.reportService.getCurrentReport()?.id;
    
    if (reportId) {
      const storageKey = `reportVisitedSteps_${reportId}`;
      const storedSteps = localStorage.getItem(storageKey);
      
      if (storedSteps) {
        try {
          // Convert stored Array back to Set
          const visitedStepsArray = JSON.parse(storedSteps) as number[];
          this.visitedSteps = new Set<number>(visitedStepsArray);
          console.log('Loaded visited steps from localStorage:', this.visitedSteps);
          
          // Update UI state based on loaded visited steps
          this.updateNextButtonState();
        } catch (e) {
          console.error('Error parsing visited steps from localStorage:', e);
          this.visitedSteps = new Set<number>();
        }
      }
    }
  }
  
  /**
   * Update the Next button state based on visited steps
   */
  private updateNextButtonState(): void {
    // If current step has been visited before, enable Next button
    if (this.visitedSteps.has(this.currentStep)) {
      this.isNextStepEnabled = true;
      
      // Also update step completion status
      this.updateCurrentStepStatus(true);
    }
  }

  /**
   * Load step completion status from storage for the current step
   * This ensures Next Step button remains enabled across page refreshes
   */
  private loadStepCompletionStatus(): void {
    const reportId = this.reportService.getCurrentReport()?.id;
    
    if (reportId) {
      // Load step completion status for current step
      const storageKey = `reportStepCompleted_${reportId}_step${this.currentStep}`;
      const isCompleted = localStorage.getItem(storageKey) === 'true';
      
      if (isCompleted) {
        // Update step completion status based on current step
        this.updateCurrentStepStatus(true);
        
        // Enable Next Step button
        this.isNextStepEnabled = true;
        console.log(`Step ${this.currentStep} marked as completed from storage`);
      }
    }
  }
  
  /**
   * Save step completion status to storage for the current step
   * This ensures Next Step button remains enabled across page refreshes
   */
  private saveStepCompletionStatus(): void {
    const reportId = this.reportService.getCurrentReport()?.id;
    
    if (reportId) {
      // Save step completion status for current step
      const storageKey = `reportStepCompleted_${reportId}_step${this.currentStep}`;
      localStorage.setItem(storageKey, 'true');
      console.log(`Step ${this.currentStep} completion saved to storage`);
    }
  }

  /**
   * Returns whether the Next Step button should be enabled for the current step
   * @returns true if the button should be enabled, false otherwise
   */
  isNextStepButtonEnabled(): boolean {
    // If API call is in progress, button is always disabled
    if (this.isSaving) {
      return false;
    }
    
    // If the step has been visited before, button is enabled
    if (this.visitedSteps.has(this.currentStep)) {
      return true;
    }
    
    // Otherwise, use existing logic (enabled by save API success)
    return this.isNextStepEnabled;
  }
}
