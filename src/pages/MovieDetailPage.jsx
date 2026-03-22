import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API, getUserSession } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play } from "lucide-react";
import { toast } from "sonner";

const convertToDirectUrl = (url) => {
  if (!url) return url;
  const trimmed = url.trim();

  // Google Drive
  let driveId = '';
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveMatch) {
    driveId = driveMatch[1];
  } else if (driveIdMatch) {
    driveId = driveIdMatch[1];
  }

  if (driveId && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com") || trimmed.includes("googleusercontent.com"))) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  // Dropbox
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace("dl=0", "dl=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
  }

  // OneDrive / SharePoint embed link
  if (trimmed.includes("1drv.ms") || trimmed.includes("onedrive.live.com") || trimmed.includes("sharepoint.com")) {
    // Convert share link to direct download
    if (trimmed.includes("onedrive.live.com")) {
      return trimmed.replace("/redir?", "/download?").replace("resid=", "resid=");
    }
    // For 1drv.ms short links, try appending download param
    return trimmed.includes("?") ? `${trimmed}&download=1` : `${trimmed}?download=1`;
  }

  // Imgur: convert page URL to direct image
  // e.g. https://imgur.com/abc123 → https://i.imgur.com/abc123.jpg
  const imgurMatch = trimmed.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)$/);
  if (imgurMatch && !trimmed.includes("i.imgur.com")) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Postimg.cc
  const postimgMatch = trimmed.match(/postimg\.cc\/([a-zA-Z0-9]+)/);
  if (postimgMatch) {
    return `https://i.postimg.cc/${postimgMatch[1]}/image.jpg`;
  }

  // ImgBB viewer → direct
  if (trimmed.includes("ibb.co/") && !trimmed.includes("i.ibb.co")) {
    return trimmed.replace("ibb.co/", "i.ibb.co/") + "/image.jpg";
  }

  return trimmed;
};

const MovieDetailPage = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [relatedMovies, setRelatedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

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
            `${API}/movies?show_id=${currentMovie.show_id}`
          );
          // Filter out the current movie from the list of related movies
          const otherMovies = relatedRes.data.filter(
            (m) => m.id !== currentMovie.id
          );
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
      <div className="relative h-[70vh] overflow-hidden">
        {(movie.poster_url || movie.thumbnail_url) && (
          <>
            <img
              src={convertToDirectUrl(movie.poster_url || movie.thumbnail_url)}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          </>
        )}
        <div className="absolute inset-0 flex flex-col justify-end p-0 max-w-7xl mx-auto">
          <Button onClick={() => navigate("/")} variant="ghost" className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white hover:bg-white hover:text-black">
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <h1 className="text-5xl sm:text-6xl font-bold mb-4" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {movie.title}
          </h1>
          {movie.description && <p className="text-lg text-gray-300 max-w-3xl mb-6">{movie.description}</p>}
          <Button onClick={() => handleWatch(movie.id)} className="bg-[#e50914] hover:bg-[#f40612] w-fit">
            <Play className="mr-2 h-5 w-5" /> Watch Now
          </Button>
        </div>
      </div>

      {/* Related Movies Section */}
      {relatedMovies.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold mb-8">More in this Collection</h2>
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
                      src={convertToDirectUrl(relatedMovie.poster_url || relatedMovie.thumbnail_url)}
                      alt={relatedMovie.title}
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
                  <h4 className="font-semibold text-sm truncate">{relatedMovie.title}</h4>
                  {relatedMovie.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{relatedMovie.description}</p>
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
