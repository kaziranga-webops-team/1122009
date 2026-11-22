/**
 * Historical Indian artworks used across the site. Every image is released
 * under CC0 (public domain) by the Cleveland Museum of Art's Open Access
 * programme; the files live in /public/images/heritage.
 */
export type Heritage = {
  src: string;
  title: string;
  made: string;
  where: string;
  alt: string;
  source: string;
};

const cma = (id: string) => `https://www.clevelandart.org/art/${id}`;

export const HERITAGE = {
  elephant: {
    src: "/images/heritage/elephant-mughal-c1700.webp",
    title: "Drawing of an Elephant",
    made: "c. 1700",
    where: "Mughal India",
    alt: "A fine ink drawing of a tethered elephant in profile, its tusks capped in gold",
    source: cma("1969.65"),
  },
  kamarupa: {
    src: "/images/heritage/kamarupa-parrot-c1560.webp",
    title: "The hunter offers the mother parrot to the king of Kamarupa",
    made: "c. 1560",
    where: "Mughal India, court of Akbar",
    alt: "A painted court scene: a hunter hands a green parrot to the seated king of Kamarupa, old Assam",
    source: cma("1962.279.36.b"),
  },
  hoopoe: {
    src: "/images/heritage/hoopoe-company-c1800.webp",
    title: "Hoopoe on a Citrus Tree Branch",
    made: "c. 1800",
    where: "Company school, Calcutta",
    alt: "A hoopoe with a striped crest perched on a citrus branch",
    source: cma("1990.67"),
  },
  parrot: {
    src: "/images/heritage/green-parrot-c1820.webp",
    title: "Green Parrot",
    made: "c. 1820",
    where: "East India Company school",
    alt: "A green parakeet with a black collar on a slender branch",
    source: cma("1972.285"),
  },
  waqwaq: {
    src: "/images/heritage/waqwaq-floral-fantasy.webp",
    title: "A floral fantasy of animals and birds (Waq-waq)",
    made: "early 1600s",
    where: "Mughal India",
    alt: "A painted tree whose blossoms are the heads of animals, birds flying around it, inside a gilded border",
    source: cma("2013.319"),
  },
  kantha: {
    src: "/images/heritage/kantha-east-bengal.webp",
    title: "Kantha (ceremonial quilt)",
    made: "1800s",
    where: "East Bengal",
    alt: "An embroidered quilt crowded with lotus wheels, paisleys, birds and animals in red, indigo and gold thread",
    source: cma("1960.274"),
  },
  shawl: {
    src: "/images/heritage/shawl-border-kashmir.webp",
    title: "Border of a Shawl",
    made: "c. 1825–30",
    where: "Kashmir",
    alt: "Woven paisley panels of red and green flowers on a cream ground",
    source: cma("1925.500"),
  },
  rubberTree: {
    src: "/images/heritage/rubber-tree-assam-1880s.webp",
    title: "Rubber Tree, Assam, India",
    made: "c. 1880s",
    where: "Assam",
    alt: "A sepia photograph of a giant rubber fig with buttress roots spreading over the forest floor",
    source: cma("1993.24"),
  },
} satisfies Record<string, Heritage>;

export const HERITAGE_CREDIT = "Cleveland Museum of Art, Open Access (CC0)";
