import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../App';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ShowDetailPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState({});
  const [loading, setLoading] = useState(true);

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
      const sortedSeasons = seasonsRes.data.sort((a, b) => a.season_number - b.season_number);
      setSeasons(sortedSeasons);

      // Fetch episodes for each season
      const episodesData = {};
      for (const season of sortedSeasons) {
        const episodesRes = await axios.get(`${API}/episodes?season_id=${season.id}`);
        episodesData[season.id] = episodesRes.data.sort((a, b) => a.episode_number - b.episode_number);
      }
      setEpisodes(episodesData);
    } catch (error) {
      console.error('Error fetching show details:', error);
      toast.error('Failed to load show details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Show not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Banner */}
      <div className="relative h-[70vh] overflow-hidden">
        {show.poster_url ? (
          <>
            <img
              src={show.poster_url}
              alt={show.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black"></div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end p-8 max-w-7xl mx-auto">
          <Button
            data-testid="back-btn"
            onClick={() => navigate('/')}
            variant="ghost"
            className="absolute top-4 left-4 text-white bg-white/10 hover:bg-black/10"
          >
            <ArrowLeft className="mr-2" />
            Backing
          </Button>

          <h1 className="text-5xl sm:text-6xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {show.name}
          </h1>
          {show.description && (
            <p className="text-lg text-gray-300 max-w-3xl mb-6">{show.description}</p>
          )}
        </div>
      </div>

      {/* Episodes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8">Seasons & Episodes</h2>

        {seasons.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No seasons available yet</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {seasons.map((season) => (
              <AccordionItem
                key={season.id}
                value={season.id}
                className="bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-6 py-4 hover:bg-[#222] hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xl font-semibold">
                      Season {season.season_number}
                      {season.name && ` - ${season.name}`}
                    </span>
                    <span className="text-sm text-gray-400">
                      {episodes[season.id]?.length || 0} episodes
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <div className="space-y-3 mt-2">
                    {episodes[season.id]?.map((episode) => (
                      <div
                        key={episode.id}
                        data-testid={`episode-${episode.id}`}
                        onClick={() => navigate(`/watch/${episode.id}`)}
                        className="flex items-center gap-4 p-4 bg-[#0a0a0a] hover:bg-[#222] rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex-shrink-0 w-12 h-12 bg-[#e50914] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm">Episode {episode.episode_number}</span>
                            <span className="text-white font-medium">{episode.title}</span>
                          </div>
                          {episode.description && (
                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{episode.description}</p>
                          )}
                        </div>
                        {episode.duration && (
                          <span className="text-gray-500 text-sm">
                            {Math.floor(episode.duration / 60)}m
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default ShowDetailPage;