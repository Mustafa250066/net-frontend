import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, getUserSession } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";
import convertToDirectUrl from "../lib/convert";
import getShortAlt from "@/lib/fallback";
import formatDuration from "@/lib/formatDuration";

const MovieDetailPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showName, setShowName] = useState(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      setMovie(null);
      setRelatedMovies([]);
      try {
        const res = await axios.get(`${API}/movies/${movieId}`);
        const currentMovie = res.data;
        setMovie(currentMovie);

        if (currentMovie.show_id) {
          const relatedRes = await axios.get(
            `${API}/movies?show_id=${currentMovie.show_id}`,
          );
          // Filter out the current movie from the list of related movies
          const otherMovies = relatedRes.data.filter(
            (m) => m.id !== currentMovie.id,
          );
          const showRes = await axios.get(
            `${API}/shows/${currentMovie.show_id}`,
          );
          setShowName(showRes.data.name);
          setRelatedMovies(otherMovies);
        }
      } catch (error) {
        console.error("Error loading movie:", error);
        toast.error("Failed to load movie details");
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieId]);

  const handleWatch = (id) => {
    const userSession = getUserSession();
    // In a real app, you might check for subscription or age rating here.
    // For now, we'll just navigate.
    navigate(`/watch/${id}?type=movie`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Movie not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* --- NETFLIX STYLE HEADER --- */}
      <div className="relative h-[75vh] sm:h-[85vh] w-full overflow-hidden bg-[#0a0a0a]">
        {/* Background Image with Dual Gradients */}
        {(movie.poster_url || movie.thumbnail_url) && (
          <div className="absolute inset-0">
            <img
              src={convertToDirectUrl(movie.poster_url || movie.thumbnail_url)}
              alt={getShortAlt(movie.title)}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          </div>
        )}

        {/* Back Button */}
        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-black/80 backdrop-blur-sm text-white hover:bg-white hover:text-black"
        >
          <ArrowLeft className="mr-2 h-5 w-5 " /> Back
        </Button>

        {/* Main Content Container */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 max-w-7xl mx-auto w-full z-10 pb-12 sm:pb-20">
          <div className="max-w-2xl lg:max-w-3xl space-y-4">
            {/* Show / Franchise Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[#e50914] font-bold tracking-wider text-xs sm:text-sm uppercase drop-shadow-md line-clamp-1 break-words">
                {showName ? showName : "Franchise Movie"}
              </span>
            </div>

            {/* Movie Title */}
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-2xl line-clamp-2 break-words leading-tight"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {movie.title}
            </h1>

            <div className="flex items-center gap-3 text-sm sm:text-base font-medium text-gray-300 drop-shadow-md  line-clamp-1 break-words">
              {movie.duration && (
                <span className="line-clamp-1 break-words">
                  {formatDuration(movie.duration)}
                </span>
              )}
              <span className="px-1.5 py-0.5 border border-[#EFBF04] rounded text-xs text-[#EFBF04]  font-bold  line-clamp-1 break-words">
                HD
              </span>
            </div>

            {/* Movie Description */}
            {movie.description && (
              <p className="text-sm sm:text-base md:text-lg text-gray-200 drop-shadow-md line-clamp-3 break-words leading-relaxed max-w-2xl">
                {movie.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex pt-4 sm:pt-6 w-full sm:w-max mt-2">
              <Button
                onClick={() => handleWatch(movie.id)}
                className="w-full sm:w-auto h-12 sm:h-14 bg-[#e50914] hover:bg-[#f40612] text-sm sm:text-base md:text-lg font-bold px-6 sm:px-8 rounded-md transition-all duration-300 flex justify-center items-center gap-2 shadow-lg hover:shadow-[#e50914]/30 hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-current shrink-0" />
                <span>Play</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Movies Section */}
      {relatedMovies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-8 break-words line-clamp-1">
            More in this Collection
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedMovies.map((relatedMovie) => (
              <div
                key={relatedMovie.id}
                onClick={() => navigate(`/movie/${relatedMovie.id}`)}
                className="rounded-lg overflow-hidden bg-[#1a1a1a] group cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden">
                  {relatedMovie.poster_url || relatedMovie.thumbnail_url ? (
                    <img
                      src={convertToDirectUrl(
                        relatedMovie.poster_url || relatedMovie.thumbnail_url,
                      )}
                      alt={getShortAlt(relatedMovie.title)}
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
                  <h4 className="font-semibold text-sm truncate">
                    {relatedMovie.title}
                  </h4>
                  {relatedMovie.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2  break-words">
                      {relatedMovie.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetailPage;
