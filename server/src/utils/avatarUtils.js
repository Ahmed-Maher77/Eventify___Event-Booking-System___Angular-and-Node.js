const buildInitials = (name = "") => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "US";
  }

  if (words.length === 1) {
    const word = words[0].toUpperCase();
    return (word.slice(0, 2) || "US").padEnd(2, "S");
  }

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};



const buildFallbackAvatarUrl = (name = "") => {
  const initials = buildInitials(name);
  const encodedName = encodeURIComponent(initials);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=E7C873&color=1A1A1A&bold=true`;
};

export { buildInitials, buildFallbackAvatarUrl };
