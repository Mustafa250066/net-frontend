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
import NetflixSpinner from '@/components/NetflixSpinner';

const HomePage = () => {
  const navigate = useNavigate();
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Refs for scrolling
  const contentRef = useRef(null);

  useEffect(() => {
    fetchAllContent();
  }, []);

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchAllContent = async () => {
    try {
      setLoading(true);
      // Fetch shows, seasons, and movies concurrently
      const [showsResponse, seasonsResponse, moviesResponse] = await Promise.all([
        axios.get(`${API}/shows`),
        axios.get(`${API}/seasons`),
        axios.get(`${API}/movies`)
      ]);

      const validShowIds = new Set(seasonsResponse.data.map(season => season.show_id));
      const activeShows = showsResponse.data
        .filter(show => validShowIds.has(show.id))
        .map(show => ({ ...show, contentType: 'show' }));

      const activeMovies = moviesResponse.data.map(movie => ({ ...movie, contentType: 'movie' }));

      // Interleave shows and movies
      const mergedContent = [];
      const maxLength = Math.max(activeShows.length, activeMovies.length);
      for (let i = 0; i < maxLength; i++) {
        if (i < activeShows.length) mergedContent.push(activeShows[i]);
        if (i < activeMovies.length) mergedContent.push(activeMovies[i]);
      }

      setAllContent(mergedContent);
      
    } catch (error) {
      console.error('Error fetching content:', error);
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = allContent.filter(item => {
    const title = item.contentType === 'show' ? item.name : item.title;
    return (title || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredContent.length / ITEMS_PER_PAGE);

  const paginatedContent = filteredContent.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Helper to render pagination items
  const renderPaginationItems = (currentPage, totalPages, setPage, scrollRef) => {
    const items = [];
    
    const addPage = (pageNumber) => {
      items.push(
        <PaginationItem key={pageNumber}>
          <PaginationLink 
            onClick={() => {
              setPage(pageNumber);
              if (scrollRef && scrollRef.current) {
                scrollRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            isActive={currentPage === pageNumber}
            className="cursor-pointer hover:bg-[#e50914] hover:text-white transition-colors border-gray-700"
          >
            {pageNumber}
          </PaginationLink>
        </PaginationItem>
      );
    };

    const addEllipsis = (key) => {
      items.push(
        <PaginationItem key={`ellipsis-${key}`}>
          <PaginationEllipsis />
        </PaginationItem>
      );
    };

    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        addPage(i);
      }
    } else {
      let start = Math.max(1, currentPage - 1);
      let end = Math.min(totalPages, currentPage + 1);
      
      // Ensure we show at least 3 pages if we are at the very beginning
      if (currentPage === 1 && totalPages >= 3) {
        end = 3;
      }

      for (let i = start; i <= end; i++) {
        addPage(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          addEllipsis('end');
        }
        addPage(totalPages);
      }
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

  if (loading) {
    return <NetflixSpinner fullScreen />;
  }

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

          {/* Combined Content Section */}
          <div className="space-y-4 sm:space-y-8" ref={contentRef}>
            <div className="px-1 xs:px-2 sm:px-0">
              <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 sm:mb-6 break-words">
                Browse All
              </h3>
            </div>
            
            {filteredContent.length === 0 ? (
              <div className="text-center py-8 sm:py-20">
                <p className="text-gray-400 text-xs xs:text-sm sm:text-base md:text-lg">No content found</p>
              </div>
            ) : (
              <div className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-5 xs:gap-3 sm:gap-5 px-1 xs:px-2 sm:px-0">
                  {paginatedContent.map((item) => {
                    const isShow = item.contentType === 'show';
                    const title = isShow ? item.name : item.title;
                    const imageUrl = isShow ? item.poster_url : (item.poster_url || item.thumbnail_url);
                    const navRoute = isShow ? `/show/${item.id}` : `/movie/${item.id}`;

                    return (
                      <div
                        key={`${item.contentType}-${item.id}`}
                        data-testid={`${item.contentType}-card-${item.id}`}
                        onClick={() => navigate(navRoute)}
                        className="animated-border-wrapper group cursor-pointer transition-transform hover:scale-105 duration-200"
                      >
                        <div className="animated-border-content flex flex-col h-full bg-[#1a1a1a]">
                          <div className="relative aspect-[2/3] overflow-hidden">
                            {imageUrl ? (
                              <img
                                src={convertToDirectUrl(imageUrl)}
                                alt={getShortAlt(title)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                <Play className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#e50914]" />
                              </div>
                            )}
                            
                            {/* Type Badge */}
                            <div className="absolute top-2 right-2 bg-black/80 text-white text-[8px] xs:text-[10px] sm:text-xs px-2 py-0.5 rounded shadow z-10 backdrop-blur-sm border border-white/20 uppercase tracking-wider font-semibold">
                              {item.contentType}
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="p-1.5 xs:p-2 sm:p-3 flex-grow">
                            <h4 className="font-semibold text-[10px] xs:text-xs sm:text-sm truncate" title={title}>
                              {title}
                            </h4>
                            {item.description && (
                              <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-400 mt-0.5 xs:mt-1 line-clamp-2 break-words">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unified Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-4 sm:mt-8">
                    <PaginationContent className="flex-wrap justify-center">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => {
                            setCurrentPage(prev => Math.max(1, prev - 1));
                            if (contentRef.current) contentRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems(currentPage, totalPages, setCurrentPage, contentRef)}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => {
                            setCurrentPage(prev => Math.min(totalPages, prev + 1));
                            if (contentRef.current) contentRef.current.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer hover:bg-[#e50914] transition-colors"}
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