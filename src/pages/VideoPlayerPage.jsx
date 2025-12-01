import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { API, getUserSession } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";

const VideoPlayerPage = () => {
  const { episodeId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [episode, setEpisode] = useState(null); // for episode or movie
  const [show, setShow] = useState(null); // show for episodes / Movie for movies
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const progressInterval = useRef(null);

  // detect type
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get("type"); // "movie" or null

  useEffect(() => {
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

        setEpisode({
          id: movie.id,
          title: movie.title,
          description: movie.description,
          video_url: movie.video_url,
          episode_number: 1, // UI consistency
        });

        setShow({ name: "Movie" });

      } else {
        // ----- EPISODE MODE -----
        const episodeRes = await axios.get(`${API}/episodes/${episodeId}`);
        const ep = episodeRes.data;

        setEpisode(ep);

        const showRes = await axios.get(`${API}/shows/${ep.show_id}`);
        setShow(showRes.data);

        // Load saved progress
        const userSession = getUserSession();
        const progressRes = await axios.get(
          `${API}/watch-progress/${userSession}/${episodeId}`
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading video...</div>
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* ----- OLD BUTTONS (Unchanged) ----- */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          data-testid="back-to-show-btn"
          onClick={() =>
            type === "movie"
              ? navigate(-1)
              : navigate(`/show/${episode.show_id}`)
          }
          variant="ghost"
          className="bg-black/80 backdrop-blur-sm text-white hover:bg-white hover:text-black"
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
      <div className="max-w-7xl mx-auto my-8">
        <VideoPlayer
          ref={videoRef}
          url={episode.video_url}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
        />
      </div>

      {/* ----- INFO OVERLAY (UNTOUCHED) ----- */}
      {showInfo && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-8 z-40">
          <div className="max-w-4xl mx-auto">
            {show && <p className="text-gray-400 text-sm mb-2">{show.name}</p>}

            <h2 className="text-3xl font-bold mb-2">{episode.title}</h2>

            {type !== "movie" && (
              <p className="text-gray-300 mb-4">
                Episode {episode.episode_number}
              </p>
            )}

            {episode.description && (
              <p className="text-gray-400">{episode.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayerPage;
