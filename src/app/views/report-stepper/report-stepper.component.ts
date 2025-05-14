import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import {
  ButtonDirective,
  ProgressBarComponent,
} from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-report-stepper',
  templateUrl: './report-stepper.component.html',
  styleUrls: ['./report-stepper.component.scss'],  standalone: true,  imports: [
    CommonModule,
    ButtonDirective,
    ReactiveFormsModule,
    ProgressBarComponent,
    IconDirective
  ]
})
export class ReportStepperComponent implements OnInit {
  currentStep = 1;
  totalSteps = 2;
  reportForm: FormGroup;
  sqlResult: string = ''; // Property to store the SQL result
  
  // Report name suggestions that users can click on
  reportNameSuggestions = [
    'Monthly Sales Report',
    'Customer Analytics Dashboard',
    'Inventory Status Summary',
    'Financial Performance Q2',
    'Marketing Campaign Results',
    'Employee Productivity Metrics'
  ];
  
  steps = [
    { id: 1, name: 'Enter Report Name', complete: false, active: true },
    { id: 2, name: 'Message With GenerateSql', complete: false, active: false }
  ];
    constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.reportForm = this.fb.group({
      reportName: ['', [Validators.required, Validators.minLength(3)]],
      sqlMessage: ['', [Validators.required]]
    });
  }  ngOnInit(): void {
    // Load from report service if available
    const currentReport = this.reportService.getCurrentReport();
    
    if (currentReport) {
      this.reportForm.patchValue({
        reportName: currentReport.reportName || '',
        sqlMessage: currentReport.sqlMessage || ''
      });
      
      // If we have a valid report name, mark the first step as complete
      if (currentReport.reportName && currentReport.reportName.length >= 3) {
        this.steps[0].complete = true;
      }
    }
    
    this.route.queryParams.subscribe(params => {
      // Handle step navigation
      if (params['step']) {
        this.currentStep = +params['step'];
        this.setStep(this.currentStep);
      }
      
      // Handle report name from query params
      if (params['reportName']) {
        this.reportForm.patchValue({
          reportName: params['reportName']
        });
      }
      
      // If coming from report-details, and going to step 2, mark step 1 as complete
      if (params['from'] === 'details' && this.currentStep === 2) {
        this.steps[0].complete = true;
      }
    });
  }
  
  get reportName() {
    return this.reportForm.get('reportName') as FormControl;
  }
  
  get sqlMessage() {
    return this.reportForm.get('sqlMessage') as FormControl;
  }
    setStep(stepId: number) {
    // Validate current step before allowing navigation to a later step
    if (stepId > this.currentStep) {
      // Check previous steps for validity
      if (stepId > 1 && this.reportName.invalid) {
        this.reportName.markAsTouched();
        alert('Please complete the report name step before proceeding.');
        return;
      }
    }
    
    this.currentStep = stepId;
    
    // Update active state for all steps
    this.steps.forEach(step => {
      step.active = step.id === stepId;
    });
    
    // Update URL query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { step: stepId },
      queryParamsHandling: 'merge',
    });
  }
    nextStep() {
    if (this.currentStep < this.totalSteps) {
      // Validate current step
      if (this.currentStep === 1) {
        this.reportName.markAsTouched();
        if (this.reportName.invalid) {
          return;
        }
      }
      
      // Mark current step as complete and move to next
      this.steps[this.currentStep - 1].complete = true;
      this.currentStep++;
      this.setStep(this.currentStep);
    }
  }
  prevStep() {
    if (this.currentStep > 1) {
      // If going back from step 2 to step 1, navigate to report-details instead
      if (this.currentStep === 2) {
        this.router.navigate(['/report-details']);
      } else {
        this.currentStep--;
        this.setStep(this.currentStep);
      }
    }
  }  onGenerateSql() {
    if (this.reportForm.invalid) {
      // Mark all form controls as touched to show validation messages
      Object.keys(this.reportForm.controls).forEach(key => {
        const control = this.reportForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    console.log('Generating SQL with the following data:', this.reportForm.value);
    
    // Generate a sample SQL query based on the input message
    // In a real app, this would come from an API call
    const message = this.reportForm.value.sqlMessage || '';
    
    // Generate a SQL query based on the message keywords
    if (message.toLowerCase().includes('product')) {
      this.sqlResult = 'SELECT * FROM Products;';
    } else if (message.toLowerCase().includes('customer')) {
      this.sqlResult = 'SELECT * FROM Customers;';
    } else if (message.toLowerCase().includes('order')) {
      this.sqlResult = 'SELECT o.OrderID, c.CustomerName, o.OrderDate\nFROM Orders o\nJOIN Customers c ON o.CustomerID = c.CustomerID;';
    } else if (message.toLowerCase().includes('sales')) {
      this.sqlResult = 'SELECT p.ProductName, SUM(od.Quantity) as TotalSold\nFROM OrderDetails od\nJOIN Products p ON od.ProductID = p.ProductID\nGROUP BY p.ProductName;';
    } else {
      this.sqlResult = 'SELECT * FROM Table1;';
    }
    
    // Get current report data
    const currentReport = this.reportService.getCurrentReport();
    
    // Get session ID from multiple sources
    let sessionId = currentReport?.sessionId;
    if (!sessionId) {
      // Try localStorage as a backup source
      const storedSessionId = localStorage.getItem('reportSessionId');
      if (storedSessionId) {
        console.log('Retrieved session ID from localStorage:', storedSessionId);
        sessionId = storedSessionId;
      }
    }
    
    // Complete the process with the available session ID (can be undefined)
    this.completeGenerateSql(sessionId);
  }
  
  /**
   * Complete the SQL generation process after ensuring we have a valid session ID
   */  private completeGenerateSql(sessionId: string | undefined): void {
    // Get current report data again to ensure we have the latest
    const currentReport = this.reportService.getCurrentReport();
    
    // Use the report service to save the data
    const reportData = {
      reportName: this.reportForm.value.reportName,
      description: currentReport?.description || '',
      sqlMessage: this.reportForm.value.sqlMessage,
      sqlResult: this.sqlResult, // Add the SQL result to the saved report
      createdDate: currentReport?.createdDate || new Date().toISOString(),
      id: currentReport?.id || Date.now().toString(),
      sessionId: sessionId, // May be undefined until Save Report
      lastUpdated: new Date().toISOString()
    };
    
    this.reportService.setCurrentReport(reportData);
    
    // Mark step as complete
    this.steps[this.currentStep - 1].complete = true;
      // Show success message and offer to redirect
    if (confirm('SQL generated successfully for: ' + this.reportForm.value.reportName + 
                '\n\nWould you like to view the report details?')) {
      // Navigate to the report details page with step 3 (Review & Submit)
      this.router.navigate(['/report-details'], {
        queryParams: { step: '3' }
      });
    }
  }
  
  /**
   * Sets the selected report name in the form
   * @param reportName The report name to set
   */  
  selectReportName(reportName: string) {
    this.reportForm.patchValue({
      reportName: reportName
    });
    
    // Save using the report service
    const reportData = {
      reportName: reportName,
      description: '',
      selectedAt: new Date().toISOString()
    };
    
    // Use the report service instead of localStorage
    this.reportService.setCurrentReport(reportData);
    
    // Show a confirmation that the name was selected
    console.log('Selected report name:', reportName);
    
    // If the report name is valid, we can visually indicate success
    if (this.reportName.valid) {
      // You could add visual feedback here
      
      // Optionally, automatically go to the next step after a short delay
      setTimeout(() => {
        if (this.currentStep === 1) {
          this.nextStep();
        }
      }, 500);
    }
  }
  
  /**
   * Save the report to the backend by calling the update-report-name API
   * This function will be used by the Save Report button
   */  saveReport(): void {
    if (this.reportForm.valid) {
      const reportName = this.reportForm.value.reportName;
      let currentReport = this.reportService.getCurrentReport();
      let sessionId = currentReport?.sessionId;
      if (!sessionId) {
        // Try localStorage as a backup source
        const storedSessionId = localStorage.getItem('reportSessionId');
        if (storedSessionId) {
          sessionId = storedSessionId;
        }
      }
      if (!sessionId) {
        // Only now, on save, create a session
        const userId = 1;
        const payload = { UserId: userId.toString(), ReportName: reportName };
        this.reportService.createSession(payload).subscribe({
          next: (response) => {
            sessionId = response.sessionId;
            this.finalizeSaveReport(reportName, sessionId);
          },
          error: (error) => {
            alert('Failed to create a session. Please try again.');
          }
        });
        return;
      }
      this.finalizeSaveReport(reportName, sessionId);
    } else {
      // Mark form controls as touched to show validation errors
      this.reportForm.markAllAsTouched();
    }
  }

  private finalizeSaveReport(reportName: string, sessionId: string) {
    try {
      this.reportService.updateReportName(reportName).subscribe({
        next: (response) => {
          const currentReport = this.reportService.getCurrentReport();
          const reportData = {
            ...(currentReport || {}),
            reportName: reportName,
            sqlResult: this.sqlResult, // Include SQL result in saved report
            sessionId: sessionId,
            lastUpdated: new Date().toISOString()
          };
          this.reportService.setCurrentReport(reportData);
          this.reportService.saveReportToCollection(reportData);
          if (this.currentStep === 1) {
            this.steps[0].complete = true;
          }
          alert('Report saved successfully!');
        },
        error: (error) => {
          if (error && (error.status === 200 || error.statusText === 'OK')) {
            const currentReport = this.reportService.getCurrentReport();
            const reportData = {
              ...(currentReport || {}),
              reportName: reportName,
              sqlResult: this.sqlResult,
              sessionId: sessionId,
              lastUpdated: new Date().toISOString()
            };
            this.reportService.setCurrentReport(reportData);
            this.reportService.saveReportToCollection(reportData);
            if (this.currentStep === 1) {
              this.steps[0].complete = true;
            }
            alert('Report saved successfully!');
          } else {
            alert(`Failed to update report name: ${error.message || 'Please try again'}`);
          }
        }
      });
    } catch (error: any) {
      alert('Failed to save report. Please try again.');
    }
  }
}
