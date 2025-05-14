import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { IconModule } from '@coreui/icons-angular';
import {
  BadgeModule,
  ButtonModule,
  CardModule,
  ContainerComponent
} from '@coreui/angular';
import { NavigationService } from '../../services/navigation.service';
import { ReportService } from '../../services/report.service';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [
    CommonModule,
    ContainerComponent,
    IconModule,
    RouterOutlet,
    RouterLink,
    ButtonModule,
    CardModule,
    BadgeModule
  ],
  standalone: true
})
export class DefaultLayoutComponent implements OnInit {
  public navItems = [...navItems];
  public reports: any[] = []; // Array to hold report data
  
  constructor(
    private navigationService: NavigationService,
    private reportService: ReportService,
    private router: Router
  ) {
    console.log('DefaultLayoutComponent initialized');
  }
  
  ngOnInit(): void {
    // Load reports from service or local storage if available
    this.loadReports();
  }
  
  /**
   * Handle click on specific menu items
   * This is the primary handler for navigation actions from the sidebar
   * @param event Click event from the sidebar navigation
   */
  onNavItemClick(event: any): void {
    console.log('Nav item clicked event:', event);
    
    if (event && event.item) {
      const navItem = event.item;
      console.log('Nav item name:', navItem.name);
      console.log('Nav item URL:', navItem.url);
      console.log('Nav item attributes:', navItem.attributes);
      
      // Check if clicked item is "New Report" - using both name and data-action
      if (navItem.name === 'New Report' || 
          (navItem.attributes && navItem.attributes['data-action'] === 'new-report')) {
        console.log('New Report menu item detected');
        // Prevent default navigation
        if (event.event) {
          event.event.preventDefault();
        }
        
        // Direct API call - for immediate feedback
        console.log('Calling navigationService.handleNewReportClick() directly');
        
        try {
          // Call the navigation service with better error handling
          this.navigationService.handleNewReportClick();
          
          // Alert for debugging
          alert('New Report clicked - Creating session via API call. Check console for details.');
        } catch (error: unknown) {
          console.error('Error in click handler:', error);
          if (error instanceof Error) {
            alert(`Error handling New Report click: ${error.message}`);
          } else {
            alert('Error handling New Report click');
          }
        }
        
        // Return to prevent any further navigation
        return;
      } else {
        console.log('Not a New Report menu item, allowing default navigation');
      }
    } else {
      console.log('Invalid event structure: missing item property');
    }
  }
  
  /**
   * Debug method to check if clicks are being detected on the sidebar
   * This is used only for debugging purposes, the actual navigation handling
   * should be done in onNavItemClick
   */
  onSidebarClick(event: MouseEvent): void {
    // Stop event propagation to prevent interference with other handlers
    // event.stopPropagation();
    
    const target = event.target as HTMLElement;
    console.log('Sidebar clicked:', event);
    console.log('Click target:', target);
    console.log('Target tag:', target.tagName);
    console.log('Target classes:', target.className);
    
    // Try to find the closest nav-item
    const navItem = target.closest('.nav-item');
    if (navItem) {
      console.log('Found nav-item:', navItem);
      console.log('Nav item text:', navItem.textContent);
      
      // Check if this is the "New Report" link
      if (navItem.textContent?.trim().includes('New Report')) {
        console.log('New Report nav-item clicked from general click handler');
        // We'll let the navItemClicked event handle this
      }
    }
  }
  
  /**
   * Loads reports from the service or local storage
   */
  loadReports(): void {
    // For now, we'll use an empty array to show the "No reports found" UI
    this.reports = [];
    
    // When we have real data, we can use something like this:
    // const currentReport = this.reportService.getCurrentReport();
    // if (currentReport) {
    //   this.reports = [currentReport];
    // }
  }
  
  /**
   * Handles creating a new report
   */
  createNewReport(event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    console.log('Creating new report...');
    // Clear any existing report data
    localStorage.removeItem('currentReport');
    // Only navigate to report details, do NOT create session here
    this.router.navigate(['/report-details']);
  }
  
  /**
   * Checks if the current route is the report list route
   */
  isReportListRoute(): boolean {
    return this.router.url === '/' || this.router.url === '/reports';
  }
  
  /**
   * Deletes a report
   */
  deleteReport(id: string): void {
    if (confirm('Are you sure you want to delete this report?')) {
      console.log('Deleting report:', id);
      
      // Remove the report from the local array
      this.reports = this.reports.filter(report => report.id !== id);
      
      // In a real app, also call an API to delete it from the backend
    }
  }
}
