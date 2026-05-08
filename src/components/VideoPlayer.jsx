import React, { useState, useEffect, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function VideoPlayer({ url }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Helper to detect YouTube URL
  const isYouTubeUrl = (link) => {
    if (!link) return false;
    const trimmed = link.trim();
    return trimmed.includes('youtube.com') || trimmed.includes('youtu.be');
  };

  const isYouTube = isYouTubeUrl(url);

  useEffect(() => {
    const handleFullscreenChange = async () => {
      const isFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      setIsFullscreen(isFs);
      
      if (isFs) {
        if (window.screen && screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock("landscape");
          } catch (err) {
            console.log("Screen orientation lock failed:", err);
          }
        }
      } else {
        if (window.screen && screen.orientation && screen.orientation.unlock) {
          try {
            screen.orientation.unlock();
          } catch (err) {
            console.log("Screen orientation unlock failed:", err);
          }
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    let timeoutId;
    const updateScale = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Agar YouTube hai toh scale default 1 rahega
        if (isYouTube) {
          setScale(1);
          return;
        }

        const width = isFullscreen 
          ? window.innerWidth 
          : (containerRef.current ? containerRef.current.offsetWidth : 0);
        const height = isFullscreen
          ? window.innerHeight
          : (containerRef.current ? containerRef.current.offsetHeight : 0);
        
        if (width > 0 && height > 0) {
          const MIN_W = 1280;
          const MIN_H = 720;
          
          if (width < MIN_W || height < MIN_H) {
            const s = Math.min(width / MIN_W, height / MIN_H);
            setScale(s);
          } else {
            setScale(1);
          }
        } else {
          setScale(1);
        }
      }, 100);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [isFullscreen, isYouTube, url]);

  if (!url) return null;

  const getEmbedUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();

    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = trimmed.match(youtubeRegex);
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?controls=1&rel=0&modestbranding=1&playsinline=1`;
    }

    const driveIDPatterns = [
      /\/d\/([a-zA-Z0-9_-]{25,50})/,
      /[?&]id=([a-zA-Z0-9_-]{25,50})/,
      /\/file\/d\/([a-zA-Z0-9_-]{25,50})/
    ];

    let driveId = "";
    for (const pattern of driveIDPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        driveId = match[1];
        break;
      }
    }

    if (driveId) {
      return `https://drive.google.com/file/d/${driveId}/preview`;
    }

    return trimmed;
  };

  const embedUrl = getEmbedUrl(url);
  const isDirectVideo = /\.(mp4|webm|ogg|mov|avi|mkv|m3u8)(\?|$)/i.test(embedUrl);
  
  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden sm:rounded-xl shadow-lg relative group">
      <style>{`
        /* Default scaling rules for non-youtube players (like Google Drive) */
        .scaled-iframe {
          width: ${scale < 1 ? (100 / scale) + '%' : '100%'} !important;
          height: ${scale < 1 ? (100 / scale) + '%' : '100%'} !important;
          transform: ${scale < 1 ? `scale(${scale})` : 'none'} !important;
          transform-origin: top left !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border: 0 !important;
        }

        /* YouTube specific overriding rules to keep it responsive and native */
        ${isYouTube ? `
          .scaled-iframe {
            transform: none !important;
            zoom: 1 !important;
            width: 100% !important;
            height: 100% !important;
          }
        ` : ''}

        /* Browser zoom support targeting non-youtube links */
        @supports (zoom: 1) {
          .scaled-iframe {
            ${!isYouTube ? `
              transform: none !important;
              width: 100% !important;
              height: 100% !important;
              zoom: ${scale < 1 ? scale : 1} !important;
            ` : ''}
          }
        }
      `}</style>
      
      {isDirectVideo ? (
        <video
          className="w-full h-full absolute inset-0"
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          style={{ objectFit: 'contain', backgroundColor: '#000' }}
        >
          <source src={embedUrl} />
          Your browser does not support the video tag.
        </video>
      ) : (
        <iframe
          src={embedUrl}
          className="scaled-iframe"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      )}
    </div>
  );
}