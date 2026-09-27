import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';

export const PORTFOLIO_PAGE_TITLE = 'My Profile';

export const PORTFOLIO_HEADER_ACTIONS = {
  editProfile: {
    label: 'Edit Profile',
    icon: 'edit',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;

export const PORTFOLIO_TABLE_ACTIONS = {
  addCrypto: { label: 'Add', icon: 'add', variant: 'primary' as const },
  edit: { label: 'Edit', icon: 'edit' },
  delete: { label: 'Delete', icon: 'delete', color: 'warn' as const },
  ban: { label: 'Ban/Unban', icon: 'block', color: 'warn' as const },
  view: { label: 'View', icon: 'visibility' },
} as const;
