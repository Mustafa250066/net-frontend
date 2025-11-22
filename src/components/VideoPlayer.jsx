import React from "react";

export default function VideoPlayer({ url }) {
  if (!url) return null;

  const getEmbedUrl = (url) => {
    // YouTube
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const youtubeMatch = url.match(youtubeRegex);
    if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;

    // Google Drive
    const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
    const driveMatch = url.match(driveRegex);
    if (driveMatch) return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;

    // fallback (direct video URL)
    return url;
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
