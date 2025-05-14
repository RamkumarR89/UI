import { INavData } from '@coreui/angular';

export const navItems: INavData[] = [
  {
    name: 'My Reports',
    url: '/reports',
    iconComponent: { name: 'cil-list' }        
  },
  {
    title: true,
    name: 'Report Builder'
  },
  {
    name: 'New Report',
    url: 'javascript:void(0)', // Use javascript:void(0) to prevent default navigation
    iconComponent: { name: 'cil-notes' },
    attributes: { 
      'data-action': 'new-report' // Custom attribute to identify this menu item for special handling in menu-wrapper
    }
  },
  {
    name: 'Test Navigation',
    url: '/test-nav',
    iconComponent: { name: 'cil-pencil' },
    attributes: { 
      'data-action': 'test-nav' 
    }
  }
];
