// frontend/src/components/VideoPlayer.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function VideoPlayer({ videoUrl, title, onClose }) {

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return createPortal(
    <div className="video-overlay-portal" onClick={onClose}>
      <div className="video-wrapper-portal" onClick={(e) => e.stopPropagation()}>
        <button className="video-close-portal" onClick={onClose}>✕</button>
        <video
          className="video-player-portal"
          src={videoUrl}
          controls
          autoPlay
          playsInline
        />
      </div>
    </div>,
    document.body
  );
}