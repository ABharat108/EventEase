import { useState } from 'react';
import { OrganizerDashboard } from './OrganizerDashboardNew';
import { StaffDashboard } from './StaffDashboard';

interface DashboardProps {
  userType: 'organizer' | 'staff';
}

export function Dashboard({ userType }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  if (userType === 'organizer') {
    return <OrganizerDashboard searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
  } else {
    return <StaffDashboard searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
  }
}
