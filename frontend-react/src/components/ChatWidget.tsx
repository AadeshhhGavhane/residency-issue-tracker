import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, MapPin, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
  
interface Media {
  type: 'image' | 'video';
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  media?: Media[];
  audioUrl?: string;
}

interface User {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  role?: string;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((state: RootState) => state.auth);

  // Voice chat states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const getTokenFromAPI = async () => {
    try {
      const response = await fetch('/api/auth/token', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to get token');
      }
      
      const data = await response.json();
      return data.data.token;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Voice chat functions
  const checkBrowserSupport = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log('Browser Error: Your browser does not support audio recording.');
      return false;
    }

    if (!window.MediaRecorder) {
      console.log('Browser Error: MediaRecorder is not supported in your browser.');
      return false;
    }

    return true;
  };

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }

    return 'audio/webm';
  };

  const startRecording = async () => {
    if (!checkBrowserSupport()) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await sendAudioToGroq(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      console.log('Microphone Error: Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const sendAudioToGroq = async (audioBlob: Blob) => {
    try {
      if (!apiKey) {
        console.log('Error: GROQ_API_KEY environment variable is not set');
        return;
      }

      const audioFile = new File([audioBlob], 'recording.webm', { 
        type: audioBlob.type 
      });

      const formData = new FormData();
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('file', audioFile);
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Groq API Response:', result);
      
      if (result.text) {
        setInputValue(result.text.trim());
        console.log('Success: Transcription complete! Text added to input.');
      }
      
      setIsProcessing(false);

    } catch (error) {
      console.error('Error sending audio to Groq:', error);
      console.log(`Transcription Error: Failed to transcribe audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `Location: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        
        setInputValue(prev => {
          const newValue = prev ? `${prev} ${locationText}` : locationText;
          return newValue;
        });
        
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied by user.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const addUserDetails = () => {
    const name = user?.name || 'Unknown User';
    const email = user?.email || 'N/A';
    const phoneNumber = user?.phoneNumber || 'N/A';
    const userDetailsText = `${name} ${email} ${phoneNumber}`;
    
    setInputValue(prev => {
      const newValue = prev ? `${prev} ${userDetailsText}` : userDetailsText;
      return newValue;
    });
  };

  const parseCloudinaryURLs = (text: string): { text: string; media: Media[] } => {
    const cloudinaryRegex = /https:\/\/res\.cloudinary\.com\/[^\s]+/g;
    const urls = text.match(cloudinaryRegex) || [];
    let remainingText = text;
    const media: Media[] = [];

    urls.forEach(url => {
      remainingText = remainingText.replace(url, '').trim();
      const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(url);
      const isVideo = /\.(mp4|webm|ogv)$/i.test(url);
      if (isImage) {
        media.push({ type: 'image', url });
      } else if (isVideo) {
        media.push({ type: 'video', url });
      }
    });

    return {
      text: remainingText || text,
      media
    };
  };

  const generateTTS = async (text: string): Promise<string | null> => {
    try {
      if (!apiKey) {
        console.log('Error: GROQ_API_KEY environment variable is not set');
        return null;
      }

      console.log('Generating TTS for text:', text.substring(0, 100) + '...');
      console.log('Using API key:', apiKey.substring(0, 10) + '...');
      console.log('TTS Request body:', {
        model: 'playai-tts',
        voice: 'Jennifer-PlayAI',
        input: text.substring(0, 50) + '...',
        response_format: 'wav'
      });
      
      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'playai-tts',
          voice: 'Jennifer-PlayAI',
          input: text,
          response_format: 'wav'
        })
      });

      console.log('TTS Response status:', response.status);
      console.log('TTS Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('TTS Audio blob size:', audioBlob.size);
      const audioUrl = URL.createObjectURL(audioBlob);
      return audioUrl;

    } catch (error) {
      console.error('Error generating TTS:', error);
      console.log(`TTS Error: Failed to generate audio response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = await getTokenFromAPI();
      
      if (!token) {
        throw new Error('Please log in to use the chat');
      }

      console.log('Sending message to n8n:', {
        message,
        userId: user?.id,
        userName: user?.name
      });

      const response = await fetch('/api/chat/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: message,
          userId: user?._id || user?.id,
          userName: user?.name,
          userRole: user?.role,
          sessionId: user?._id || user?.id || user?.email
        })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      let responseText = 'I received your message. How can I help you?';
      
      if (data && Array.isArray(data) && data.length > 0) {
        responseText = data[0].output || data[0].response || responseText;
      } else if (data && typeof data === 'object') {
        responseText = data.output || data.response || data.message || responseText;
      }

      const { text, media } = parseCloudinaryURLs(responseText);
      
      // Add bot message first
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text,
        sender: 'bot',
        timestamp: new Date(),
        media: media.length > 0 ? media : undefined
      };

      setMessages(prev => [...prev, botMessage]);
      
      // Generate TTS for bot response (non-blocking)
      generateTTS(text).then(audioUrl => {
        if (audioUrl) {
          // Update the message with audio URL
          setMessages(prev => prev.map(msg => 
            msg.id === botMessage.id 
              ? { ...msg, audioUrl }
              : msg
          ));
        }
      }).catch(error => {
        console.error('TTS generation failed, but message was sent:', error);
        // Don't show error toast here as the message was successfully sent
      });

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chat Button in Header */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="relative"
      >
        <MessageCircle className="h-5 w-5" />
        {messages.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">
            {messages.length}
          </Badge>
        )}
      </Button>

      {/* Chat Modal/Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Overlay - covers entire screen including sidebar */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Panel */}
          <div className="fixed right-0 top-0 h-screen w-full max-w-md bg-background border-l border-border shadow-xl z-[110]">
            <Card className="h-full flex flex-col">
              <CardHeader className="flex-shrink-0 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">AI Assistant</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ask me anything about your issues or report a new one
                </p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4 min-h-0 max-h-[calc(100vh-200px)]">
                  <div className="space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm">
                          Hi! I'm your AI assistant. I can help you:
                        </p>
                        <ul className="text-xs mt-2 space-y-1">
                          <li>• Check the status of your issues</li>
                          <li>• Report new maintenance problems</li>
                          <li>• Get updates on ongoing work</li>
                          <li>• Share your location for better assistance</li>
                          <li>• Share your contact details</li>
                        </ul>
                      </div>
                    )}
                    
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div
                          className={`max-w-xs rounded-lg px-3 py-2 break-words ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-foreground'
                          }`}
                        >
                          {message.text && (
                            <div className="text-sm">
                              {message.sender === 'bot' ? (
                                <ReactMarkdown 
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => <code className="bg-muted-foreground/20 px-1 py-0.5 rounded text-xs">{children}</code>,
                                    pre: ({ children }) => <pre className="bg-muted-foreground/20 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                                  }}
                                >
                                  {message.text}
                                </ReactMarkdown>
                              ) : (
                                <p className="whitespace-pre-wrap">{message.text}</p>
                              )}
                            </div>
                          )}
                          {message.media && message.media.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.media.map((media, index) => (
                                <div key={`${message.id}-media-${index}`}>
                                  {media.type === 'image' ? (
                                    <img
                                      src={media.url}
                                      alt="Shared image"
                                      className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
                                    />
                                  ) : (
                                    <video
                                      controls
                                      className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
                                    >
                                      <source src={media.url} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {message.audioUrl && message.sender === 'bot' && (
                            <div className="mt-2">
                              <audio
                                controls
                                className="w-full max-w-[300px] h-8"
                                src={message.audioUrl}
                                onError={(e) => {
                                  console.error('Audio playback error:', e);
                                  console.log('Audio Error: Failed to play audio response');
                                }}
                              >
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          <p className="text-xs opacity-70 mt-1">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input - Fixed at bottom */}
                <div className="border-t border-border p-4 flex-shrink-0">
                  <div className="flex space-x-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Type your message..."
                      disabled={isLoading || isProcessing}
                      className="flex-1"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit(e);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={getCurrentLocation}
                      disabled={isLoading || isGettingLocation}
                      className="px-2"
                      title="Share current location"
                    >
                      <MapPin className={`h-4 w-4 ${isGettingLocation ? 'animate-pulse' : ''}`} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addUserDetails}
                      disabled={isLoading}
                      className="px-2"
                      title="Share user details"
                    >
                      <User className="h-4 w-4" />
                    </Button>
                    {/* Voice Chat Button */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={isLoading || isProcessing}
                      className="px-2"
                      title={isRecording ? "Stop recording" : "Start voice recording"}
                    >
                      {isRecording ? (
                        <MicOff className="h-4 w-4 text-red-500" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isLoading || !inputValue.trim() || isProcessing}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  {(isGettingLocation || isRecording || isProcessing) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {isGettingLocation && "Getting your location..."}
                                             {isRecording && `Recording ${formatRecordingTime(recordingTime)}`}
                      {isProcessing && "Processing audio..."}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;