import React, { useState, useRef, useEffect } from 'react';
import {
    MessageCircle, X, Send, Bot, User, Loader2, Sparkles,
    ChevronRight, GraduationCap, BookOpen, ExternalLink, Database,
    Zap, ChevronDown, ChevronUp, Paperclip, Image, Camera, Mic, Trash2, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';

// ─── Source Chip ────────────────────────────────────────────────────────────
const SourceChip = ({ title }) => (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 border border-violet-200 text-violet-700 text-[10px] rounded-full font-medium">
        <BookOpen size={9} />
        {title}
    </span>
);

// ─── RAG Sources Section ─────────────────────────────────────────────────────
const SourcesSection = ({ sources }) => {
    const [expanded, setExpanded] = useState(false);
    if (!sources || sources.length === 0) return null;

    return (
        <div className="mt-2 pt-2 border-t border-gray-100">
            <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-700 transition-colors font-medium"
            >
                <Database size={10} />
                {sources.length} course source{sources.length > 1 ? 's' : ''} used
                {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-1 mt-1.5 overflow-hidden"
                    >
                        {sources.map((src, i) => <SourceChip key={i} title={src} />)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── RAG Badge ───────────────────────────────────────────────────────────────
const RagBadge = () => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-600 text-[9px] rounded-full font-semibold tracking-wide">
        <Zap size={8} className="fill-emerald-500" />
        RAG
    </span>
);

// ─── Message Bubble ──────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
    const isBot = msg.role === 'bot';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${!isBot ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border ${
                !isBot ? 'bg-indigo-100 border-indigo-200' : 'bg-white border-purple-100'
            }`}>
                {!isBot
                    ? <User size={16} className="text-indigo-600" />
                    : <Bot size={16} className="text-purple-600" />
                }
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                !isBot
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-tr-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-md'
            }`}>
                {isBot ? (
                    <div>
                        {/* Header row: RAG badge if used */}
                        {msg.ragUsed && (
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <RagBadge />
                                <span className="text-[9px] text-gray-400 italic">grounded in your course material</span>
                            </div>
                        )}
                        <div className="prose prose-sm prose-p:my-1 prose-ul:my-1 prose-li:my-0 max-w-none text-gray-700">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.text}
                            </ReactMarkdown>
                        </div>
                        {/* Sources accordion */}
                        <SourcesSection sources={msg.sources} />
                    </div>
                ) : (
                    <div>
                        {msg.text && <p>{msg.text}</p>}
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {msg.attachments.map((att, i) => {
                                    const isImage = att.type.startsWith('image/');
                                    const isAudio = att.type.startsWith('audio/');
                                    return (
                                        <div key={i} className="max-w-full rounded-lg overflow-hidden border border-white/20 bg-white/10 p-1">
                                            {isImage ? (
                                                <img src={att.url} alt={att.name} className="max-h-32 rounded object-cover" />
                                            ) : isAudio ? (
                                                <audio src={att.url} controls className="h-8 max-w-[200px]" />
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-white bg-black/20 rounded">
                                                    <Paperclip size={12} />
                                                    <span className="truncate max-w-[120px]">{att.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Main ChatBot Component ──────────────────────────────────────────────────
const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [ragMode, setRagMode] = useState(true); // RAG mode on by default
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: "Hi! I'm your **AI Mentor**, now powered by **RAG** 🚀\n\nI can answer questions from your actual course materials, not just generic knowledge!\n\n**Try asking:**\n- Explain a concept from my courses 📚\n- How am I doing in my courses? 📊\n- Show my recent quiz scores 📝\n- Do I have any certificates? 🏆",
            sources: [],
            ragUsed: false
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Multimodal attachments and security states
    const [attachments, setAttachments] = useState([]);
    const [showCamera, setShowCamera] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const suggestedQuestions = [
        "Explain a topic from my course",
        "How am I doing in my courses?",
        "Show my recent quiz scores",
        "What should I study next?",
        "Do I have any certificates?"
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Cleanup camera and recording streams
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setAttachments(prev => [...prev, ...selectedFiles]);
    };

    const videoRefCallback = (node) => {
        videoRef.current = node;
        if (node && streamRef.current) {
            node.srcObject = streamRef.current;
        }
    };

    const startCamera = async () => {
        try {
            setShowCamera(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error(err);
            toast.error("Could not access camera");
            setShowCamera(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    setAttachments(prev => [...prev, file]);
                    toast.success("Photo captured!");
                }
                stopCamera();
            }, 'image/jpeg');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], `recording-${Date.now()}.weba`, { type: 'audio/webm' });
                setAttachments(prev => [...prev, file]);
                toast.success("Audio recorded successfully!");
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            toast.success("Recording audio...");
        } catch (err) {
            console.error(err);
            toast.error("Could not access microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = async (text) => {
        if ((!text.trim() && attachments.length === 0) || isLoading) return;

        const userMessage = text.trim();
        const currentAttachments = attachments.map(file => ({
            name: file.name,
            type: file.type,
            url: URL.createObjectURL(file)
        }));

        setMessages(prev => [...prev, { 
            role: 'user', 
            text: userMessage,
            attachments: currentAttachments
        }]);

        setInput('');
        setAttachments([]);
        setIsLoading(true);

        try {
            let response;
            if (attachments.length > 0) {
                const formData = new FormData();
                formData.append('message', userMessage);
                attachments.forEach(file => {
                    formData.append('files', file);
                });
                response = await api.post('/chat', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                response = await api.post('/chat', { message: userMessage });
            }

            const data = response.data;

            setMessages(prev => [...prev, {
                role: 'bot',
                text: data.response || 'No response received.',
                sources: data.sources || [],
                ragUsed: data.ragUsed || false
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'bot',
                text: 'Sorry, I am having trouble connecting right now. Please check if the Python service is running.',
                sources: [],
                ragUsed: false
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSend(input);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute bottom-20 right-0 w-80 md:w-[420px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col"
                        style={{ height: '640px' }}
                    >
                        {/* ── Header ── */}
                        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 flex justify-between items-center text-white shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm border border-white/10">
                                    <Bot size={22} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm flex items-center gap-2">
                                        AI Mentor
                                        <Sparkles size={13} className="text-yellow-300" />
                                        <span className="text-[9px] bg-emerald-400/30 border border-emerald-300/50 px-1.5 py-0.5 rounded-full font-semibold tracking-wider">
                                            RAG ENABLED
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-purple-100 flex items-center gap-1.5 opacity-90 mt-0.5">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                                        </span>
                                        Grounded in your course materials
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* ── Messages Area ── */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 relative">
                            {/* Watermark */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                                <GraduationCap size={200} />
                            </div>

                            {messages.map((msg, idx) => (
                                <MessageBubble key={idx} msg={msg} />
                            ))}

                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex gap-3"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center shrink-0">
                                        <Bot size={16} className="text-purple-600" />
                                    </div>
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-md flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                                        </span>
                                        <span className="text-[10px] text-gray-400 ml-1">Searching course materials…</span>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Suggested Chips ── */}
                        {messages.length < 3 && !isLoading && (
                            <div className="px-4 pb-2 bg-slate-50 flex gap-2 overflow-x-auto scrollbar-hide">
                                {suggestedQuestions.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-purple-200 text-purple-700 text-[11px] rounded-full hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-1 shrink-0"
                                    >
                                        {q} <ChevronRight size={11} />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* ── Input Area ── */}
                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="px-4 py-2 bg-slate-50 border-t border-gray-100 flex flex-wrap gap-2 overflow-x-auto max-h-24">
                                {attachments.map((file, i) => {
                                    const isImage = file.type.startsWith('image/');
                                    const isAudio = file.type.startsWith('audio/');
                                    return (
                                        <div key={i} className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white p-1">
                                            {isImage ? (
                                                <img src={URL.createObjectURL(file)} alt="attachment" className="w-full h-full object-cover rounded" />
                                            ) : isAudio ? (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-purple-600 bg-purple-50 rounded">
                                                    <Mic size={18} />
                                                    <span className="text-[7px] font-semibold mt-1">Audio</span>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded">
                                                    <Paperclip size={18} />
                                                    <span className="text-[7px] truncate w-full text-center px-1 mt-1">{file.name}</span>
                                                </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow-md"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 space-y-3">
                            {/* Attachment Actions */}
                            <div className="flex items-center gap-3.5 text-gray-400 px-1">
                                <label className="hover:text-purple-600 cursor-pointer transition-colors" title="Upload Files">
                                    <Paperclip size={18} />
                                    <input type="file" multiple onChange={handleFileChange} className="hidden" />
                                </label>
                                <label className="hover:text-purple-600 cursor-pointer transition-colors" title="Upload Images">
                                    <Image size={18} />
                                    <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                <button type="button" onClick={startCamera} className="hover:text-purple-600 transition-colors" title="Take Photo">
                                    <Camera size={18} />
                                </button>
                                <button 
                                    type="button" 
                                    onClick={isRecording ? stopRecording : startRecording} 
                                    className={`transition-colors ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-purple-600'}`} 
                                    title={isRecording ? "Stop Recording" : "Record Audio"}
                                >
                                    <Mic size={18} />
                                </button>
                                {isRecording && (
                                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
                                        ● Recording...
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all shadow-inner">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    placeholder="Ask about your courses or materials…"
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 placeholder-gray-400 outline-none"
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                                    className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all transform hover:scale-105 active:scale-95"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-gray-400 mt-2 flex items-center justify-center gap-1">
                                <Database size={9} className="text-emerald-500" />
                                Answers grounded in your enrolled course materials
                            </p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Live Camera Modal */}
            {showCamera && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full border border-gray-700 flex flex-col">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center text-white">
                            <h4 className="font-bold text-sm">Take Photo</h4>
                            <button onClick={stopCamera} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="relative aspect-video bg-black flex items-center justify-center">
                            <video ref={videoRefCallback} autoPlay playsInline className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 bg-gray-900/50 flex justify-center gap-4">
                            <button 
                                onClick={capturePhoto}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Capture Photo
                            </button>
                            <button 
                                onClick={stopCamera}
                                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Floating Toggle Button ── */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center group relative overflow-hidden"
                    title="AI Mentor — RAG Powered"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-full" />
                    <Sparkles size={24} className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-4 group-hover:translate-y-[-12px]" />
                    <MessageCircle size={28} className="transition-transform duration-300 group-hover:scale-90" />

                    {/* RAG indicator dot */}
                    <span className="absolute right-0 top-0 flex h-3 w-3 -mt-1 -mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                </motion.button>
            )}
        </div>
    );
};

export default ChatBot;
