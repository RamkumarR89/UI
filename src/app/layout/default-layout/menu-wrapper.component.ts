import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-menu-wrapper',
  standalone: true,
  imports: [RouterModule],
  template: `<ng-content></ng-content>`
})
export class MenuWrapperComponent {
  constructor(private navigationService: NavigationService) {}
  
  /**
   * Handle click on New Report menu item
   */
  handleNewReportClick(event: MouseEvent): void {
    event.preventDefault();
    this.navigationService.handleNewReportClick();
  }
}
