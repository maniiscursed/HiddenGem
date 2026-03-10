import { useState, useEffect, useMemo } from 'react'
import { Search, PlusCircle, Gem, Loader2, SlidersHorizontal } from 'lucide-react'
import axios from 'axios'
import BusinessCard from './components/Business/BusinessCard'
import BusinessDetailModal from './components/Business/BusinessDetailModal'
import AddBusinessWizard from './components/Business/AddBusinessWizard'
import DiscoveryMap from './components/Map/DiscoveryMap'
import AuthTabs from './components/Auth/AuthTabs'
import AdminDashboard from './components/Admin/AdminDashboard'
import { Toaster, toast } from 'react-hot-toast'

const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const API = 'http://localhost:8000'
const ALL_CATEGORIES = ['All', 'Food', 'Services', 'Retail', 'Health', 'Education', 'Entertainment', 'Other']

// Add Axios interceptor for JWT
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [activeTab, setActiveTab] = useState('discover')
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('Recommended') // Recommended, Highest Rated, Most Popular, Distance
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = (data) => {
    setCurrentUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.access_token);
    setShowAuth(false);
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation([latitude, longitude])
        setIsLocating(false)
      },
      (error) => {
        console.error("Error getting location", error)
        setIsLocating(false)
        alert("Unable to retrieve your location. Please check your browser permissions.")
      }
    )
  }

  const fetchBusinesses = () => {
    setLoading(true)
    axios.get(`${API}/api/businesses`)
      .then(res => setBusinesses(res.data))
      .catch(err => console.error('Failed to fetch businesses', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchBusinesses()

    // Auto-locate user on initial load
    if (navigator.geolocation && !userLocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          setIsLocating(false)
        },
        (error) => {
          console.error("Auto-location failed", error)
          setIsLocating(false)
        }
      )
    }
  }, [])

  const filteredBusinesses = useMemo(() => {
    let result = businesses.filter(biz => {
      const matchesCategory = activeCategory === 'All' || biz.category === activeCategory
      const q = searchQuery.toLowerCase()
      const matchesQuery = !q || biz.name.toLowerCase().includes(q) || biz.category.toLowerCase().includes(q) || biz.location.toLowerCase().includes(q) || biz.description.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })

    if (userLocation) {
      result = result.map(biz => ({
        ...biz,
        distance: getDistanceFromLatLonInKm(userLocation[0], userLocation[1], biz.lat, biz.lng)
      }))
    }

    if (sortBy === 'Highest Rated') {
      result.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'Most Popular') {
      result.sort((a, b) => b.reviewCount - a.reviewCount)
    } else if (sortBy === 'Distance' && userLocation) {
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return result
  }, [businesses, searchQuery, activeCategory, userLocation, sortBy])

  const handleWizardSuccess = () => {
    fetchBusinesses()
    setActiveTab('discover')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-center" />
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            className="flex items-center gap-2 text-brand-600"
            onClick={() => setActiveTab('discover')}
          >
            <Gem className="w-8 h-8 flex-shrink-0" />
            <h1 className="text-xl font-bold tracking-tight">Hidden Gem</h1>
          </button>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3 mr-2">
                <span className="text-sm font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
                  Hi, {currentUser.username}
                  {currentUser.role === 'admin' && ' (Admin)'}
                </span>
                {currentUser.role === 'admin' && (
                  <button
                    className="text-sm text-brand-600 hover:underline font-medium"
                    onClick={() => setActiveTab('admin')}
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="text-sm text-slate-600 hover:text-brand-600 font-medium px-2 mr-2 transition-colors"
              >
                Sign In
              </button>
            )}

            <button
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-full font-medium transition-colors text-sm shadow-md"
              onClick={() => {
                if (!currentUser) return setShowAuth(true);
                setActiveTab('add');
              }}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Add Business</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 flex flex-col">

        {/* ─── DISCOVER TAB ─── */}
        {activeTab === 'discover' && (
          <div className="flex flex-col gap-4 h-full">

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 sm:text-sm shadow-sm transition-shadow"
                placeholder="Find a gem… (e.g. 'late night tacos', 'bike repair')"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1.5" />
              {ALL_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${activeCategory === cat
                    ? 'bg-brand-500 text-white border-brand-500 shadow-sm shadow-brand-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Map + Sidebar Container */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col sm:flex-row min-h-[520px]">

              {/* Map Panel */}
              <div className="flex-1 relative min-h-[280px] sm:min-h-0">
                <DiscoveryMap
                  businesses={filteredBusinesses}
                  selectedBusiness={selectedBusiness}
                  onMarkerClick={biz => setSelectedBusiness(biz)}
                  userLocation={userLocation}
                  isLocating={isLocating}
                  onLocateMe={handleLocateMe}
                />
              </div>

              {/* Sidebar – Business Cards */}
              <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-800">
                    Nearby Gems
                  </h2>
                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="text-xs border-0 bg-transparent text-slate-500 font-medium focus:ring-0 cursor-pointer p-0"
                    >
                      <option>Recommended</option>
                      <option>Highest Rated</option>
                      <option>Most Popular</option>
                      {userLocation && <option>Distance</option>}
                    </select>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {filteredBusinesses.length}
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-0">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-brand-500 py-12">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Finding gems...</span>
                    </div>
                  ) : filteredBusinesses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 h-full">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300 text-3xl">
                        🔍
                      </div>
                      <p className="font-semibold text-slate-700">No gems found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search area.</p>
                      <button
                        onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
                        className="mt-4 text-sm text-brand-600 font-medium hover:text-brand-700 hover:underline"
                      >
                        Clear filters
                      </button>
                    </div>
                  ) : (
                    filteredBusinesses.map(biz => (
                      <div
                        key={biz.id}
                        className={`rounded-xl transition-all ${selectedBusiness?.id === biz.id ? 'ring-2 ring-brand-400 ring-offset-1' : ''}`}
                      >
                        <BusinessCard
                          business={biz}
                          onClick={() => setSelectedBusiness(biz)}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ADD BUSINESS TAB ─── */}
        {activeTab === 'add' && (
          <AddBusinessWizard onSuccess={handleWizardSuccess} />
        )}

        {/* ─── ADMIN TAB ─── */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard onBack={() => setActiveTab('discover')} />
        )}

      </main>

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          currentUser={currentUser}
          onRequireAuth={() => setShowAuth(true)}
        />
      )}

      {/* Auth Modal */}
      {showAuth && (
        <AuthTabs
          onClose={() => setShowAuth(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

    </div>
  )
}

export default App
