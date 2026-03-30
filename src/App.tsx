/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Video, 
  FileText, 
  Settings, 
  Activity, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Download, 
  RefreshCw, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Camera,
  Mic,
  StopCircle,
  Play,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Types
type View = 'dashboard' | 'upload' | 'webcam' | 'report' | 'settings';
type AnalysisStatus = 'idle' | 'uploading' | 'processing' | 'completed';
type Verdict = 'DECEPTIVE' | 'TRUTHFUL';

interface Feature {
  name: string;
  category: 'Video' | 'Audio';
  value: string | number;
  importance: number;
  contribution: 'High' | 'Medium' | 'Low';
}

// Constants
const PIPELINE_STEPS = [
  { id: 'decoding', label: 'Video Decoding' },
  { id: 'extraction', label: 'Frame Extraction' },
  { id: 'openface', label: 'OpenFace Analysis' },
  { id: 'audio', label: 'Audio Separation' },
  { id: 'mfcc', label: 'MFCC Extraction' },
  { id: 'fusion', label: 'Feature Fusion' },
  { id: 'prediction', label: 'Prediction Engine' },
];

const VIDEO_FEATURES = [
  'Gaze Direction (Left/Right)',
  'Head Pose (Pitch, Yaw, Roll)',
  'Action Unit AU4 (Brow Lowerer)',
  'Action Unit AU7 (Lid Tightener)',
  'Action Unit AU12 (Lip Corner Puller)',
  'Action Unit AU17 (Chin Raiser)',
  'Action Unit AU23 (Lip Tightener)',
  'Blink Rate',
  'Eye Aspect Ratio',
  'Facial Asymmetry Index',
];

const AUDIO_FEATURES = [
  'MFCC-1 (Energy)',
  'MFCC-2',
  'MFCC-3',
  'MFCC-4',
  'MFCC-5',
  'Pitch Mean',
  'Pitch Variance',
  'Speaking Rate',
  'Voice Tremor Index',
  'Silence Ratio',
];

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Feature; direction: 'asc' | 'desc' } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Webcam state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulated analysis
  const startAnalysis = async () => {
    setStatus('processing');
    setCurrentStep(0);
    setProgress(0);
    setLogs(['[INFO] Loading video stream...']);
    setVerdict(null);

    const runStep = async (stepIdx: number) => {
      if (stepIdx >= PIPELINE_STEPS.length) {
        completeAnalysis();
        return;
      }

      setCurrentStep(stepIdx);
      const step = PIPELINE_STEPS[stepIdx];
      
      // Simulate step logs
      const stepLogs = [
        `[INFO] Starting ${step.label}...`,
        `[INFO] ${step.label} in progress...`,
      ];
      
      if (step.id === 'openface') stepLogs.push('[INFO] Detected 68 facial landmarks per frame');
      if (step.id === 'mfcc') stepLogs.push('[INFO] Computing MFCC features (n_mfcc=40)');
      if (step.id === 'prediction') stepLogs.push('[INFO] Running prediction model...');

      for (const log of stepLogs) {
        setLogs(prev => [...prev, log]);
        await new Promise(r => setTimeout(r, 400));
      }

      setProgress(((stepIdx + 1) / PIPELINE_STEPS.length) * 100);
      await new Promise(r => setTimeout(r, 600));
      runStep(stepIdx + 1);
    };

    runStep(0);
  };

  const completeAnalysis = () => {
    const isDeceptive = Math.random() > 0.5;
    const conf = 75 + Math.random() * 20;
    
    setVerdict(isDeceptive ? 'DECEPTIVE' : 'TRUTHFUL');
    setConfidence(conf);
    setLogs(prev => [...prev, '[DONE] Analysis complete.']);
    setStatus('completed');

    // Generate random features
    const newFeatures: Feature[] = [
      ...VIDEO_FEATURES.map(name => ({
        name,
        category: 'Video' as const,
        value: (Math.random() * 2 - 1).toFixed(2),
        importance: Math.random(),
        contribution: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low' as any
      })),
      ...AUDIO_FEATURES.map(name => ({
        name,
        category: 'Audio' as const,
        value: (Math.random() * 100).toFixed(1) + (name.includes('Hz') ? ' Hz' : ''),
        importance: Math.random(),
        contribution: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low' as any
      }))
    ];
    setFeatures(newFeatures);
  };

  const resetAnalysis = () => {
    setStatus('idle');
    setSelectedFile(null);
    setVerdict(null);
    setLogs([]);
    setProgress(0);
    setCurrentStep(0);
  };

  // Webcam logic
  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      
      // Audio visualization setup
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(mediaStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      drawWaveform();
    } catch (err) {
      console.error('Error accessing webcam:', err);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      // In a real app, we'd use MediaRecorder here
    } else {
      setIsRecording(false);
      stopWebcam();
      startAnalysis();
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `rgb(0, 212, 255)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    }
  };

  // Charts data
  const videoChartData = useMemo(() => ({
    labels: VIDEO_FEATURES,
    datasets: [{
      label: 'Importance Score',
      data: features.filter(f => f.category === 'Video').map(f => f.importance),
      backgroundColor: 'rgba(0, 212, 255, 0.6)',
      borderColor: 'rgba(0, 212, 255, 1)',
      borderWidth: 1,
    }]
  }), [features]);

  const audioChartData = useMemo(() => ({
    labels: AUDIO_FEATURES,
    datasets: [{
      label: 'Importance Score',
      data: features.filter(f => f.category === 'Audio').map(f => f.importance),
      backgroundColor: 'rgba(255, 165, 0, 0.6)',
      borderColor: 'rgba(255, 165, 0, 1)',
      borderWidth: 1,
    }]
  }), [features]);

  const confidenceChartData = useMemo(() => ({
    datasets: [{
      data: [confidence, 100 - confidence],
      backgroundColor: [
        verdict === 'DECEPTIVE' ? '#ff4444' : '#00ff88',
        '#30363d'
      ],
      borderWidth: 0,
      cutout: '80%',
    }]
  }), [confidence, verdict]);

  // Table logic
  const filteredFeatures = useMemo(() => {
    let result = features.filter(f => 
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [features, searchTerm, sortConfig]);

  const handleSort = (key: keyof Feature) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const downloadReport = () => {
    const report = {
      verdict,
      confidence: confidence.toFixed(2) + '%',
      timestamp: new Date().toISOString(),
      features: features.map(f => ({ name: f.name, value: f.value, importance: f.importance }))
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UDDS_Report_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-udds-card border-r border-udds-border flex flex-col z-40 transition-transform duration-300 lg:relative lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center justify-between border-b border-udds-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-udds-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,212,255,0.3)]">
              <Shield className="text-udds-bg w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">UDDS</h1>
              <p className="text-[10px] text-udds-accent font-mono uppercase tracking-widest">Forensic AI</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-udds-text-muted hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            onClick={() => { setActiveView('dashboard'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={<Upload size={20} />} 
            label="Upload Analysis" 
            active={activeView === 'upload'} 
            onClick={() => { setActiveView('upload'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={<Video size={20} />} 
            label="Live Webcam" 
            active={activeView === 'webcam'} 
            onClick={() => { setActiveView('webcam'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Feature Report" 
            active={activeView === 'report'} 
            onClick={() => { setActiveView('report'); setIsSidebarOpen(false); }} 
          />
          <div className="pt-4 mt-4 border-t border-udds-border">
            <SidebarItem 
              icon={<Settings size={20} />} 
              label="Settings" 
              active={activeView === 'settings'} 
              onClick={() => { setActiveView('settings'); setIsSidebarOpen(false); }} 
            />
          </div>
        </nav>

        <div className="p-4 border-t border-udds-border">
          <div className="bg-udds-bg rounded-lg p-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-udds-truthful animate-pulse" />
            <span className="text-xs font-mono text-udds-text-muted uppercase tracking-wider">System Ready</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-udds-bg">
        <div className="scanline" />
        
        {/* Header */}
        <header className="sticky top-0 z-10 bg-udds-bg/80 backdrop-blur-md border-b border-udds-border p-4 lg:p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 bg-udds-card border border-udds-border rounded-lg text-udds-accent hover:bg-udds-border/50 transition-all"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg lg:text-2xl font-bold text-white tracking-tight">
                {activeView === 'dashboard' && 'Unified Deception Detection System'}
                {activeView === 'upload' && 'Video Upload Analysis'}
                {activeView === 'webcam' && 'Live Biometric Capture'}
                {activeView === 'report' && 'Detailed Feature Analysis'}
                {activeView === 'settings' && 'System Configuration'}
              </h2>
              <p className="text-udds-text-muted text-[10px] lg:text-sm">
                {activeView === 'dashboard' && 'Real-time forensic analysis and deception modeling.'}
                {activeView === 'upload' && 'Analyze pre-recorded video files for deceptive markers.'}
                {activeView === 'webcam' && 'Real-time capture and analysis via camera and microphone.'}
                {activeView === 'report' && 'Comprehensive breakdown of extracted biometric features.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-udds-text-muted uppercase font-mono tracking-widest">Analysis Engine</p>
              <p className="text-xs font-mono text-udds-accent">v2.4.1-FORENSIC</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-udds-border flex items-center justify-center border border-udds-border hover:border-udds-accent transition-colors cursor-pointer">
              <Activity size={16} className="text-udds-accent lg:size-[18px]" />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Input Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card title="Video Upload" icon={<Upload size={18} />}>
                    <div 
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer",
                        selectedFile ? "border-udds-accent bg-udds-accent/5" : "border-udds-border hover:border-udds-text-muted"
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="video/*" 
                        onChange={handleFileSelect} 
                      />
                      {selectedFile ? (
                        <>
                          <div className="w-16 h-16 bg-udds-accent/20 rounded-full flex items-center justify-center">
                            <Video className="text-udds-accent w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                            <p className="text-udds-text-muted text-xs">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-udds-border rounded-full flex items-center justify-center">
                            <Upload className="text-udds-text-muted w-8 h-8" />
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium">Drag & drop video file</p>
                            <p className="text-udds-text-muted text-xs">MP4, MOV, AVI, WEBM</p>
                          </div>
                        </>
                      )}
                    </div>
                    <button 
                      disabled={!selectedFile || status !== 'idle'}
                      onClick={startAnalysis}
                      className="w-full mt-6 py-3 bg-udds-accent text-udds-bg font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {status === 'processing' ? <Loader2 className="animate-spin" /> : <Play size={18} />}
                      Begin Analysis
                    </button>
                  </Card>

                  <Card title="Live Webcam" icon={<Camera size={18} />}>
                    <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-udds-border group">
                      {!stream ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 bg-udds-border rounded-full flex items-center justify-center">
                            <Camera className="text-udds-text-muted w-8 h-8" />
                          </div>
                          <button 
                            onClick={startWebcam}
                            className="px-6 py-2 bg-udds-border text-white rounded-lg hover:bg-udds-border/80 transition-all border border-udds-border"
                          >
                            Start Webcam
                          </button>
                        </div>
                      ) : (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline
                            muted 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <div className={cn("w-2 h-2 rounded-full", isRecording ? "bg-red-500 animate-pulse" : "bg-udds-truthful")} />
                            <span className="text-[10px] font-mono text-white uppercase tracking-wider">
                              {isRecording ? `Recording ${Math.floor(recordingTime / 60)}:${(recordingTime % 60).toString().padStart(2, '0')}` : 'Live Feed'}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 h-12 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 overflow-hidden">
                            <canvas ref={canvasRef} className="w-full h-full" width={400} height={48} />
                          </div>
                        </>
                      )}
                    </div>
                    <button 
                      disabled={!stream || status !== 'idle'}
                      onClick={toggleRecording}
                      className={cn(
                        "w-full mt-6 py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                        isRecording 
                          ? "bg-udds-deceptive text-white hover:opacity-90" 
                          : "bg-udds-accent text-udds-bg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isRecording ? <StopCircle size={18} /> : <Play size={18} />}
                      {isRecording ? 'Stop & Analyze' : 'Start Capture'}
                    </button>
                  </Card>
                </div>

                {/* Processing Section */}
                {(status === 'processing' || status === 'completed') && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                  >
                    <div className="lg:col-span-2 space-y-8">
                      <Card title="Analysis Pipeline" icon={<Activity size={18} />}>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {PIPELINE_STEPS.map((step, idx) => {
                              const isComplete = idx < currentStep || status === 'completed';
                              const isProcessing = idx === currentStep && status === 'processing';
                              return (
                                <div 
                                  key={step.id}
                                  className={cn(
                                    "p-3 rounded-lg border transition-all flex flex-col gap-2",
                                    isComplete ? "border-udds-truthful/30 bg-udds-truthful/5" : 
                                    isProcessing ? "border-udds-accent bg-udds-accent/10 animate-pulse" : 
                                    "border-udds-border bg-udds-bg"
                                  )}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className={cn("text-[10px] font-mono uppercase tracking-wider", isComplete ? "text-udds-truthful" : isProcessing ? "text-udds-accent" : "text-udds-text-muted")}>
                                      Step 0{idx + 1}
                                    </span>
                                    {isComplete ? <CheckCircle2 size={12} className="text-udds-truthful" /> : 
                                     isProcessing ? <Loader2 size={12} className="text-udds-accent animate-spin" /> : 
                                     <div className="w-2 h-2 rounded-full bg-udds-border" />}
                                  </div>
                                  <p className={cn("text-xs font-medium", isComplete || isProcessing ? "text-white" : "text-udds-text-muted")}>
                                    {step.label}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-udds-text-muted">Overall Progress</span>
                              <span className="text-udds-accent">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-2 bg-udds-border rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-udds-accent shadow-[0_0_10px_rgba(0,212,255,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      <Card title="System Logs" icon={<Activity size={18} />}>
                        <div className="bg-black/50 rounded-lg p-4 h-48 overflow-y-auto font-mono text-[10px] space-y-1 border border-udds-border">
                          {logs.map((log, i) => (
                            <div key={i} className={cn(
                              log.includes('[DONE]') ? "text-udds-truthful" : 
                              log.includes('[INFO]') ? "text-udds-accent" : "text-udds-text-muted"
                            )}>
                              <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                              {log}
                            </div>
                          ))}
                          {status === 'processing' && <div className="text-udds-accent animate-pulse">_</div>}
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-8">
                      <AnimatePresence>
                        {status === 'completed' && (
                          <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <Card title="Analysis Result" icon={<Shield size={18} />}>
                              <div className="flex flex-col items-center text-center gap-6 py-4">
                                <div className="relative w-48 h-48">
                                  <Doughnut 
                                    data={confidenceChartData} 
                                    options={{ 
                                      plugins: { legend: { display: false }, tooltip: { enabled: false } },
                                      maintainAspectRatio: false,
                                      cutout: '80%'
                                    }} 
                                  />
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-white">{confidence.toFixed(1)}%</span>
                                    <span className="text-[10px] text-udds-text-muted uppercase tracking-widest">Confidence</span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h3 className={cn(
                                    "text-4xl font-black tracking-tighter italic",
                                    verdict === 'DECEPTIVE' ? "text-udds-deceptive" : "text-udds-truthful"
                                  )}>
                                    {verdict}
                                  </h3>
                                  <p className="text-xs text-udds-text-muted max-w-[200px]">
                                    Biometric markers indicate a high probability of {verdict?.toLowerCase()} behavior.
                                  </p>
                                </div>

                                <div className="w-full space-y-3 pt-4 border-t border-udds-border">
                                  <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                                    <span className="text-udds-deceptive">Deceptive</span>
                                    <span className="text-udds-truthful">Truthful</span>
                                  </div>
                                  <div className="h-3 bg-udds-border rounded-full overflow-hidden flex">
                                    <div 
                                      className="h-full bg-udds-deceptive transition-all duration-1000" 
                                      style={{ width: verdict === 'DECEPTIVE' ? `${confidence}%` : `${100 - confidence}%` }} 
                                    />
                                    <div 
                                      className="h-full bg-udds-truthful transition-all duration-1000" 
                                      style={{ width: verdict === 'TRUTHFUL' ? `${confidence}%` : `${100 - confidence}%` }} 
                                    />
                                  </div>
                                </div>

                                <div className="flex gap-3 w-full">
                                  <button 
                                    onClick={resetAnalysis}
                                    className="flex-1 py-2 bg-udds-border text-white text-xs font-bold rounded-lg hover:bg-udds-border/80 transition-all flex items-center justify-center gap-2"
                                  >
                                    <RefreshCw size={14} />
                                    Re-Analyze
                                  </button>
                                  <button 
                                    onClick={downloadReport}
                                    className="flex-1 py-2 bg-udds-accent text-udds-bg text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                  >
                                    <Download size={14} />
                                    Report
                                  </button>
                                </div>
                                
                                <p className="text-[9px] text-udds-text-muted italic opacity-50">
                                  * This result is generated by a simulated model for demonstration purposes.
                                </p>
                              </div>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

                {/* Charts Section */}
                {status === 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                  >
                    <Card title="Video Feature Importance" icon={<Activity size={18} />}>
                      <div className="h-80">
                        <Bar 
                          data={videoChartData} 
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                              y: { grid: { display: false }, ticks: { color: '#c9d1d9', font: { size: 10 } } }
                            }
                          }} 
                        />
                      </div>
                    </Card>
                    <Card title="Audio Feature Importance" icon={<Activity size={18} />}>
                      <div className="h-80">
                        <Bar 
                          data={audioChartData} 
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                              x: { grid: { color: '#30363d' }, ticks: { color: '#8b949e' } },
                              y: { grid: { display: false }, ticks: { color: '#c9d1d9', font: { size: 10 } } }
                            }
                          }} 
                        />
                      </div>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeView === 'report' && (
              <motion.div 
                key="report"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <Card title="Feature Extraction Report" icon={<FileText size={18} />}>
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                      <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-udds-text-muted" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search features..." 
                          className="w-full bg-udds-bg border border-udds-border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-udds-accent transition-all"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <button 
                        onClick={downloadReport}
                        className="px-4 py-2 bg-udds-accent text-udds-bg text-sm font-bold rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-udds-border rounded-lg">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-udds-bg border-b border-udds-border">
                          <tr>
                            <TableHeader label="Feature Name" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
                            <TableHeader label="Category" sortKey="category" currentSort={sortConfig} onSort={handleSort} />
                            <TableHeader label="Value" sortKey="value" currentSort={sortConfig} onSort={handleSort} />
                            <TableHeader label="Importance" sortKey="importance" currentSort={sortConfig} onSort={handleSort} />
                            <TableHeader label="Contribution" sortKey="contribution" currentSort={sortConfig} onSort={handleSort} />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-udds-border">
                          {filteredFeatures.length > 0 ? (
                            filteredFeatures.map((f, i) => (
                              <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-medium text-white">{f.name}</td>
                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    f.category === 'Video' ? "bg-udds-accent/10 text-udds-accent" : "bg-orange-500/10 text-orange-500"
                                  )}>
                                    {f.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-xs">{f.value}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-udds-border rounded-full overflow-hidden">
                                      <div className="h-full bg-udds-accent" style={{ width: `${f.importance * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-mono w-8">{f.importance.toFixed(2)}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                    f.contribution === 'High' ? "bg-udds-deceptive/10 text-udds-deceptive" : 
                                    f.contribution === 'Medium' ? "bg-yellow-500/10 text-yellow-500" : 
                                    "bg-udds-text-muted/10 text-udds-text-muted"
                                  )}>
                                    {f.contribution}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-udds-text-muted italic">
                                No features found matching your search.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {(activeView === 'upload' || activeView === 'webcam' || activeView === 'settings') && (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-udds-card rounded-full flex items-center justify-center border border-udds-border">
                  <AlertCircle size={40} className="text-udds-text-muted" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Section Under Development</h3>
                  <p className="text-udds-text-muted">Please use the Dashboard for the full end-to-end simulation.</p>
                </div>
                <button 
                  onClick={() => setActiveView('dashboard')}
                  className="px-6 py-2 bg-udds-accent text-udds-bg font-bold rounded-lg hover:opacity-90 transition-all"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sub-components
function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
        active 
          ? "bg-udds-accent text-udds-bg shadow-[0_0_15px_rgba(0,212,255,0.2)]" 
          : "text-udds-text-muted hover:text-white hover:bg-white/5"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-udds-bg" : "text-udds-accent")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function Card({ title, icon, children, className }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("bg-udds-card border border-udds-border rounded-2xl overflow-hidden shadow-xl", className)}>
      <div className="px-6 py-4 border-b border-udds-border flex items-center gap-3 bg-white/5">
        <span className="text-udds-accent">{icon}</span>
        <h3 className="font-bold text-sm text-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

function TableHeader({ label, sortKey, currentSort, onSort }: { label: string, sortKey: keyof Feature, currentSort: any, onSort: (key: any) => void }) {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className="px-4 py-3 cursor-pointer group hover:bg-white/5 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-udds-text-muted group-hover:text-white transition-colors">
          {label}
        </span>
        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronUp size={10} className={cn(isActive && currentSort.direction === 'asc' ? "text-udds-accent" : "text-udds-text-muted")} />
          <ChevronDown size={10} className={cn(isActive && currentSort.direction === 'desc' ? "text-udds-accent" : "text-udds-text-muted")} />
        </div>
      </div>
    </th>
  );
}
