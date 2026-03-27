export default function convertToDirectUrl(url) {
  if (typeof url !== 'string' || !url) return url;
  const trimmed = url.trim();

  // Google Drive ID Extraction
  let driveId = '';
  
  // Robust Drive Regex (handles /d/ID, ?id=ID, uc?id=ID, and reversed params)
  const driveIDPatterns = [
    /\/d\/([a-zA-Z0-9_-]{25,50})/,
    /[?&]id=([a-zA-Z0-9_-]{25,50})/,
    /\/file\/d\/([a-zA-Z0-9_-]{25,50})/
  ];

  for (const pattern of driveIDPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      driveId = match[1];
      break;
    }
  }
  
  // If not found, try raw ID check
  if (!driveId && trimmed.length >= 25 && trimmed.length <= 50 && !trimmed.includes("/") && !trimmed.includes(".") && !trimmed.includes("http")) {
    driveId = trimmed;
  }

  if (driveId && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com") || driveId === trimmed)) {
    // lh3.googleusercontent.com/d/ID is currently the most stable way to embed Drive images
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  // YouTube Thumbnail
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = trimmed.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://img.youtube.com/vi/${youtubeMatch[1]}/maxresdefault.jpg`;
  }

  // Dropbox
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace("dl=0", "dl=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
  }

  // OneDrive / SharePoint embed link
  if (trimmed.includes("1drv.ms") || trimmed.includes("onedrive.live.com") || trimmed.includes("sharepoint.com")) {
    if (trimmed.includes("onedrive.live.com")) {
      return trimmed.replace("/redir?", "/download?").replace("resid=", "resid=");
    }
    return trimmed.includes("?") ? `${trimmed}&download=1` : `${trimmed}?download=1`;
  }

  // Imgur: convert page URL to direct image
  const imgurMatch = trimmed.match(/imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)/);
  if (imgurMatch && !trimmed.includes("i.imgur.com")) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Postimg.cc
  if (trimmed.includes("postimg.cc")) {
    const postimgMatch = trimmed.match(/postimg\.cc\/([a-zA-Z0-9]+)/);
    if (postimgMatch) return `https://i.postimg.cc/${postimgMatch[1]}/image.jpg`;
  }

  // ImgBB
  if (trimmed.includes("ibb.co/") && !trimmed.includes("i.ibb.co")) {
    const ibbMatch = trimmed.match(/ibb\.co\/([a-zA-Z0-9]+)/);
    if (ibbMatch) {
      return `https://i.ibb.co/${ibbMatch[1]}/image.jpg`;
    }
  }

  return trimmed;
}

