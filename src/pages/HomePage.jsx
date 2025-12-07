import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Search, Lock } from 'lucide-react';
import { toast } from 'sonner';

const HomePage = () => {
  const navigate = useNavigate();
  const [shows, setShows] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchShows();
    fetchMovies();
  }, []);


  const fetchShows = async () => {
    try {
      const response = await axios.get(`${API}/shows`);
      setShows(response.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gradient-to-b from-black to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#e50914]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            FlixPort
          </h1>
          <Button
            data-testid="admin-login-btn"
            onClick={() => navigate('/admin')}
            variant="outline"
            className="border-[#e50914] text-[#e50914] hover:bg-[#e50914] hover:text-white"
          >
            <Lock className="mr-2 h-4 w-4" />
            Admin
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-5xl sm:text-6xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Unlimited entertainment
            </h2>
            <p className="text-lg text-gray-400">Watch anywhere. No login required.</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Search for shows and movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 bg-[#1a1a1a] border-gray-700 text-white placeholder-gray-500 focus:border-[#e50914]"
              />
            </div>
          </div>

          {/* Shows Grid */}
          <div className="space-y-8">
            <h3 className="text-2xl font-semibold mb-6">Browse Shows</h3>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="skeleton rounded-lg h-64"></div>
                ))}
              </div>
            ) : filteredShows.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg">No shows found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredShows.map((show) => (
                  <div
                    key={show.id}
                    data-testid={`show-card-${show.id}`}
                    onClick={() => navigate(`/show/${show.id}`)}
                    className="show-card rounded-lg overflow-hidden bg-[#1a1a1a] group cursor-pointer"
                  >
                    <div className="relative aspect-[2/3] overflow-hidden">
                      {show.poster_url ? (
                        <img
                          src={show.poster_url}
                          alt={show.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                          <Play className="w-12 h-12 text-[#e50914]" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-3">
                      <h4 className="font-semibold text-sm truncate">{show.name}</h4>
                      {show.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{show.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {console.log(movies)}

{/* Movies Grid */}
<div className="space-y-8">
  <h3 className="text-2xl font-semibold mb-6 mt-6">Browse Movies</h3>

  {loading ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="skeleton rounded-lg h-64"></div>
      ))}
    </div>
  ) : filteredMovies.length === 0 ? (
    <div className="text-center py-20">
      <p className="text-gray-400 text-lg">No movies found</p>
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {filteredMovies.map((movie) => (
        <div
          key={movie.id}
          onClick={() => navigate(`/movie/${movie.id}`)}
          className="rounded-lg overflow-hidden bg-[#1a1a1a] group cursor-pointer"
        >
          <div className="relative aspect-[2/3] overflow-hidden">
            {movie.poster_url || movie.thumbnail_url ? (
              <img
                src={movie.poster_url || movie.thumbnail_url}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <Play className="w-12 h-12 text-[#e50914]" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>

          <div className="p-3">
            <h4 className="font-semibold text-sm truncate">{movie.title}</h4>
            {movie.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {movie.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )}
</div>

        </div>
      </div>
    </div>
  );
};

export default HomePage;