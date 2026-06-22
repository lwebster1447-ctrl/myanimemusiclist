// frontend/src/components/ProfilePicture.jsx
import { useState, useRef } from 'react';
import ImageCropper from './ImageCropper';

export default function ProfilePicture({ 
  username, 
  photoURL, 
  onPhotoUpdate,
  isOwner = false,
  size = 'medium'
}) {
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef(null);

  const getSizeClass = () => {
    switch(size) {
      case 'small': return 'profile-picture-small';
      case 'large': return 'profile-picture-large';
      default: return 'profile-picture-medium';
    }
  };

  const getInitials = () => {
    if (!username) return '?';
    return username.charAt(0).toUpperCase();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempImage(event.target.result);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage) => {
    setShowCropper(false);
    setTempImage(null);
    await onPhotoUpdate(croppedImage);
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setTempImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (isOwner) {
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <div 
        className={`profile-picture-container ${getSizeClass()}`}
        onMouseEnter={() => isOwner && setIsHovering(true)}
        onMouseLeave={() => isOwner && setIsHovering(false)}
      >
        <div 
          className="profile-picture-wrapper"
          onClick={handleClick}
          style={{ cursor: isOwner ? 'pointer' : 'default' }}
        >
          {photoURL ? (
            <img src={photoURL} alt={username} className="profile-picture-image" />
          ) : (
            <div className="profile-picture-initials">
              {getInitials()}
            </div>
          )}
          
          {isOwner && isHovering && (
            <div className="profile-picture-overlay">
              <span>Change Photo</span>
            </div>
          )}
        </div>
        
        {isOwner && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        )}
      </div>

      {showCropper && tempImage && (
        <ImageCropper
          image={tempImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}
    </>
  );
}