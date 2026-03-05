export const VIDEO_OPTIONS = [
  { 
    id: "1", 
    src: "/videos/trump.mp4", 
    label: "Trump's Oval Office Address", 
    description: `In a January 8, 2019, prime-time Oval Office address, President Donald Trump described the situation 
    at the U.S.-Mexico border as a "humanitarian and security crisis". He urged Congress to approve $5.7 billion in 
    funding for a border wall, citing the need to stop illegal drug influxes, reduce crime, and prevent the strain on public resources.` 
  },
  { 
    id: "2", 
    src: "/videos/biden.mp4", 
    label: "Biden's Oval Office Address", 
    description: `In a July 24, 2024, Oval Office address, President Biden defended democracy by announcing his decision 
    to drop out of the 2024 presidential race to "pass the torch" to a new generation. He emphasized that saving American 
    democracy outweighed personal ambition and framed the election as a critical inflection point.`
  },
];

export const DEFAULT_EXPRESSIONS = { angry: 0.0, disgusted: 0.0, fearful: 0.0, happy: 0.0, neutral: 0.0, sad: 0.0, surprised: 0.0 };
export const DEFAULT_MODELS_URL = "/models";

// to convert YT to mp4s: https://turboscribe.ai/downloader/youtube/mp4