export interface Leader {
  id: string;
  name: string;
  partyName: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  photoUrl: string;
  constituency: string;
  nativeAddress: string;
  electionType: 'national' | 'state' | 'panchayat';
  location: {
    state?: string;
    district?: string;
  };
  rating: number;
  reviewCount: number;
  previousElections: Array<{
    electionType: string;
    constituency: string;
    status: 'winner' | 'loser';
    electionYear: string;
    partyName: string;
  }>;
  manifestoUrl?: string;
  twitterUrl?: string;
}

let leaders: Leader[] | null = null;

function initializeLeaders() {
  if (typeof window === 'undefined') {
    leaders = [];
    return;
  }
  
  if (leaders === null) {
      const storedLeaders = localStorage.getItem('politirate_leaders');
      if (storedLeaders) {
          try {
            leaders = JSON.parse(storedLeaders);
          } catch(e) {
            console.error("Failed to parse leaders, initializing with default.", e);
            leaders = [...defaultLeaders];
          }
      } else {
          leaders = [...defaultLeaders];
      }
      localStorage.setItem('politirate_leaders', JSON.stringify(leaders));
  }
}

const defaultLeaders: Leader[] = [
  {
    id: '1',
    name: 'Aarav Sharma',
    partyName: 'Jan Vikas Party',
    gender: 'male',
    age: 45,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mumbai South',
    nativeAddress: 'Mumbai, Maharashtra',
    electionType: 'national',
    location: { state: 'Maharashtra' },
    rating: 4.5,
    reviewCount: 120,
    previousElections: [
      { electionType: 'national', constituency: 'Mumbai South', status: 'winner', electionYear: '2019', partyName: 'Jan Vikas Party' }
    ],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '2',
    name: 'Priya Singh',
    partyName: 'Lok Satta Party',
    gender: 'female',
    age: 38,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Bangalore Central',
    nativeAddress: 'Bengaluru, Karnataka',
    electionType: 'national',
    location: { state: 'Karnataka' },
    rating: 4.2,
    reviewCount: 95,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '3',
    name: 'Rohan Gupta',
    partyName: 'Swabhiman Party',
    gender: 'male',
    age: 52,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Pune Assembly',
    nativeAddress: 'Pune, Maharashtra',
    electionType: 'state',
    location: { state: 'Maharashtra' },
    rating: 3.8,
    reviewCount: 75,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    partyName: 'People\'s Front',
    gender: 'female',
    age: 41,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Chennai Corporation',
    nativeAddress: 'Chennai, Tamil Nadu',
    electionType: 'panchayat',
    location: { state: 'Tamil Nadu', district: 'Chennai' },
    rating: 4.8,
    reviewCount: 210,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '5',
    name: 'Vikram Patel',
    partyName: 'Jan Vikas Party',
    gender: 'male',
    age: 55,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Lucknow East',
    nativeAddress: 'Lucknow, Uttar Pradesh',
    electionType: 'state',
    location: { state: 'Uttar Pradesh' },
    rating: 3.5,
    reviewCount: 60,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '6',
    name: 'Anika Desai',
    partyName: 'Independent',
    gender: 'female',
    age: 35,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Mysuru Gram Panchayat',
    nativeAddress: 'Mysuru, Karnataka',
    electionType: 'panchayat',
    location: { state: 'Karnataka', district: 'Mysuru' },
    rating: 4.9,
    reviewCount: 150,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
   {
    id: '7',
    name: 'Ravi Kumar',
    partyName: 'Lok Satta Party',
    gender: 'male',
    age: 60,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'New Delhi',
    nativeAddress: 'New Delhi, Delhi',
    electionType: 'national',
    location: { state: 'Delhi' },
    rating: 4.1,
    reviewCount: 500,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  },
  {
    id: '8',
    name: 'Meera Iyer',
    partyName: 'Swabhiman Party',
    gender: 'female',
    age: 48,
    photoUrl: 'https://placehold.co/400x400.png',
    constituency: 'Madurai West',
    nativeAddress: 'Madurai, Tamil Nadu',
    electionType: 'state',
    location: { state: 'Tamil Nadu' },
    rating: 4.0,
    reviewCount: 88,
    previousElections: [],
    twitterUrl: 'https://x.com/example',
  }
];

export function getLeaders(): Leader[] {
  initializeLeaders();
  return leaders || [];
}

export function addLeader(leader: Omit<Leader, 'id' | 'rating' | 'reviewCount'>): void {
  initializeLeaders();
  if (!leaders) return;

  const newLeader: Leader = {
    ...leader,
    id: new Date().getTime().toString(),
    rating: 0,
    reviewCount: 0,
  };

  leaders.push(newLeader);
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('politirate_leaders', JSON.stringify(leaders));
  }
}
