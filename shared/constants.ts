// Interest tags for user profiles
export const INTEREST_TAGS = [
  "Chill Music",
  "Talkative", 
  "Quiet",
  "Foodie",
  "Gym Rat",
  "Gamer",
  "Podcasts",
  "Bookworm",
  "Open to Chat",
  "Napper",
  "Country Music",
  "EDM",
  "No Music",
  "Study Vibes",
  "Political Junkie",
  "Anime Fan",
  "Religious",
  "Night Owl",
  "Early Bird",
  "Nature Lover",
  "Roadtrip Vibes",
  "Spotify DJ",
  "Dog Person",
  "Cat Person",
  "Meme Lord",
  "Drama-Free",
  "Outgoing",
  "Introvert",
  "Binge-Watcher",
  "UF Football"
] as const;

export type InterestTag = typeof INTEREST_TAGS[number];

export const MAX_INTEREST_TAGS = 5;