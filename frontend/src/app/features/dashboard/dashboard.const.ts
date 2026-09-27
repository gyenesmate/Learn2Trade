import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';

export const DASHBOARD_PAGE_TITLE = 'Dashboard';

export const DASHBOARD_HEADER_ACTIONS = {
  exportReport: {
    label: 'Export Report',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
  addInvestment: {
    label: 'Add Investment',
    icon: 'add',
    variant: 'primary',
  } satisfies PageHeaderActionDef,
} as const;
