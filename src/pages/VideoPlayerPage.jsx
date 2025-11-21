import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API, getUserSession } from '../App';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';
import { toast } from 'sonner';

const VideoPlayerPage = () => {
  const { episodeId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [episode, setEpisode] = useState(null);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const progressInterval = useRef(null);

  useEffect(() => {
    fetchEpisodeDetails();
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [episodeId]);

  const fetchEpisodeDetails = async () => {
    try {
      const episodeRes = await axios.get(`${API}/episodes/${episodeId}`);
      setEpisode(episodeRes.data);

      const showRes = await axios.get(`${API}/shows/${episodeRes.data.show_id}`);
      setShow(showRes.data);

      // Load saved progress
      const userSession = getUserSession();
      const progressRes = await axios.get(`${API}/watch-progress/${userSession}/${episodeId}`);
      if (progressRes.data.progress > 0 && videoRef.current) {
        videoRef.current.currentTime = progressRes.data.progress;
      }
    } catch (error) {
      console.error('Error fetching episode:', error);
      toast.error('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPlay = () => {
    // Save progress every 5 seconds
    progressInterval.current = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused) {
        saveProgress(videoRef.current.currentTime);
      }
    }, 5000);
  };

  const handleVideoPause = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    if (videoRef.current) {
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
      console.error('Error saving progress:', error);
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
      {/* Back Button */}
      <div className="fixed top-4 left-4 z-50 flex gap-2">
        <Button
          data-testid="back-to-show-btn"
          onClick={() => navigate(`/show/${episode.show_id}`)}
          variant="ghost"
          className="bg-black/80 backdrop-blur-sm text-white hover:bg-white hover:text-black"
        >
          <ArrowLeft className="mr-2" />
          Backing
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

      {/* Video Player */}
      <div className="relative w-full h-screen flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          data-testid="video-player"
          className="w-full h-full"
          controls
          controlsList="nodownload"
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoPause}
          src={episode.video_url}
        >
          <source src={episode.video_url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Episode Info Overlay */}
      {showInfo && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/95 to-transparent p-8 z-40">
          <div className="max-w-4xl mx-auto">
            {show && (
              <p className="text-gray-400 text-sm mb-2">{show.name}</p>
            )}
            <h2 className="text-3xl font-bold mb-2">{episode.title}</h2>
            <p className="text-gray-300 mb-4">Episode {episode.episode_number}</p>
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