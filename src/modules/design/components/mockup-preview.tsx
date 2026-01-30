'use client';

import { cn } from '@/lib/utils';
import { Loader2, Sparkles, AlertCircle, ImageOff, Palette, ChevronLeft, History, ImagePlus } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';

import { MockupVariant } from '@/types';

interface MockupPreviewProps {
    html?: string;
    isLoading?: boolean;
    error?: string;
    className?: string;
    colors?: {
        primary: string;
        secondary: string;
        background: string;
        text: string;
        accent: string;
    };
    viewMode?: 'desktop' | 'tablet' | 'mobile';
    onColorChange?: (key: string, value: string) => void;

    // Multi-variant props
    variants?: MockupVariant[];
    activeVariantId?: string;
    mockupHistory?: MockupVariant[];
    onVariantChange?: (id: string) => void;
    onSelectionConfirm?: (variant: MockupVariant) => void;
    allImages?: any[];
    onImageSwap?: (oldSrc: string, newSrc: string) => void;
}

// Premium Holographic Loader
function HolographicLoader() {
    const [step, setStep] = useState(0);
    const steps = [
        "Initializing Neural Architects...",
        "Parsing Design DNA...",
        "Synthesizing Layout Structure...",
        "Applying Vibe Parameters...",
        "Rendering Holographic Preview..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((s) => (s + 1) % steps.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-[#050505] flex flex-col items-center justify-center overflow-hidden">
            {/* CSS for Scanline & Grid */}
            <style>{`
                @keyframes scan {
                    0% { top: -10%; opacity: 0; }
                    15% { opacity: 1; }
                    85% { opacity: 1; }
                    100% { top: 110%; opacity: 0; }
                }
                .scanline {
                    animation: scan 4s linear infinite;
                    background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5), transparent);
                }
                @keyframes grid-move {
                    0% { transform: perspective(500px) rotateX(20deg) translateY(0); }
                    100% { transform: perspective(500px) rotateX(20deg) translateY(40px); }
                }
                .holo-grid {
                    animation: grid-move 3s linear infinite;
                }
             `}</style>

            {/* Animated Grid Background */}
            <div className="absolute inset-[-50%] opacity-20 holo-grid"
                style={{
                    backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Scanline */}
            <div className="scanline absolute w-full h-[200px] left-0 pointer-events-none z-10" />

            {/* Central Pulse */}
            <div className="relative z-20 flex flex-col items-center gap-8">
                <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Rotating Rings */}
                    <div className="absolute inset-0 border border-blue-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-2 border border-purple-500/30 rounded-full animate-[spin_7s_linear_infinite_reverse]" />
                    <div className="absolute inset-6 border border-emerald-500/30 rounded-full animate-[spin_5s_linear_infinite]" />

                    {/* Core Glow */}
                    <div className="absolute inset-0 bg-blue-500/20 blur-[50px] animate-pulse" />
                    <Sparkles className="w-12 h-12 text-white animate-pulse relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                </div>

                <div className="text-center space-y-3">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 animate-pulse tracking-tight">
                        AI ARCHITECT
                    </div>
                    <div className="h-6 overflow-hidden">
                        <div key={step} className="text-sm text-blue-300/80 font-mono animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {'>'} {steps[step]}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MockupPreview({
    html, isLoading, error, className, colors, viewMode = 'desktop', onColorChange,
    // Multi-variant props
    variants = [], activeVariantId, mockupHistory = [], onVariantChange, onSelectionConfirm,
    allImages = [], onImageSwap
}: MockupPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isImageInspectorOpen, setIsImageInspectorOpen] = useState(false);
    const [extractedImages, setExtractedImages] = useState<{ src: string, alt: string }[]>([]);
    const [swappingImageSrc, setSwappingImageSrc] = useState<string | null>(null);

    const activeVariant = variants.find(v => v.id === activeVariantId) || mockupHistory.find(v => v.id === activeVariantId);
    const displayHtml = activeVariant?.html || html;

    // Handle iframe communication
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data.type === 'COLOR_CLICKED') {
                const colorKey = e.data.payload; // e.g., 'primary'
                if (colorKey && colors && Object.keys(colors).includes(colorKey)) {
                    setIsPaletteOpen(true);
                    toast.success(`Selected ${colorKey} color`);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [colors]);

    useEffect(() => {
        if (displayHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(displayHtml, 'text/html');
            const imgs = Array.from(doc.querySelectorAll('img')).map(img => ({
                src: img.getAttribute('src') || '',
                alt: img.getAttribute('alt') || ''
            })).filter(img => img.src && !img.src.startsWith('data:'));

            // Deduplicate by src
            const unique: { src: string, alt: string }[] = [];
            const seen = new Set();
            for (const img of imgs) {
                if (!seen.has(img.src)) {
                    seen.add(img.src);
                    unique.push(img);
                }
            }
            setExtractedImages(unique);
        }
    }, [displayHtml]);

    useEffect(() => {
        const updateScale = () => {
            if (!containerRef.current) return;
            const containerWidth = containerRef.current.clientWidth - 16; // Account for padding

            // Define target widths proportional to real device widths
            let targetWidth = 1440; // Desktop - standard resolution
            if (viewMode === 'tablet') targetWidth = 768;
            if (viewMode === 'mobile') targetWidth = 390;

            // Calculate scale to fit container - aim for less scaling
            const newScale = Math.min(1, containerWidth / targetWidth);
            setScale(newScale);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [viewMode]);

    // Build full HTML document with Tailwind CDN for iframe
    const fullHtml = displayHtml ? `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '${colors?.primary || "#3b82f6"}',
                        secondary: '${colors?.secondary || "#1e293b"}',
                        background: '${colors?.background || "#ffffff"}',
                        text: '${colors?.text || "#0f172a"}',
                        accent: '${colors?.accent || "#f59e0b"}',
                    }
                }
            }
        }
    </script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; cursor: default; }
        /* Highlight hover effect for interactive elements if needed, though pure CSS vars update is cleaner */
    </style>
    <script>
        // Click-to-Edit Logic
        document.addEventListener('click', (e) => {
             e.preventDefault();
             e.stopPropagation();
             
             let target = e.target;
             let colorFound = null;
             
             // Traverse up 3 levels to find color classes
             for (let i = 0; i < 3 && target; i++) {
                 const cls = target.className || '';
                 if (typeof cls === 'string') {
                      if (cls.includes('primary')) colorFound = 'primary';
                      else if (cls.includes('secondary')) colorFound = 'secondary';
                      else if (cls.includes('accent')) colorFound = 'accent';
                      else if (cls.includes('background')) colorFound = 'background';
                 }
                 if (colorFound) break;
                 target = target.parentElement;
             }

             if (colorFound) {
                 window.parent.postMessage({ type: 'COLOR_CLICKED', payload: colorFound }, '*');
             } else {
                 // specific fallback to always open palette on click if unsure? 
                 window.parent.postMessage({ type: 'COLOR_CLICKED', payload: 'primary' }, '*'); 
             }
        });
    </script>
</head>
<body>
    ${displayHtml}
</body>
</html>` : null;


    // Calculate simulated height based on scale to avoid huge empty space
    const targetWidth = viewMode === 'mobile' ? 390 : viewMode === 'tablet' ? 768 : 1440;

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative rounded-xl border border-white/10 overflow-hidden bg-[#0A0A0A] flex flex-col",
                className
            )}
        >
            {/* Simple Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent border-b border-white/5 h-14">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        AI Preview
                    </div>

                    {/* Variant Tabs */}
                    {variants.length > 1 && (
                        <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                            {variants.map((v, i) => (
                                <button
                                    key={v.id}
                                    onClick={() => onVariantChange?.(v.id)}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                        activeVariantId === v.id
                                            ? "bg-blue-600 text-white shadow-lg"
                                            : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                                    )}
                                >
                                    Variant {i + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {mockupHistory.length > 0 && (
                        <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                                isHistoryOpen
                                    ? "bg-purple-600 border-purple-500 text-white"
                                    : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                            )}
                        >
                            <History className="w-3 h-3" />
                            History ({mockupHistory.length})
                        </button>
                    )}

                    <button
                        onClick={() => {
                            setIsImageInspectorOpen(!isImageInspectorOpen);
                            setIsHistoryOpen(false);
                        }}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                            isImageInspectorOpen
                                ? "bg-blue-600 border-blue-500 text-white"
                                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <Sparkles className="w-3 h-3" />
                        Assets ({extractedImages.length})
                    </button>


                    {isLoading && (
                        <div className="flex items-center gap-2 text-xs text-purple-400 bg-purple-500/10 px-3 py-1.5 rounded-lg border border-purple-500/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Synthesizing...
                        </div>
                    )}
                </div>
            </div>

            {/* History Drawer */}
            {isHistoryOpen && (
                <div className="absolute top-14 right-0 bottom-0 w-80 bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/10 z-40 animate-in slide-in-from-right shadow-2xl flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <History className="w-4 h-4 text-purple-400" /> Design History
                        </h3>
                        <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-white">
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {mockupHistory.map((item, idx) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onVariantChange?.(item.id);
                                    // setIsHistoryOpen(false);
                                }}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl border transition-all group relative overflow-hidden",
                                    activeVariantId === item.id
                                        ? "bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-900/20"
                                        : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-300">
                                        Iteration {item.iteration}
                                    </div>
                                    <div className="text-[10px] text-gray-600">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="text-xs font-medium text-gray-200 line-clamp-1 mb-2">
                                    {item.archetype ? `Theme: ${item.archetype}` : "Standard Design"}
                                </div>

                                {/* Mini Preview Placeholder */}
                                <div className="h-16 w-full bg-white/5 rounded-lg border border-white/5 flex items-center justify-center overflow-hidden">
                                    <Sparkles className="w-4 h-4 text-white/10" />
                                </div>

                                {activeVariantId === item.id && (
                                    <div className="absolute top-0 right-0 p-2 flex flex-col items-end gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                                        <span className="text-[8px] font-bold text-blue-400 bg-blue-400/10 px-1 rounded border border-blue-400/20">ACTIVE</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Asset Inspector Drawer */}
            {isImageInspectorOpen && (
                <div className="absolute top-14 right-0 bottom-0 w-80 bg-[#0A0A0A]/95 backdrop-blur-xl border-l border-white/10 z-40 animate-in slide-in-from-right shadow-2xl flex flex-col">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-blue-400" /> Active Assets
                        </h3>
                        <button onClick={() => setIsImageInspectorOpen(false)} className="text-gray-500 hover:text-white">
                            <ChevronLeft className="w-4 h-4 rotate-180" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                            Images used in this mockup
                        </div>
                        {extractedImages.length === 0 ? (
                            <div className="text-xs text-gray-600 text-center py-8">
                                No external images detected in this layout.
                            </div>
                        ) : (
                            extractedImages.map((img, idx) => {
                                const semanticInfo = allImages.find(i => i.src === img.src);
                                return (
                                    <div
                                        key={`${img.src}-${idx}`}
                                        className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group"
                                    >
                                        <div className="aspect-video w-full bg-black/40 rounded-lg overflow-hidden border border-white/5 mb-3">
                                            <img
                                                src={img.src}
                                                alt={img.alt}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="text-[10px] font-bold text-blue-400 uppercase tracking-tight truncate">
                                                {semanticInfo?.role || 'Section Image'}
                                            </div>
                                            <div className="text-xs text-gray-300 font-medium line-clamp-1">
                                                {img.alt || 'No alt text provided'}
                                            </div>
                                            {semanticInfo?.context && (
                                                <div className="text-[10px] text-gray-500 line-clamp-2 italic">
                                                    {semanticInfo.context}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                            <button
                                                onClick={() => setSwappingImageSrc(img.src)}
                                                className="text-[10px] font-bold text-gray-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                                            >
                                                <ImagePlus className="w-3 h-3" />
                                                Swap Image
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Image Swap Modal / Overlay */}
                    {swappingImageSrc && (
                        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in flex flex-col">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Select Alternative</h4>
                                <button onClick={() => setSwappingImageSrc(null)} className="text-gray-500 hover:text-white">
                                    <ChevronLeft className="w-4 h-4 rotate-180" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-2 custom-scrollbar">
                                {allImages
                                    .filter(i => i.src && i.src !== swappingImageSrc && !i.src.includes('logo'))
                                    .map((altImg, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (onImageSwap) {
                                                    onImageSwap(swappingImageSrc, altImg.src);
                                                }
                                                setSwappingImageSrc(null);
                                                toast.success("Image swapped successfully");
                                            }}
                                            className="aspect-square bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-blue-500 transition-all group"
                                        >
                                            <img
                                                src={altImg.src}
                                                alt={altImg.alt}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Content Container with Scaling */}
            <div className="flex-1 flex justify-center overflow-hidden p-2">
                <div
                    className="origin-top transition-transform duration-300 ease-in-out bg-white rounded-lg shadow-lg overflow-hidden"
                    style={{
                        width: targetWidth,
                        height: viewMode === 'mobile' ? 800 : viewMode === 'tablet' ? 1024 : 900,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top center'
                    }}
                >
                    {isLoading ? (
                        <HolographicLoader />
                    ) : error ? (
                        <div className="h-full w-full bg-[#0A0A0A] flex flex-col items-center justify-center gap-3 text-center p-8">
                            <AlertCircle className="w-10 h-10 text-red-400" />
                            <div className="text-sm text-red-400 font-medium">Generation Failed</div>
                            <div className="text-xs text-gray-500 max-w-xs">{error}</div>
                        </div>
                    ) : fullHtml ? (
                        <iframe
                            srcDoc={fullHtml}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                            title="Design Mockup Preview"
                        />
                    ) : (
                        <div className="h-full w-full bg-[#0A0A0A] flex flex-col items-center justify-center gap-4 text-center p-8">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center">
                                <ImageOff className="w-8 h-8 text-gray-600" />
                            </div>
                            <div>
                                <div className="text-sm text-gray-400 font-medium mb-1">No Mockup Yet</div>
                                <div className="text-xs text-gray-600 max-w-xs">
                                    Configure your design settings and click "Generate Mockup" to create an AI-powered visual preview.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Color Palette - Only shown when open */}
            {colors && onColorChange && isPaletteOpen && (
                <div className="absolute top-14 left-4 z-30 animate-in slide-in-from-left-4 fade-in duration-200">
                    <div className="bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-2xl w-64">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                                <Palette className="w-3 h-3 text-purple-400" /> Vibe Colors
                            </h3>
                            <button onClick={() => setIsPaletteOpen(false)} className="text-gray-500 hover:text-white">
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {Object.entries(colors).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full border border-white/20 shadow-inner flex-shrink-0 relative overflow-hidden group">
                                        <input
                                            type="color"
                                            value={value}
                                            onChange={(e) => onColorChange?.(key, e.target.value)}
                                            className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer opacity-0"
                                        />
                                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: value }} />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase text-gray-500 font-bold block mb-0.5">{key}</label>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => onColorChange?.(key, e.target.value)}
                                            className="w-full bg-transparent border-none text-xs text-white font-mono h-4 focus:outline-none p-0"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle (if closed) */}
            {
                colors && onColorChange && !isPaletteOpen && (
                    <button
                        onClick={() => setIsPaletteOpen(true)}
                        className="absolute top-14 left-4 z-30 w-10 h-10 bg-[#0A0A0A]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-xl flex items-center justify-center text-gray-400 hover:text-white transition-all hover:scale-105"
                    >
                        <Palette className="w-4 h-4" />
                    </button>
                )
            }
        </div >
    );
}
