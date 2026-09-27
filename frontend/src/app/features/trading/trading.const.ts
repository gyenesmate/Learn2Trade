import { PageHeaderActionDef } from '@shared/components/page-header/page-header.types';

export const TRADING_HEADER_ACTIONS = {
  invest: {
    label: 'Invest',
    icon: 'payments',
    variant: 'primary',
  } satisfies PageHeaderActionDef,
  setAlert: {
    label: 'Set alert',
    icon: 'notifications',
    variant: 'secondary',
  } satisfies PageHeaderActionDef,
} as const;
