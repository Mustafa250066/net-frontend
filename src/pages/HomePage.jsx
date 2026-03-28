import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Search, Lock, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import convertToDirectUrl from '../lib/convert';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import getShortAlt from "@/lib/fallback";

const HomePage = () => {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Pagination State
  const [currentShowPage, setCurrentShowPage] = useState(1);
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Refs for scrolling
  const showsRef = useRef(null);
  const moviesRef = useRef(null);

  useEffect(() => {
    fetchShows();
    fetchMovies();
  }, []);

  // Reset pagination on search
  useEffect(() => {
    setCurrentShowPage(1);
    setCurrentMoviePage(1);
  }, [searchQuery]);

  const fetchShows = async () => {
    try {
      // 1. Shows aur Seasons dono ko ek sath API se mangwayen
      const [showsResponse, seasonsResponse] = await Promise.all([
        axios.get(`${API}/shows`),
        axios.get(`${API}/seasons`)
      ]);

      // 2. Un tamaam shows ki IDs ka ek "Set" bana lein jin ka kam az kam 1 season exist karta hai
      const validShowIds = new Set(seasonsResponse.data.map(season => season.show_id));

      // 3. Sirf un Shows ko filter kar ke rakhein jo is Set mein majood hain
      const activeShows = showsResponse.data.filter(show => validShowIds.has(show.id));

      // 4. Filtered shows ko state mein set kar dein
      setShows(activeShows);
      
    } catch (error) {
      console.error('Error fetching shows:', error);
      toast.error('Failed to load shows');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMovies = async () => {
    try {
      const response = await axios.get(`${API}/movies`);
      setMovies(response.data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const filteredShows = shows.filter(show =>
    show.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredMovies = movies.filter(movie =>
    (movie.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalShowPages = Math.ceil(filteredShows.length / ITEMS_PER_PAGE);
  const totalMoviePages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);

  const paginatedShows = filteredShows.slice(
    (currentShowPage - 1) * ITEMS_PER_PAGE,
    currentShowPage * ITEMS_PER_PAGE
  );

  const paginatedMovies = filteredMovies.slice(
    (currentMoviePage - 1) * ITEMS_PER_PAGE,
    currentMoviePage * ITEMS_PER_PAGE
  );

  // Helper to render pagination items
  const renderPaginationItems = (currentPage, totalPages, setPage, scrollRef) => {
    const items = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => {
              setPage(i);
              if (scrollRef && scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            isActive={currentPage === i}
            className="cursor-pointer hover:bg-[#e50914] hover:text-white transition-colors border-gray-700"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    return items;
  };

  // Skeleton loader component
  const SkeletonCard = () => (
    <div className="animate-pulse">
      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="aspect-[2/3] bg-gradient-to-br from-gray-700 to-gray-800"></div>
        <div className="p-2 sm:p-3">
          <div className="h-3 sm:h-4 bg-gray-700 rounded w-3/4 mb-1 sm:mb-2"></div>
          <div className="h-2 sm:h-3 bg-gray-700 rounded w-full"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black overflow-x-hidden flex flex-col">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black via-gray-950 to-black">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 
              className="text-xl xs:text-2xl sm:text-3xl font-bold text-[#e50914] cursor-pointer hover:opacity-80 transition-opacity truncate"
              onClick={() => navigate('/')}
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              FlixPort
            </h1>
            
            {/* Desktop Admin Button */}
            <Button
              data-testid="admin-login-btn"
              onClick={() => navigate('/admin')}
              variant="outline"
              className="hidden sm:flex border-[#e50914] text-[#e50914] hover:bg-[#e50914] hover:text-white text-xs sm:text-sm"
            >
              <Lock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Admin
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden text-[#e50914] h-8 w-8 p-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden mt-2 p-2 pt-7 pb-5 border-t border-gray-700 animate-in slide-in-from-top-2 duration-200" style={{height:80}}>
              <Button
                onClick={() => {
                  navigate('/admin');
                  setMobileMenuOpen(false);
                }}
                variant="outline"
                className="w-full justify-center border-[#e50914] text-[#e50914] hover:bg-[#e50914] hover:text-white text-xs"
              >
                <Lock className="mr-2 h-3 w-3" />
                Admin
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content - Added flex-grow to push footer down */}
      <main className="flex-grow pt-16 xs:pt-20 sm:pt-24">
        <div className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 lg:px-8 pb-4 sm:pb-6">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-12">
            <h2 
              className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 sm:mb-4 px-1 break-words"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Unlimited <br className="hidden xs:hidden sm:hidden" /> 
              Entertainment
            </h2>
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-400 px-2 break-words">
              A world of movies and shows. Just a click away.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 sm:mb-12 px-1 xs:px-2 sm:px-0">
            <div className="relative">
              <Search className="absolute left-2 xs:left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 xs:h-4 xs:w-4 sm:h-5 sm:w-5" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 xs:pl-9 sm:pl-12 py-3 xs:py-4 sm:py-6 bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500 focus:border-[#e50914] text-xs xs:text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Shows Section */}
          <div className="space-y-4 sm:space-y-8">
            <div className="px-1 xs:px-2 sm:px-0" ref={showsRef}>
              <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 sm:mb-6 break-words">
                Browse Shows
              </h3>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 px-1 xs:px-2 sm:px-0">
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredShows.length === 0 ? (
              <div className="text-center py-8 sm:py-20">
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">No shows found</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5 xs:gap-3 sm:gap-5 px-1 xs:px-2 sm:px-0">
                  {paginatedShows.map((show) => (
                    /* Animated Wrapper */
                    <div
                      key={show.id}
                      data-testid={`show-card-${show.id}`}
                      onClick={() => navigate(`/show/${show.id}`)}
                      className="animated-border-wrapper group cursor-pointer transition-transform hover:scale-105 duration-200"
                    >
                      {/* Inner Card Content */}
                      <div className="animated-border-content flex flex-col h-full bg-[#1a1a1a]">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {show.poster_url ? (
                            <img
                              src={convertToDirectUrl(show.poster_url)}
                              alt={getShortAlt(show.name)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <Play className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#e50914]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-1.5 xs:p-2 sm:p-3 flex-grow">
                          <h4 className="font-semibold text-[10px] xs:text-xs sm:text-sm truncate" title={show.name}>
                            {show.name}
                          </h4>
                          {show.description && (
                            <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5 xs:mt-1 line-clamp-2 break-words">
                              {show.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shows Pagination */}
                {totalShowPages > 1 && (
                  <Pagination className="mt-4 sm:mt-8">
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            setCurrentShowPage(prev => Math.max(1, prev - 1));
                            if (showsRef.current) showsRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentShowPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems(currentShowPage, totalShowPages, setCurrentShowPage, showsRef)}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            setCurrentShowPage(prev => Math.min(totalShowPages, prev + 1));
                            if (showsRef.current) showsRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentShowPage === totalShowPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>

          {/* Movies Section */}
          <div className="space-y-4 sm:space-y-8 mt-6 sm:mt-12" ref={moviesRef}>
            <div className="px-1 xs:px-2 sm:px-0">
              <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 sm:mb-6 break-words">
                Browse Movies
              </h3>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 xs:gap-3 sm:gap-4 px-1 xs:px-2 sm:px-0">
                {[...Array(10)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="text-center py-8 sm:py-20">
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">No movies found</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5 xs:gap-3 sm:gap-5 px-1 xs:px-2 sm:px-0">
                  {paginatedMovies.map((movie) => (
                    /* Animated Wrapper */
                    <div
                      key={movie.id}
                      onClick={() => navigate(`/movie/${movie.id}`)}
                      className="animated-border-wrapper group cursor-pointer transition-transform hover:scale-105 duration-200"
                    >
                      {/* Inner Card Content */}
                      <div className="animated-border-content flex flex-col h-full bg-[#1a1a1a]">
                        <div className="relative aspect-[2/3] overflow-hidden">
                          {movie.poster_url || movie.thumbnail_url ? (
                            <img
                              src={convertToDirectUrl(movie.poster_url || movie.thumbnail_url)}
                              alt={getShortAlt(movie.title)}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <Play className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#e50914]" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="p-1.5 xs:p-2 sm:p-3 flex-grow">
                          <h4 className="font-semibold text-[10px] xs:text-xs sm:text-sm truncate" title={movie.title}>
                            {movie.title}
                          </h4>
                          {movie.description && (
                            <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5 xs:mt-1 line-clamp-2 break-words">
                              {movie.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Movies Pagination */}
                {totalMoviePages > 1 && (
                  <Pagination className="mt-4 sm:mt-8">
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            setCurrentMoviePage(prev => Math.max(1, prev - 1));
                            if (moviesRef.current) moviesRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentMoviePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems(currentMoviePage, totalMoviePages, setCurrentMoviePage, moviesRef)}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            setCurrentMoviePage(prev => Math.min(totalMoviePages, prev + 1));
                            if (moviesRef.current) moviesRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentMoviePage === totalMoviePages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Custom CSS */}
      <style jsx>{`
        /* The New Animated Border CSS */
        .animated-border-wrapper {
          position: relative;
          overflow: hidden;
          border-radius: 0.5rem; /* Matches Tailwind's rounded-lg */
          padding: 2px; /* This controls the thickness of the glowing border */
          background: linear-gradient(to right, #ff3333, #e50914, #8b0000); /* Theme gradient: Light Red -> Brand Red -> Dark Red */
        }
        
        
        
        .animated-border-content {
          position: relative;
          z-index: 1;
          border-radius: 0.4rem; /* Slightly smaller than outer border */
          overflow: hidden;
        }

        @keyframes border-spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }

        /* Existing CSS */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @media (min-width: 480px) {
          .xs\\:text-2xl { font-size: 1.5rem; }
          .xs\\:text-3xl { font-size: 1.875rem; }
          .xs\\:text-sm { font-size: 0.875rem; }
          .xs\\:text-base { font-size: 1rem; }
        }
        
        .break-words {
          word-wrap: break-word;
          word-break: break-word;
          hyphens: auto;
        }
        
        .overflow-x-hidden {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default HomePage;