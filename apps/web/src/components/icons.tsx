interface IconProps {
  className?: string;
  size?: number;
}

function base(className?: string, size = 18) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };
}

export function IconDashboard(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
    </svg>
  );
}

export function IconShield(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M12 2 4 5.5v5.2c0 4.6 3.3 8.6 8 9.8 4.7-1.2 8-5.2 8-9.8V5.5L12 2Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function IconUsers(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.2 3.3-5 6.5-5s5.9 1.8 6.5 5" />
      <circle cx="17.5" cy="9" r="2.5" />
      <path d="M16 15.3c2.6.2 4.6 1.6 5.3 4.2" />
    </svg>
  );
}

export function IconUser(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.7-5.5 7-5.5s6.2 2 7 5.5" />
    </svg>
  );
}

export function IconBuilding(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 21V5.5C4 4.7 4.7 4 5.5 4h8c.8 0 1.5.7 1.5 1.5V21" />
      <path d="M15 9h3.5c.8 0 1.5.7 1.5 1.5V21" />
      <path d="M2 21h20" />
      <path d="M7 8h2M11 8h1M7 12h2m5 0h1M7 16h2m5 0h1" />
    </svg>
  );
}

export function IconContract(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v4h4" />
      <path d="M9 12h6M9 16h6M9 8h3" />
    </svg>
  );
}

export function IconSite(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M12 3 5.5 7v5.5c0 4.2 2.8 7.8 6.5 9.5 3.7-1.7 6.5-5.3 6.5-9.5V7L12 3Z" />
      <path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M12 12v4" />
    </svg>
  );
}

export function IconPost(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M3 21h18" />
      <path d="M5 21V9l7-4 7 4v12" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

export function IconClock(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function IconShifts(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01" />
    </svg>
  );
}

export function IconList(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
}

export function IconAlert(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9.5V14" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function IconIncident(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M7 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0Z" />
      <path d="m12 12-4.5 2M20 4l-2-1v3l2 1v-3Z" />
    </svg>
  );
}

export function IconRoute(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" />
    </svg>
  );
}

export function IconCamera(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h2l1.2-2h6.6L16.5 6h2A1.5 1.5 0 0 1 20 7.5v9A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-9Z" />
      <circle cx="12" cy="12" r="3.2" />
    </svg>
  );
}

export function IconMapPin(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 1 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconBell(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M6 9.5a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function IconSos(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="m4.5 12.5 5 5 10-11" />
    </svg>
  );
}

export function IconClose(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function IconRefresh(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M20 11a8 8 0 0 0-14.9-3M4 13a8 8 0 0 0 15 3" />
      <path d="M20 4v4h-4M4 20v-4h4" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconDownload(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

export function IconMenu(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconLogout(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="m16 8 4 4-4 4M20 12H9" />
    </svg>
  );
}

export function IconWallet(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16.5 14h.01" />
    </svg>
  );
}

export function IconInvoice(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  );
}

export function IconSupervis(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.5 3.7-5.5 7-5.5 2 0 3.8.7 5.1 1.9" />
      <path d="M17 14.5l1 .5.7.7.2-1 .2-.5 1-.2.5.2-.6.9.1.9-1 .1" />
    </svg>
  );
}

export function IconEye(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconDocument(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M15 3v4h4" />
    </svg>
  );
}

export function IconReport(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 20V10M10 20V4M16 20v-7M20 20h1M3 20h18" />
    </svg>
  );
}

export function IconVisitors(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19c.6-2.8 3-4.5 6-4.5s5.4 1.7 6 4.5" />
      <path d="M16 5.5a2.5 2.5 0 0 1 0 5M18.5 14.8c1.3.8 2.1 2.2 2.4 4.2" />
    </svg>
  );
}

export function IconCar(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 11 5.8 6a1.5 1.5 0 0 1 1.4-1h9.6a1.5 1.5 0 0 1 1.4 1L20 11" />
      <path d="M3.5 11h17a1 1 0 0 1 1 1.6L20 15H4l-1.5-2.4a1 1 0 0 1 1-1.6Z" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
      <path d="M9.3 17h5.4" />
    </svg>
  );
}

export function IconBox(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  );
}

export function IconPayroll(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M4 5h16v3H4z" />
      <path d="M6 8v11h12V8" />
      <path d="M10 12h4M10 15h4" />
    </svg>
  );
}

export function IconFolder(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2h9A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Z" />
    </svg>
  );
}

export function IconLock(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export function IconMail(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  );
}

export function IconGps(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  );
}

export function IconLog(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M5 3h14v18l-2-1.5L15 21l-2-1.5L11 21l-2-1.5L7 21l-2-1.5V3Z" />
      <path d="M8 8h8M8 12h8" />
    </svg>
  );
}

export function IconPhone(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <path d="M5 4h4l1.5 4.5-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2L20 15v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function IconSun(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </svg>
  );
}

export function IconCalendar(p: IconProps) {
  return (
    <svg {...base(p.className, p.size)}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export type IconName =
  | 'dashboard' | 'shield' | 'users' | 'user' | 'building' | 'contract' | 'site' | 'post' | 'clock'
  | 'shifts' | 'list' | 'alert' | 'incident' | 'route' | 'camera' | 'map-pin' | 'bell' | 'sos' | 'check'
  | 'close' | 'plus' | 'search' | 'refresh' | 'chevron-right' | 'chevron-down' | 'download' | 'menu'
  | 'logout' | 'wallet' | 'invoice' | 'supervis' | 'eye' | 'document' | 'report' | 'visitors' | 'car'
  | 'box' | 'payroll' | 'folder' | 'lock' | 'mail' | 'gps' | 'log' | 'phone' | 'sun' | 'calendar';

export const ICONS: Record<IconName, (p: IconProps) => React.ReactNode> = {
  dashboard: (p) => <IconDashboard {...p} />,
  shield: (p) => <IconShield {...p} />,
  users: (p) => <IconUsers {...p} />,
  user: (p) => <IconUser {...p} />,
  building: (p) => <IconBuilding {...p} />,
  contract: (p) => <IconContract {...p} />,
  site: (p) => <IconSite {...p} />,
  post: (p) => <IconPost {...p} />,
  clock: (p) => <IconClock {...p} />,
  shifts: (p) => <IconShifts {...p} />,
  list: (p) => <IconList {...p} />,
  alert: (p) => <IconAlert {...p} />,
  incident: (p) => <IconIncident {...p} />,
  route: (p) => <IconRoute {...p} />,
  camera: (p) => <IconCamera {...p} />,
  'map-pin': (p) => <IconMapPin {...p} />,
  bell: (p) => <IconBell {...p} />,
  sos: (p) => <IconSos {...p} />,
  check: (p) => <IconCheck {...p} />,
  close: (p) => <IconClose {...p} />,
  plus: (p) => <IconPlus {...p} />,
  search: (p) => <IconSearch {...p} />,
  refresh: (p) => <IconRefresh {...p} />,
  'chevron-right': (p) => <IconChevronRight {...p} />,
  'chevron-down': (p) => <IconChevronDown {...p} />,
  download: (p) => <IconDownload {...p} />,
  menu: (p) => <IconMenu {...p} />,
  logout: (p) => <IconLogout {...p} />,
  wallet: (p) => <IconWallet {...p} />,
  invoice: (p) => <IconInvoice {...p} />,
  supervis: (p) => <IconSupervis {...p} />,
  eye: (p) => <IconEye {...p} />,
  document: (p) => <IconDocument {...p} />,
  report: (p) => <IconReport {...p} />,
  visitors: (p) => <IconVisitors {...p} />,
  car: (p) => <IconCar {...p} />,
  box: (p) => <IconBox {...p} />,
  payroll: (p) => <IconPayroll {...p} />,
  folder: (p) => <IconFolder {...p} />,
  lock: (p) => <IconLock {...p} />,
  mail: (p) => <IconMail {...p} />,
  gps: (p) => <IconGps {...p} />,
  log: (p) => <IconLog {...p} />,
  phone: (p) => <IconPhone {...p} />,
  sun: (p) => <IconSun {...p} />,
  calendar: (p) => <IconCalendar {...p} />,
};

export function Icon({ name, className, size }: { name: IconName } & IconProps) {
  return <>{ICONS[name]({ className, size })}</>;
}