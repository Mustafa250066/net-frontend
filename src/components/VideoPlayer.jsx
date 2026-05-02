import React, { useState, useEffect, useRef } from "react";
import { Maximize, Minimize } from "lucide-react";

export default function VideoPlayer({ url }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement || !!document.webkitFullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const updateScale = () => {
      const width = isFullscreen 
        ? window.innerWidth 
        : (containerRef.current ? containerRef.current.offsetWidth : 0);
      
      // Target safe width
      if (width < 800 && width > 0) {
        setScale(width / 800);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [isFullscreen]);

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
  
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        await containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        await containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      }
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-black overflow-hidden sm:rounded-xl shadow-lg relative group">
      <style>{`
        .scaled-iframe {
          width: ${scale < 1 ? '800px' : '100%'} !important;
          height: ${scale < 1 ? (100 / scale) + '%' : '100%'} !important;
          transform: ${scale < 1 ? `scale(${scale})` : 'none'} !important;
          transform-origin: top left !important;
          border: 0 !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
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
        <>
          <iframe
            src={embedUrl}
            className="scaled-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
          {/* Custom Fullscreen Button for iframe to bypass browser iframe-fullscreen overrides */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 left-4 z-50 p-2 bg-black/60 hover:bg-black/90 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </>
      )}
    </div>
  );
}