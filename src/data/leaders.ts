export interface Leader {
  id: string;
  name: string;
  imageUrl: string;
  constituency: string;
  electionType: 'national' | 'state' | 'panchayat';
  location: {
    state?: string;
    district?: string;
  };
  rating: number;
  reviewCount: number;
}

export const initialLeaders: Leader[] = [
  {
    id: '1',
    name: 'Aarav Sharma',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mumbai South',
    electionType: 'national',
    location: { state: 'Maharashtra' },
    rating: 4.5,
    reviewCount: 120,
  },
  {
    id: '2',
    name: 'Priya Singh',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Bangalore Central',
    electionType: 'national',
    location: { state: 'Karnataka' },
    rating: 4.2,
    reviewCount: 95,
  },
  {
    id: '3',
    name: 'Rohan Gupta',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Pune Assembly',
    electionType: 'state',
    location: { state: 'Maharashtra' },
    rating: 3.8,
    reviewCount: 75,
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Chennai Corporation',
    electionType: 'panchayat',
    location: { state: 'Tamil Nadu', district: 'Chennai' },
    rating: 4.8,
    reviewCount: 210,
  },
  {
    id: '5',
    name: 'Vikram Patel',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Lucknow East',
    electionType: 'state',
    location: { state: 'Uttar Pradesh' },
    rating: 3.5,
    reviewCount: 60,
  },
  {
    id: '6',
    name: 'Anika Desai',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mysuru Gram Panchayat',
    electionType: 'panchayat',
    location: { state: 'Karnataka', district: 'Mysuru' },
    rating: 4.9,
    reviewCount: 150,
  },
   {
    id: '7',
    name: 'Ravi Kumar',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'New Delhi',
    electionType: 'national',
    location: { state: 'Delhi' },
    rating: 4.1,
    reviewCount: 500,
  },
  {
    id: '8',
    name: 'Meera Iyer',
    imageUrl: 'https://placehold.co/400x400.png',
    constituency: 'Madurai West',
    electionType: 'state',
    location: { state: 'Tamil Nadu' },
    rating: 4.0,
    reviewCount: 88,
  }
];

const LEADERS_STORAGE_KEY = 'politirate_leaders';

export function getLeaders(): Leader[] {
  if (typeof window === 'undefined') {
    return initialLeaders;
  }

  try {
    const storedLeaders = localStorage.getItem(LEADERS_STORAGE_KEY);
    if (storedLeaders) {
      return JSON.parse(storedLeaders);
    } else {
      localStorage.setItem(LEADERS_STORAGE_KEY, JSON.stringify(initialLeaders));
      return initialLeaders;
    }
  } catch (error) {
    console.error("Failed to read leaders from localStorage", error);
    return initialLeaders;
  }
}

export function addLeader(leader: Omit<Leader, 'id' | 'rating' | 'reviewCount'>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const newLeader: Leader = {
    ...leader,
    id: new Date().getTime().toString(),
    rating: 0,
    reviewCount: 0,
  };

  const currentLeaders = getLeaders();
  const updatedLeaders = [...currentLeaders, newLeader];

  try {
    localStorage.setItem(LEADERS_STORAGE_KEY, JSON.stringify(updatedLeaders));
  } catch (error) {
    console.error("Failed to save leader to localStorage", error);
  }
}
