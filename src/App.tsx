import { useState, useEffect, useRef } from 'react';
import * as faceapi from "face-api.js";
import './App.css';

type Expressions = {
  angry: number
  disgusted: number
  fearful: number
  happy: number
  neutral: number
  sad: number
  surprised: number
}

const videoOptions = [
  { label: "Trump's Oval Office Address: Immigration and the \"humanitarian and national security crisis\" at the border", src: "/videos/trump.mp4", date: "01-08-2019" },
  { label: "Biden's Oval Office Address: The Defense of Democracy Is More Important Than Any Title", src: "/videos/biden.mp4", date: "07-24-2024" },
];


export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [expressions, setExpressions] = useState<Expressions>({ angry: 0.0, disgusted: 0.0, fearful: 0.0, happy: 0.0, neutral: 0.0, sad: 0.0, surprised: 0.0 });

  const [currentVideo, setCurrentVideo] = useState(videoOptions[0].src);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSrc = e.target.value;
    setCurrentVideo(newSrc);

    // Optional: reset video playback
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  };


  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      console.log("Models loaded");
    };

    loadModels();
  }, []);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    const handleLoaded = () => {
      setVideoReady(true);
      console.log("Video ready: ", video.videoWidth, video.videoHeight);
    }

    video.addEventListener("loadedmetadata", handleLoaded);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
    }
  }, []);


let lastDetectionTime = 0;

const runDetectionLoop = async () => {
  const video = videoRef.current;
  const canvas = canvasRef.current;

  if (!video || !canvas) return;
  if (video.paused || video.ended) return;

  const now = Date.now();
  if (now - lastDetectionTime > 1000) {
    lastDetectionTime = now;

    const detection = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (detection) {
      // console.log(detection.expressions);
      // const { width: videoWidth, height: videoHeight } = video;
      // canvas.width = videoWidth;
      // canvas.height = videoHeight;

      // console.log(canvas.width, canvas.height)

      const scaleX = canvas.width / video.videoWidth;
      const scaleY = canvas.height / video.videoHeight;

      const box = detection.detection.box;
      const rectWidth = box.width * scaleX * 0.75;   // narrower
      const rectHeight = box.height * scaleY * 1.25; // taller

      ctx.strokeStyle = "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        box.x * scaleX + (box.width * scaleX - rectWidth) / 2, // center horizontally
        box.y * scaleY - (rectHeight - box.height * scaleY) / 2, // extend above and below
        rectWidth,
        rectHeight
      );

      // Label top expression
      const topExp = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1])[0];
      if (topExp) {
        ctx.fillStyle = "lime";
        ctx.font = "10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";       // Y coordinate is the top of the text
        ctx.fillText(
          `${topExp[0]} ${(topExp[1] * 100).toFixed(1)}%`,
          box.x * scaleX + (box.width * scaleX) / 2,                 // same horizontal center as box
          box.y * scaleY - (rectHeight - box.height * scaleY) / 2 + rectHeight + 2 // below the rectangle
        );
      }
      setExpressions(detection.expressions as Expressions);
    }
  }

  animationRef.current = requestAnimationFrame(runDetectionLoop);
};


useEffect(() => {
  if (!modelsLoaded || !videoReady) return;

  const video = videoRef.current;
  if (!video) return;

  const handlePlay = () => {
    runDetectionLoop();
  };

  video.addEventListener("play", handlePlay);

  return () => {
    video.removeEventListener("play", handlePlay);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
}, [modelsLoaded, videoReady]);


//https://turboscribe.ai/downloader/youtube/mp4

  return (
    <main className="h-screen flex flex-col items-center justify-center">
      <section className="flex items-center justify-center">
        <article className="h-[366px] w-[640px] border-4 border-gray-300 relative">
          <video ref={videoRef} src={currentVideo} controls crossOrigin="anonymous" />
          <canvas ref={canvasRef} className="h-[285px] w-[628px] absolute top-[2px] left-[2px]" />
        </article>

        <aside className="h-[366px] border-t-4 border-r-4 border-b-4 border-gray-300 rounded-tr-lg rounded-br-lg pl-4 pr-4 pt-2 pb-2">
          {Object.entries(expressions).map(([emotion, value]) => (
            <div key={emotion} className="w-64 pb-3">
              <div className="flex justify-between text-base">
                <span className="capitalize">{emotion}</span>
                <span>{(value * 100).toFixed(1)}%</span>
              </div>

              <div className="w-full rounded h-2 mt-1 bg-blue-500">
                <div className="rounded bg-orange-500 h-2 transition-all duration-200" style={{ width: `${value * 100}%` }}/>
              </div>
            </div>
          ))}
        </aside>
      </section>  
      <header className="w-full text-center mt-2">
        <select
          value={currentVideo}
          onChange={handleChange}
          className="border px-2 py-1 rounded"
        >
          {videoOptions.map((video) => (
            <option key={video.src} value={video.src}>
              {video.label}
            </option>
          ))}
        </select>
      </header>
    </main>
  )
}
