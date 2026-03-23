import React from "react";

export default function VideoPlayer({ url }) {
  if (!url) return null;

  const getEmbedUrl = (url) => {
    if (!url) return "";
    const trimmed = url.trim();

    // YouTube
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = trimmed.match(youtubeRegex);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    // Google Drive
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

    // fallback (direct video URL)
    return trimmed;
  };



  return (
    <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
      <iframe
        src={getEmbedUrl(url)}
        className="w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      />
    </div>
  );
}
