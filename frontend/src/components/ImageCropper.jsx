// frontend/src/components/ImageCropper.jsx
import { useRef, useState } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function ImageCropper({ image, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 70,
    height: 70,
    x: 15,
    y: 15,
    aspect: 1
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const handleCropComplete = (crop) => {
    setCompletedCrop(crop);
  };

  const getCroppedImage = () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.arc(
      completedCrop.width / 2,
      completedCrop.height / 2,
      completedCrop.width / 2,
      0,
      Math.PI * 2
    );
    ctx.closePath();
    ctx.clip();
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    
    const base64Image = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(base64Image);
  };

  return (
    <div className="image-cropper-overlay">
      <div className="image-cropper-modal">
        <h3>Crop Profile Picture</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
          Drag and resize the crop area to fit your image
        </p>
        
        <div className="image-cropper-container">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              src={image}
              alt="Crop preview"
              style={{ maxWidth: '100%', maxHeight: '400px' }}
            />
          </ReactCrop>
        </div>
        
        <div className="image-cropper-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={getCroppedImage}
            disabled={!completedCrop}
          >
            Save & Crop
          </button>
        </div>
      </div>
    </div>
  );
}