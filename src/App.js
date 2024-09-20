import React, { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import './App.css';

function App() {
  const [location, setLocation] = useState(null);
  const [district, setDistrict] = useState('');
  const [exciseStation, setExciseStation] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState('');
  const webcamRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    const getDevices = async () => {
      const mediaDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = mediaDevices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId); // Default to the first camera
      }
    };
    getDevices();
  }, []);

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    overlayInfoOnImage(imageSrc);
  };

  const overlayInfoOnImage = (imageSrc) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Set text properties
      ctx.font = 'bold 20px Arial';
      ctx.textBaseline = 'top';

      const drawHighlightedText = (text, x, y) => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        const textWidth = ctx.measureText(text).width;
        ctx.fillRect(x - 2, y - 2, textWidth + 4, 24);
        
        ctx.fillStyle = 'white';
        ctx.fillText(text, x, y);
      };

      drawHighlightedText(`Lat: ${location.latitude.toFixed(6)}, Long: ${location.longitude.toFixed(6)}`, 10, canvas.height - 90);
      drawHighlightedText(`District: ${district}`, 10, canvas.height - 60);
      drawHighlightedText(`Excise Station: ${exciseStation}`, 10, canvas.height - 30);
      
      const finalImage = canvas.toDataURL('image/jpeg');
      setCapturedImage(finalImage);
    };
    img.src = imageSrc;
  };

  const handleShare = async () => {
    if (capturedImage && navigator.share) {
      try {
        await navigator.share({
          files: [new File([capturedImage], 'photo.jpg', { type: 'image/jpeg' })],
          title: 'Captured Photo',
          text: 'Check out this photo I captured!'
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleChangeCamera = (event) => {
    setCurrentDeviceId(event.target.value);
  };

  return (
    <div className="App">
      <h1>Location Photo App</h1>
      {location ? (
        <p>Current Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>
      ) : (
        <p>Getting location...</p>
      )}
      <input
        type="text"
        placeholder="District Name"
        value={district}
        onChange={(e) => setDistrict(e.target.value)}
      />
      <input
        type="text"
        placeholder="Excise Station"
        value={exciseStation}
        onChange={(e) => setExciseStation(e.target.value)}
      />
      <div className="camera-container">
        <select onChange={handleChangeCamera} value={currentDeviceId}>
          {devices.map(device => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || `Camera ${devices.indexOf(device) + 1}`}
            </option>
          ))}
        </select>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
          }}
        />
      </div>
      <button onClick={handleCapture}>Capture</button>
      {capturedImage && (
        <div className="captured-image">
          <img src={capturedImage} alt="Captured" />
          <button onClick={handleShare}>Share</button>
        </div>
      )}
    </div>
  );
}

export default App;
