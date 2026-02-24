import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Star, Shield, Calendar, DollarSign, Users, Clock, CheckCircle, MessageCircle, Heart, Search, Filter, Home, User, Bell, Menu, X, Plus, ChevronRight, TrendingUp, Award, Key, Edit, List, Map } from 'lucide-react';

// ─── Google Maps Configuration ───────────────────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'AIzaSyBufA5vSXzxRPYrWr_2m-s2PJabZJ4yxW0';

// Neighborhood center — 600 Block of N. Harvey Ave, Oak Park, IL
const NEIGHBORHOOD_CENTER = { lat: 41.8878, lng: -87.8028 };

// Per-user map pin data (matches blockbutler-db.json households)
const USER_LOCATIONS = {
  dana:   { lat: 41.88820, lng: -87.80350, address: '248 W. Iowa Street' },
  rico:   { lat: 41.88820, lng: -87.80350, address: '248 W. Iowa Street' },
  andrew: { lat: 41.88780, lng: -87.80280, address: '613 N. Harvey Avenue' },
  mel:    { lat: 41.88750, lng: -87.80280, address: '609 N. Harvey Avenue' },
  tom:    { lat: 41.88810, lng: -87.80280, address: '617 N. Harvey Avenue' },
  sarah:  { lat: 41.88840, lng: -87.80280, address: '621 N. Harvey Avenue' },
  james:  { lat: 41.88720, lng: -87.80280, address: '605 N. Harvey Avenue' },
};

// ─── ProfilePhoto Component ───────────────────────────────────────────────────
// Shows image if path is valid, falls back to colored initials
const AVATAR_COLORS = ['#E07B5F','#5C8C5A','#7B8CBE','#C4855A','#6B9E8C','#B07CC6'];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
};
const ProfilePhoto = ({ user, size = 48, fontSize }) => {
  const [imgError, setImgError] = React.useState(false);
  const name = user?.name || '';
  const photo = user?.photo || '';
  // If photo is an emoji or empty or errored, show initials
  const isImagePath = photo && photo.startsWith('/');
  const showImage = isImagePath && !imgError;
  const avatarColor = getAvatarColor(name);
  const fs = fontSize || Math.round(size * 0.38);
  const style = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: showImage ? 'transparent' : avatarColor,
    color: '#fff', fontWeight: 700, fontSize: fs,
    flexShrink: 0, overflow: 'hidden', userSelect: 'none',
  };
  if (showImage) {
    return (
      <div style={style}>
        <img
          src={photo} alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  // Show emoji if it looks like one (non-path, short string)
  if (photo && !photo.startsWith('/') && photo.length <= 4) {
    return <div style={{ ...style, background: avatarColor, fontSize: fs * 1.3 }}>{photo}</div>;
  }
  return <div style={style}>{getInitials(name)}</div>;
};
// ─────────────────────────────────────────────────────────────────────────────

// Mock Data (kept as fallback if API is unavailable)
// This data structure shows what the API should return
const currentUser = {
  id: 'dana',
  name: 'Dana Martinez',
  photo: '👩🏽',
  address: '248 W. Iowa Street',
  neighborhood: 'Harvey Ave Block',
  verifiedBlock: '600 Block of N. Harvey Avenue',
  verifiedDate: 'November 2024',
  role: 'client', // or 'butler'
  bio: 'New mom looking for reliable help with everyday tasks. Love connecting with neighbors!',
  interests: [
    'Parenting',
    'Gardening',
    'Cooking',
    'Book Club',
    'Running',
    'Community Events'
  ],
  seekingHelp: [
    {
      id: 1,
      category: 'Household',
      task: 'Laundry Service',
      frequency: 'Twice weekly',
      budget: '$20-30 per load',
      priority: 'high',
      status: 'active' // has found help (Mel)
    },
    {
      id: 2,
      category: 'Errands',
      task: 'Grocery Delivery',
      frequency: 'Weekly',
      budget: '$15-25 per trip',
      priority: 'high',
      status: 'active' // has found help (Mel)
    },
    {
      id: 3,
      category: 'Childcare',
      task: 'Occasional Babysitting',
      frequency: 'As needed',
      budget: '$20-25 per hour',
      priority: 'medium',
      status: 'seeking' // still looking
    },
    {
      id: 4,
      category: 'Yard Work',
      task: 'Lawn Mowing',
      frequency: 'Bi-weekly',
      budget: '$30-40',
      priority: 'low',
      status: 'seeking'
    }
  ],
  connections: ['tom', 'sarah', 'james', 'mel'],
  joinedDate: 'November 2024',
  tasksCompleted: 0, // client doesn't complete tasks for others yet
  activeBookings: 2
};

// Mel's profile as a user (butler perspective)
const melAsUser = {
  id: 'mel',
  name: 'Mel Chen',
  photo: '👩🏻',
  address: '609 N. Harvey Avenue',
  neighborhood: 'Harvey Ave Block',
  verifiedBlock: '600 Block of N. Harvey Avenue',
  verifiedDate: 'August 2024',
  role: 'butler',
  bio: 'Stay-at-home parent with flexible schedule. Love helping neighbors!',
  interests: [
    'Cooking',
    'Organization',
    'Children',
    'Fitness',
    'Volunteering',
    'Reading'
  ],
  servicesOffered: [
    {
      id: 1,
      name: 'Package Collection',
      rate: 15,
      frequency: 'per pickup',
      radius: null,
      active: true,
      bookings: 8
    },
    {
      id: 2,
      name: 'Laundry Service',
      rate: 25,
      frequency: 'per load',
      radius: null,
      active: true,
      bookings: 12
    },
    {
      id: 3,
      name: 'Grocery Delivery',
      rate: 20,
      frequency: 'per trip',
      radius: 5,
      radiusUnit: 'miles',
      active: true,
      bookings: 7
    },
    {
      id: 4,
      name: 'Local Errands',
      rate: 18,
      frequency: 'per hour',
      radius: 5,
      radiusUnit: 'miles',
      active: true,
      bookings: 5
    }
  ],
  activeClients: [
    {
      id: 1,
      client: {
        id: 'dana',
        name: 'Dana Martinez',
        photo: '👩🏽',
        address: '248 W. Iowa Street'
      },
      services: ['Laundry Service', 'Grocery Delivery'],
      weeklyRevenue: 90,
      nextScheduled: 'Tomorrow, 10:00 AM',
      houseKeyAccess: true,
      since: '3 weeks ago'
    },
    {
      id: 2,
      client: {
        id: 'tom',
        name: 'Tom Williams',
        photo: '👨🏼',
        address: '617 N. Harvey Avenue'
      },
      services: ['Package Collection'],
      weeklyRevenue: 30,
      nextScheduled: 'Thursday, 2:00 PM',
      houseKeyAccess: true,
      since: '2 months ago'
    }
  ],
  connections: ['dana', 'tom', 'sarah'],
  joinedDate: 'August 2024',
  tasksCompleted: 47,
  rating: 4.9,
  reviewCount: 23,
  totalEarnings: 1847,
  thisMonthEarnings: 340
};

const users = {
  mel: {
    id: 'mel',
    name: 'Mel Chen',
    photo: '👩🏻',
    address: '609 N. Harvey Avenue',
    neighborhood: 'Harvey Ave Block',
    bio: 'Stay-at-home parent with flexible schedule. Love helping neighbors!',
    rating: 4.9,
    reviewCount: 23,
    verified: true,
    houseKeyTrusted: 3, // Number of neighbors who have given house access
    houseKeyTrustedBy: ['dana', 'tom', 'sarah'], // IDs of neighbors who trust with keys
    services: [
      { id: 1, name: 'Package Collection', rate: 15, frequency: 'per pickup', radius: null },
      { id: 2, name: 'Laundry Service', rate: 25, frequency: 'per load', radius: null },
      { id: 3, name: 'Grocery Delivery', rate: 20, frequency: 'per trip', radius: 5, radiusUnit: 'miles' },
      { id: 4, name: 'Local Errands', rate: 18, frequency: 'per hour', radius: 5, radiusUnit: 'miles' }
    ],
    availability: 'Mon-Fri, 9am-4pm',
    connections: ['tom', 'sarah', 'dana'],
    mutualWith: ['tom'], // mutual with current user
    tags: ['Reliable', 'Flexible', 'Detail-oriented'],
    joined: '3 months ago',
    completedTasks: 47
  },
  tom: {
    id: 'tom',
    name: 'Tom Williams',
    photo: '👨🏼',
    address: '617 N. Harvey Avenue',
    neighborhood: 'Harvey Ave Block',
    bio: 'Retired teacher, happy to help with tutoring and handyman work.',
    rating: 5.0,
    reviewCount: 31,
    verified: true,
    houseKeyTrusted: 5,
    houseKeyTrustedBy: ['mel', 'dana', 'sarah', 'james'],
    services: [
      { id: 5, name: 'Tutoring (K-8)', rate: 30, frequency: 'per hour', radius: null },
      { id: 6, name: 'DIY Assistance', rate: 25, frequency: 'per hour', radius: null },
      { id: 7, name: 'Pet Sitting', rate: 0, frequency: 'free', radius: null }
    ],
    availability: 'Flexible',
    connections: ['mel', 'dana', 'sarah', 'james'],
    mutualWith: [],
    tags: ['Experienced', 'Patient', 'Trustworthy'],
    joined: '6 months ago',
    completedTasks: 68
  },
  sarah: {
    id: 'sarah',
    name: 'Sarah Johnson',
    photo: '👩🏾',
    address: '621 N. Harvey Avenue',
    neighborhood: 'Harvey Ave Block',
    bio: 'Working from home, available for dog walking and plant care.',
    rating: 4.8,
    reviewCount: 15,
    verified: false,
    houseKeyTrusted: 1,
    houseKeyTrustedBy: ['tom'],
    services: [
      { id: 8, name: 'Dog Walking', rate: 20, frequency: 'per walk', radius: 2, radiusUnit: 'miles' },
      { id: 9, name: 'Plant Care', rate: 15, frequency: 'per visit', radius: null }
    ],
    availability: 'Weekday mornings',
    connections: ['tom', 'mel', 'dana'],
    mutualWith: ['tom', 'mel'],
    tags: ['Loves pets', 'Green thumb'],
    joined: '2 months ago',
    completedTasks: 19
  },
  james: {
    id: 'james',
    name: 'James Park',
    photo: '👨🏻',
    address: '605 N. Harvey Avenue',
    neighborhood: 'Harvey Ave Block',
    bio: 'College student home for break, looking to earn extra money.',
    rating: 4.7,
    reviewCount: 8,
    verified: false,
    houseKeyTrusted: 0,
    houseKeyTrustedBy: [],
    services: [
      { id: 10, name: 'Snow Shoveling', rate: 0, frequency: 'free', radius: null },
      { id: 11, name: 'Tech Support', rate: 22, frequency: 'per hour', radius: null },
      { id: 12, name: 'Moving Help', rate: 25, frequency: 'per hour', radius: 10, radiusUnit: 'miles' }
    ],
    availability: 'Weekends',
    connections: ['tom', 'dana'],
    mutualWith: ['tom'],
    tags: ['Strong', 'Tech-savvy'],
    joined: '1 month ago',
    completedTasks: 12
  }
};

const bookings = [
  {
    id: 1,
    butler: users.mel,
    service: 'Laundry Service',
    status: 'active',
    frequency: 'Every Tuesday & Thursday',
    nextDate: 'Tomorrow, 10:00 AM',
    rate: 25,
    startedDate: '3 weeks ago'
  },
  {
    id: 2,
    butler: users.mel,
    service: 'Grocery Delivery',
    status: 'active',
    frequency: 'Weekly',
    nextDate: 'Friday, 2:00 PM',
    rate: 20,
    startedDate: '1 week ago'
  }
];

const BlockButlerApp = () => {
  const [currentView, setCurrentView] = useState('auth');
  const [authStep, setAuthStep] = useState('welcome');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState('dana');
  const [selectedButler, setSelectedButler] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // NEW: State for API data
  const [users, setUsers] = useState({});
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [requests, setRequests] = useState([]);
  const [communityBoard, setCommunityBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // NEW: Fetch data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users
        const usersRes = await fetch('http://localhost:3001/users');
        
        if (!usersRes.ok) {
          throw new Error('API not available');
        }
        
        const usersData = await usersRes.json();
        
        // Convert array to object keyed by id (to match current structure)
        const usersObj = {};
        usersData.forEach(user => {
          usersObj[user.id] = user;
        });
        setUsers(usersObj);
        
        // Fetch all services
        const servicesRes = await fetch('http://localhost:3001/services');
        const servicesData = await servicesRes.json();
        setServices(servicesData);
        
        // Fetch all bookings
        const bookingsRes = await fetch('http://localhost:3001/bookings');
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);

        try {
          const catalogRes = await fetch('http://localhost:3001/serviceCatalog');
          if (catalogRes.ok) setServiceCatalog(await catalogRes.json());
        } catch(e) {}
        try {
          const requestsRes = await fetch('http://localhost:3001/requests');
          if (requestsRes.ok) setRequests(await requestsRes.json());
        } catch(e) {}
        try {
          const communityRes = await fetch('http://localhost:3001/communityBoard');
          if (communityRes.ok) setCommunityBoard(await communityRes.json());
        } catch(e) {}
        
        setLoading(false);
      } catch (err) {
        console.warn('API not available, using mock data:', err);
        // Fall back to mock data
        setUsers({
          dana: currentUser,
          mel: {
            ...melAsUser,
            services: melAsUser.servicesOffered || []
          },
          tom: {
            id: 'tom',
            name: 'Tom Williams',
            photo: '👨🏼',
            address: '617 N. Harvey Avenue',
            neighborhood: 'Harvey Ave Block',
            verifiedBlock: '600 Block of N. Harvey Avenue',
            verifiedDate: 'June 2024',
            role: 'butler',
            bio: 'Retired teacher, happy to help with tutoring and handyman work.',
            rating: 5.0,
            reviewCount: 31,
            verified: true,
            connections: ['mel', 'dana', 'sarah', 'james'],
            joinedDate: 'June 2024',
            tasksCompleted: 68,
            houseKeyTrusted: 5,
            houseKeyTrustedBy: ['mel', 'dana', 'sarah', 'james'],
            tags: ['Experienced', 'Patient', 'Trustworthy'],
            interests: ['Teaching', 'DIY Projects', 'Pets', 'History'],
            services: [
              {
                id: 'service5',
                name: 'Tutoring (K-8)',
                rate: 30,
                frequency: 'per hour',
                radius: null,
                active: true
              },
              {
                id: 'service6',
                name: 'DIY Assistance',
                rate: 25,
                frequency: 'per hour',
                radius: null,
                active: true
              },
              {
                id: 'service7',
                name: 'Pet Sitting',
                rate: 0,
                frequency: 'free',
                radius: null,
                active: true
              }
            ]
          },
          sarah: {
            id: 'sarah',
            name: 'Sarah Johnson',
            photo: '👩🏾',
            address: '621 N. Harvey Avenue',
            neighborhood: 'Harvey Ave Block',
            verifiedBlock: '600 Block of N. Harvey Avenue',
            verifiedDate: 'October 2024',
            role: 'butler',
            bio: 'Working from home, available for dog walking and plant care.',
            rating: 4.8,
            reviewCount: 15,
            verified: false,
            connections: ['tom', 'mel', 'dana'],
            joinedDate: 'October 2024',
            tasksCompleted: 19,
            houseKeyTrusted: 1,
            houseKeyTrustedBy: ['tom'],
            tags: ['Loves pets', 'Green thumb'],
            interests: ['Dogs', 'Gardening', 'Hiking'],
            services: [
              {
                id: 'service8',
                name: 'Dog Walking',
                rate: 20,
                frequency: 'per walk',
                radius: 2,
                radiusUnit: 'miles',
                active: true
              },
              {
                id: 'service9',
                name: 'Plant Care',
                rate: 15,
                frequency: 'per visit',
                radius: null,
                active: true
              }
            ]
          },
          james: {
            id: 'james',
            name: 'James Park',
            photo: '👨🏻',
            address: '605 N. Harvey Avenue',
            neighborhood: 'Harvey Ave Block',
            verifiedBlock: '600 Block of N. Harvey Avenue',
            verifiedDate: 'January 2025',
            role: 'butler',
            bio: 'College student home for break, looking to earn extra money.',
            rating: 4.7,
            reviewCount: 8,
            verified: false,
            connections: ['tom', 'dana'],
            joinedDate: 'January 2025',
            tasksCompleted: 12,
            houseKeyTrusted: 0,
            houseKeyTrustedBy: [],
            tags: ['Strong', 'Tech-savvy'],
            interests: ['Technology', 'Gaming', 'Fitness'],
            services: [
              {
                id: 'service10',
                name: 'Snow Shoveling',
                rate: 0,
                frequency: 'free',
                radius: null,
                active: true
              },
              {
                id: 'service11',
                name: 'Tech Support',
                rate: 22,
                frequency: 'per hour',
                radius: null,
                active: true
              },
              {
                id: 'service12',
                name: 'Moving Help',
                rate: 25,
                frequency: 'per hour',
                radius: 10,
                radiusUnit: 'miles',
                active: true
              }
            ]
          },
          andrew: {
            id: 'andrew',
            name: 'Andrew Antal',
            email: 'aantal2000@yahoo.com',
            photo: '/images/profiles/andrew.svg',
            address: '613 N. Harvey Avenue',
            neighborhood: 'Harvey Ave Block',
            verifiedBlock: '600 Block of N. Harvey Avenue',
            verifiedDate: 'February 2026',
            bio: '',
            interests: [],
            connections: [],
            joinedDate: 'February 2026',
            verified: true,
            tasksCompleted: 0,
            rating: null,
            reviewCount: 0,
            totalEarnings: 0,
            thisMonthEarnings: 0,
            houseKeyTrusted: 0,
            houseKeyTrustedBy: [],
            tags: [],
            seeking: [],
            activeBookings: 0,
            activeClients: []
          }
        });
        setBookings([
          { id: 'booking1',   clientId: 'dana',  providerId: 'mel',   serviceId: 'svc-mel-01',   serviceName: 'Laundry',          status: 'active',    frequency: 'Twice weekly',  nextDate: 'Tomorrow, 10:00 AM',    rate: 25, rateUnit: 'per load',    startedDate: '3 weeks ago',  houseKeyAccess: true,  notes: 'Eco-friendly detergent. Baby clothes gentle cycle.' },
          { id: 'booking2',   clientId: 'dana',  providerId: 'mel',   serviceId: 'svc-mel-02',   serviceName: 'Grocery Shopping', status: 'active',    frequency: 'Weekly',        nextDate: 'Friday, 2:00 PM',       rate: 20, rateUnit: 'per trip',    startedDate: '1 week ago',   houseKeyAccess: false, notes: 'List sent Thursday evening. Prefers Whole Foods.' },
          { id: 'booking3',   clientId: 'tom',   providerId: 'mel',   serviceId: 'svc-mel-04',   serviceName: 'Package Collection',status: 'active',   frequency: 'As needed',     nextDate: 'Thursday, 2:00 PM',     rate: 15, rateUnit: 'per pickup',  startedDate: '2 months ago', houseKeyAccess: true,  notes: 'Leave on porch table, text when dropped off.' },
          { id: 'booking4',   clientId: 'tom',   providerId: 'dana',  serviceId: 'svc-dana-01',  serviceName: 'Meals & Cooking',  status: 'active',    frequency: 'Weekly',        nextDate: 'Wednesday, 5:00 PM',    rate: 30, rateUnit: 'per meal',    startedDate: '2 weeks ago',  houseKeyAccess: false, notes: 'No shellfish. Loves Mediterranean. Cooler on porch.' },
          { id: 'booking5',   clientId: 'sarah', providerId: 'tom',   serviceId: 'svc-tom-01',   serviceName: 'Tutoring',         status: 'active',    frequency: 'Twice weekly',  nextDate: 'Monday, 4:00 PM',       rate: 35, rateUnit: 'per hour',    startedDate: '1 month ago',  houseKeyAccess: false, notes: '8th grade math and science.' },
          { id: 'booking6',   clientId: 'rico',  providerId: 'sarah', serviceId: 'svc-sarah-01', serviceName: 'Dog Walking',      status: 'active',    frequency: 'Daily',         nextDate: 'Tomorrow, 7:30 AM',     rate: 20, rateUnit: 'per walk',    startedDate: '3 weeks ago',  houseKeyAccess: true,  notes: 'Two labs — Biscuit and Pepper. Biscuit pulls, use harness.' },
          { id: 'booking7',   clientId: 'james', providerId: 'tom',   serviceId: 'svc-tom-02',   serviceName: 'DIY Tasks',        status: 'active',    frequency: 'As needed',     nextDate: 'Saturday, 9:00 AM',     rate: 25, rateUnit: 'per hour',    startedDate: '2 weeks ago',  houseKeyAccess: false, notes: 'Deck boards and leaky faucet.' },
          { id: 'booking8',   clientId: 'dana',  providerId: 'sarah', serviceId: 'svc-sarah-02', serviceName: 'Pet Sitting',      status: 'active',    frequency: 'One-time',      nextDate: 'Next Monday, All day',  rate: 25, rateUnit: 'per day',     startedDate: 'This week',    houseKeyAccess: true,  notes: 'Cat named Mochi. Food in pantry, litter in basement.' },
          { id: 'booking-c1', clientId: 'dana',  providerId: 'mel',   serviceId: 'svc-mel-03',   serviceName: 'Local Errands',    status: 'completed', frequency: 'One-time',      nextDate: null, completedDate: 'Last Monday',  rate: 18, rateUnit: 'per hour',    startedDate: 'Last Monday',  houseKeyAccess: false, notes: 'Post office and dry cleaning pickup.' },
          { id: 'booking-c2', clientId: 'tom',   providerId: 'mel',   serviceId: 'svc-mel-05',   serviceName: 'House Sitting',    status: 'completed', frequency: 'One-time',      nextDate: null, completedDate: '2 weeks ago',  rate: 30, rateUnit: 'per day',     startedDate: '2 weeks ago',  houseKeyAccess: true,  notes: 'Watered plants and took in mail.' },
          { id: 'booking-c3', clientId: 'sarah', providerId: 'tom',   serviceId: 'svc-tom-04',   serviceName: 'Chauffeur',        status: 'completed', frequency: 'One-time',      nextDate: null, completedDate: 'Last Friday',  rate: 20, rateUnit: 'per hour',    startedDate: 'Last Friday',  houseKeyAccess: false, notes: "Airport run to O'Hare, early morning." },
        ]);
                setServiceCatalog([
          { id: 'cat-01', name: 'Package Collection',      icon: '📦', category: 'Errands',   defaultRate: 15, rateUnit: 'per pickup' },
          { id: 'cat-02', name: 'Chauffeur',               icon: '🚗', category: 'Transport', defaultRate: 25, rateUnit: 'per hour'   },
          { id: 'cat-03', name: 'Babysitting',             icon: '👶', category: 'Childcare', defaultRate: 20, rateUnit: 'per hour'   },
          { id: 'cat-04', name: 'After School Child Care', icon: '🏫', category: 'Childcare', defaultRate: 18, rateUnit: 'per hour'   },
          { id: 'cat-05', name: 'Laundry',                 icon: '🧺', category: 'Household', defaultRate: 25, rateUnit: 'per load'   },
          { id: 'cat-06', name: 'Grocery Shopping',        icon: '🛒', category: 'Errands',   defaultRate: 20, rateUnit: 'per trip'   },
          { id: 'cat-07', name: 'Local Errands',           icon: '🏃', category: 'Errands',   defaultRate: 18, rateUnit: 'per hour'   },
          { id: 'cat-08', name: 'House Sitting',           icon: '🏠', category: 'Household', defaultRate: 30, rateUnit: 'per day'    },
          { id: 'cat-09', name: 'Pet Sitting',             icon: '🐾', category: 'Pets',      defaultRate: 25, rateUnit: 'per day'    },
          { id: 'cat-10', name: 'Dog Walking',             icon: '🐕', category: 'Pets',      defaultRate: 20, rateUnit: 'per walk'   },
          { id: 'cat-11', name: 'DIY Tasks',               icon: '🔧', category: 'Household', defaultRate: 25, rateUnit: 'per hour'   },
          { id: 'cat-12', name: 'Meals & Cooking',         icon: '🍳', category: 'Food',      defaultRate: 30, rateUnit: 'per meal'   },
          { id: 'cat-13', name: 'Tutoring',                icon: '📚', category: 'Education', defaultRate: 35, rateUnit: 'per hour'   },
        ]);
        setRequests([
          { id: 'req-001', type: 'cat-10', typeName: 'Dog Walking',     status: 'requested',  butlerId: 'sarah', principalId: 'dana',  proposedRate: 20, rateUnit: 'per walk', date: '2026-02-25', time: '7:30 AM',   notes: 'Both dogs, about 45 mins.',            createdAt: '2026-02-18T09:15:00' },
          { id: 'req-002', type: 'cat-06', typeName: 'Grocery Shopping', status: 'requested',  butlerId: 'mel',   principalId: 'tom',   proposedRate: 20, rateUnit: 'per trip', date: '2026-02-22', time: '10:00 AM',  notes: 'Whole Foods, ~20 items.',              createdAt: '2026-02-18T11:30:00' },
          { id: 'req-003', type: 'cat-13', typeName: 'Tutoring',         status: 'requested',  butlerId: 'tom',   principalId: 'james', proposedRate: 35, rateUnit: 'per hour', date: '2026-02-24', time: '4:00 PM',   notes: 'SAT prep, first session.',             createdAt: '2026-02-17T16:45:00' },
          { id: 'req-004', type: 'cat-11', typeName: 'DIY Tasks',        status: 'requested',  butlerId: 'james', principalId: 'sarah', proposedRate: 22, rateUnit: 'per hour', date: '2026-02-26', time: '9:00 AM',   notes: 'Shelves and a stuck door.',            createdAt: '2026-02-18T08:00:00' },
          { id: 'req-005', type: 'cat-09', typeName: 'Pet Sitting',      status: 'scheduled',  butlerId: 'sarah', principalId: 'rico',  proposedRate: 25, rateUnit: 'per day',  date: '2026-02-28', time: 'All day',   notes: 'Two cats. Very easy.',                 createdAt: '2026-02-15T14:00:00' },
          { id: 'req-006', type: 'cat-05', typeName: 'Laundry',          status: 'scheduled',  butlerId: 'mel',   principalId: 'dana',  proposedRate: 25, rateUnit: 'per load', date: '2026-02-20', time: '10:00 AM',  notes: '3 loads. Baby clothes gentle cycle.',  createdAt: '2026-02-16T10:00:00' },
          { id: 'req-007', type: 'cat-02', typeName: 'Chauffeur',        status: 'cancelled',  butlerId: 'tom',   principalId: 'dana',  proposedRate: 20, rateUnit: 'per hour', date: '2026-02-17', time: '6:00 AM',   notes: 'Airport run. Flight rescheduled.',     createdAt: '2026-02-14T09:00:00' },
          { id: 'req-008', type: 'cat-07', typeName: 'Local Errands',    status: 'completed',  butlerId: 'mel',   principalId: 'dana',  proposedRate: 18, rateUnit: 'per hour', date: '2026-02-17', time: '11:00 AM',  notes: 'Post office and pharmacy.',            createdAt: '2026-02-16T18:00:00' },
          { id: 'req-009', type: 'cat-12', typeName: 'Meals & Cooking',  status: 'completed',  butlerId: 'dana',  principalId: 'tom',   proposedRate: 30, rateUnit: 'per meal', date: '2026-02-12', time: '5:00 PM',   notes: 'Mediterranean spread. Tom loved it.',  createdAt: '2026-02-10T12:00:00' },
        ]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Intent-driven role helpers (no fixed role field required)
  const isProvider = (user) => {
    if (!user) return false;
    if (user.role === 'butler') return true; // legacy fallback
    const userServices = services.filter(s => s.providerId === user.id);
    return userServices.length > 0 || (user.services && user.services.length > 0) || (user.tasksCompleted > 0);
  };

  const isConsumer = (user) => {
    if (!user) return false;
    if (user.role === 'client') return true; // legacy fallback
    return bookings.some(b => b.clientId === user.id) || (user.seekingHelp && user.seekingHelp.length > 0) || (user.activeBookings > 0);
  };

  // Get current user based on ID
  const getCurrentUser = () => {
    return users[currentUserId] || users.dana || {};
  };

  const activeUser = getCurrentUser();
  const activeUserIsProvider = isProvider(activeUser);

  // Show loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #F5F1E8 0%, #E8E4DC 100%)' }}>
        <h2 style={{ fontFamily: 'Quicksand, sans-serif', color: '#2C2C2C' }}>Loading BlockButler...</h2>
      </div>
    );
  }

  // Authentication Views
  const AuthView = () => {
    if (authStep === 'welcome') {
      return (
        <div className="auth-container">
          <div className="auth-card welcome-card">
            <div className="auth-logo">
              <Home size={48} />
              <h1>BlockButler</h1>
              <p className="auth-tagline">Your trusted neighborhood network</p>
            </div>

            <div className="welcome-illustration">
              <div className="welcome-houses">
                <span>🏠</span>
                <span>🏡</span>
                <span>🏘️</span>
              </div>
              <p className="welcome-message">
                Connect with verified neighbors. Build trust through small tasks. 
                Create lasting community relationships.
              </p>
            </div>

            <div className="auth-actions">
              <button className="primary-auth-button" onClick={() => setAuthStep('signup')}>
                Get Started
              </button>
              <button className="secondary-auth-button" onClick={() => setAuthStep('login')}>
                Log In
              </button>
            </div>

            <div className="demo-login-section">
              <div className="demo-divider">
                <span>Or try demo accounts</span>
              </div>
              <div className="demo-buttons">
                <button 
                  className="demo-button"
                  onClick={() => {
                    setCurrentUserId('dana');
                    setIsAuthenticated(true);
                    setCurrentView('home');
                  }}
                >
                  <span className="demo-avatar">👩🏽</span>
                  <div>
                    <strong>Dana (Client)</strong>
                    <span>Looking for help</span>
                  </div>
                </button>
                <button 
                  className="demo-button"
                  onClick={() => {
                    setCurrentUserId('mel');
                    setIsAuthenticated(true);
                    setCurrentView('home');
                  }}
                >
                  <span className="demo-avatar">👩🏻</span>
                  <div>
                    <strong>Mel (Butler)</strong>
                    <span>Offering services</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (authStep === 'login') {
      const handleEmailLogin = () => {
        const email = loginEmail.trim().toLowerCase();
        const match = Object.values(users).find(u => u.email && u.email.toLowerCase() === email);
        if (match) {
          setCurrentUserId(match.id);
          setIsAuthenticated(true);
          setCurrentView('discover');
          setLoginError('');
        } else {
          setLoginError('No account found for that email. Try a demo account or sign up.');
        }
      };

      return (
        <div className="auth-container">
          <div className="auth-card">
            <button className="back-to-welcome" onClick={() => { setAuthStep('welcome'); setLoginError(''); }}>
              ← Back
            </button>

            <div className="auth-header">
              <Home size={32} />
              <h2>Welcome Back</h2>
              <p>Enter your email to log in</p>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={loginEmail}
                  onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleEmailLogin(); }}
                  autoFocus
                />
              </div>

              {loginError && (
                <div style={{
                  padding: '10px 14px',
                  background: '#FDECEA',
                  color: '#CC4444',
                  borderRadius: '10px',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  {loginError}
                </div>
              )}

              <button className="primary-auth-button" onClick={handleEmailLogin}>
                Log In
              </button>
            </div>

            <div className="auth-footer">
              Don't have an account? <button onClick={() => setAuthStep('signup')}>Sign up</button>
            </div>
          </div>
        </div>
      );
    }

    if (authStep === 'signup') {
      return (
        <div className="auth-container">
          <div className="auth-card">
            <button className="back-to-welcome" onClick={() => setAuthStep('welcome')}>
              ← Back
            </button>

            <div className="auth-header">
              <Home size={32} />
              <h2>Join BlockButler</h2>
              <p>Create your account to get started</p>
            </div>

            <div className="auth-form">
              <div className="sso-buttons">
                <button className="sso-button google" onClick={() => setAuthStep('verify-address')}>
                  <span className="sso-icon">G</span>
                  Continue with Google
                </button>
                <button className="sso-button facebook" onClick={() => setAuthStep('verify-address')}>
                  <span className="sso-icon">f</span>
                  Continue with Facebook
                </button>
                <button className="sso-button apple" onClick={() => setAuthStep('verify-address')}>
                  <span className="sso-icon"></span>
                  Continue with Apple
                </button>
              </div>

              <div className="auth-divider">
                <span>or</span>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Dana Martinez" />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="your@email.com" />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input type="password" placeholder="••••••••" />
              </div>

              <button className="primary-auth-button" onClick={() => setAuthStep('verify-address')}>
                Continue
              </button>

              <div className="terms-notice">
                By continuing, you agree to BlockButler's Terms of Service and Privacy Policy
              </div>
            </div>

            <div className="auth-footer">
              Already have an account? <button onClick={() => setAuthStep('login')}>Log in</button>
            </div>
          </div>
        </div>
      );
    }

    if (authStep === 'verify-address') {
      return (
        <div className="auth-container">
          <div className="auth-card verification-card">
            <div className="verification-progress">
              <div className="progress-step active">
                <div className="step-number">1</div>
                <span>Verify Identity</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step active">
                <div className="step-number">2</div>
                <span>Verify Address</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step">
                <div className="step-number">3</div>
                <span>Choose Role</span>
              </div>
            </div>

            <div className="auth-header">
              <Shield size={40} className="verification-icon" />
              <h2>Verify Your Address</h2>
              <p>BlockButler requires address verification to ensure safe, trusted neighborhood connections</p>
            </div>

            <div className="verification-explainer">
              <div className="why-verify">
                <strong>Why we verify addresses:</strong>
                <ul>
                  <li>Ensures you're connecting with real neighbors</li>
                  <li>Creates trusted, geographic boundaries</li>
                  <li>Prevents fraud and builds community safety</li>
                  <li>Enables location-based service matching</li>
                </ul>
              </div>
            </div>

            <div className="auth-form">
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" placeholder="613 N. Harvey Avenue" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" placeholder="Oak Park" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" placeholder="IL" />
                </div>
                <div className="form-group">
                  <label>ZIP</label>
                  <input type="text" placeholder="60302" />
                </div>
              </div>

              <div className="verification-methods">
                <div className="verification-method-card">
                  <input type="radio" name="verification" id="utility" defaultChecked />
                  <label htmlFor="utility">
                    <strong>Upload Utility Bill</strong>
                    <span>Quick verification with recent bill</span>
                  </label>
                </div>
                <div className="verification-method-card">
                  <input type="radio" name="verification" id="postcard" />
                  <label htmlFor="postcard">
                    <strong>Postcard Verification</strong>
                    <span>We'll mail a code to your address (3-5 days)</span>
                  </label>
                </div>
              </div>

              <button className="primary-auth-button" onClick={() => setAuthStep('select-role')}>
                Verify Address
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (authStep === 'select-role') {
      return (
        <div className="auth-container">
          <div className="auth-card role-selection-card">
            <div className="verification-progress">
              <div className="progress-step completed">
                <div className="step-number"><CheckCircle size={20} /></div>
                <span>Verify Identity</span>
              </div>
              <div className="progress-line completed"></div>
              <div className="progress-step completed">
                <div className="step-number"><CheckCircle size={20} /></div>
                <span>Verify Address</span>
              </div>
              <div className="progress-line"></div>
              <div className="progress-step active">
                <div className="step-number">3</div>
                <span>Choose Role</span>
              </div>
            </div>

            <div className="auth-header">
              <Users size={40} />
              <h2>How do you want to use BlockButler?</h2>
              <p>You can always change this later or do both!</p>
            </div>

            <div className="role-selection-grid">
              <div className="role-card" onClick={() => {
                setCurrentUserId('dana');
                setIsAuthenticated(true);
                setCurrentView('discover');
              }}>
                <div className="role-icon client-icon">
                  <Search size={32} />
                </div>
                <h3>Find Help</h3>
                <p>I'm looking for trusted neighbors to help with tasks and services</p>
                <div className="role-features">
                  <span>✓ Browse local services</span>
                  <span>✓ Book trusted neighbors</span>
                  <span>✓ Build recurring relationships</span>
                </div>
              </div>

              <div className="role-card" onClick={() => {
                setCurrentUserId('mel');
                setIsAuthenticated(true);
                setCurrentView('dashboard');
              }}>
                <div className="role-icon butler-icon">
                  <Heart size={32} />
                </div>
                <h3>Offer Services</h3>
                <p>I want to help neighbors and earn money with my time and skills</p>
                <div className="role-features">
                  <span>✓ List your services</span>
                  <span>✓ Set your own rates</span>
                  <span>✓ Build trusted clientele</span>
                </div>
              </div>

              <div className="role-card" onClick={() => {
                setCurrentUserId('dana');
                setIsAuthenticated(true);
                setCurrentView('connections');
              }}>
                <div className="role-icon community-icon">
                  <Users size={32} />
                </div>
                <h3>Just Connect</h3>
                <p>I want to meet neighbors and build community connections</p>
                <div className="role-features">
                  <span>✓ Find neighbors with shared interests</span>
                  <span>✓ Join community activities</span>
                  <span>✓ Build local friendships</span>
                </div>
              </div>
            </div>

            <button className="skip-button" onClick={() => {
              setIsAuthenticated(true);
              setCurrentView('discover');
            }}>
              Skip for now
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Navigation
  const NavBar = () => (
    <nav className="nav-bar">
      <div className="nav-container">
        <div className="nav-logo" onClick={() => setCurrentView('home')}>
          <Home size={24} />
          <span className="logo-text">BlockButler</span>
        </div>
        
        <div className="nav-menu-desktop">
          <>
            <button
              className={`nav-button ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              <Home size={20} />
              <span>Home</span>
            </button>
            <button
              className={`nav-button ${currentView === 'discover' ? 'active' : ''}`}
              onClick={() => setCurrentView('discover')}
            >
              <Search size={20} />
              <span>Discover</span>
            </button>
            <button
              className={`nav-button ${currentView === 'bookings' ? 'active' : ''}`}
              onClick={() => setCurrentView('bookings')}
            >
              <Calendar size={20} />
              <span>{activeUserIsProvider ? 'My Work' : 'My Tasks'}</span>
            </button>
            {activeUserIsProvider && (
              <button
                className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                <TrendingUp size={20} />
                <span>Dashboard</span>
              </button>
            )}
          </>
          <button 
            className={`nav-button ${currentView === 'connections' ? 'active' : ''}`}
            onClick={() => setCurrentView('connections')}
          >
            <Users size={20} />
            <span>Connections</span>
          </button>
          <button className="nav-button">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
          <button 
            className="nav-button profile-button"
            onClick={() => setCurrentView('profile')}
          >
            <div className="nav-avatar"><ProfilePhoto user={activeUser} size={32} /></div>
          </button>
        </div>

        <button className="nav-menu-mobile" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          {activeUserIsProvider ? (
            <>
              <button onClick={() => { setCurrentView('home'); setMenuOpen(false); }}>
                <Home size={20} /><span>Home</span>
              </button>
              <button onClick={() => { setCurrentView('dashboard'); setMenuOpen(false); }}>
                <TrendingUp size={20} /> Dashboard
              </button>
              <button onClick={() => { setCurrentView('bookings'); setMenuOpen(false); }}>
                <Calendar size={20} /> My Clients
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setCurrentView('discover'); setMenuOpen(false); }}>
                <Search size={20} /> Discover
              </button>
              <button onClick={() => { setCurrentView('bookings'); setMenuOpen(false); }}>
                <Calendar size={20} /> My Tasks
              </button>
            </>
          )}
          <button onClick={() => { setCurrentView('connections'); setMenuOpen(false); }}>
            <Users size={20} /> Connections
          </button>
          <button onClick={() => { setCurrentView('profile'); setMenuOpen(false); }}>
            <User size={20} /> Profile
          </button>
        </div>
      )}
    </nav>
  );

  // ─── Google Maps Hook ──────────────────────────────────────────────────────
  // ─── Google Maps Hook ──────────────────────────────────────────────────────
  const useGoogleMaps = () => {
    const isMapsReady = () => !!(window.google?.maps?.Map);
    const [mapsLoaded, setMapsLoaded] = useState(isMapsReady());
    useEffect(() => {
      if (isMapsReady()) { setMapsLoaded(true); return; }
      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        const poll = setInterval(() => {
          if (isMapsReady()) { setMapsLoaded(true); clearInterval(poll); }
        }, 100);
        return () => clearInterval(poll);
      }
      window.__googleMapsCallback = () => {
        // Callback fires when script is parsed but Map constructor may still
        // be initializing — poll a little longer to be safe
        const poll = setInterval(() => {
          if (isMapsReady()) { setMapsLoaded(true); clearInterval(poll); }
        }, 50);
      };
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=__googleMapsCallback&loading=async`;
      script.async = true;
      script.defer = true;
      script.onerror = () => console.error('Google Maps failed to load.');
      document.head.appendChild(script);
    }, []);
    return mapsLoaded;
  };

  // ─── Neighborhood Map Component ────────────────────────────────────────────
  // Accepts: providers, height, selectedId, onPinClick, mapRef (forwarded)
  const NeighborhoodMap = ({ providers, height, selectedId, onPinClick, mapInstanceRef }) => {
    const mapRef = useRef(null);
    const markersRef = useRef({});
    const openInfoRef = useRef(null);
    const mapsLoaded = useGoogleMaps();

    // Build initials avatar as data URL for map markers
    const makeAvatarSvg = (user) => {
      const COLORS = ['#E07B5F','#5C8C5A','#7B8CBE','#C4855A','#6B9E8C','#B07CC6'];
      const color = COLORS[(user.name || '').charCodeAt(0) % COLORS.length];
      const parts = (user.name || '?').trim().split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
        : (parts[0] || '?').slice(0,2).toUpperCase();
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'>
        <circle cx='20' cy='20' r='19' fill='${color}' stroke='white' stroke-width='2'/>
        <text x='20' y='25' text-anchor='middle' font-size='14' font-weight='bold' fill='white' font-family='sans-serif'>${initials}</text>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    const makeSelectedSvg = (user) => {
      const COLORS = ['#E07B5F','#5C8C5A','#7B8CBE','#C4855A','#6B9E8C','#B07CC6'];
      const color = COLORS[(user.name || '').charCodeAt(0) % COLORS.length];
      const parts = (user.name || '?').trim().split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
        : (parts[0] || '?').slice(0,2).toUpperCase();
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='56'>
        <circle cx='24' cy='22' r='22' fill='${color}' stroke='white' stroke-width='3'/>
        <text x='24' y='28' text-anchor='middle' font-size='15' font-weight='bold' fill='white' font-family='sans-serif'>${initials}</text>
        <polygon points='16,42 32,42 24,56' fill='${color}'/>
      </svg>`;
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    };

    useEffect(() => {
      if (!mapsLoaded || !mapRef.current) return;

      const map = new window.google.maps.Map(mapRef.current, {
        center: NEIGHBORHOOD_CENTER,
        zoom: 17,
        mapTypeId: 'roadmap',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
      });

      if (mapInstanceRef) mapInstanceRef.current = map;

      // Close open info window when clicking map background
      map.addListener('click', () => {
        if (openInfoRef.current) { openInfoRef.current.close(); openInfoRef.current = null; }
      });

      markersRef.current = {};

      providers.forEach(provider => {
        const loc = USER_LOCATIONS[provider.id];
        if (!loc) return;

        const isSelected = provider.id === selectedId;
        const marker = new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map,
          title: provider.name,
          icon: {
            url: isSelected ? makeSelectedSvg(provider) : makeAvatarSvg(provider),
            scaledSize: isSelected
              ? new window.google.maps.Size(48, 56)
              : new window.google.maps.Size(40, 40),
            anchor: isSelected
              ? new window.google.maps.Point(24, 56)
              : new window.google.maps.Point(20, 20),
          },
          zIndex: isSelected ? 10 : 1,
        });

        markersRef.current[provider.id] = marker;

        // Rich info window: avatar + name + rating + services
        const stars = provider.rating
          ? '&#9733;'.repeat(Math.round(provider.rating)) + ` <span style="color:#555">${provider.rating}</span>`
          : '<span style="color:#aaa">No rating yet</span>';
        const serviceList = (provider.services || []).slice(0,3).map(s =>
          `<span style="display:inline-block;background:#F0EDE4;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">${s.name}</span>`
        ).join('');

        const infoContent = `
          <div style="padding:12px;min-width:200px;max-width:240px;font-family:sans-serif;line-height:1.4">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
              <img src="${makeAvatarSvg(provider)}" width="36" height="36" style="border-radius:50%" />
              <div>
                <div style="font-weight:700;font-size:14px;color:#2C2C2C">${provider.name}</div>
                <div style="font-size:12px;color:#E07B5F">${stars}</div>
              </div>
            </div>
            <div style="font-size:11px;color:#888;margin-bottom:6px">${loc.address}</div>
            ${serviceList ? `<div style="margin-top:4px">${serviceList}</div>` : ''}
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({ content: infoContent });

        marker.addListener('click', () => {
          if (openInfoRef.current) openInfoRef.current.close();
          infoWindow.open(map, marker);
          openInfoRef.current = infoWindow;
          if (onPinClick) onPinClick(provider);
        });
      });
    }, [mapsLoaded, providers, selectedId]);

    if (!mapsLoaded) {
      return (
        <div style={{ height: height || '340px', background: '#F0EDE4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8C8C8C', fontSize: '14px' }}>
          <MapPin size={20} style={{ marginRight: '8px' }} /> Loading map…
        </div>
      );
    }

    return <div ref={mapRef} style={{ height: height || '340px', width: '100%' }} />;
  };

  // ─── Discover View (combined map + list) ───────────────────────────────────
  // ── HomeView — context-aware landing screen ─────────────────────────────
  const HomeView = () => {
    const activeUserIsConsumer = isConsumer(activeUser);
    const hasActivity = activeUserIsProvider || activeUserIsConsumer;

    // If no activity, show Discover directly as home
    if (!hasActivity) return <DiscoverView />;

    // My upcoming bookings (as butler or principal), sorted by date proximity
    const upcomingAsButler    = bookings.filter(b => b.providerId === activeUser.id && b.status === 'active');
    const upcomingAsPrincipal = bookings.filter(b => b.clientId   === activeUser.id && b.status === 'active');

    // Requests
    const incomingRequests = requests.filter(r => r.butlerId    === activeUser.id && r.status === 'requested');
    const outgoingRequests = requests.filter(r => r.principalId === activeUser.id && r.status === 'requested');
    const scheduledRequests = requests.filter(r =>
      (r.butlerId === activeUser.id || r.principalId === activeUser.id) && r.status === 'scheduled'
    );

    // Quick stats
    const weeklyEarned = upcomingAsButler.reduce((s, b) => s + (b.rate || 0), 0);
    const weeklySpent  = upcomingAsPrincipal.reduce((s, b) => s + (b.rate || 0), 0);

    const StatusBadge = ({ status }) => {
      const map = {
        requested:  { label: 'Pending',   color: '#E07B5F', bg: '#FFF3E0' },
        scheduled:  { label: 'Scheduled', color: '#5C8C5A', bg: '#E8F5E9' },
        completed:  { label: 'Done',      color: '#8C8C8C', bg: '#F5F5F5' },
        cancelled:  { label: 'Cancelled', color: '#CC4444', bg: '#FDECEA' },
      };
      const s = map[status] || map.scheduled;
      return (
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px',
          borderRadius: '10px', background: s.bg, color: s.color, textTransform: 'uppercase' }}>
          {s.label}
        </span>
      );
    };

    const BookingCard = ({ booking, role }) => {
      const person = role === 'butler'
        ? users[booking.clientId]
        : users[booking.providerId];
      return (
        <div className="home-booking-card">
          <div className="home-booking-avatar">
            <ProfilePhoto user={person || { name: '?' }} size={44} />
          </div>
          <div className="home-booking-info">
            <strong>{booking.serviceName}</strong>
            <span className="home-booking-who">
              {role === 'butler' ? 'for' : 'by'} {person?.name || '—'}
            </span>
            <span className="home-booking-when">
              <Calendar size={12} /> {booking.nextDate || booking.frequency}
            </span>
          </div>
          <div className="home-booking-right">
            <span className="home-booking-rate">${booking.rate}</span>
            <span className="home-booking-unit">{booking.rateUnit}</span>
          </div>
        </div>
      );
    };

    const RequestCard = ({ req, perspective }) => {
      // perspective: 'butler' = I'm being asked, 'principal' = I asked
      const otherUserId = perspective === 'butler' ? req.principalId : req.butlerId;
      const otherUser = users[otherUserId];
      const isIncoming = perspective === 'butler';
      return (
        <div className="home-request-card">
          <div className="home-request-top">
            <div className="home-booking-avatar">
              <ProfilePhoto user={otherUser || { name: '?' }} size={40} />
            </div>
            <div className="home-booking-info">
              <strong>{req.typeName}</strong>
              <span className="home-booking-who">
                {isIncoming ? `from ${otherUser?.name || '—'}` : `to ${otherUser?.name || '—'}`}
              </span>
              <span className="home-booking-when">
                <Calendar size={12} /> {req.date} at {req.time}
              </span>
            </div>
            <div className="home-booking-right">
              <StatusBadge status={req.status} />
              <span className="home-booking-rate" style={{ marginTop: '4px' }}>${req.proposedRate}</span>
              <span className="home-booking-unit">{req.rateUnit}</span>
            </div>
          </div>
          {req.notes && <p className="home-request-notes">{req.notes}</p>}
          {isIncoming && req.status === 'requested' && (
            <div className="home-request-actions">
              <button className="req-accept-btn">✓ Accept</button>
              <button className="req-decline-btn">✕ Decline</button>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="view-container home-view">

        {/* Greeting */}
        <div className="home-greeting">
          <div>
            <h1>Hey, {activeUser.name.split(' ')[0]} 👋</h1>
            <p className="subtitle">Here's what's happening on Harvey Ave</p>
          </div>
          <div className="home-avatar-wrap">
            <ProfilePhoto user={activeUser} size={48} />
          </div>
        </div>

        {/* Quick stats strip */}
        {(activeUserIsProvider || activeUserIsConsumer) && (
          <div className="home-stats-strip">
            {activeUserIsProvider && (
              <div className="home-stat">
                <strong>${weeklyEarned}</strong>
                <span>earning this week</span>
              </div>
            )}
            {activeUserIsConsumer && (
              <div className="home-stat">
                <strong>${weeklySpent}</strong>
                <span>spending this week</span>
              </div>
            )}
            {activeUserIsProvider && (
              <div className="home-stat">
                <strong>{upcomingAsButler.length}</strong>
                <span>active clients</span>
              </div>
            )}
            {activeUserIsConsumer && (
              <div className="home-stat">
                <strong>{upcomingAsPrincipal.length}</strong>
                <span>active butlers</span>
              </div>
            )}
            {incomingRequests.length > 0 && (
              <div className="home-stat urgent">
                <strong>{incomingRequests.length}</strong>
                <span>new requests</span>
              </div>
            )}
          </div>
        )}

        {/* Incoming requests — butler perspective */}
        {incomingRequests.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h3>Requests for You</h3>
              <span className="home-section-badge urgent">{incomingRequests.length} new</span>
            </div>
            <div className="home-cards-list">
              {incomingRequests.map(r => <RequestCard key={r.id} req={r} perspective="butler" />)}
            </div>
          </div>
        )}

        {/* Outgoing requests — principal perspective */}
        {outgoingRequests.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h3>My Pending Requests</h3>
              <span className="home-section-badge">{outgoingRequests.length}</span>
            </div>
            <div className="home-cards-list">
              {outgoingRequests.map(r => <RequestCard key={r.id} req={r} perspective="principal" />)}
            </div>
          </div>
        )}

        {/* Upcoming as butler */}
        {upcomingAsButler.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h3>Upcoming — I'm Providing</h3>
            </div>
            <div className="home-cards-list">
              {upcomingAsButler.slice(0, 4).map(b => <BookingCard key={b.id} booking={b} role="butler" />)}
            </div>
          </div>
        )}

        {/* Upcoming as principal */}
        {upcomingAsPrincipal.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h3>Upcoming — Being Provided to Me</h3>
            </div>
            <div className="home-cards-list">
              {upcomingAsPrincipal.slice(0, 4).map(b => <BookingCard key={b.id} booking={b} role="principal" />)}
            </div>
          </div>
        )}

        {/* Scheduled requests */}
        {scheduledRequests.length > 0 && (
          <div className="home-section">
            <div className="home-section-header">
              <h3>Confirmed & Scheduled</h3>
            </div>
            <div className="home-cards-list">
              {scheduledRequests.map(r => {
                const perspective = r.butlerId === activeUser.id ? 'butler' : 'principal';
                return <RequestCard key={r.id} req={r} perspective={perspective} />;
              })}
            </div>
          </div>
        )}

        {/* Find more CTA */}
        <div className="home-find-more">
          <div className="home-find-more-text">
            <h4>Looking for more help?</h4>
            <p>See who else is available on your block</p>
          </div>
          <button className="home-find-more-btn" onClick={() => setCurrentView('discover')}>
            <Search size={16} /> Discover Neighbors
          </button>
        </div>

      </div>
    );
  };

  const DiscoverView = () => {

    const [activeFilters, setActiveFilters] = useState([]);
    const [selectedNeighbor, setSelectedNeighbor] = useState(null);
    const mapInstanceRef = useRef(null);
    const tileRefs = useRef({});

    // All neighbors except current user
    const allNeighbors = Object.values(users).filter(u => u && u.id !== activeUser?.id);

    // Classifier helpers
    const isButler = (u) => isProvider(u);
    const isPrincipal = (u) => isConsumer(u);
    const isLookingToConnect = (u) => !isProvider(u) && !isConsumer(u);

    const toggleFilter = (filter) => {
      setActiveFilters(prev =>
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
      );
    };

    const filteredNeighbors = activeFilters.length === 0
      ? allNeighbors
      : allNeighbors.filter(u => {
          if (activeFilters.includes('butler') && isButler(u)) return true;
          if (activeFilters.includes('principal') && isPrincipal(u)) return true;
          if (activeFilters.includes('connect') && isLookingToConnect(u)) return true;
          return false;
        });

    const counts = {
      butler: allNeighbors.filter(isButler).length,
      principal: allNeighbors.filter(isPrincipal).length,
      connect: allNeighbors.filter(isLookingToConnect).length,
    };

    const FILTERS = [
      { key: 'butler',    label: 'Butlers',           desc: 'Offering services' },
      { key: 'principal', label: 'Principals',         desc: 'Looking to hire' },
      { key: 'connect',   label: 'Looking to Connect', desc: 'Building community' },
    ];

    // When a pin is clicked: set selected, scroll tile into view
    const handlePinClick = (neighbor) => {
      setSelectedNeighbor(neighbor);
      setTimeout(() => {
        const el = tileRefs.current[neighbor.id];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    };

    // When a tile is clicked: set selected, pan map to that pin
    const handleTileClick = (neighbor) => {
      setSelectedNeighbor(neighbor);
      const loc = USER_LOCATIONS[neighbor.id];
      if (loc && mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: loc.lat, lng: loc.lng });
        mapInstanceRef.current.setZoom(18);
      }
    };

    if (allNeighbors.length === 0) {
      return (
        <div className="view-container discover-view">
          <div className="view-header"><h1>Discover Neighbors</h1></div>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}><p>Loading neighbors...</p></div>
        </div>
      );
    }

    return (
      <div className="view-container discover-view" style={{ padding: '0' }}>
        {/* Header + filters — sticky above map */}
        <div className="discover-header-area">
          <div className="view-header" style={{ marginBottom: '12px' }}>
            <h1>Discover Neighbors</h1>
            <p className="subtitle">600 Block of N. Harvey Avenue</p>
          </div>

          <div className="search-filter-bar" style={{ marginBottom: '12px' }}>
            <div className="search-box">
              <Search size={20} />
              <input type="text" placeholder="Search neighbors or services..." />
            </div>
          </div>

          <div className="neighbor-filters">
            <span className="filter-label">Neighbor Type:</span>
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-chip ${activeFilters.includes(f.key) ? 'active' : ''}`}
                onClick={() => toggleFilter(f.key)}
                title={f.desc}
              >
                {f.label}
                <span className="filter-chip-count">{counts[f.key]}</span>
              </button>
            ))}
            {activeFilters.length > 0 && (
              <button className="filter-chip clear" onClick={() => setActiveFilters([])}>Clear</button>
            )}
          </div>
        </div>

        {/* Map — full width, no border-radius on sides */}
        <div className="discover-map-wrapper">
          <NeighborhoodMap
            providers={filteredNeighbors}
            height="320px"
            selectedId={selectedNeighbor?.id}
            onPinClick={handlePinClick}
            mapInstanceRef={mapInstanceRef}
          />
          <div className="map-neighbor-count">
            <MapPin size={13} />
            {filteredNeighbors.length} of {allNeighbors.length} neighbors shown
            {activeFilters.length > 0 ? ' (filtered)' : ''}
          </div>
        </div>

        {/* Tile list below map */}
        <div className="discover-tile-area">
          {selectedNeighbor && (
            <div className="selected-neighbor-label">
              <span>Showing: <strong>{selectedNeighbor.name}</strong></span>
              <button onClick={() => setSelectedNeighbor(null)}>Show all</button>
            </div>
          )}
          <div className="butler-grid">
            {filteredNeighbors.map(neighbor => {
              const isSelected = selectedNeighbor?.id === neighbor.id;
              return (
                <div
                  key={neighbor.id}
                  ref={el => tileRefs.current[neighbor.id] = el}
                  className={`butler-card ${isSelected ? 'butler-card-selected' : ''}`}
                  onClick={() => handleTileClick(neighbor)}
                >
                  <div className="butler-card-header">
                    <div className="butler-avatar-large"><ProfilePhoto user={neighbor} size={56} /></div>
                    <div className="butler-info">
                      <div className="butler-name-row">
                        <h3>{neighbor.name}</h3>
                        {neighbor.verified && <Shield className="verified-badge" size={16} />}
                      </div>
                      {neighbor.rating && (
                        <div className="butler-rating">
                          <Star fill="#FFB800" color="#FFB800" size={16} />
                          <span>{neighbor.rating}</span>
                          <span className="review-count">({neighbor.reviewCount})</span>
                        </div>
                      )}
                      <div className="butler-location">
                        <MapPin size={14} />
                        <span>{neighbor.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="neighbor-type-badges">
                    {isButler(neighbor) && <span className="type-badge butler-badge">Butler</span>}
                    {isPrincipal(neighbor) && <span className="type-badge principal-badge">Principal</span>}
                    {isLookingToConnect(neighbor) && <span className="type-badge connect-badge">Looking to Connect</span>}
                  </div>

                  {neighbor.mutualWith && neighbor.mutualWith.length > 0 && (
                    <div className="trust-indicator">
                      <Users size={14} />
                      <span>Connected through {users[neighbor.mutualWith[0]]?.name || 'mutual connection'}</span>
                    </div>
                  )}

                  {neighbor.houseKeyTrusted > 0 && (
                    <div className="house-key-badge">
                      <Key size={14} />
                      <span><strong>{neighbor.houseKeyTrusted}</strong> {neighbor.houseKeyTrusted === 1 ? 'neighbor trusts' : 'neighbors trust'} {neighbor.name.split(' ')[0]} with house access</span>
                    </div>
                  )}

                  <p className="butler-bio">{neighbor.bio}</p>

                  {neighbor.tags && neighbor.tags.length > 0 && (
                    <div className="butler-tags">
                      {neighbor.tags.map((tag, i) => <span key={i} className="tag">{tag}</span>)}
                    </div>
                  )}

                  {communityBoard.filter(p => p.userId === neighbor.id && p.active).length > 0 && (
                    <div className="community-connect-badges">
                      {communityBoard.filter(p => p.userId === neighbor.id && p.active).map(post => (
                        <span key={post.id} className="community-connect-badge">
                          {post.icon} {post.title}
                        </span>
                      ))}
                    </div>
                  )}

                  {neighbor.services && neighbor.services.length > 0 && (
                    <div className="services-preview">
                      <strong>Services:</strong>
                      <div className="service-chips">
                        {neighbor.services.slice(0, 3).map(service => (
                          <span key={service.id} className="service-chip">
                            {service.name}
                            {service.rate > 0 && <span className="rate">${service.rate}</span>}
                            {service.rate === 0 && <Heart size={12} fill="#E07B5F" color="#E07B5F" />}
                          </span>
                        ))}
                        {neighbor.services.length > 3 && (
                          <span className="service-chip more">+{neighbor.services.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    className="view-profile-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedButler(neighbor);
                      setCurrentView('butler-detail');
                    }}
                  >
                    View Profile <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Butler Detail View
  // Butler Detail View
  const ButlerDetailView = () => {
    if (!selectedButler) return null;

    return (
      <div className="view-container butler-detail-view">
        <button className="back-button" onClick={() => setCurrentView('discover')}>
          ← Back to Discover
        </button>

        <div className="butler-detail-header">
          <div className="butler-avatar-xlarge"><ProfilePhoto user={selectedButler} size={96} /></div>
          <div className="butler-detail-info">
            <div className="name-verified">
              <h1>{selectedButler.name}</h1>
              {selectedButler.verified && (
                <div className="verified-badge-large">
                  <Shield size={20} />
                  <span>Verified</span>
                </div>
              )}
            </div>
            
            <div className="rating-large">
              <Star fill="#FFB800" color="#FFB800" size={24} />
              <span className="rating-number">{selectedButler.rating}</span>
              <span className="review-count">({selectedButler.reviewCount} reviews)</span>
            </div>

            <div className="detail-badges">
              <div className="detail-badge">
                <MapPin size={16} />
                <span>{selectedButler.address}</span>
              </div>
              <div className="detail-badge">
                <Clock size={16} />
                <span>{selectedButler.availability || "Flexible"}</span>
              </div>
              <div className="detail-badge">
                <TrendingUp size={16} />
                <span>{selectedButler.tasksCompleted || selectedButler.completedTasks || 0} tasks completed</span>
              </div>
            </div>
          </div>
        </div>

        {selectedButler.mutualWith?.length > 0 && (
          <div className="trust-section">
            <h3><Users size={20} /> Mutual Connections</h3>
            <div className="mutual-connections">
              {selectedButler.mutualWith.map(connId => {
                const conn = users[connId];
                return (
                  <div key={connId} className="mutual-connection-card">
                    <div className="mutual-avatar"><ProfilePhoto user={conn} size={40} /></div>
                    <div>
                      <strong>{conn.name}</strong>
                      <span>recommends {selectedButler.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedButler.houseKeyTrusted > 0 && (
          <div className="house-key-section">
            <div className="house-key-header">
              <div className="house-key-icon">
                <Key size={28} />
              </div>
              <div>
                <h3>Trusted with House Access</h3>
                <p className="house-key-subtitle">
                  <strong>{selectedButler.houseKeyTrusted}</strong> {selectedButler.houseKeyTrusted === 1 ? 'neighbor has' : 'neighbors have'} given {selectedButler.name.split(' ')[0]} access to their home
                </p>
              </div>
            </div>
            <div className="house-key-explainer">
              <p>This is the highest level of trust in the BlockButler community. These neighbors trust {selectedButler.name.split(' ')[0]} to enter their homes, complete tasks independently, and maintain complete reliability.</p>
            </div>
            {selectedButler.houseKeyTrustedBy && selectedButler.houseKeyTrustedBy.length > 0 && (
              <div className="trusted-by-list">
                <span className="trusted-by-label">Trusted by:</span>
                <div className="trusted-by-avatars">
                  {selectedButler.houseKeyTrustedBy.slice(0, 5).map(id => {
                    const neighbor = users[id] || { photo: '👤', name: 'Neighbor' };
                    return (
                      <div key={id} className="trusted-avatar" title={neighbor.name}>
                        <ProfilePhoto user={neighbor} size={56} />
                      </div>
                    );
                  })}
                  {selectedButler.houseKeyTrustedBy.length > 5 && (
                    <div className="trusted-avatar-more">+{selectedButler.houseKeyTrustedBy.length - 5}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="about-section">
          <h3>About</h3>
          <p>{selectedButler.bio}</p>
          <div className="butler-tags">
            {(selectedButler.tags || []).map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        {communityBoard.filter(p => p.userId === selectedButler.id && p.active).length > 0 && (
          <div className="community-section">
            <h3>🌱 Looking to Connect</h3>
            <p className="community-section-subtitle">Non-transactional ways to connect with {selectedButler.name.split(' ')[0]}</p>
            <div className="community-posts-list">
              {communityBoard.filter(p => p.userId === selectedButler.id && p.active).map(post => (
                <div key={post.id} className="community-post-card">
                  <div className="community-post-icon">{post.icon}</div>
                  <div className="community-post-body">
                    <h4>{post.title}</h4>
                    <p>{post.description}</p>
                    <div className="community-post-meta">
                      {post.frequency && <span className="community-meta-chip">🔁 {post.frequency}</span>}
                      {post.location && post.location !== 'Flexible' && <span className="community-meta-chip">📍 {post.location}</span>}
                    </div>
                    <div className="community-post-tags">
                      {(post.tags || []).map((t, i) => <span key={i} className="community-tag">{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="services-section">
          <h3>Services Offered</h3>
          <div className="services-list">
            {selectedButler.services && selectedButler.services.length > 0 ? (
              selectedButler.services.map(service => (
              <div key={service.id} className="service-card">
                <div className="service-info">
                  <h4>{service.name}</h4>
                  <div className="service-rate">
                    {service.rate > 0 ? (
                      <>
                        <DollarSign size={18} />
                        <span className="rate-amount">${service.rate}</span>
                        <span className="rate-frequency">/ {service.frequency}</span>
                      </>
                    ) : (
                      <div className="free-badge">
                        <Heart size={16} fill="#E07B5F" color="#E07B5F" />
                        <span>Free / Community Service</span>
                      </div>
                    )}
                  </div>
                  {service.radius && (
                    <div className="service-radius">
                      <MapPin size={14} />
                      <span>Within {service.radius} {service.radiusUnit} radius</span>
                    </div>
                  )}
                </div>
                <button 
                  className="book-button"
                  onClick={() => {
                    setSelectedService(service);
                    setShowBookingModal(true);
                  }}
                >
                  Book Now
                </button>
              </div>
            ))
            ) : (
              <p>No services available</p>
            )}
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card">
            <Award size={24} />
            <div>
              <strong>{selectedButler.tasksCompleted || selectedButler.completedTasks || 0}</strong>
              <span>Tasks Completed</span>
            </div>
          </div>
          <div className="stat-card">
            <Clock size={24} />
            <div>
              <strong>{selectedButler.joinedDate || selectedButler.joined || "—"}</strong>
              <span>Member Since</span>
            </div>
          </div>
          <div className="stat-card">
            <Star size={24} />
            <div>
              <strong>{selectedButler.rating}/5.0</strong>
              <span>Average Rating</span>
            </div>
          </div>
          {selectedButler.houseKeyTrusted > 0 && (
            <div className="stat-card house-key-stat">
              <Key size={24} />
              <div>
                <strong>{selectedButler.houseKeyTrusted}</strong>
                <span>House Access Trusted</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Booking Modal
  const BookingModal = () => {
    if (!showBookingModal || !selectedService) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Book Service</h2>
            <button onClick={() => setShowBookingModal(false)}><X size={24} /></button>
          </div>

          <div className="booking-summary">
            <div className="booking-butler">
              <div className="butler-avatar-medium"><ProfilePhoto user={selectedButler} size={48} /></div>
              <div>
                <strong>{selectedButler.name}</strong>
                <span>{selectedService.name}</span>
                {selectedService.radius && (
                  <div className="booking-radius-info">
                    <MapPin size={12} />
                    <span>Service area: {selectedService.radius} {selectedService.radiusUnit} radius</span>
                  </div>
                )}
              </div>
            </div>

            <div className="booking-rate">
              {selectedService.rate > 0 ? (
                <>
                  <span className="rate-label">Rate:</span>
                  <span className="rate-amount">${selectedService.rate}</span>
                  <span className="rate-frequency">/ {selectedService.frequency}</span>
                </>
              ) : (
                <div className="free-badge">
                  <Heart size={16} fill="#E07B5F" color="#E07B5F" />
                  <span>Free / Community Service</span>
                </div>
              )}
            </div>
          </div>

          <div className="booking-form">
            <div className="form-group">
              <label>Frequency</label>
              <select>
                <option>One-time</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Custom schedule</option>
              </select>
            </div>

            <div className="form-group">
              <label>Preferred Start Date</label>
              <input type="date" />
            </div>

            <div className="form-group">
              <label>Preferred Time</label>
              <input type="time" />
            </div>

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea placeholder="Any special instructions or preferences..."></textarea>
            </div>

            {selectedService.rate > 0 && (
              <div className="payment-info">
                <div className="payment-row">
                  <span>Service Rate:</span>
                  <span>${selectedService.rate}</span>
                </div>
                <div className="payment-row">
                  <span>Platform Fee (5%):</span>
                  <span>${(selectedService.rate * 0.05).toFixed(2)}</span>
                </div>
                <div className="payment-row total">
                  <span>Total per {selectedService.frequency}:</span>
                  <span>${(selectedService.rate * 1.05).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button className="cancel-button" onClick={() => setShowBookingModal(false)}>
              Cancel
            </button>
            <button className="confirm-button" onClick={() => {
              setShowBookingModal(false);
              alert('Booking request sent to ' + selectedButler.name + '!');
            }}>
              Send Request
            </button>
          </div>
        </div>
      </div>
    );
  };

  // My Bookings View
  const BookingsView = () => {
    const myClientBookings   = bookings.filter(b => b.clientId   === activeUser.id);
    const myProviderBookings = bookings.filter(b => b.providerId === activeUser.id);
    const activeClientBookings   = myClientBookings.filter(b => b.status === 'active');
    const activeProviderBookings = myProviderBookings.filter(b => b.status === 'active');
    const completedBookings = [...myClientBookings, ...myProviderBookings]
      .filter(b => b.status === 'completed')
      .filter((b, i, arr) => arr.findIndex(x => x.id === b.id) === i); // dedupe

    const hasAny = activeClientBookings.length > 0 || activeProviderBookings.length > 0;

    const BookingCard = ({ booking, role }) => {
      const otherUser = role === 'client'
        ? users[booking.providerId]
        : users[booking.clientId];
      return (
        <div className="booking-card">
          <div className="booking-header">
            <div className="booking-butler-info">
              <div className="butler-avatar-medium">
                <ProfilePhoto user={otherUser || { name: '?' }} size={48} />
              </div>
              <div>
                <h3>{booking.serviceName}</h3>
                <span className="butler-name-small">
                  {role === 'client' ? 'provided by' : 'for'} {otherUser?.name || '—'}
                </span>
              </div>
            </div>
            <div className={`status-badge ${booking.status}`}>
              <CheckCircle size={14} />
              <span>Active</span>
            </div>
          </div>

          <div className="booking-details">
            <div className="booking-detail">
              <Calendar size={16} />
              <div>
                <strong>Next Scheduled:</strong>
                <span>{booking.nextDate || '—'}</span>
              </div>
            </div>
            <div className="booking-detail">
              <Clock size={16} />
              <div>
                <strong>Frequency:</strong>
                <span>{booking.frequency}</span>
              </div>
            </div>
            <div className="booking-detail">
              <DollarSign size={16} />
              <div>
                <strong>Rate:</strong>
                <span>${booking.rate} {booking.rateUnit}</span>
              </div>
            </div>
          </div>

          {booking.notes && (
            <div className="booking-meta">
              <span>{booking.notes}</span>
            </div>
          )}

          <div className="booking-actions">
            <button className="secondary-button">
              <MessageCircle size={16} />
              Message
            </button>
            <button className="secondary-button">
              <Calendar size={16} />
              Manage Schedule
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="view-container bookings-view">
        <div className="view-header">
          <h1>{activeUserIsProvider ? 'My Work' : 'My Tasks'}</h1>
          <p className="subtitle">Your active bookings with neighbors</p>
        </div>

        {!hasAny ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No active bookings yet</h3>
            <p>Discover neighbors and book your first service!</p>
            <button className="primary-button" onClick={() => setCurrentView('discover')}>
              Discover Services
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {activeClientBookings.length > 0 && (
              <>
                <h2 style={{ margin: '0 0 12px', fontSize: '18px', color: '#2C2C2C' }}>Services I'm Receiving</h2>
                {activeClientBookings.map(b => <BookingCard key={b.id} booking={b} role="client" />)}
              </>
            )}
            {activeProviderBookings.length > 0 && (
              <>
                <h2 style={{ margin: '16px 0 12px', fontSize: '18px', color: '#2C2C2C' }}>Services I'm Providing</h2>
                {activeProviderBookings.map(b => <BookingCard key={b.id} booking={b} role="provider" />)}
              </>
            )}
          </div>
        )}

        {completedBookings.length > 0 && (
          <div style={{ marginTop: '32px' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '18px', color: '#8C8C8C' }}>Completed</h2>
            <div className="bookings-list" style={{ opacity: 0.7 }}>
              {completedBookings.map(b => {
                const role = b.clientId === activeUser.id ? 'client' : 'provider';
                return <BookingCard key={b.id} booking={b} role={role} />;
              })}
            </div>
          </div>
        )}

        <div className="add-booking-cta">
          <Plus size={24} />
          <div>
            <h3>Need more help?</h3>
            <p>Discover more services from your neighbors</p>
          </div>
          <button className="primary-button" onClick={() => setCurrentView('discover')}>
            Discover
          </button>
        </div>
      </div>
    );
  };

  // Connections View
  const ConnectionsView = () => {
    const allNeighbors = Object.values(users);
    const myConnections = allNeighbors.filter(u => currentUser.connections.includes(u.id));

    return (
      <div className="view-container connections-view">
        <div className="view-header">
          <h1>Your Network</h1>
          <p className="subtitle">{myConnections.length} trusted neighbors</p>
        </div>

        <div className="trust-explainer">
          <Shield size={24} />
          <div>
            <h3>How Trust Works</h3>
            <p>BlockButler connects you with neighbors through mutual connections. When you book someone recommended by a trusted neighbor, you're building on existing community trust.</p>
          </div>
        </div>

        <div className="connections-grid">
          {myConnections.map(neighbor => (
            <div key={neighbor.id} className="connection-card">
              <div className="connection-avatar"><ProfilePhoto user={neighbor} size={56} /></div>
              <h3>{neighbor.name}</h3>
              <span className="connection-address">{neighbor.address}</span>
              <div className="connection-rating">
                <Star fill="#FFB800" color="#FFB800" size={14} />
                <span>{neighbor.rating}</span>
              </div>
              <button 
                className="view-profile-small"
                onClick={() => {
                  setSelectedButler(neighbor);
                  setCurrentView('butler-detail');
                }}
              >
                View Profile
              </button>
            </div>
          ))}
        </div>

        <div className="expand-network-cta">
          <Users size={32} />
          <h3>Expand Your Network</h3>
          <p>Discover more neighbors in Harvey Ave Block</p>
          <button className="primary-button" onClick={() => setCurrentView('discover')}>
            Discover Neighbors
          </button>
        </div>
      </div>
    );
  };

  // Dashboard View — role-aware with tabs for dual-role users
  const ButlerDashboardView = () => {
    const activeUserIsConsumer = isConsumer(activeUser);
    const showBoth = activeUserIsProvider && activeUserIsConsumer;
    const defaultTab = activeUserIsProvider ? 'butler' : 'principal';
    const [dashTab, setDashTab] = useState(defaultTab);

    const myProviderBookings = bookings.filter(b => b.providerId === activeUser.id);
    const myClientBookings   = bookings.filter(b => b.clientId   === activeUser.id);
    const myServices = services.filter(s => s.providerId === activeUser.id);

    const upcomingAsButler    = myProviderBookings.filter(b => b.status === 'active');
    const upcomingAsPrincipal = myClientBookings.filter(b => b.status === 'active');

    const weeklyEarnings    = myProviderBookings.reduce((s, b) => s + (b.rate || 0), 0);
    const monthlyEarnings   = activeUser.thisMonthEarnings || weeklyEarnings * 4;
    const scheduledEarnings = upcomingAsButler.reduce((s, b) => s + (b.rate || 0), 0);

    const weeklySpend    = myClientBookings.filter(b => b.status === 'active').reduce((s, b) => s + (b.rate || 0), 0);
    const monthlySpend   = weeklySpend * 4;
    const scheduledSpend = upcomingAsPrincipal.reduce((s, b) => s + (b.rate || 0), 0);

    const UpcomingCard = ({ booking, role }) => {
      const person = role === 'butler' ? users[booking.clientId] : users[booking.providerId];
      return (
        <div className="dash-booking-card">
          <div className="dash-booking-avatar">
            <ProfilePhoto user={person || {name: '?'}} size={44} />
          </div>
          <div className="dash-booking-info">
            <strong>{booking.serviceName || booking.service}</strong>
            <span className="dash-booking-who">
              {role === 'butler' ? 'for' : 'by'} {person?.name || '—'}
            </span>
            <span className="dash-booking-when">
              <Calendar size={12} /> {booking.nextDate || booking.frequency}
            </span>
          </div>
          <div className="dash-booking-rate">
            <strong>${booking.rate}</strong>
            <span>{booking.rateUnit || 'per service'}</span>
          </div>
        </div>
      );
    };

    const ActivePersonCard = ({ booking, role }) => {
      const person = role === 'butler' ? users[booking.clientId] : users[booking.providerId];
      return (
        <div className="client-card">
          <div className="client-header">
            <div className="client-info-row">
              <div className="butler-avatar-medium">
                <ProfilePhoto user={person || {name: '?'}} size={48} />
              </div>
              <div className="client-details">
                <h4>{person?.name || '—'}</h4>
                <span className="client-address">{person?.address || ''}</span>
                {role === 'principal' && person?.rating && (
                  <div className="dash-inline-rating">
                    <Star fill="#FFB800" color="#FFB800" size={12} />
                    <span>{person.rating}</span>
                  </div>
                )}
                {booking.houseKeyAccess && (
                  <div className="house-access-badge"><Key size={12} /><span>House Access</span></div>
                )}
              </div>
            </div>
            <div className="client-revenue">
              <strong>${booking.rate}</strong>
              <span>{booking.frequency}</span>
            </div>
          </div>
          <div className="client-next-scheduled">
            <Calendar size={16} /><span>Next: {booking.nextDate}</span>
          </div>
          <div className="client-actions">
            <button className="secondary-button"><MessageCircle size={16} />Message</button>
            {role === 'butler'
              ? <button className="secondary-button"><Calendar size={16} />Schedule</button>
              : <button className="secondary-button" onClick={() => setCurrentView('discover')}><Search size={16} />Find More</button>
            }
          </div>
        </div>
      );
    };

    const ButlerView = () => (
      <>
        <div className="dash-summary-grid">
          <div className="dash-stat-card primary">
            <span className="dash-stat-label">This Week</span>
            <strong className="dash-stat-value">${weeklyEarnings}</strong>
            <span className="dash-stat-sub">earned</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Month to Date</span>
            <strong className="dash-stat-value">${monthlyEarnings}</strong>
            <span className="dash-stat-sub">earned</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Scheduled</span>
            <strong className="dash-stat-value">${scheduledEarnings}</strong>
            <span className="dash-stat-sub">remaining this month</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Tasks Done</span>
            <strong className="dash-stat-value">{activeUser.tasksCompleted || 0}</strong>
            <span className="dash-stat-sub">all time</span>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header"><h3>Upcoming — Services I'm Providing</h3></div>
          {upcomingAsButler.length > 0
            ? <div className="dash-booking-list">{upcomingAsButler.map(b => <UpcomingCard key={b.id} booking={b} role="butler" />)}</div>
            : <div className="dash-empty">No upcoming services scheduled.</div>}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>Active Clients</h3>
            <span className="section-count">{upcomingAsButler.length}</span>
          </div>
          {upcomingAsButler.length > 0
            ? <div className="dash-booking-list">{upcomingAsButler.map(b => <ActivePersonCard key={b.id} booking={b} role="butler" />)}</div>
            : <div className="dash-empty">No active clients yet.</div>}
        </div>

        <div className="dashboard-section">
          <div className="section-header"><h3>My Services</h3></div>
          <div className="butler-services-grid">
            {myServices.length > 0 ? myServices.map(svc => (
              <div key={svc.id} className="butler-service-card">
                <div className="service-header-row">
                  <div>
                    <h4>{svc.name}</h4>
                    <div className="service-rate">
                      <DollarSign size={16} /><span>${svc.rate}</span>
                      <span className="rate-freq">/ {svc.rateUnit || svc.frequency}</span>
                    </div>
                  </div>
                  <div className={`service-status ${svc.active ? 'active' : 'inactive'}`}>
                    {svc.active ? 'Active' : 'Paused'}
                  </div>
                </div>
                <div className="service-stats-row">
                  <div className="service-stat"><strong>{svc.bookings || 0}</strong><span>Bookings</span></div>
                  <button className="edit-service-button"><Edit size={14} />Edit</button>
                </div>
              </div>
            )) : <div className="dash-empty">No services listed yet.</div>}
          </div>
          <button className="add-service-button"><Plus size={20} />Add New Service</button>
        </div>

        <div className="dashboard-section trust-reputation-section">
          <h3>Trust & Reputation</h3>
          <div className="reputation-grid">
            <div className="reputation-card">
              <div className="reputation-icon"><Star fill="#FFB800" color="#FFB800" size={24} /></div>
              <div>
                <strong>{activeUser.rating || '—'}/5.0</strong>
                <span>Average Rating</span>
                <div className="rating-detail">{activeUser.reviewCount || 0} reviews</div>
              </div>
            </div>
            <div className="reputation-card">
              <div className="reputation-icon"><Key size={24} /></div>
              <div>
                <strong>{activeUser.houseKeyTrusted || 0}</strong>
                <span>House Key Trusted</span>
                <div className="rating-detail">by neighbors</div>
              </div>
            </div>
            <div className="reputation-card">
              <div className="reputation-icon"><Shield size={24} /></div>
              <div>
                <strong>{activeUser.verified ? 'Verified' : 'Unverified'}</strong>
                <span>Identity & Address</span>
                <div className="rating-detail">{activeUser.verified ? 'Background checked' : 'Pending'}</div>
              </div>
            </div>
          </div>
        </div>
      </>
    );

    const PrincipalView = () => (
      <>
        <div className="dash-summary-grid">
          <div className="dash-stat-card primary">
            <span className="dash-stat-label">This Week</span>
            <strong className="dash-stat-value">${weeklySpend}</strong>
            <span className="dash-stat-sub">spent</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Month to Date</span>
            <strong className="dash-stat-value">${monthlySpend}</strong>
            <span className="dash-stat-sub">spent</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Scheduled</span>
            <strong className="dash-stat-value">${scheduledSpend}</strong>
            <span className="dash-stat-sub">remaining this month</span>
          </div>
          <div className="dash-stat-card">
            <span className="dash-stat-label">Active Butlers</span>
            <strong className="dash-stat-value">{upcomingAsPrincipal.length}</strong>
            <span className="dash-stat-sub">helping you</span>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header"><h3>Upcoming — Services Being Provided to Me</h3></div>
          {upcomingAsPrincipal.length > 0
            ? <div className="dash-booking-list">{upcomingAsPrincipal.map(b => <UpcomingCard key={b.id} booking={b} role="principal" />)}</div>
            : <div className="dash-empty">No upcoming services scheduled.</div>}
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <h3>My Active Butlers</h3>
            <span className="section-count">{upcomingAsPrincipal.length}</span>
          </div>
          {upcomingAsPrincipal.length > 0
            ? <div className="dash-booking-list">{upcomingAsPrincipal.map(b => <ActivePersonCard key={b.id} booking={b} role="principal" />)}</div>
            : <div className="dash-empty">
                <p>No active butlers yet.</p>
                <button className="add-service-cta" style={{marginTop:'12px'}} onClick={() => setCurrentView('discover')}>
                  <Search size={16} /> Find a Butler
                </button>
              </div>}
        </div>

        <div className="dashboard-section">
          <h3>Recently Completed</h3>
          <div className="dash-empty">Completed services will appear here.</div>
        </div>
      </>
    );

    return (
      <div className="view-container butler-dashboard-view">
        <div className="view-header">
          <div>
            <h1>My Dashboard</h1>
            <p className="subtitle">
              {showBoth ? 'Butler & Principal' : activeUserIsProvider ? 'Butler View' : 'Principal View'}
            </p>
          </div>
          {activeUserIsProvider && (
            <button className="edit-services-button"><Edit size={18} />Edit Services</button>
          )}
        </div>

        {showBoth && (
          <div className="dash-tab-bar">
            <button className={`dash-tab ${dashTab === 'butler' ? 'active' : ''}`} onClick={() => setDashTab('butler')}>
              <Award size={16} /> Butler
            </button>
            <button className={`dash-tab ${dashTab === 'principal' ? 'active' : ''}`} onClick={() => setDashTab('principal')}>
              <Users size={16} /> Principal
            </button>
          </div>
        )}

        {(!showBoth || dashTab === 'butler') && activeUserIsProvider && <ButlerView />}
        {(!showBoth || dashTab === 'principal') && activeUserIsConsumer && <PrincipalView />}
      </div>
    );
  };

  // Profile View
  const ProfileView = () => {
    const [editingProviding, setEditingProviding] = useState(false);
    const [editingSeeking, setEditingSeek] = useState(false);

    const userServices = services.filter(s => s.providerId === activeUser.id);
    const userProvidingCatalogIds = userServices.map(s => s.catalogId).filter(Boolean);
    const userSeekingCatalogIds = activeUser.seeking || [];
    const getCatalogItem = (id) => serviceCatalog.find(c => c.id === id);

    const catalogByCategory = serviceCatalog.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    const ServicePicker = ({ selectedIds, onClose }) => (
      <div className="service-picker-overlay" onClick={onClose}>
        <div className="service-picker" onClick={e => e.stopPropagation()}>
          <div className="service-picker-header">
            <h4>Select Services</h4>
            <button onClick={onClose}><X size={18} /></button>
          </div>
          <div className="service-picker-body">
            {Object.entries(catalogByCategory).map(([category, items]) => (
              <div key={category} className="picker-category">
                <div className="picker-category-label">{category}</div>
                <div className="picker-items">
                  {items.map(item => {
                    const selected = selectedIds.includes(item.id);
                    return (
                      <button key={item.id} className={`picker-item ${selected ? 'selected' : ''}`}>
                        <span className="picker-icon">{item.icon}</span>
                        <span className="picker-name">{item.name}</span>
                        {selected && <CheckCircle size={14} className="picker-check" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    return (
      <div className="view-container profile-view">
        <div className="view-header">
          <h1>Your Profile</h1>
          <button className="edit-profile-button"><Edit size={18} />Edit Profile</button>
        </div>

        <div className="profile-main-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large"><ProfilePhoto user={activeUser} size={80} /></div>
            <button className="change-photo-button">Change Photo</button>
          </div>
          <div className="profile-info-section">
            <h2>{activeUser.name}</h2>
            <div className="verified-location">
              <Shield size={20} className="verified-icon" />
              <div>
                <strong>Verified Location</strong>
                <span>{activeUser.verifiedBlock}</span>
                <span className="verified-date">Verified {activeUser.verifiedDate}</span>
              </div>
            </div>
            <div className="profile-address-detail">
              <MapPin size={16} /><span>{activeUser.address}</span>
            </div>
            {activeUser.bio && <p className="profile-bio">{activeUser.bio}</p>}
            <div className="profile-stats-row">
              <div className="profile-stat-item">
                <strong>{activeUser.activeBookings || 0}</strong>
                <span>{activeUserIsProvider ? 'Active Clients' : 'Active Bookings'}</span>
              </div>
              <div className="profile-stat-item">
                <strong>{(activeUser.connections || []).length}</strong>
                <span>Connections</span>
              </div>
              <div className="profile-stat-item">
                <strong>{activeUser.joinedDate}</strong>
                <span>Member Since</span>
              </div>
            </div>
          </div>
        </div>

        {/* I Am Providing */}
        <div className="profile-section services-section">
          <div className="section-header">
            <div className="section-title-group">
              <h3>I Am Providing</h3>
              <span className="section-count">{userServices.length} services</span>
            </div>
            <button className="edit-section-button" onClick={() => setEditingProviding(true)}>
              <Plus size={16} /><span>Add</span>
            </button>
          </div>
          <p className="section-description">Services you offer to neighbors on your block</p>
          {userServices.length > 0 ? (
            <div className="service-catalog-grid">
              {userServices.map(svc => {
                const cat = getCatalogItem(svc.catalogId);
                return (
                  <div key={svc.id} className="service-catalog-card providing">
                    <span className="catalog-icon">{cat?.icon || '⚡'}</span>
                    <div className="catalog-card-info">
                      <strong>{svc.name}</strong>
                      <span className="catalog-rate">${svc.rate} {svc.rateUnit}</span>
                    </div>
                    <div className="catalog-card-meta">
                      <span className="catalog-bookings">{svc.bookings || 0} bookings</span>
                      <span className={`catalog-status ${svc.active ? 'active' : 'inactive'}`}>
                        {svc.active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-services">
              <p>You haven't listed any services yet.</p>
              <button className="add-service-cta" onClick={() => setEditingProviding(true)}>
                <Plus size={16} /> Add Your First Service
              </button>
            </div>
          )}
        </div>

        {/* I Am Looking For */}
        <div className="profile-section seeking-section">
          <div className="section-header">
            <div className="section-title-group">
              <h3>I Am Looking For</h3>
              <span className="section-count">{userSeekingCatalogIds.length} services</span>
            </div>
            <button className="edit-section-button" onClick={() => setEditingSeek(true)}>
              <Plus size={16} /><span>Add</span>
            </button>
          </div>
          <p className="section-description">Services you'd like help with from neighbors</p>
          {userSeekingCatalogIds.length > 0 ? (
            <div className="service-catalog-grid">
              {userSeekingCatalogIds.map(catId => {
                const cat = getCatalogItem(catId);
                if (!cat) return null;
                return (
                  <div key={catId} className="service-catalog-card seeking">
                    <span className="catalog-icon">{cat.icon}</span>
                    <div className="catalog-card-info">
                      <strong>{cat.name}</strong>
                      <span className="catalog-rate">~${cat.defaultRate} {cat.rateUnit}</span>
                    </div>
                    <button className="catalog-find-btn" onClick={() => setCurrentView('discover')}>
                      Find <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-services">
              <p>You haven't added anything you're looking for yet.</p>
              <button className="add-service-cta" onClick={() => setEditingSeek(true)}>
                <Plus size={16} /> Add What You Need
              </button>
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="profile-section interests-section">
          <div className="section-header">
            <h3>My Interests</h3>
            <button className="edit-section-button"><Edit size={16} /></button>
          </div>
          <p className="section-description">Connect with neighbors who share your interests</p>
          <div className="interests-grid">
            {(activeUser.interests || []).map((interest, i) => (
              <div key={i} className="interest-tag"><Heart size={14} /><span>{interest}</span></div>
            ))}
          </div>
          <button className="add-more-button"><Plus size={16} />Add More Interests</button>
        </div>

        {/* Community Board */}
        {communityBoard.filter(p => p.userId === activeUser.id && p.active).length > 0 && (
          <div className="profile-section community-section">
            <div className="section-header">
              <h3>🌱 Looking to Connect</h3>
              <button className="edit-section-button"><Plus size={16} /><span>Add</span></button>
            </div>
            <p className="section-description">Non-transactional ways you want to connect with neighbors</p>
            <div className="community-posts-list">
              {communityBoard.filter(p => p.userId === activeUser.id && p.active).map(post => (
                <div key={post.id} className="community-post-card">
                  <div className="community-post-icon">{post.icon}</div>
                  <div className="community-post-body">
                    <h4>{post.title}</h4>
                    <p>{post.description}</p>
                    <div className="community-post-meta">
                      {post.frequency && <span className="community-meta-chip">🔁 {post.frequency}</span>}
                      {post.location && post.location !== 'Flexible' && <span className="community-meta-chip">📍 {post.location}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connections */}
        <div className="profile-section connections-section">
          <div className="section-header">
            <h3>My Neighborhood Network</h3>
            <button className="view-all-button" onClick={() => setCurrentView('connections')}>View All</button>
          </div>
          <p className="section-description">{(activeUser.connections || []).length} trusted neighbors in your network</p>
          <div className="profile-connections-grid">
            {(activeUser.connections || []).map(connId => {
              const neighbor = users[connId];
              if (!neighbor) return null;
              return (
                <div key={connId} className="profile-connection-card"
                  onClick={() => { setSelectedButler(neighbor); setCurrentView('butler-detail'); }}>
                  <div className="connection-avatar-small"><ProfilePhoto user={neighbor} size={36} /></div>
                  <div className="connection-info">
                    <strong>{neighbor.name}</strong>
                    <span className="connection-address-small">
                      {(neighbor.address || '').split(' ').slice(0,2).join(' ')}
                    </span>
                    {neighbor.houseKeyTrusted > 0 && (
                      <div className="connection-key-badge"><Key size={10} /><span>{neighbor.houseKeyTrusted}</span></div>
                    )}
                  </div>
                  <ChevronRight size={16} className="connection-arrow" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Settings */}
        <div className="profile-section settings-section">
          <h3>Account Settings</h3>
          <div className="settings-list">
            <button className="setting-item"><span>Payment Methods</span><ChevronRight size={18} /></button>
            <button className="setting-item"><span>Notification Preferences</span><ChevronRight size={18} /></button>
            <button className="setting-item"><span>Privacy & Security</span><ChevronRight size={18} /></button>
            <button className="setting-item"><span>Verify Identity</span><ChevronRight size={18} /></button>
            <button className="setting-item"><span>Help & Support</span><ChevronRight size={18} /></button>
          </div>
        </div>

        {editingProviding && <ServicePicker selectedIds={userProvidingCatalogIds} onClose={() => setEditingProviding(false)} />}
        {editingSeeking && <ServicePicker selectedIds={userSeekingCatalogIds} onClose={() => setEditingSeek(false)} />}
      </div>
    );
  };

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, #F5F1E8 0%, #E8E4DC 100%);
          color: #2C2C2C;
          -webkit-font-smoothing: antialiased;
        }

        .app {
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* Navigation */
        .nav-bar {
          background: white;
          border-bottom: 2px solid #E0D8C8;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }

        .nav-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
          height: 70px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          color: #E07B5F;
        }

        .logo-text {
          font-family: 'Quicksand', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #2C2C2C;
        }

        .nav-menu-desktop {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: none;
          background: transparent;
          color: #5C5C5C;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
        }

        .nav-button:hover {
          background: #F5F1E8;
          color: #2C2C2C;
        }

        .nav-button.active {
          background: #E07B5F;
          color: white;
        }

        .notification-badge {
          position: absolute;
          top: 6px;
          right: 8px;
          background: #E07B5F;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
        }

        .nav-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .nav-menu-mobile {
          display: none;
          background: none;
          border: none;
          color: #2C2C2C;
          cursor: pointer;
        }

        .mobile-menu {
          display: none;
        }

        /* View Container */
        .view-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 40px 20px;
        }

        .view-header {
          margin-bottom: 32px;
        }

        .view-header h1 {
          font-family: 'Quicksand', sans-serif;
          font-size: 36px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #6C6C6C;
          font-size: 16px;
        }

        /* Search & Filter */
        /* ── Home View ──────────────────────────────────────────────── */
        .home-view { padding-bottom: 40px; }

        .home-greeting {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .home-greeting h1 { font-size: 24px; font-weight: 700; color: #2C2C2C; }
        .home-avatar-wrap { flex-shrink: 0; }

        .home-stats-strip {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 24px;
          scrollbar-width: none;
        }
        .home-stats-strip::-webkit-scrollbar { display: none; }
        .home-stat {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 16px;
          background: white;
          border-radius: 12px;
          border: 1.5px solid #E0D8C8;
          min-width: 90px;
          text-align: center;
        }
        .home-stat strong { font-size: 20px; font-weight: 700; color: #2C2C2C; }
        .home-stat span { font-size: 11px; color: #8C8C8C; margin-top: 2px; }
        .home-stat.urgent { border-color: #E07B5F; background: #FFF8F6; }
        .home-stat.urgent strong { color: #E07B5F; }

        .home-section { margin-bottom: 28px; }
        .home-section-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .home-section-header h3 { font-size: 16px; font-weight: 700; color: #2C2C2C; }
        .home-section-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
          background: #F0EDE4;
          color: #6C6C6C;
        }
        .home-section-badge.urgent { background: #E07B5F; color: white; }

        .home-cards-list { display: flex; flex-direction: column; gap: 10px; }

        .home-booking-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: white;
          border-radius: 14px;
          border: 1.5px solid #E0D8C8;
        }
        .home-booking-avatar { flex-shrink: 0; }
        .home-booking-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
        .home-booking-info strong { font-size: 14px; font-weight: 700; color: #2C2C2C; }
        .home-booking-who { font-size: 12px; color: #8C8C8C; }
        .home-booking-when { font-size: 12px; color: #5C8C5A; display: flex; align-items: center; gap: 4px; }
        .home-booking-right { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 4px; }
        .home-booking-rate { font-size: 16px; font-weight: 700; color: #2C2C2C; }
        .home-booking-unit { font-size: 11px; color: #8C8C8C; }

        .home-request-card {
          padding: 14px;
          background: white;
          border-radius: 14px;
          border: 1.5px solid #E0D8C8;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .home-request-top { display: flex; align-items: flex-start; gap: 12px; }
        .home-request-notes {
          font-size: 12px;
          color: #6C6C6C;
          background: #F8F6F2;
          border-radius: 8px;
          padding: 8px 10px;
          margin: 0;
          border-left: 3px solid #E0D8C8;
        }
        .home-request-actions { display: flex; gap: 8px; }
        .req-accept-btn {
          flex: 1;
          padding: 9px;
          background: #5C8C5A;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .req-accept-btn:hover { background: #4a7248; }
        .req-decline-btn {
          flex: 1;
          padding: 9px;
          background: white;
          color: #CC4444;
          border: 1.5px solid #CC4444;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }
        .req-decline-btn:hover { background: #FDECEA; }

        .home-find-more {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: linear-gradient(135deg, #5C8C5A 0%, #3a6a38 100%);
          border-radius: 16px;
          margin-top: 8px;
          gap: 12px;
        }
        .home-find-more-text h4 { font-size: 15px; font-weight: 700; color: white; }
        .home-find-more-text p { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 2px; }
        .home-find-more-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: white;
          color: #5C8C5A;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Discover combined layout */
        .discover-header-area {
          padding: 24px 24px 0 24px;
        }

        .discover-map-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          border-top: 2px solid #E0D8C8;
          border-bottom: 2px solid #E0D8C8;
        }

        .map-neighbor-count {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255,255,255,0.92);
          border-radius: 20px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 600;
          color: #5C5C5C;
          display: flex;
          align-items: center;
          gap: 5px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          pointer-events: none;
        }

        .discover-tile-area {
          padding: 20px 24px 32px 24px;
        }

        .selected-neighbor-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          background: #F0EDE4;
          border-radius: 10px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #5C5C5C;
        }

        .selected-neighbor-label button {
          background: none;
          border: none;
          color: #E07B5F;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
        }

        .butler-card-selected {
          border-color: #5C8C5A !important;
          box-shadow: 0 0 0 3px rgba(92,140,90,0.2) !important;
        }

        /* Neighbor Type Filter Chips */
        .neighbor-filters {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .filter-label {
          font-size: 13px;
          font-weight: 600;
          color: #6C6C6C;
          white-space: nowrap;
        }

        .filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 20px;
          border: 2px solid #E0D8C8;
          background: white;
          font-size: 13px;
          font-weight: 600;
          color: #5C5C5C;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .filter-chip:hover { border-color: #5C8C5A; color: #5C8C5A; }

        .filter-chip.active {
          background: #5C8C5A;
          border-color: #5C8C5A;
          color: white;
        }

        .filter-chip.clear { border-color: #E07B5F; color: #E07B5F; }
        .filter-chip.clear:hover { background: #E07B5F; color: white; }

        .filter-chip-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(0,0,0,0.1);
          font-size: 11px;
          font-weight: 700;
        }

        .filter-chip.active .filter-chip-count { background: rgba(255,255,255,0.3); }

        /* Neighbor Type Badges on cards */
        .neighbor-type-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .type-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 12px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .butler-badge { background: #E8F5E9; color: #5C8C5A; }
        .principal-badge { background: #FFF3E0; color: #C4855A; }
        .connect-badge { background: #EDE7F6; color: #7B6CBE; }

        .search-filter-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 14px 18px;
          border-radius: 16px;
          border: 2px solid #E0D8C8;
          transition: all 0.2s;
        }

        .search-box:focus-within {
          border-color: #E07B5F;
          box-shadow: 0 0 0 3px rgba(224, 123, 95, 0.1);
        }

        .search-box input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          color: #2C2C2C;
        }

        .search-box input::placeholder {
          color: #A0A0A0;
        }

        .filter-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 20px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 16px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .filter-button:hover {
          border-color: #E07B5F;
          background: #FFF5F2;
        }

        /* Neighborhood Banner */
        .neighborhood-banner {
          background: linear-gradient(135deg, #7FB685, #6BA371);
          color: white;
          padding: 16px 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 32px;
          box-shadow: 0 4px 12px rgba(127, 182, 133, 0.2);
        }

        .neighborhood-banner strong {
          display: block;
          font-size: 18px;
          margin-bottom: 2px;
        }

        .neighborhood-banner span {
          font-size: 14px;
          opacity: 0.95;
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 3px;
          margin-left: auto;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          background: transparent;
          color: rgba(255,255,255,0.8);
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: white;
          color: #5C8C5A;
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }

        .toggle-btn:hover:not(.active) {
          background: rgba(255,255,255,0.3);
          color: white;
        }

        .discover-map-container {
          margin-bottom: 24px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .map-hint {
          text-align: center;
          font-size: 13px;
          color: #8C8C8C;
          margin-top: 10px;
          margin-bottom: 0;
        }

        .block-overview-card {
          background: white;
          border-radius: 16px;
          border: 2px solid #E0D8C8;
          overflow: hidden;
          margin-bottom: 28px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .block-overview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 18px;
          color: #5C8C5A;
          border-bottom: 1px solid #F0EDE4;
        }

        .block-overview-header strong {
          font-size: 14px;
          font-weight: 700;
        }

        .block-overview-subtitle {
          font-size: 12px;
          color: #8C8C8C;
          margin-left: 4px;
        }

        /* Butler Grid */
        .butler-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .butler-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid #E0D8C8;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .butler-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #E07B5F, #7FB685);
          transform: scaleX(0);
          transition: transform 0.3s;
        }

        .butler-card:hover {
          border-color: #E07B5F;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-4px);
        }

        .butler-card:hover::before {
          transform: scaleX(1);
        }

        .butler-card-header {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .butler-avatar-large {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.2);
        }

        .butler-info {
          flex: 1;
        }

        .butler-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .butler-name-row h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #2C2C2C;
        }

        .verified-badge {
          color: #7FB685;
        }

        .butler-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          font-weight: 600;
          color: #2C2C2C;
        }

        .review-count {
          color: #8C8C8C;
          font-weight: 400;
          font-size: 14px;
        }

        .butler-location {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6C6C6C;
          font-size: 14px;
        }

        .trust-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border-radius: 12px;
          margin-bottom: 16px;
          color: #5C8C5A;
          font-size: 14px;
          font-weight: 500;
        }

        .house-key-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #FFF3E0, #FFE6CC);
          border: 2px solid #FFB74D;
          border-radius: 12px;
          margin-bottom: 16px;
          color: #E65100;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
        }

        .house-key-badge strong {
          font-weight: 700;
          color: #E65100;
        }

        .house-key-badge svg {
          flex-shrink: 0;
          color: #F57C00;
        }

        .butler-bio {
          color: #5C5C5C;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .butler-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }

        .tag {
          padding: 6px 12px;
          background: #F5F1E8;
          border-radius: 8px;
          font-size: 13px;
          color: #5C5C5C;
          font-weight: 500;
        }

        .community-connect-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 14px;
        }

        .community-connect-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 11px;
          background: #EEF6EE;
          border: 1px solid #C3DEC3;
          border-radius: 20px;
          font-size: 12px;
          color: #3A6B3A;
          font-weight: 500;
        }

        .services-preview {
          margin-bottom: 16px;
        }

        .services-preview strong {
          display: block;
          font-size: 14px;
          margin-bottom: 8px;
          color: #2C2C2C;
        }

        .service-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .service-chip {
          padding: 8px 12px;
          background: white;
          border: 1.5px solid #E0D8C8;
          border-radius: 10px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #2C2C2C;
        }

        .service-chip .rate {
          color: #E07B5F;
          font-weight: 600;
        }

        .service-chip.more {
          background: #F5F1E8;
          color: #6C6C6C;
          border-color: transparent;
        }

        .view-profile-button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .view-profile-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateX(2px);
        }

        /* Butler Detail View */
        .butler-detail-view {
          max-width: 900px;
        }

        .back-button {
          background: none;
          border: none;
          color: #6C6C6C;
          font-size: 15px;
          cursor: pointer;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 0;
          transition: color 0.2s;
        }

        .back-button:hover {
          color: #E07B5F;
        }

        .butler-detail-header {
          background: white;
          border-radius: 20px;
          padding: 32px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .butler-avatar-xlarge {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          flex-shrink: 0;
          box-shadow: 0 8px 24px rgba(224, 123, 95, 0.3);
        }

        .butler-detail-info {
          flex: 1;
        }

        .name-verified {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .name-verified h1 {
          font-family: 'Quicksand', sans-serif;
          font-size: 32px;
          font-weight: 700;
        }

        .verified-badge-large {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border-radius: 10px;
          color: #5C8C5A;
          font-weight: 600;
          font-size: 14px;
        }

        .rating-large {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }

        .rating-number {
          font-size: 24px;
          font-weight: 700;
          color: #2C2C2C;
        }

        .detail-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .detail-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: #F5F1E8;
          border-radius: 10px;
          color: #5C5C5C;
          font-size: 14px;
        }

        .trust-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
        }

        .house-key-section {
          background: linear-gradient(135deg, #FFF8E1, #FFECB3);
          border-radius: 20px;
          padding: 28px;
          border: 3px solid #FFB74D;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(255, 183, 77, 0.2);
        }

        .house-key-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .house-key-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #FFB74D, #FFA726);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(255, 183, 77, 0.3);
        }

        .house-key-header h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 22px;
          color: #E65100;
          margin-bottom: 8px;
        }

        .house-key-subtitle {
          color: #F57C00;
          font-size: 15px;
          margin: 0;
        }

        .house-key-subtitle strong {
          font-size: 20px;
          font-weight: 700;
        }

        .house-key-explainer {
          background: white;
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border-left: 4px solid #FFB74D;
        }

        .house-key-explainer p {
          color: #5C5C5C;
          line-height: 1.6;
          margin: 0;
        }

        .trusted-by-list {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .trusted-by-label {
          font-weight: 600;
          color: #E65100;
          font-size: 14px;
        }

        .trusted-by-avatars {
          display: flex;
          gap: -8px;
        }

        .trusted-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FFB74D, #FFA726);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          border: 3px solid #FFF8E1;
          margin-left: -8px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .trusted-avatar:first-child {
          margin-left: 0;
        }

        .trusted-avatar:hover {
          transform: translateY(-4px);
          z-index: 10;
        }

        .trusted-avatar-more {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #E65100;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          border: 3px solid #FFF8E1;
          margin-left: -8px;
        }

        .trust-section h3 {
          font-family: 'Quicksand', sans-serif;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          color: #2C2C2C;
        }

        .mutual-connections {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mutual-connection-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border-radius: 12px;
        }

        .mutual-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7FB685, #6BA371);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .mutual-connection-card strong {
          display: block;
          font-size: 16px;
          color: #2C2C2C;
          margin-bottom: 2px;
        }

        .mutual-connection-card span {
          font-size: 14px;
          color: #5C8C5A;
        }

        .about-section,
        .services-section,
        .stats-section,
        .community-section {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
        }

        .community-section {
          border-color: #C3DEC3;
          background: #FAFFF8;
        }

        .community-section-subtitle {
          font-size: 13px;
          color: #6B8B6B;
          margin-bottom: 16px;
          margin-top: -8px;
        }

        .community-posts-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .community-post-card {
          display: flex;
          gap: 14px;
          padding: 14px;
          background: white;
          border-radius: 12px;
          border: 1px solid #D8EDD8;
        }

        .community-post-icon {
          font-size: 28px;
          flex-shrink: 0;
          line-height: 1.2;
        }

        .community-post-body {
          flex: 1;
        }

        .community-post-body h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 15px;
          font-weight: 700;
          color: #2C2C2C;
          margin: 0 0 6px 0;
        }

        .community-post-body p {
          font-size: 13px;
          color: #5C5C5C;
          line-height: 1.5;
          margin: 0 0 10px 0;
        }

        .community-post-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }

        .community-meta-chip {
          font-size: 12px;
          color: #3A6B3A;
          background: #EEF6EE;
          border-radius: 8px;
          padding: 3px 8px;
        }

        .community-post-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .community-tag {
          font-size: 11px;
          color: #7A9B7A;
          background: #F0F8F0;
          border-radius: 6px;
          padding: 2px 7px;
        }

        .about-section h3,
        .services-section h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          margin-bottom: 16px;
          color: #2C2C2C;
        }

        .about-section p {
          color: #5C5C5C;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .services-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .service-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #F5F1E8;
          border-radius: 12px;
          border: 1.5px solid #E0D8C8;
          transition: all 0.2s;
        }

        .service-card:hover {
          border-color: #E07B5F;
          background: #FFF5F2;
        }

        .service-info h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .service-rate {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #E07B5F;
          font-weight: 600;
        }

        .rate-frequency {
          color: #8C8C8C;
          font-weight: 400;
        }

        .free-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #E07B5F;
          font-weight: 600;
        }

        .service-radius {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #F1F8E9, #E8F5E9);
          border-radius: 8px;
          color: #5C8C5A;
          font-size: 13px;
          font-weight: 500;
        }

        .service-radius svg {
          flex-shrink: 0;
        }

        .book-button {
          padding: 10px 24px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .book-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.3);
        }

        .stats-section {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: linear-gradient(135deg, #F5F1E8, #E8E4DC);
          border-radius: 16px;
        }

        .stat-card svg {
          color: #E07B5F;
        }

        .stat-card strong {
          display: block;
          font-size: 24px;
          font-weight: 700;
          color: #2C2C2C;
          margin-bottom: 2px;
        }

        .stat-card span {
          font-size: 14px;
          color: #6C6C6C;
        }

        .stat-card.house-key-stat {
          background: linear-gradient(135deg, #FFF8E1, #FFECB3);
          border: 2px solid #FFB74D;
        }

        .stat-card.house-key-stat svg {
          color: #F57C00;
        }

        .stat-card.house-key-stat strong {
          color: #E65100;
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.2s;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: white;
          border-radius: 24px;
          max-width: 600px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 2px solid #E0D8C8;
        }

        .modal-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 24px;
          color: #2C2C2C;
        }

        .modal-header button {
          background: none;
          border: none;
          cursor: pointer;
          color: #8C8C8C;
          transition: color 0.2s;
        }

        .modal-header button:hover {
          color: #E07B5F;
        }

        .booking-summary {
          padding: 24px;
          border-bottom: 2px solid #E0D8C8;
        }

        .booking-butler {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .butler-avatar-medium {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .booking-butler strong {
          display: block;
          font-size: 18px;
          margin-bottom: 4px;
          color: #2C2C2C;
        }

        .booking-butler span {
          color: #6C6C6C;
          font-size: 15px;
        }

        .booking-radius-info {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 6px;
          color: #5C8C5A;
          font-size: 13px;
          font-weight: 500;
        }

        .booking-rate {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #F5F1E8;
          border-radius: 12px;
        }

        .rate-label {
          color: #6C6C6C;
        }

        .rate-amount {
          font-size: 20px;
          font-weight: 700;
          color: #E07B5F;
        }

        .booking-form {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2C2C2C;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-size: 15px;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #E07B5F;
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
        }

        .payment-info {
          margin-top: 24px;
          padding: 16px;
          background: #F5F1E8;
          border-radius: 12px;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          color: #5C5C5C;
        }

        .payment-row.total {
          border-top: 2px solid #E0D8C8;
          margin-top: 8px;
          padding-top: 12px;
          font-weight: 700;
          color: #2C2C2C;
          font-size: 18px;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          padding: 24px;
          border-top: 2px solid #E0D8C8;
        }

        .cancel-button {
          flex: 1;
          padding: 14px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #5C5C5C;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: #F5F1E8;
          border-color: #C5C5C5;
        }

        .confirm-button {
          flex: 1;
          padding: 14px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .confirm-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.3);
        }

        /* Bookings View */
        .bookings-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .booking-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          border: 2px solid #E0D8C8;
        }

        .booking-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .booking-butler-info {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .booking-butler-info h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          color: #2C2C2C;
          margin-bottom: 4px;
        }

        .butler-name-small {
          color: #6C6C6C;
          font-size: 14px;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
        }

        .status-badge.active {
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          color: #5C8C5A;
        }

        .booking-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        .booking-detail {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          background: #F5F1E8;
          border-radius: 12px;
        }

        .booking-detail svg {
          color: #E07B5F;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .booking-detail strong {
          display: block;
          margin-bottom: 2px;
          color: #2C2C2C;
        }

        .booking-detail span {
          color: #6C6C6C;
          font-size: 14px;
        }

        .booking-meta {
          color: #8C8C8C;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .booking-actions {
          display: flex;
          gap: 12px;
        }

        .secondary-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .secondary-button:hover {
          background: #F5F1E8;
          border-color: #E07B5F;
        }

        .add-booking-cta {
          background: white;
          border-radius: 20px;
          padding: 32px;
          border: 2px dashed #E0D8C8;
          margin-top: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .add-booking-cta svg {
          color: #E07B5F;
          flex-shrink: 0;
        }

        .add-booking-cta h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          margin-bottom: 4px;
          color: #2C2C2C;
        }

        .add-booking-cta p {
          color: #6C6C6C;
        }

        .primary-button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .primary-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.3);
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 20px;
          border: 2px dashed #E0D8C8;
        }

        .empty-state svg {
          color: #C5C5C5;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 24px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .empty-state p {
          color: #6C6C6C;
          margin-bottom: 24px;
        }

        /* Connections View */
        .connections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .connection-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #E0D8C8;
          text-align: center;
          transition: all 0.2s;
        }

        .connection-card:hover {
          border-color: #E07B5F;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .connection-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7FB685, #6BA371);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          margin: 0 auto 16px;
        }

        .connection-card h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          margin-bottom: 4px;
          color: #2C2C2C;
        }

        .connection-address {
          color: #8C8C8C;
          font-size: 13px;
          display: block;
          margin-bottom: 8px;
        }

        .connection-rating {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 16px;
          font-weight: 600;
          color: #2C2C2C;
        }

        .view-profile-small {
          width: 100%;
          padding: 10px;
          background: #F5F1E8;
          border: 1.5px solid #E0D8C8;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .view-profile-small:hover {
          background: #E07B5F;
          color: white;
          border-color: #E07B5F;
        }

        .trust-explainer {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 2px solid #E0D8C8;
          display: flex;
          gap: 20px;
          margin-bottom: 32px;
        }

        .trust-explainer svg {
          color: #7FB685;
          flex-shrink: 0;
        }

        .trust-explainer h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          margin-bottom: 8px;
          color: #2C2C2C;
        }

        .trust-explainer p {
          color: #6C6C6C;
          line-height: 1.6;
          font-size: 14px;
        }

        .expand-network-cta {
          background: white;
          border-radius: 20px;
          padding: 40px;
          border: 2px dashed #E0D8C8;
          text-align: center;
        }

        .expand-network-cta svg {
          color: #E07B5F;
          margin-bottom: 16px;
        }

        .expand-network-cta h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 24px;
          margin-bottom: 8px;
          color: #2C2C2C;
        }

        .expand-network-cta p {
          color: #6C6C6C;
          margin-bottom: 24px;
        }

        /* Profile View */
        .profile-view .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .edit-profile-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .edit-profile-button:hover {
          background: #F5F1E8;
          border-color: #E07B5F;
        }

        .profile-main-card {
          background: white;
          border-radius: 24px;
          padding: 40px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
          display: flex;
          gap: 40px;
          align-items: flex-start;
        }

        .profile-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .profile-avatar-large {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 70px;
          box-shadow: 0 8px 24px rgba(224, 123, 95, 0.3);
        }

        .change-photo-button {
          padding: 8px 16px;
          background: #F5F1E8;
          border: 1.5px solid #E0D8C8;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #5C5C5C;
          transition: all 0.2s;
        }

        .change-photo-button:hover {
          background: #E07B5F;
          color: white;
          border-color: #E07B5F;
        }

        .profile-info-section {
          flex: 1;
        }

        .profile-info-section h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 32px;
          margin-bottom: 20px;
          color: #2C2C2C;
        }

        .verified-location {
          display: flex;
          gap: 16px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border: 2px solid #7FB685;
          border-radius: 16px;
          margin-bottom: 16px;
        }

        .verified-icon {
          color: #5C8C5A;
          flex-shrink: 0;
        }

        .verified-location strong {
          display: block;
          font-size: 16px;
          color: #2C2C2C;
          margin-bottom: 4px;
        }

        .verified-location span {
          display: block;
          font-size: 15px;
          color: #5C8C5A;
          font-weight: 600;
        }

        .verified-date {
          font-size: 13px !important;
          font-weight: 400 !important;
          color: #6C8C6A !important;
          margin-top: 4px;
        }

        .profile-address-detail {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6C6C6C;
          margin-bottom: 16px;
          font-size: 15px;
        }

        .profile-bio {
          color: #5C5C5C;
          line-height: 1.6;
          margin-bottom: 20px;
          font-size: 15px;
        }

        .profile-stats-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          padding-top: 20px;
          border-top: 2px solid #E0D8C8;
        }

        .profile-stat-item {
          text-align: center;
        }

        .profile-stat-item strong {
          display: block;
          font-size: 28px;
          font-weight: 700;
          color: #E07B5F;
          margin-bottom: 4px;
        }

        .profile-stat-item span {
          color: #6C6C6C;
          font-size: 14px;
        }

        /* Profile Sections */
        .profile-section {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .section-header h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 22px;
          color: #2C2C2C;
        }

        .edit-section-button,
        .view-all-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #F5F1E8;
          border: 1.5px solid #E0D8C8;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #5C5C5C;
          transition: all 0.2s;
        }

        .edit-section-button:hover,
        .view-all-button:hover {
          background: #E07B5F;
          color: white;
          border-color: #E07B5F;
        }

        .section-description {
          color: #6C6C6C;
          font-size: 14px;
          margin-bottom: 20px;
        }

        /* Interests Section */
        .interests-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .interest-tag {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #FFF5F2, #FFE6E0);
          border: 2px solid #E07B5F;
          border-radius: 12px;
          color: #C5705E;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.2s;
          cursor: pointer;
        }

        .interest-tag:hover {
          background: #E07B5F;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.2);
        }

        .interest-tag svg {
          flex-shrink: 0;
        }

        .add-more-button {
          width: 100%;
          padding: 12px;
          background: white;
          border: 2px dashed #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #6C6C6C;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .add-more-button:hover {
          border-color: #E07B5F;
          color: #E07B5F;
          background: #FFF5F2;
        }

        /* Seeking Help Section */
        .add-task-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 18px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: white;
          transition: all 0.2s;
        }

        .add-task-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.3);
        }

        .seeking-tasks-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .seeking-task-card {
          padding: 20px;
          background: #F5F1E8;
          border: 2px solid #E0D8C8;
          border-radius: 16px;
          transition: all 0.2s;
        }

        .seeking-task-card.active {
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border-color: #7FB685;
        }

        .seeking-task-card:hover {
          border-color: #E07B5F;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }

        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .task-category {
          display: inline-block;
          padding: 4px 10px;
          background: white;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: #6C6C6C;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .task-info h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          color: #2C2C2C;
        }

        .task-status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
        }

        .task-status-badge.active {
          background: white;
          color: #5C8C5A;
          border: 1.5px solid #7FB685;
        }

        .task-status-badge.seeking {
          background: white;
          color: #E07B5F;
          border: 1.5px solid #E07B5F;
        }

        .task-details-row {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 16px;
        }

        .task-detail {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #5C5C5C;
          font-size: 14px;
        }

        .task-detail svg {
          color: #8C8C8C;
        }

        .task-priority {
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .task-priority.priority-high {
          background: #FFEBEE;
          color: #C62828;
        }

        .task-priority.priority-medium {
          background: #FFF3E0;
          color: #E65100;
        }

        .task-priority.priority-low {
          background: #E8F5E9;
          color: #2E7D32;
        }

        .task-action {
          display: flex;
          gap: 12px;
        }

        .view-booking-button,
        .find-help-button {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .view-booking-button {
          background: white;
          border: 2px solid #7FB685;
          color: #5C8C5A;
        }

        .view-booking-button:hover {
          background: #7FB685;
          color: white;
        }

        .find-help-button {
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          border: none;
          color: white;
        }

        .find-help-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(224, 123, 95, 0.3);
        }

        /* Connections Section */
        .profile-connections-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .profile-connection-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #F5F1E8;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .profile-connection-card:hover {
          border-color: #E07B5F;
          background: #FFF5F2;
          transform: translateX(4px);
        }

        .connection-avatar-small {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7FB685, #6BA371);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          flex-shrink: 0;
        }

        .connection-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .connection-info strong {
          font-size: 16px;
          color: #2C2C2C;
        }

        .connection-address-small {
          color: #8C8C8C;
          font-size: 13px;
        }

        .connection-key-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: linear-gradient(135deg, #FFF3E0, #FFE6CC);
          border-radius: 6px;
          color: #E65100;
          font-size: 11px;
          font-weight: 700;
        }

        .connection-arrow {
          color: #C5C5C5;
        }

        /* Become Butler Section */
        .become-butler-section {
          background: linear-gradient(135deg, #F5F1E8, #E8E4DC);
          border: 2px dashed #E0D8C8;
        }

        .become-butler-content {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .become-butler-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .become-butler-section h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 20px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .become-butler-section p {
          color: #5C5C5C;
          line-height: 1.6;
          margin: 0;
        }

        /* Settings Section */
        .settings-section .settings-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-item {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #F5F1E8;
          border: 1.5px solid #E0D8C8;
          border-radius: 12px;
          text-align: left;
          font-weight: 500;
          cursor: pointer;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .setting-item:hover {
          background: #FFF5F2;
          border-color: #E07B5F;
          transform: translateX(4px);
        }

        .setting-item svg {
          color: #C5C5C5;
        }

        /* Responsive - Profile */
        @media (max-width: 768px) {
          .profile-main-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 32px 24px;
          }

          .profile-stats-row {
            grid-template-columns: 1fr;
          }

          .interests-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .profile-connections-grid {
            gap: 8px;
          }

          .edit-profile-button {
            padding: 8px 16px;
            font-size: 14px;
          }
        }

        /* Authentication Styles */
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #F5F1E8 0%, #E8E4DC 100%);
        }

        .auth-card {
          background: white;
          border-radius: 24px;
          padding: 48px;
          max-width: 500px;
          width: 100%;
          border: 2px solid #E0D8C8;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
        }

        .welcome-card {
          max-width: 600px;
        }

        .auth-logo {
          text-align: center;
          margin-bottom: 40px;
        }

        .auth-logo svg {
          color: #E07B5F;
          margin-bottom: 16px;
        }

        .auth-logo h1 {
          font-family: 'Quicksand', sans-serif;
          font-size: 36px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .auth-tagline {
          color: #6C6C6C;
          font-size: 16px;
        }

        .welcome-illustration {
          text-align: center;
          margin-bottom: 40px;
          padding: 32px;
          background: linear-gradient(135deg, #FFF5F2, #FFE6E0);
          border-radius: 20px;
        }

        .welcome-houses {
          font-size: 48px;
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .welcome-message {
          color: #5C5C5C;
          line-height: 1.8;
          font-size: 15px;
        }

        .auth-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }

        .primary-auth-button {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-auth-button:hover {
          background: linear-gradient(135deg, #C5705E, #B06050);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(224, 123, 95, 0.3);
        }

        .secondary-auth-button {
          width: 100%;
          padding: 16px;
          background: white;
          color: #2C2C2C;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-auth-button:hover {
          background: #F5F1E8;
          border-color: #E07B5F;
        }

        .demo-login-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 2px solid #E0D8C8;
        }

        .demo-divider {
          text-align: center;
          margin-bottom: 20px;
        }

        .demo-divider span {
          color: #8C8C8C;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .demo-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .demo-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
          background: linear-gradient(135deg, #F5F1E8, #E8E4DC);
          border: 2px solid #E0D8C8;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .demo-button:hover {
          border-color: #E07B5F;
          background: #FFF5F2;
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .demo-avatar {
          font-size: 36px;
        }

        .demo-button strong {
          font-size: 15px;
          color: #2C2C2C;
        }

        .demo-button span {
          font-size: 13px;
          color: #6C6C6C;
        }

        .back-to-welcome {
          background: none;
          border: none;
          color: #6C6C6C;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 24px;
          display: inline-block;
          padding: 8px 0;
        }

        .back-to-welcome:hover {
          color: #E07B5F;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header svg {
          color: #E07B5F;
          margin-bottom: 16px;
        }

        .auth-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 28px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .auth-header p {
          color: #6C6C6C;
          font-size: 15px;
        }

        .auth-form {
          margin-bottom: 24px;
        }

        .sso-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .sso-button {
          width: 100%;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sso-button.google {
          background: white;
          border: 2px solid #E0D8C8;
          color: #2C2C2C;
        }

        .sso-button.google:hover {
          background: #F5F1E8;
          border-color: #DB4437;
        }

        .sso-button.facebook {
          background: #1877F2;
          border: 2px solid #1877F2;
          color: white;
        }

        .sso-button.facebook:hover {
          background: #155DB2;
        }

        .sso-button.apple {
          background: #000;
          border: 2px solid #000;
          color: white;
        }

        .sso-button.apple:hover {
          background: #333;
        }

        .sso-icon {
          font-weight: 700;
          font-size: 18px;
        }

        .auth-divider {
          text-align: center;
          margin: 24px 0;
          position: relative;
        }

        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #E0D8C8;
        }

        .auth-divider span {
          position: relative;
          background: white;
          padding: 0 16px;
          color: #8C8C8C;
          font-size: 14px;
          font-weight: 600;
        }

        .forgot-password {
          background: none;
          border: none;
          color: #E07B5F;
          font-size: 14px;
          cursor: pointer;
          padding: 8px 0;
          margin-bottom: 24px;
        }

        .forgot-password:hover {
          text-decoration: underline;
        }

        .terms-notice {
          text-align: center;
          font-size: 13px;
          color: #8C8C8C;
          line-height: 1.6;
        }

        .auth-footer {
          text-align: center;
          color: #6C6C6C;
          font-size: 14px;
        }

        .auth-footer button {
          background: none;
          border: none;
          color: #E07B5F;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          margin-left: 4px;
        }

        .auth-footer button:hover {
          text-decoration: underline;
        }

        /* Verification Screens */
        .verification-card {
          max-width: 650px;
        }

        .verification-progress {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 40px;
        }

        .progress-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #E0D8C8;
          color: #8C8C8C;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
          transition: all 0.2s;
        }

        .progress-step.active .step-number {
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
        }

        .progress-step.completed .step-number {
          background: linear-gradient(135deg, #7FB685, #6BA371);
          color: white;
        }

        .progress-step span {
          font-size: 12px;
          color: #8C8C8C;
          font-weight: 600;
          text-align: center;
        }

        .progress-step.active span {
          color: #E07B5F;
        }

        .progress-step.completed span {
          color: #7FB685;
        }

        .progress-line {
          width: 60px;
          height: 2px;
          background: #E0D8C8;
          margin: 0 12px;
        }

        .progress-line.completed {
          background: #7FB685;
        }

        .verification-icon {
          color: #7FB685;
        }

        .verification-explainer {
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          border: 2px solid #7FB685;
        }

        .why-verify strong {
          display: block;
          color: #2C2C2C;
          margin-bottom: 12px;
          font-size: 16px;
        }

        .why-verify ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .why-verify li {
          padding: 8px 0;
          padding-left: 24px;
          color: #5C8C5A;
          font-size: 14px;
          position: relative;
        }

        .why-verify li::before {
          content: '✓';
          position: absolute;
          left: 0;
          font-weight: 700;
        }

        .form-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 12px;
        }

        .verification-methods {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .verification-method-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #F5F1E8;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .verification-method-card:has(input:checked) {
          border-color: #E07B5F;
          background: #FFF5F2;
        }

        .verification-method-card input[type="radio"] {
          margin-top: 4px;
        }

        .verification-method-card label {
          flex: 1;
          cursor: pointer;
        }

        .verification-method-card strong {
          display: block;
          color: #2C2C2C;
          margin-bottom: 4px;
          font-size: 15px;
        }

        .verification-method-card span {
          color: #6C6C6C;
          font-size: 14px;
        }

        /* Role Selection */
        .role-selection-card {
          max-width: 900px;
        }

        .role-selection-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }

        .role-card {
          padding: 28px;
          background: linear-gradient(135deg, #F5F1E8, #E8E4DC);
          border: 2px solid #E0D8C8;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: center;
        }

        .role-card:hover {
          border-color: #E07B5F;
          background: white;
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }

        .role-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: all 0.3s;
        }

        .client-icon {
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          color: white;
        }

        .butler-icon {
          background: linear-gradient(135deg, #7FB685, #6BA371);
          color: white;
        }

        .community-icon {
          background: linear-gradient(135deg, #FFB74D, #FFA726);
          color: white;
        }

        .role-card:hover .role-icon {
          transform: scale(1.1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .role-card h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 22px;
          color: #2C2C2C;
          margin-bottom: 12px;
        }

        .role-card > p {
          color: #6C6C6C;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 20px;
        }

        .role-features {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .role-features span {
          color: #5C5C5C;
          font-size: 13px;
          text-align: left;
        }

        .skip-button {
          width: 100%;
          padding: 14px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          color: #6C6C6C;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .skip-button:hover {
          background: #F5F1E8;
          border-color: #C5C5C5;
        }

        /* Butler Dashboard */
        /* ── Dashboard tabs & summary ─────────────────────────── */
        .dash-tab-bar { display: flex; gap: 8px; margin-bottom: 24px; background: #F0EDE4; border-radius: 12px; padding: 4px; }
        .dash-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px; padding: 10px; border: none; border-radius: 9px; background: transparent; font-size: 14px; font-weight: 600; color: #6C6C6C; cursor: pointer; transition: all 0.2s; }
        .dash-tab.active { background: white; color: #2C2C2C; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .dash-summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px; }
        .dash-stat-card { background: white; border-radius: 14px; padding: 16px; border: 1.5px solid #E0D8C8; display: flex; flex-direction: column; gap: 4px; }
        .dash-stat-card.primary { background: #5C8C5A; border-color: #5C8C5A; }
        .dash-stat-card.primary .dash-stat-label, .dash-stat-card.primary .dash-stat-sub { color: rgba(255,255,255,0.8); }
        .dash-stat-card.primary .dash-stat-value { color: white; }
        .dash-stat-label { font-size: 12px; font-weight: 600; color: #8C8C8C; text-transform: uppercase; letter-spacing: 0.5px; }
        .dash-stat-value { font-size: 26px; font-weight: 700; color: #2C2C2C; line-height: 1.1; }
        .dash-stat-sub { font-size: 11px; color: #8C8C8C; }
        .dash-empty { text-align: center; padding: 28px; background: #FAFAF8; border-radius: 12px; border: 2px dashed #E0D8C8; color: #8C8C8C; font-size: 14px; }
        .dash-booking-list { display: flex; flex-direction: column; gap: 10px; }
        .dash-booking-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: white; border-radius: 12px; border: 1.5px solid #E0D8C8; }
        .dash-booking-avatar { flex-shrink: 0; }
        .dash-booking-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .dash-booking-info strong { font-size: 14px; color: #2C2C2C; }
        .dash-booking-who { font-size: 12px; color: #8C8C8C; }
        .dash-booking-when { font-size: 12px; color: #5C8C5A; display: flex; align-items: center; gap: 4px; }
        .dash-booking-rate { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; }
        .dash-booking-rate strong { font-size: 16px; font-weight: 700; color: #2C2C2C; }
        .dash-booking-rate span { font-size: 11px; color: #8C8C8C; }
        .dash-inline-rating { display: flex; align-items: center; gap: 3px; font-size: 12px; color: #E07B5F; margin-top: 2px; }

        /* ── Profile service sections ──────────────────────────── */
        .section-title-group { display: flex; align-items: center; gap: 8px; }
        .section-count { font-size: 12px; font-weight: 600; padding: 2px 8px; background: #F0EDE4; border-radius: 10px; color: #6C6C6C; }
        .edit-section-button { display: flex; align-items: center; gap: 4px; padding: 6px 12px; background: white; border: 1.5px solid #E0D8C8; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; color: #5C5C5C; transition: all 0.2s; }
        .edit-section-button:hover { border-color: #E07B5F; color: #E07B5F; }
        .service-catalog-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .service-catalog-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: 12px; border: 1.5px solid #E0D8C8; background: white; }
        .service-catalog-card.providing { border-left: 4px solid #5C8C5A; }
        .service-catalog-card.seeking { border-left: 4px solid #C4855A; }
        .catalog-icon { font-size: 22px; flex-shrink: 0; }
        .catalog-card-info { flex: 1; min-width: 0; }
        .catalog-card-info strong { display: block; font-size: 13px; color: #2C2C2C; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .catalog-rate { font-size: 11px; color: #8C8C8C; }
        .catalog-card-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; }
        .catalog-bookings { font-size: 11px; color: #8C8C8C; }
        .catalog-status { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 8px; text-transform: uppercase; }
        .catalog-status.active { background: #E8F5E9; color: #5C8C5A; }
        .catalog-status.inactive { background: #F5F5F5; color: #8C8C8C; }
        .catalog-find-btn { display: flex; align-items: center; gap: 2px; padding: 4px 10px; background: #FFF3E0; border: none; border-radius: 8px; font-size: 12px; font-weight: 600; color: #C4855A; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
        .catalog-find-btn:hover { background: #C4855A; color: white; }
        .empty-services { text-align: center; padding: 24px; background: #FAFAF8; border-radius: 12px; border: 2px dashed #E0D8C8; color: #8C8C8C; font-size: 14px; }
        .add-service-cta { display: inline-flex; align-items: center; gap: 6px; margin-top: 12px; padding: 8px 16px; background: #E07B5F; color: white; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
        .service-picker-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
        .service-picker { background: white; border-radius: 20px 20px 0 0; width: 100%; max-width: 600px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
        .service-picker-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px 14px; border-bottom: 1px solid #E0D8C8; }
        .service-picker-header h4 { font-size: 17px; font-weight: 700; color: #2C2C2C; }
        .service-picker-header button { background: none; border: none; cursor: pointer; color: #6C6C6C; padding: 4px; }
        .service-picker-body { overflow-y: auto; padding: 16px 20px 32px; display: flex; flex-direction: column; gap: 20px; }
        .picker-category-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #8C8C8C; margin-bottom: 8px; }
        .picker-items { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .picker-item { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1.5px solid #E0D8C8; border-radius: 10px; background: white; cursor: pointer; font-size: 13px; font-weight: 500; color: #2C2C2C; transition: all 0.15s; text-align: left; }
        .picker-item:hover { border-color: #5C8C5A; background: #F0F7F0; }
        .picker-item.selected { border-color: #5C8C5A; background: #E8F5E9; color: #3A6A38; }
        .picker-icon { font-size: 18px; flex-shrink: 0; }
        .picker-name { flex: 1; line-height: 1.2; }
        .picker-check { color: #5C8C5A; flex-shrink: 0; }

                .butler-dashboard-view .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .edit-services-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #2C2C2C;
          transition: all 0.2s;
        }

        .edit-services-button:hover {
          background: #F5F1E8;
          border-color: #E07B5F;
        }

        .earnings-overview {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }

        .earnings-card {
          background: white;
          border: 2px solid #E0D8C8;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .earnings-card.primary {
          background: linear-gradient(135deg, #E07B5F, #C5705E);
          border-color: #E07B5F;
          color: white;
        }

        .earnings-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .earnings-info {
          flex: 1;
        }

        .earnings-label {
          display: block;
          font-size: 14px;
          margin-bottom: 8px;
          opacity: 0.9;
        }

        .earnings-card.primary .earnings-label {
          color: white;
        }

        .earnings-card:not(.primary) .earnings-label {
          color: #6C6C6C;
        }

        .earnings-amount {
          display: block;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .earnings-card.primary .earnings-amount {
          color: white;
        }

        .earnings-card:not(.primary) .earnings-amount {
          color: #E07B5F;
        }

        .earnings-trend {
          font-size: 13px;
          color: rgba(255,255,255,0.9);
          font-weight: 600;
        }

        .dashboard-section {
          background: white;
          border-radius: 20px;
          padding: 28px;
          border: 2px solid #E0D8C8;
          margin-bottom: 24px;
        }

        .dashboard-section h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 22px;
          color: #2C2C2C;
          margin-bottom: 20px;
        }

        .clients-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .client-card {
          padding: 20px;
          background: #F5F1E8;
          border: 2px solid #E0D8C8;
          border-radius: 16px;
        }

        .client-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .client-info-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .client-details h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          color: #2C2C2C;
          margin-bottom: 4px;
        }

        .client-address {
          display: block;
          color: #8C8C8C;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .house-access-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: linear-gradient(135deg, #FFF3E0, #FFE6CC);
          border-radius: 8px;
          color: #E65100;
          font-size: 12px;
          font-weight: 600;
        }

        .client-revenue {
          text-align: right;
        }

        .client-revenue strong {
          display: block;
          font-size: 24px;
          color: #7FB685;
          margin-bottom: 4px;
        }

        .client-revenue span {
          font-size: 13px;
          color: #6C6C6C;
        }

        .client-services {
          margin-bottom: 12px;
        }

        .client-services strong {
          display: block;
          font-size: 14px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .service-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .service-tag {
          padding: 6px 12px;
          background: white;
          border: 1.5px solid #E0D8C8;
          border-radius: 8px;
          font-size: 13px;
          color: #5C5C5C;
          font-weight: 500;
        }

        .client-next-scheduled {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: white;
          border-radius: 10px;
          color: #5C5C5C;
          font-size: 14px;
          margin-bottom: 12px;
        }

        .client-next-scheduled svg {
          color: #E07B5F;
        }

        .client-meta {
          color: #8C8C8C;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .client-actions {
          display: flex;
          gap: 12px;
        }

        .butler-services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .butler-service-card {
          padding: 20px;
          background: #F5F1E8;
          border: 2px solid #E0D8C8;
          border-radius: 16px;
        }

        .service-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .butler-service-card h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 18px;
          color: #2C2C2C;
          margin-bottom: 8px;
        }

        .butler-service-card .service-rate {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #E07B5F;
          font-weight: 600;
        }

        .rate-freq {
          color: #8C8C8C;
          font-weight: 400;
        }

        .service-status {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }

        .service-status.active {
          background: linear-gradient(135deg, #E8F5E9, #F1F8E9);
          color: #5C8C5A;
        }

        .service-status.inactive {
          background: #F5F5F5;
          color: #8C8C8C;
        }

        .service-radius-info {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border-radius: 8px;
          color: #5C8C5C;
          font-size: 13px;
          margin-bottom: 12px;
        }

        .service-stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-stat strong {
          display: block;
          font-size: 20px;
          color: #E07B5F;
          margin-bottom: 2px;
        }

        .service-stat span {
          font-size: 12px;
          color: #6C6C6C;
        }

        .edit-service-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: white;
          border: 1.5px solid #E0D8C8;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          color: #5C5C5C;
          transition: all 0.2s;
        }

        .edit-service-button:hover {
          background: #E07B5F;
          color: white;
          border-color: #E07B5F;
        }

        .add-service-button {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          background: white;
          border: 2px dashed #E0D8C8;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          color: #6C6C6C;
          transition: all 0.2s;
        }

        .add-service-button:hover {
          border-color: #E07B5F;
          color: #E07B5F;
          background: #FFF5F2;
        }

        .trust-reputation-section .reputation-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        .reputation-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #F5F1E8;
          border-radius: 16px;
        }

        .reputation-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #E07B5F;
        }

        .reputation-card strong {
          display: block;
          font-size: 20px;
          color: #2C2C2C;
          margin-bottom: 4px;
        }

        .reputation-card span {
          display: block;
          font-size: 14px;
          color: #6C6C6C;
          margin-bottom: 4px;
        }

        .rating-detail {
          font-size: 12px;
          color: #8C8C8C;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .nav-menu-desktop {
            display: none;
          }

          .nav-menu-mobile {
            display: block;
          }

          .mobile-menu {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            background: #F5F1E8;
            border-top: 2px solid #E0D8C8;
          }

          .mobile-menu button {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: white;
            border: none;
            border-radius: 12px;
            font-weight: 500;
            cursor: pointer;
            color: #2C2C2C;
            transition: all 0.2s;
          }

          .mobile-menu button:hover {
            background: #E07B5F;
            color: white;
          }

          .butler-grid {
            grid-template-columns: 1fr;
          }

          .butler-detail-header {
            flex-direction: column;
            text-align: center;
          }

          .butler-avatar-xlarge {
            margin: 0 auto;
          }

          .name-verified {
            justify-content: center;
          }

          .rating-large {
            justify-content: center;
          }

          .stats-section {
            grid-template-columns: 1fr;
          }

          .connections-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          }

          .profile-stats {
            grid-template-columns: 1fr;
          }

          .auth-card {
            padding: 32px 24px;
          }

          .role-selection-grid {
            grid-template-columns: 1fr;
          }

          .demo-buttons {
            grid-template-columns: 1fr;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .earnings-overview {
            grid-template-columns: 1fr;
          }

          .butler-services-grid {
            grid-template-columns: 1fr;
          }

          .trust-reputation-section .reputation-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {!isAuthenticated ? (
        <AuthView />
      ) : (
        <>
          <NavBar />
          
          {currentView === 'home' && <HomeView />}
          {currentView === 'discover' && <DiscoverView />}
          {currentView === 'butler-detail' && <ButlerDetailView />}
          {currentView === 'bookings' && <BookingsView />}
          {currentView === 'connections' && <ConnectionsView />}
          {currentView === 'profile' && <ProfileView />}
          {currentView === 'dashboard' && <ButlerDashboardView />}

          {showBookingModal && <BookingModal />}
        </>
      )}
    </div>
  );
};

export default BlockButlerApp;
