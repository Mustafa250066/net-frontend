const getShortAlt = (text) => {
  if (!text) return "";

  return text.length > 20 ? text.slice(0, 19) + "..." : text;
};

export default getShortAlt;