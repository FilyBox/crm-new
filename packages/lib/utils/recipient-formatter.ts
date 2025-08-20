import type { Recipient } from '@prisma/client';

export const extractInitials = (text: string) =>
  text
    .split(' ')
    .map((name: string) => name.slice(0, 1).toUpperCase())
    .slice(0, 2)
    .join('');

export const recipientAbbreviation = (recipient: Recipient) => {
  return extractInitials(recipient.name) || recipient.email.slice(0, 1).toUpperCase();
};

type enhancedAssignees = {
  name: string | null;
  email: string;
};

type enhancedArtists = {
  artistName: string | null;
};

type artistsTask = {
  name: string;
  id: number;
};

export const usereAbbreviation = (user: enhancedAssignees) => {
  return extractInitials(user.name || '') || user.email.slice(0, 1).toUpperCase();
};

export const artistAbbreviation = (artist: enhancedArtists) => {
  return extractInitials(artist.artistName || '');
};

export const artistTaskAbbreviation = (artist: artistsTask) => {
  return extractInitials(artist.name || '');
};
