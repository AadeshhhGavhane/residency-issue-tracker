import React, { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

interface GoogleTranslateProps {
  className?: string;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

const GoogleTranslate: React.FC<GoogleTranslateProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>({
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  });
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTranslateReady, setIsTranslateReady] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const googleTranslateRef = useRef<any>(null);

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'as', name: 'অসমীয়া', flag: '🇮🇳' },
    { code: 'ne', name: 'नेपाली', flag: '🇳🇵' },
    { code: 'si', name: 'සිංහල', flag: '🇱🇰' }
  ];

  // Get language from cookie on mount
  useEffect(() => {
    const getCookieValue = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const savedLang = getCookieValue('googtrans');
    if (savedLang) {
      // Cookie format is like "/en/hi" so we extract the target language
      const langCode = savedLang.split('/').pop();
      const savedLanguage = languages.find(lang => lang.code === langCode);
      if (savedLanguage) {
        setCurrentLanguage(savedLanguage);
      }
    }

    // Also check localStorage as a backup
    const storedLang = localStorage.getItem('selectedLanguage');
    if (storedLang && !savedLang) {
      try {
        const parsedLang = JSON.parse(storedLang);
        const foundLang = languages.find(lang => lang.code === parsedLang.code);
        if (foundLang) {
          setCurrentLanguage(foundLang);
        }
      } catch (e) {
        console.error('Error parsing stored language:', e);
      }
    }
  }, []);

  // Load Google Translate script
  useEffect(() => {
    if (!scriptLoaded) {
      setIsLoading(true);
      setError(null);
      
      // Define the callback function before loading the script
      window.googleTranslateElementInit = () => {
        try {
          googleTranslateRef.current = new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: languages.map(lang => lang.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true
          }, 'google_translate_element');
          
          setIsTranslateReady(true);
          console.log('Google Translate initialized successfully');
        } catch (err) {
          console.error('Error initializing Google Translate:', err);
          setError('Failed to initialize translation service');
        }
      };
      
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      
      script.onload = () => {
        setScriptLoaded(true);
        setIsLoading(false);
      };
      
      script.onerror = () => {
        console.error('Failed to load Google Translate script');
        setError('Failed to load translation service');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }
  }, [scriptLoaded]);

  // Function to change language
  const changeLanguage = (languageCode: string) => {
    try {
      // Method 1: Try to find and change the select element
      const iframe = document.querySelector('.goog-te-menu-frame') as HTMLIFrameElement;
      if (iframe && iframe.contentDocument) {
        const select = iframe.contentDocument.querySelector('.goog-te-menu2-item span.text') as HTMLElement;
        if (select) {
          // Find the language option and click it
          const options = iframe.contentDocument.querySelectorAll('.goog-te-menu2-item');
          options.forEach((option: any) => {
            if (option.textContent && option.textContent.includes(languageCode)) {
              option.click();
            }
          });
        }
      }

      // Method 2: Try using the cookie approach
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${languageCode}; domain=${domain}; path=/`;
      document.cookie = `googtrans=/en/${languageCode}; path=/`;
      
      // Method 3: Try to find the select element directly
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = languageCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Method 4: Use Google's internal API if available
      if (window.google && window.google.translate && window.google.translate.TranslateElement) {
        const instance = window.google.translate.TranslateElement.getInstance();
        if (instance && instance.c && typeof instance.c === 'function') {
          instance.c(languageCode);
        }
      }

      // Force page refresh to apply translation
      setTimeout(() => {
        // Check if translation was applied
        const body = document.querySelector('body');
        if (body && !body.classList.contains('translated-ltr')) {
          // If not translated, try refreshing
          window.location.reload();
        }
      }, 500);

    } catch (err) {
      console.error('Error changing language:', err);
    }
  };

  // Handle language change
  const handleLanguageChange = (language: Language) => {
    // Update state immediately for better UX
    setCurrentLanguage(language);
    setIsOpen(false);
    
    // Save to localStorage
    localStorage.setItem('selectedLanguage', JSON.stringify(language));
    
    if (isTranslateReady) {
      changeLanguage(language.code);
    }
  };

  // Monitor for Google Translate readiness and sync state
  useEffect(() => {
    if (scriptLoaded && !isTranslateReady) {
      const checkInterval = setInterval(() => {
        const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (select) {
          setIsTranslateReady(true);
          clearInterval(checkInterval);
          console.log('Google Translate widget is ready');
          
          // Sync the current language with Google Translate
          if (currentLanguage.code !== 'en') {
            changeLanguage(currentLanguage.code);
          }
        }
      }, 100);

      // Clear interval after 10 seconds to prevent infinite checking
      setTimeout(() => clearInterval(checkInterval), 10000);
    }
  }, [scriptLoaded, isTranslateReady, currentLanguage]);

  // Monitor Google Translate state changes
  useEffect(() => {
    if (isTranslateReady) {
      const checkTranslateState = setInterval(() => {
        const getCookieValue = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const currentGoogTrans = getCookieValue('googtrans');
        if (currentGoogTrans) {
          const langCode = currentGoogTrans.split('/').pop();
          const matchingLang = languages.find(lang => lang.code === langCode);
          
          // Update state if Google Translate language changed externally
          if (matchingLang && matchingLang.code !== currentLanguage.code) {
            setCurrentLanguage(matchingLang);
            localStorage.setItem('selectedLanguage', JSON.stringify(matchingLang));
          }
        }
      }, 1000);

      return () => clearInterval(checkTranslateState);
    }
  }, [isTranslateReady, currentLanguage, languages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Hide Google Translate banner
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate {
        display: none !important;
      }
      body {
        top: 0px !important;
      }
      .goog-te-menu-value {
        display: none !important;
      }
      #google_translate_element {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className || ''}`}>
        Translation service unavailable
      </div>
    );
  }

  return (
    <div className={`relative ${className || ''}`}>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      
      {/* Custom styled button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Globe className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">{currentLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px] max-h-80 overflow-y-auto animate-in fade-in-0 zoom-in-95"
          role="listbox"
          aria-label="Language options"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language)}
              className={`w-full px-4 py-2 text-left hover:bg-blue-50 transition-colors duration-150 flex items-center gap-3 ${
                currentLanguage.code === language.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
              }`}
              role="option"
              aria-selected={currentLanguage.code === language.code}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">{language.name}</span>
              {currentLanguage.code === language.code && (
                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;