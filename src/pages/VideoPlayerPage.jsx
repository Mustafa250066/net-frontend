import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { API, getUserSession } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import NetflixSpinner from "@/components/NetflixSpinner";
import formatDuration from "@/lib/formatDuration";
const slugify = (text) => {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
};

const VideoPlayerPage = () => {
  const { showSlug, seasonEpisode, movieSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [episode, setEpisode] = useState(null);
  const [showData, setShowData] = useState(null); // Combine Show/Collection data
  const [loading, setLoading] = useState(true);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);

  const progressInterval = useRef(null);

  // detect type
  const type = movieSlug ? "movie" : "show";

  useEffect(() => {
    setLoading(true);
    fetchDetails();

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [showSlug, seasonEpisode, movieSlug]);

  // --- KEYBOARD SHORTCUTS ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      const currentIndex = seasonEpisodes.findIndex(ep => ep.id.toString() === episode?.id?.toString());

      if (e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        
        if (type !== "movie" && currentIndex !== -1 && currentIndex < seasonEpisodes.length - 1) {
          const nextEp = seasonEpisodes[currentIndex + 1];
          const seasonNum = showData?.season_number || 1;
          navigate(`/watch/show/${showSlug}/${seasonNum}x${nextEp.episode_number}`);
          window.scrollTo(0, 0);
          toast.success("Skipping to next episode");
        } else {
          toast.info("No next episode available");
        }
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        
        if (type !== "movie" && currentIndex > 0) {
          const prevEp = seasonEpisodes[currentIndex - 1];
          const seasonNum = showData?.season_number || 1;
          navigate(`/watch/show/${showSlug}/${seasonNum}x${prevEp.episode_number}`);
          window.scrollTo(0, 0);
          toast.success("Going to previous episode");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [seasonEpisodes, showSlug, episode, showData, navigate, type]); 

  const fetchDetails = async () => {
    try {
      if (type === "movie") {
        // ----- MOVIE MODE -----
        const movieRes = await axios.get(`${API}/movies/${movieSlug}`);
        const movie = movieRes.data;

        let fetchedShowName = null;

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
        const match = seasonEpisode ? seasonEpisode.match(/^(\d+)x(\d+)$/) : null;
        if (!match) {
          throw new Error("Invalid seasonEpisode format");
        }
        const seasonNum = parseInt(match[1], 10);
        const episodeNum = parseInt(match[2], 10);

        // Fetch all shows to find the matching show slug
        const showsRes = await axios.get(`${API}/shows`);
        const targetShow = showsRes.data.find(s => slugify(s.name) === showSlug);
        if (!targetShow) {
          throw new Error("Show not found");
        }

        // Fetch seasons for that show
        const seasonsRes = await axios.get(`${API}/seasons?show_id=${targetShow.id}`);
        const targetSeason = seasonsRes.data.find(s => s.season_number === seasonNum);
        if (!targetSeason) {
          throw new Error("Season not found");
        }

        // Fetch episodes of that season
        const episodesRes = await axios.get(`${API}/episodes?season_id=${targetSeason.id}`);
        const targetEpisode = episodesRes.data.find(e => e.episode_number === episodeNum);
        if (!targetEpisode) {
          throw new Error("Episode not found");
        }

        setEpisode(targetEpisode);

        // Fetch Season Episodes for prev/next navigation
        const sortedEps = episodesRes.data.sort((a, b) => (a.episode_number || 0) - (b.episode_number || 0));
        setSeasonEpisodes(sortedEps);

        setShowData({
          name: targetShow.name,
          season_number: targetSeason.season_number,
          isMovie: false,
        });

        // Load saved progress
        const userSession = getUserSession();
        try {
          const progressRes = await axios.get(
            `${API}/watch-progress/${userSession}/${targetEpisode.id}`,
          );

          if (progressRes.data.progress > 0 && videoRef.current) {
            videoRef.current.currentTime = progressRes.data.progress;
          }
        } catch (err) {
          console.error("Error loading watch progress:", err);
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
    if (type === "movie") return;

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
        episode_id: episode?.id,
        progress: currentTime,
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  if (loading) {
    return <NetflixSpinner fullScreen />;
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
    <div className="min-h-screen bg-[#0f0f0f] text-white overflow-x-hidden flex flex-col">
      {/* ----- TOP NAVBAR ----- */}
      <div className="w-full p-2 sm:p-4 flex items-center bg-[#0f0f0f]">
        <Button
          data-testid="back-to-show-btn"
          onClick={() =>
            type === "movie"
              ? navigate(-1)
              : navigate(`/show/${showSlug}`)
          }
          variant="ghost"
          className="ml-2 sm:ml-6 px-4 bg-[#e50914] text-white hover:bg-[#e50914db] hover:text-white"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back
        </Button>
      </div>

      {/* ----- VIDEO PLAYER SECTION ----- */}
      <div className="w-full bg-black flex justify-center items-center border-b border-gray-800 py-0 sm:py-4">
        <div className="w-full max-w-6xl h-[280px] sm:h-[400px] md:h-[500px] lg:h-[600px] relative">
          <VideoPlayer
            key={episode?.id}
            ref={videoRef}
            url={episode.video_url}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
          />
        </div>
      </div>

      {/* ----- CONTENT BELOW VIDEO ----- */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        
        {/* Title & Info */}
        <div className="flex flex-col gap-3 sm:gap-4 mb-8">
            {/* Top Badge (Franchise or Show Name + Season) */}
            <div className="flex items-center gap-2">
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

            {/* Title Rendering */}
            <h1
              className="text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight break-words"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {type === "movie" ? (
                episode.title
              ) : (
                <>
                  <span>
                    {episode.title
                      ? `Episode ${episode.episode_number} - ${episode.title}`
                      : `Episode ${episode.episode_number}`}
                  </span>
                </>
              )}
            </h1>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-gray-300">
              {/* Specific Meta for Episodes */}
              {type !== "movie" && showData?.season_number && (
                <span className="text-white shrink-0 font-bold bg-white/10 px-2 py-0.5 rounded border border-white/10">
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
              <span className="px-1.5 py-0.5 border border-gray-600 rounded text-xs text-gray-400 font-bold shrink-0">
                HD
              </span>
            </div>

            {/* Description */}
            {episode.description && (
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl">
                {episode.description}
              </p>
            )}
        </div>

        {/* Navigation Buttons */}
        {type !== "movie" && seasonEpisodes.length > 1 && (
          <div className="flex flex-row justify-between items-center gap-4 mt-8 sm:mt-12 border-t border-gray-800 pt-8">
            {/* Previous Button Container */}
            <div className="flex-1 flex justify-start">
              {(() => {
                const currentIndex = seasonEpisodes.findIndex(e => e.id.toString() === episode?.id?.toString());
                const prevEp = currentIndex > 0 ? seasonEpisodes[currentIndex - 1] : null;
                if (prevEp) {
                  return (
                    <Button
                      onClick={() => {
                        const seasonNum = showData?.season_number || 1;
                        navigate(`/watch/show/${showSlug}/${seasonNum}x${prevEp.episode_number}`);
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
                const currentIndex = seasonEpisodes.findIndex(e => e.id.toString() === episode?.id?.toString());
                const nextEp = currentIndex !== -1 && currentIndex < seasonEpisodes.length - 1 ? seasonEpisodes[currentIndex + 1] : null;
                if (nextEp) {
                  return (
                    <Button
                      onClick={() => {
                        const seasonNum = showData?.season_number || 1;
                        navigate(`/watch/show/${showSlug}/${seasonNum}x${nextEp.episode_number}`);
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
    </div>
  );
};

export default VideoPlayerPage;