import { useState, useRef, useCallback, useEffect } from 'react';
import { Phone, Paperclip, Mic, Send, ChevronRight, Building2, Compass, MonitorPlay, DoorOpen, FileText, MicOff } from 'lucide-react';
import logo from './assets/ainagerlogo.png';
import aiProfile from './assets/aiProfile.png';

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface Message {
  id: string;
  type: 'ai' | 'user';
  content: string;
  timestamp: Date;
}

interface SuggestionCard {
  id: string;
  icon: React.ReactNode;
  text: string;
  image: string;
  gradient: string;
}

function App() {
  const [messages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 Hello! Welcome to Bildesk. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isMicAvailable, setIsMicAvailable] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const baseTextRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const suggestions: SuggestionCard[] = [
    { 
      id: '1', 
      icon: <Building2 className="w-6 h-6" />, 
      text: 'Find coworking spaces in Dubai',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=200&fit=crop&crop=center',
      gradient: 'from-blue-500 to-purple-600'
    },
    { 
      id: '2', 
      icon: <Compass className="w-6 h-6" />, 
      text: 'Explore private offices near me',
      image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=200&fit=crop&crop=center',
      gradient: 'from-green-500 to-teal-600'
    },
    { 
      id: '3', 
      icon: <MonitorPlay className="w-6 h-6" />, 
      text: 'Check virtual office options',
      image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&h=200&fit=crop&crop=center',
      gradient: 'from-orange-500 to-red-600'
    },
    { 
      id: '4', 
      icon: <DoorOpen className="w-6 h-6" />, 
      text: 'Book a meeting room',
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop&crop=center',
      gradient: 'from-purple-500 to-pink-600'
    },
    { 
      id: '5', 
      icon: <FileText className="w-6 h-6" />, 
      text: 'Learn about flexible workspace plans',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop&crop=center',
      gradient: 'from-indigo-500 to-blue-600'
    },
  ];

  const startListening = useCallback(() => {
    try {
      console.log('Starting speech recognition...');
      
      // Check if Speech Recognition is supported
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('Speech recognition not supported');
        setIsMicAvailable(false);
        setInputValue('Speech recognition not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setIsRecording(true);
        // Store the current input value as base text
        baseTextRef.current = inputValue;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Update input field with the recognized text
        if (finalTranscript) {
          // Add final transcript to base text and update the base
          baseTextRef.current = baseTextRef.current + finalTranscript;
          setInputValue(baseTextRef.current);
          // Auto-resize after updating text
          setTimeout(autoResize, 0);
          console.log('Final transcript:', finalTranscript);
        } else if (interimTranscript) {
          // Show interim results without brackets - just append to base text
          setInputValue(baseTextRef.current + interimTranscript);
          // Auto-resize after updating text
          setTimeout(autoResize, 0);
          console.log('Interim transcript:', interimTranscript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
        
        switch (event.error) {
          case 'no-speech':
            setInputValue('No speech detected. Please try again.');
            break;
          case 'audio-capture':
            setInputValue('Microphone not found. Please check your microphone.');
            setIsMicAvailable(false);
            break;
          case 'not-allowed':
            setInputValue('Microphone access denied. Please allow microphone access.');
            setIsMicAvailable(false);
            break;
          default:
            setInputValue('Speech recognition error. Please try again.');
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        setIsRecording(false);
        // Ensure the input value matches the base text (remove any interim results)
        setInputValue(baseTextRef.current);
        // Auto-resize after updating text
        setTimeout(autoResize, 0);
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setIsMicAvailable(false);
      setInputValue('Error starting speech recognition. Please try again.');
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition...');
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setIsRecording(false);
      console.log('Speech recognition stopped');
    }
  }, [isListening]);

  const handleMicClick = useCallback(() => {
    console.log('Mic button clicked, isRecording:', isRecording);
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  }, [isRecording, startListening, stopListening]);

  const handleSendClick = useCallback(() => {
    if (inputValue.trim()) {
      // Handle sending text message
      console.log('Sending message:', inputValue);
      setInputValue(''); // Clear input after sending
      baseTextRef.current = ''; // Reset base text
    }
  }, [inputValue]);

  // Auto-resize textarea function
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight, but limit to max 6 lines (approximately 144px)
      const maxHeight = 144; // 6 lines * 24px line height
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, []);

  // Handle textarea input changes
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize after state update
    setTimeout(autoResize, 0);
  }, [autoResize]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line behavior
      if (inputValue.trim()) {
        handleSendClick();
      }
    }
    // Shift+Enter will naturally create a new line (default behavior)
  }, [inputValue, handleSendClick]);

  // Handle card click to send related question
  const handleCardClick = useCallback((cardText: string) => {
    const question = `Tell me about ${cardText.toLowerCase()}`;
    setInputValue(question);
    baseTextRef.current = question;
    // Auto-resize after setting text
    setTimeout(autoResize, 0);
    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoResize]);

  // Auto-resize textarea when inputValue changes
  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

  // Cleanup speech recognition on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="h-screen bg-background-light font-display flex flex-col">
      <header className="bg-white shadow-sm p-4 md:px-20 flex items-center justify-between fixed top-0 left-0 right-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <img src={logo} alt="logo"/>
          </div>
          <div>
            <h2 className="text-gray-900 text-lg font-bold leading-tight tracking-normal">H<span className='text-blue-900'>AI</span>NAGER</h2>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <p className="text-green-500 text-xs font-medium">Online</p>
            </div>
          </div>
        </div>
        <button className="flex items-center justify-center rounded-full h-10 w-10 text-gray-700 hover:bg-gray-100 transition-colors">
          <Phone className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 overflow-y-auto mt-[73px] mb-[89px]">
        <div className="w-full max-w-2xl">
          <div className="flex items-end gap-3 p-4">
            <div
              className="w-10 h-10 rounded-full shrink-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center"
            >
              <img className='rounded-full' src={aiProfile} alt="aiprofile" />
            </div>
            <div className="flex flex-1 flex-col gap-1 items-start">
              <p className="text-gray-500 text-sm font-medium">AINAGER</p>
              <p className="text-base font-normal leading-normal max-w-md rounded-xl px-4 py-3 bg-white text-gray-900 shadow-sm">
                {messages[0].content}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="group relative overflow-hidden bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                onClick={() => handleCardClick(suggestion.text)}
              >
                {/* Background Image */}
                <div className="relative h-32 overflow-hidden">
                  <img
                    src={suggestion.image}
                    alt={suggestion.text}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${suggestion.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                  
                  {/* Icon Overlay */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                    <div className={`text-white bg-gradient-to-br ${suggestion.gradient} rounded-md p-1.5`}>
                  {suggestion.icon}
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4">
                  <h3 className="text-gray-800 text-base font-semibold leading-tight mb-2 group-hover:text-gray-900 transition-colors">
                  {suggestion.text}
                  </h3>
                  
                  {/* Action Indicator */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                      Click to ask about this
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                </div>
                
                {/* Hover Effect Border */}
                <div className={`absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gradient-to-br group-hover:${suggestion.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="bg-white shadow-sm p-4 w-full fixed bottom-0 left-0 right-0 z-10">
        <div className="w-full max-w-2xl mx-auto flex items-center gap-4">
          <button className="flex items-center justify-center rounded-full h-11 w-11 text-gray-500 hover:bg-gray-100 transition-colors shrink-0">
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              className="w-full min-h-[48px] max-h-[144px] px-4 pr-12 py-3 rounded-full bg-gray-100 border-transparent focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-500 resize-none overflow-hidden"
              placeholder="Type your message..."
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{ height: '48px' }}
            />
            <button 
              className={`absolute right-2 bottom-2 flex items-center justify-center rounded-full h-9 w-9 transition-colors ${
                isListening 
                  ? 'bg-green-500 text-white hover:bg-green-600 animate-pulse' 
                  : isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                    : inputValue.trim() 
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : 'bg-primary text-white hover:bg-primary/90'
              }`}
              onClick={inputValue.trim() ? handleSendClick : handleMicClick}
              disabled={!isMicAvailable && !inputValue.trim()}
              title={
                isListening 
                  ? 'Listening... Click to stop' 
                  : isRecording 
                    ? 'Processing speech...' 
                    : inputValue.trim() 
                      ? 'Send message' 
                      : isMicAvailable 
                        ? 'Click to speak' 
                        : 'Microphone not available'
              }
            >
              {inputValue.trim() ? (
                <Send className="w-5 h-5" />
              ) : isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
