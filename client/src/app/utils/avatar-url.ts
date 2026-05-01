export function resolveAvatarUrl(displayName: string, pictureUrl?: string | null): string {
  const trimmedPictureUrl = pictureUrl?.trim();
  if (trimmedPictureUrl) {
    return trimmedPictureUrl;
  }

  const safeName = displayName.trim() || 'Eventify User';
  const encodedName = encodeURIComponent(safeName);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=E7C873&color=1A1A1A&bold=true`;
}
