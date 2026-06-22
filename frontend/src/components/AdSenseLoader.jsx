// frontend/src/components/AdSenseLoader.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function AdSenseLoader() {
  const location = useLocation();
  
  useEffect(() => {
    // Check if we're on the privacy policy page
    const isPrivacyPage = location.pathname === "/privacy";
    
    // Only load AdSense if NOT on privacy page
    if (!isPrivacyPage) {
      // Check if script already exists
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      
      if (!existingScript) {
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2484969573385042";
        script.crossOrigin = "anonymous";
        document.head.appendChild(script);
        console.log("✅ AdSense script loaded");
      }
    } else {
      // Remove AdSense script if it exists on privacy page
      const existingScript = document.querySelector('script[src*="pagead2.googlesyndication.com"]');
      if (existingScript) {
        existingScript.remove();
        console.log("⛔ AdSense script removed from privacy page");
      }
    }
  }, [location.pathname]);
  
  return null;
}