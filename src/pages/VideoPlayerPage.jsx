import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { API, getUserSession } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import formatDuration from "@/lib/formatDuration";

const VideoPlayerPage = () => {
  const { episodeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [episode, setEpisode] = useState(null);
  const [showData, setShowData] = useState(null); // Combine Show/Collection data
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);

  const progressInterval = useRef(null);

  // detect type
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get("type"); // "movie" or null

  useEffect(() => {
    setLoading(true);
    fetchDetails();

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [episodeId]);

  const fetchDetails = async () => {
    try {
      if (type === "movie") {
        // ----- MOVIE MODE -----
        const movieRes = await axios.get(`${API}/movies/${episodeId}`);
        const movie = movieRes.data;

        let fetchedShowName = null;

        // Exactly copying logic from MovieDetailPage
        if (movie.show_id) {
          try {
            const showRes = await axios.get(`${API}/shows/${movie.show_id}`);
            fetchedShowName = showRes.data.name;
          } catch (err) {
            console.error("Error loading collection name:", err);
          }
        }

        setEpisode(movie);
        setShowData({
          name: fetchedShowName,
          isMovie: true,
        });
      } else {
        // ----- EPISODE MODE -----
        const episodeRes = await axios.get(`${API}/episodes/${episodeId}`);
        const ep = episodeRes.data;
        setEpisode(ep);

        // Fetch Season Episodes for prev/next navigation
        try {
          const episodesRes = await axios.get(`${API}/episodes?season_id=${ep.season_id}`);
          const sortedEps = episodesRes.data.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
          setSeasonEpisodes(sortedEps);
        } catch (err) {
          console.error("Error loading season episodes:", err);
        }

        // BUG FIX: Fetch Show and Seasons securely (Matching your app's structure)
        try {
          const showRes = await axios.get(`${API}/shows/${ep.show_id}`);
          const seasonsRes = await axios.get(`${API}/seasons?show_id=${ep.show_id}`);

          // Current season ko array mein se dhoondo
          const currentSeason = seasonsRes.data.find(s => s.id === ep.season_id);

          setShowData({
            name: showRes.data.name,
            season_number: currentSeason ? currentSeason.season_number : "",
            isMovie: false,
          });
        } catch (err) {
          console.error("Error loading show/season details:", err);
          // Fallback incase of API error
          setShowData({
            name: "TV Series",
            season_number: "",
            isMovie: false,
          });
        }

        // Load saved progress
        const userSession = getUserSession();
        const progressRes = await axios.get(
          `${API}/watch-progress/${userSession}/${episodeId}`,
        );

        if (progressRes.data.progress > 0 && videoRef.current) {
          videoRef.current.currentTime = progressRes.data.progress;
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load video");
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPlay = () => {
    if (type === "movie") return; // movies don't save progress

    progressInterval.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(videoRef.current.currentTime);
      }
    }, 5000);
  };

  const handleVideoPause = () => {
    if (progressInterval.current) clearInterval(progressInterval.current);

    if (videoRef.current && type !== "movie") {
      saveProgress(videoRef.current.currentTime);
    }
  };

  const saveProgress = async (currentTime) => {
    try {
      const userSession = getUserSession();
      await axios.post(`${API}/watch-progress`, {
        user_session: userSession,
        episode_id: episodeId,
        progress: currentTime,
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-lg sm:text-xl flex items-center gap-3">
          <div className="w-6 h-6 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin"></div>
          Loading video...
        </div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <p className="text-white text-xl mb-4">Video not found</p>
        <Button
          onClick={() => navigate(-1)}
          variant="outline"
          className="border-gray-700 hover:bg-white hover:text-black"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* ----- FLOATING BUTTONS ----- */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          data-testid="back-to-show-btn"
          onClick={() =>
            type === "movie"
              ? navigate(-1)
              : navigate(`/show/${episode.show_id}`)
          }
          variant="ghost"
          className="bg-[#e50914] backdrop-blur-sm text-white hover:bg-[#e50914db] hover:text-white"
        >
          <ArrowLeft className="mr-2" />
          Back
        </Button>

        <Button
          data-testid="toggle-info-btn"
          onClick={() => setShowInfo(!showInfo)}
          variant="ghost"
          className="bg-black/80 backdrop-blur-sm text-white hover:bg-white hover:text-black"
        >
          <Info className="mr-2" />
          Info
        </Button>
      </div>

      {/* ----- VIDEO PLAYER ----- */}

      <h2
          className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-2 sm:mb-3 line-clamp-2 break-all sm:break-words drop-shadow-lg flex items-start sm:items-center gap-2 sm:gap-3 leading-tight mt-20 ml-4"
          style={{ fontFamily: "Space Grotesk, sans-serif" }}
        >
          {type === "movie" ? (
            episode.title
          ) : (
            <>
              <span>
                {episode.title
                  ? `Episode ${episode.episode_number} - ${episode.title.length > 40 ? episode.title.slice(0, 40) + "..." : episode.title}`
                  : `Episode ${episode.episode_number}`}
              </span>
            </>
          )}
        </h2>

      <div className="max-w-7xl mx-auto my-12 py-6 px-4 sm:px-6 lg:px-8">
        <VideoPlayer
          key={episodeId}
          ref={videoRef}
          url={episode.video_url}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
        />

        {/* Navigation Buttons */}
        {type !== "movie" && seasonEpisodes.length > 1 && (
          <div className="flex flex-row justify-between items-center gap-4 mt-8 sm:mt-12 px-2 sm:px-0">
            {/* Previous Button Container */}
            <div className="flex-1 flex justify-start">
              {(() => {
                const currentIndex = seasonEpisodes.findIndex(e => e.id.toString() === episodeId?.toString());
                const prevEp = currentIndex > 0 ? seasonEpisodes[currentIndex - 1] : null;
                if (prevEp) {
                  return (
                    <Button
                      onClick={() => {
                        navigate(`/watch/${prevEp.id}`);
                        window.scrollTo(0, 0);
                      }}
                      variant="ghost"
                      className="group flex items-center gap-2 sm:gap-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 px-3 sm:px-6 h-12 sm:h-16 rounded-xl sm:rounded-2xl min-w-0 max-w-full sm:max-w-[300px]"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover:-translate-x-1 transition-transform shrink-0" />
                      <div className="text-left min-w-0 overflow-hidden hidden xs:block">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-500 group-hover:text-[#e50914] transition-colors leading-none mb-1 truncate">Previous</p>
                        <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                          {prevEp.episode_number}. {prevEp.title || `Episode ${prevEp.episode_number}`}
                        </p>
                      </div>
                      {/* Mobile Label */}
                      <span className="xs:hidden text-xs font-bold uppercase tracking-widest">Prev</span>
                    </Button>
                  );
                }
                return null;
              })()}
            </div>

            {/* Next Button Container */}
            <div className="flex-1 flex justify-end">
              {(() => {
                const currentIndex = seasonEpisodes.findIndex(e => e.id.toString() === episodeId?.toString());
                const nextEp = currentIndex !== -1 && currentIndex < seasonEpisodes.length - 1 ? seasonEpisodes[currentIndex + 1] : null;
                if (nextEp) {
                  return (
                    <Button
                      onClick={() => {
                        navigate(`/watch/${nextEp.id}`);
                        window.scrollTo(0, 0);
                      }}
                      variant="ghost"
                      className="group flex items-center justify-end gap-2 sm:gap-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all duration-300 px-3 sm:px-6 h-12 sm:h-16 rounded-xl sm:rounded-2xl min-w-0 max-w-full sm:max-w-[300px]"
                    >
                      <div className="text-right min-w-0 overflow-hidden hidden xs:block">
                        <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-gray-500 group-hover:text-[#e50914] transition-colors leading-none mb-1 truncate">Next Episode</p>
                        <p className="text-xs sm:text-sm font-semibold truncate leading-tight">
                          {nextEp.episode_number}. {nextEp.title || `Episode ${nextEp.episode_number}`}
                        </p>
                      </div>
                      {/* Mobile Label */}
                      <span className="xs:hidden text-xs font-bold uppercase tracking-widest">Next</span>
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform shrink-0" />
                    </Button>
                  );
                }
                return null;
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ----- PREMIUM INFO OVERLAY ----- */}
      {showInfo && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-32 pb-8 px-4 sm:px-8 z-40 animate-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-7xl mx-auto flex flex-col justify-end min-w-0">
            <div className="flex flex-col max-w-3xl min-w-0">
              {/* Top Badge (Franchise or Show Name + Season) */}
              <div className="flex items-center gap-2 mb-2">
                {type === "movie" ? (
                  <span className="text-[#e50914] font-bold tracking-wider text-xs sm:text-sm uppercase drop-shadow-md line-clamp-1 break-all sm:break-words">
                    {showData?.name ? showData.name : "Franchise Movie"}
                  </span>
                ) : (
                  <span className="text-[#e50914] font-bold tracking-wider text-xs sm:text-sm uppercase drop-shadow-md line-clamp-1 break-all sm:break-words">
                    {showData?.name}
                  </span>
                )}
              </div>

              {/* Title Rendering (Movie Title OR Episode Title Matching ShowDetailPage logic) */}
              <h2
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-2 sm:mb-3 line-clamp-2 break-all sm:break-words drop-shadow-lg flex items-start sm:items-center gap-2 sm:gap-3 leading-tight"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                {type === "movie" ? (
                  episode.title
                ) : (
                  <>
                    <span>
                      {episode.title
                        ? `Episode ${episode.episode_number} - ${episode.title.length > 40 ? episode.title.slice(0, 40) + "..." : episode.title}`
                        : `Episode ${episode.episode_number}`}
                    </span>
                  </>
                )}
              </h2>

              {/* Meta Info Row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-gray-300 drop-shadow-md mb-3 sm:mb-4">
                {/* Specific Meta for Episodes */}
                {type !== "movie" && showData?.season_number && (
                  <span className="text-white shrink-0 font-bold bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10">
                    Season {showData.season_number}
                  </span>
                )}

                {/* Duration */}
                {episode.duration && (
                  <span className="shrink-0 flex items-center gap-1 font-bold">
                    <PlayCircle className="w-4 h-4 text-gray-400" />
                    {type === "movie"
                      ? formatDuration(episode.duration)
                      : `${Math.floor(episode.duration)}m`}
                  </span>
                )}

                {/* HD Badge */}
                <span className="px-1.5 py-0.5 border border-gray-500 rounded text-xs text-gray-400 font-bold shrink-0">
                  HD
                </span>
              </div>

              {/* Description */}
              {episode.description && (
                <p className="text-sm sm:text-base md:text-lg text-gray-200 line-clamp-3 break-all sm:break-words leading-relaxed max-w-2xl drop-shadow-md">
                  {episode.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPage;