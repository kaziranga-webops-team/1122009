/**
 * The poster wall on the homepage: frames kept for posters made by members
 * and designers. A slot with no `src` shows as reserved. To hang a poster,
 * put the file in /public/images/posters and fill in `src` and `artist`.
 */
export type Poster = {
  title: string;
  artist?: string;
  src?: string;
  alt?: string;
};

export const POSTERS: Poster[] = [{ title: "Kaziranga" }, { title: "Aarohan" }, { title: "Meetups across India" }];
