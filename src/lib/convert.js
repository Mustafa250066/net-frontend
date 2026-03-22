export default function convertToDirectUrl(url) {
  if (!url) return url;
  const trimmed = url.trim();

  // Google Drive
  let driveId = '';
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const driveIdMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  if (driveMatch) {
    driveId = driveMatch[1];
  } else if (driveIdMatch) {
    driveId = driveIdMatch[1];
  }

  if (driveId && (trimmed.includes("drive.google.com") || trimmed.includes("docs.google.com") || trimmed.includes("googleusercontent.com"))) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1000`;
  }

  // Dropbox
  if (trimmed.includes("dropbox.com")) {
    return trimmed.replace("dl=0", "dl=1").replace("www.dropbox.com", "dl.dropboxusercontent.com");
  }

  // OneDrive / SharePoint embed link
  if (trimmed.includes("1drv.ms") || trimmed.includes("onedrive.live.com") || trimmed.includes("sharepoint.com")) {
    // Convert share link to direct download
    if (trimmed.includes("onedrive.live.com")) {
      return trimmed.replace("/redir?", "/download?").replace("resid=", "resid=");
    }
    // For 1drv.ms short links, try appending download param
    return trimmed.includes("?") ? `${trimmed}&download=1` : `${trimmed}?download=1`;
  }

  // Imgur: convert page URL to direct image
  // e.g. https://imgur.com/abc123 → https://i.imgur.com/abc123.jpg
  const imgurMatch = trimmed.match(/imgur\.com\/(?:a\/)?([a-zA-Z0-9]+)$/);
  if (imgurMatch && !trimmed.includes("i.imgur.com")) {
    return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
  }

  // Postimg.cc
  const postimgMatch = trimmed.match(/postimg\.cc\/([a-zA-Z0-9]+)/);
  if (postimgMatch) {
    return `https://i.postimg.cc/${postimgMatch[1]}/image.jpg`;
  }

  // ImgBB viewer → direct
  if (trimmed.includes("ibb.co/") && !trimmed.includes("i.ibb.co")) {
    return trimmed.replace("ibb.co/", "i.ibb.co/") + "/image.jpg";
  }

  return trimmed;
};