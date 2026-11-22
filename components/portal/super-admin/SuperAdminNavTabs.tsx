'use client';

import React from 'react';
import { NavTabs } from '../layout/NavTabs';
import { HOUSE_ITEMS } from '../layout/navConfig';

/** The House screens, as tabs: the same list, in the same order, as the sidebar. */
export const SuperAdminNavTabs: React.FC = () => <NavTabs id="house" accent tabs={HOUSE_ITEMS} />;
