import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import convertToDirectUrl from "@/lib/convert";
import getShortAlt from "@/lib/fallback";
import formatDuration from "@/lib/formatDuration";

const ShowDetailPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeSeason, setActiveSeason] = useState("");

  useEffect(() => {
    fetchShowDetails();
  }, [showId]);

  const fetchShowDetails = async () => {
    try {
      const [showRes, seasonsRes] = await Promise.all([
        axios.get(`${API}/shows/${showId}`),
        axios.get(`${API}/seasons?show_id=${showId}`),
      ]);

      setShow(showRes.data);
      const sortedSeasons = seasonsRes.data.sort(
        (a, b) => a.season_number - b.season_number,
      );
      setSeasons(sortedSeasons);

      if (sortedSeasons.length > 0) {
        setActiveSeason(sortedSeasons[0].id);
      }

      const episodesData = {};
      for (const season of sortedSeasons) {
        const episodesRes = await axios.get(
          `${API}/episodes?season_id=${season.id}`,
        );
        episodesData[season.id] = episodesRes.data.sort(
          (a, b) => a.episode_number - b.episode_number,
        );
      }
      setEpisodes(episodesData);
    } catch (error) {
      console.error("Error fetching show details:", error);
      toast.error("Failed to load show details");
    } finally {
      setLoading(false);
    }
  };

  const getFirstEpisodeId = () => {
    if (seasons.length > 0 && episodes[seasons[0].id]?.length > 0) {
      return episodes[seasons[0].id][0].id;
    }
    return null;
  };

  const handleWatchShow = () => {
    const firstEpId = getFirstEpisodeId();
    if (firstEpId) {
      navigate(`/watch/${firstEpId}`);
    } else {
      toast.info("No episodes available to play yet.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-xl text-center">Loading...</div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-xl text-center">Show not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white w-full overflow-x-hidden">
      {/* --- NETFLIX STYLE HERO BANNER --- */}
      <div className="relative h-[75vh] sm:h-[85vh] w-full overflow-hidden bg-[#0a0a0a]">
        {show.poster_url && (
          <div className="absolute inset-0">
            <img
              src={convertToDirectUrl(show.poster_url)}
              alt={getShortAlt(show.name)}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          </div>
        )}

        <Button
          onClick={() => navigate("/")}
          variant="ghost"
          className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 bg-[#e50914] backdrop-blur-sm text-white hover:bg-[#e50914db] hover:text-white shrink-0"
        >
          <ArrowLeft className="mr-2 h-5 w-5 shrink-0" /> Back
        </Button>

        {/* Hero Content - min-w-0 lazmi hai flex items mein taake text shrink ho sakay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 max-w-7xl mx-auto w-full z-10 pb-12 sm:pb-20">
          <div className="max-w-2xl lg:max-w-3xl space-y-4 w-full min-w-0">

            <div className="flex items-center gap-2">
              <span className="text-[#e50914] font-bold tracking-wider text-xs sm:text-sm uppercase drop-shadow-md line-clamp-1 break-all sm:break-words">
                Series
              </span>
            </div>

            {/* Title with break-all for extreme strings */}
            <h1
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-2xl line-clamp-2 break-all sm:break-words leading-tight w-full"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {show.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm sm:text-base font-medium text-gray-300 drop-shadow-md">
              <span className="text-green-500 font-bold shrink-0">New</span>
              <span className="shrink-0">
                {seasons.length} {seasons.length === 1 ? "Season" : "Seasons"}
              </span>
              <span className="px-1.5 py-0.5 border border-gray-500 rounded text-xs text-gray-400 font-bold shrink-0">
                HD
              </span>
            </div>

            {show.description && (
              <p className="text-sm sm:text-base md:text-lg text-gray-200 drop-shadow-md line-clamp-3 break-all sm:break-words leading-relaxed w-full">
                {show.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row pt-4 sm:pt-6 w-full sm:w-max mt-2 shrink-0">
              <Button
                onClick={handleWatchShow}
                className="w-full sm:w-auto h-12 sm:h-14 bg-[#e50914] hover:bg-[#f40612] text-sm sm:text-base md:text-lg font-bold px-6 sm:px-8 rounded-md transition-all duration-300 flex justify-center items-center gap-2 shadow-lg hover:shadow-[#e50914]/30 hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-current shrink-0" />
                <span>Play</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* --- NETFLIX STYLE SEASONS & EPISODES SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full min-w-0">
        {seasons.length === 0 ? (
          <div className="text-center py-20 px-4">
            <p className="text-gray-400 text-lg line-clamp-2 break-words">No seasons available yet</p>
          </div>
        ) : (
          <div className="w-full min-w-0">
            {/* Header & Season Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 w-full min-w-0">
              <h2 className="text-2xl sm:text-3xl font-bold line-clamp-2 break-all sm:break-words">Episodes</h2>

              <Select value={activeSeason} onValueChange={setActiveSeason}>
                {/* Trigger styling: Force child span to wrap and clamp */}
                <SelectTrigger className="w-full sm:w-[250px] bg-[#1a1a1a] border-gray-700 text-white shrink-0 min-w-0 [&>span]:line-clamp-1 [&>span]:break-all [&>span]:whitespace-normal h-auto min-h-[40px] py-2">
                  <SelectValue placeholder="Select Season" />
                </SelectTrigger>

                <SelectContent className="bg-[#1a1a1a] border-gray-700 text-white max-w-[95vw] sm:max-w-md">
                  {seasons.map((season) => (
                    // SelectItem styling: Allow wrapping and clamping
                    <SelectItem key={season.id} value={season.id} className="w-full min-w-0">
                      <div className="line-clamp-2 break-all sm:break-words whitespace-normal text-left">
                        Season {season.season_number}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Episode List for Active Season */}
            <div className="flex flex-col gap-4 w-full min-w-0">
              {episodes[activeSeason]?.map((episode, index) => (
                <div
                  key={episode.id}
                  onClick={() => navigate(`/watch/${episode.id}`)}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 border-b border-gray-800 hover:bg-[#1a1a1a] rounded-lg cursor-pointer transition-colors group w-full min-w-0 overflow-hidden"
                >

                  {/* Thumbnail */}
                  <div className="relative w-full sm:w-40 md:w-48 aspect-video rounded-md overflow-hidden shrink-0 bg-gray-900">
                    {episode.thumbnail_url ? (
                      <img
                        src={convertToDirectUrl(episode.thumbnail_url)}
                        alt={`Episode ${episode.episode_number}`}
                        className="w-full h-full object-cover group-hover:opacity-70 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        <Play className="w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-[#e50914]" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 p-2 rounded-full border border-white">
                        <Play className="w-6 h-6 text-white fill-white shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Info (Title, Desc) */}
                  <div className="flex-1 min-w-0 w-full overflow-hidden">
                    <div className="flex justify-between items-start gap-2 mb-1 w-full min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 break-all sm:break-words flex-1 min-w-0">
                        <span className="sm:hidden text-gray-400 mr-2 shrink-0">
                          {episode.episode_number}.
                        </span>
                        {episode.title
                          ? `Episode ${episode.episode_number} - ${episode.title.length > 40 ? episode.title.slice(0, 40) + "..." : episode.title}`
                          : `Episode ${episode.episode_number}`}
                      </h3>
                      {episode.duration && (
                        <span className="text-gray-400 text-sm font-medium shrink-0 mt-1 sm:mt-0 whitespace-nowrap">
                          {Math.floor(episode.duration)}m
                        </span>
                      )}
                    </div>
                    {episode.description && (
                      <p className="text-gray-400 text-sm sm:text-base line-clamp-3 sm:line-clamp-2 break-all sm:break-words leading-relaxed w-full">
                        {episode.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {(!episodes[activeSeason] ||
                episodes[activeSeason].length === 0) && (
                  <div className="text-center py-12 bg-[#111] rounded-lg border border-gray-800 px-4 w-full">
                    <p className="text-gray-500 line-clamp-2 break-words">
                      Episodes coming soon for this season.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowDetailPage;