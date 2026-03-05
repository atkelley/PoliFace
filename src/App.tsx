import { useState, useEffect, useRef } from 'react';
import * as faceapi from "face-api.js";
import type { Expressions } from './assets/types';
import { VIDEO_OPTIONS, DEFAULT_EXPRESSIONS, DEFAULT_MODELS_URL } from './assets/constants';


export default function App() {
  const lastDetectionTime = useRef(0);
  const animationRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [expressions, setExpressions] = useState<Expressions>(DEFAULT_EXPRESSIONS);
  const [currentVideo, setCurrentVideo] = useState(VIDEO_OPTIONS[0]);


  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {   
    setCurrentVideo(VIDEO_OPTIONS.filter((video) => video.id == e.target.value)[0]);
    setExpressions(DEFAULT_EXPRESSIONS);

    const ctx = canvasRef.current?.getContext("2d");
    if (canvasRef.current) {
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  
  const handleLoaded = () => {
    setVideoReady(true);
  }


  const loadModels = async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(DEFAULT_MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(DEFAULT_MODELS_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(DEFAULT_MODELS_URL),
    ]);

    setModelsLoaded(true);
  };


  useEffect(() => {
    loadModels();

    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("loadedmetadata", handleLoaded);
    return () => { video.removeEventListener("loadedmetadata", handleLoaded); }
  }, []);

  
  useEffect(() => {
    if (!modelsLoaded || !videoReady) return;

    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("play", runDetectionLoop);

    return () => {
      video.removeEventListener("play", runDetectionLoop);

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [modelsLoaded, videoReady]);


  const runDetectionLoop = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) return;

    const now = Date.now();
    if (now - lastDetectionTime.current > 1000) {
      lastDetectionTime.current = now;

      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height); // clears canvas even when no face detected (instead of moving inside the detection check below)

      if (detection) {
        const box = detection.detection.box;

        const scaleX = canvas.width / video.videoWidth;
        const scaleY = canvas.height / video.videoHeight;
        const rectWidth = box.width * scaleX * 0.75;   // 0.75 for narrower
        const rectHeight = box.height * scaleY * 1.25; // 1.25 for taller

        ctx.strokeStyle = "lime";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          box.x * scaleX + (box.width * scaleX - rectWidth) / 2, // center horizontally
          box.y * scaleY - (rectHeight - box.height * scaleY) / 2, // extend above and below
          rectWidth,
          rectHeight
        );

        // label expression below box
        const topExp = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1])[0]; // "top" expression is top-RATED expression
        if (topExp) {
          ctx.fillStyle = "lime";
          ctx.font = "10px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "top";       // y-coordinate is the top of the text
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


  return (
    <main className="h-screen flex justify-center mt-20">
      <section className="flex-col items-center justify-center">
        <header className="w-64 text-left border-t-4 border-r-4 border-l-4 border-gray-300 rounded-t-lg">
          <select
            value={currentVideo.id}
            onChange={handleChange}
            className="w-full border px-2 py-1 rounded bg-[#242424]"
          >
            {VIDEO_OPTIONS.map((video) => (
              <option key={video.src} value={video.id}>{video.label}</option>
            ))}
          </select>
        </header>

        <div className="flex items-center justify-center">
          <div className="h-91.5 w-160 border-4 border-gray-300 relative">
            <video ref={videoRef} src={currentVideo.src} controls crossOrigin="anonymous" className="h-89.5 w-159" />
            <canvas ref={canvasRef} className="h-71.25 w-157 absolute top-0.5 left-0.5" />
          </div>

          <aside className="h-91.5 border-t-4 border-r-4 border-b-4 border-gray-300 rounded-tr-lg rounded-br-lg pl-4 pr-4 pt-2 pb-2">
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
        </div>

        <article className="w-160 text-left p-4 border-b-4 border-r-4 border-l-4 border-gray-300 rounded-b-lg">
          <p>{currentVideo.description}</p>
        </article>
      </section> 
    </main>
  )
}
