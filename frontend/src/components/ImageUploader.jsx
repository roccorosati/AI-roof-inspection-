import { useRef, useState } from 'react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function extractFrames(videoFile, count = 6) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.muted = true;
    video.playsInline = true;

    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not read video: ${videoFile.name}`));
    });

    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      if (!isFinite(duration) || duration === 0) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not determine video duration'));
        return;
      }

      const timestamps = Array.from({ length: count }, (_, i) =>
        (duration / (count + 1)) * (i + 1)
      );
      const frames = [];
      let idx = 0;

      const seekNext = () => {
        if (idx >= timestamps.length) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = timestamps[idx];
      };

      video.addEventListener('seeked', function onSeeked() {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            frames.push({ blob, preview: URL.createObjectURL(blob), timestamp: timestamps[idx] });
          }
          idx++;
          seekNext();
        }, 'image/jpeg', 0.85);
      });

      seekNext();
    });

    video.load();
  });
}

export default function ImageUploader({ images, setImages, onAnalyze, error }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingName, setProcessingName] = useState('');

  async function addFiles(files) {
    const allFiles = Array.from(files);
    const imageFiles = allFiles.filter((f) => f.type.startsWith('image/'));
    const videoFiles = allFiles.filter((f) => f.type.startsWith('video/'));

    if (imageFiles.length > 0) {
      const newImages = imageFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        isVideoFrame: false,
      }));
      setImages((prev) => [...prev, ...newImages].slice(0, 10));
    }

    for (const videoFile of videoFiles) {
      setProcessing(true);
      setProcessingName(videoFile.name);
      try {
        const frames = await extractFrames(videoFile, 6);
        const frameImages = frames.map((frame, i) => ({
          file: new File(
            [frame.blob],
            `${videoFile.name.replace(/\.[^.]+$/, '')}-frame${i + 1}.jpg`,
            { type: 'image/jpeg' }
          ),
          preview: frame.preview,
          name: `${formatTime(frame.timestamp)}`,
          isVideoFrame: true,
          videoName: videoFile.name,
        }));
        setImages((prev) => [...prev, ...frameImages].slice(0, 10));
      } catch (err) {
        console.error(err);
      } finally {
        setProcessing(false);
        setProcessingName('');
      }
    }
  }

  function removeImage(idx) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }

  const photoCount = images.filter((i) => !i.isVideoFrame).length;
  const frameCount = images.filter((i) => i.isVideoFrame).length;
  const countLabel = [
    photoCount > 0 && `${photoCount} photo${photoCount !== 1 ? 's' : ''}`,
    frameCount > 0 && `${frameCount} video frame${frameCount !== 1 ? 's' : ''}`,
  ].filter(Boolean).join(' + ');

  return (
    <div>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h2 style={{ fontSize: 30, fontWeight: 700, color: 'var(--slate-900)', letterSpacing: '-0.5px' }}>
          Upload Roof Photos or Videos
        </h2>
        <p style={{ color: 'var(--slate-500)', marginTop: 8, fontSize: 16, maxWidth: 560, margin: '8px auto 0' }}>
          Upload photos or video walkthroughs of the roof. Videos are automatically split into frames for analysis.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => !processing && inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragging ? '#2563eb' : '#cbd5e1'}`,
          borderRadius: 16,
          padding: '48px 24px',
          textAlign: 'center',
          cursor: processing ? 'default' : 'pointer',
          background: dragging ? 'var(--blue-50)' : 'white',
          transition: 'all 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
      >
        {processing ? (
          <>
            <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>
              ⚙️
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-700)' }}>
              Extracting frames from video...
            </p>
            <p style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 4, maxWidth: 320, margin: '4px auto 0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {processingName}
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--slate-700)' }}>
              Drop photos or videos here, or <span style={{ color: 'var(--blue-600)' }}>browse</span>
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--slate-400)', background: 'var(--slate-100)', padding: '3px 10px', borderRadius: 20 }}>
                📸 JPG · PNG · WebP
              </span>
              <span style={{ fontSize: 12, color: 'var(--slate-400)', background: 'var(--slate-100)', padding: '3px 10px', borderRadius: 20 }}>
                🎥 MP4 · MOV · AVI
              </span>
            </div>
            <p style={{ color: 'var(--slate-400)', fontSize: 12, marginTop: 8 }}>
              Up to 10 items · 20MB each · Videos split into 6 frames
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Previews */}
      {images.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate-700)' }}>
              {countLabel} selected
            </h3>
            <button
              onClick={() => inputRef.current.click()}
              disabled={processing}
              style={{
                background: 'transparent', border: '1px solid var(--slate-300)',
                color: 'var(--slate-600)', padding: '6px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 500,
                opacity: processing ? 0.5 : 1,
              }}
            >
              + Add more
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {images.map((img, idx) => (
              <div
                key={idx}
                style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              >
                <img
                  src={img.preview}
                  alt={img.name}
                  style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)',
                }} />

                {/* Video frame badge */}
                {img.isVideoFrame && (
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'rgba(0,0,0,0.7)', color: 'white',
                    fontSize: 10, fontWeight: 600, padding: '2px 7px',
                    borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    🎥 {img.name}
                  </div>
                )}

                {/* Filename / timestamp at bottom */}
                <p style={{
                  position: 'absolute', bottom: 6, left: 8, right: 28,
                  color: 'white', fontSize: 11, fontWeight: 500,
                  overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                }}>
                  {img.isVideoFrame ? img.videoName : img.name}
                </p>

                <button
                  onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    background: 'rgba(0,0,0,0.6)', border: 'none',
                    color: 'white', borderRadius: '50%',
                    width: 24, height: 24, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 16, padding: '12px 16px', background: 'var(--red-50)',
          border: '1px solid #fca5a5', borderRadius: 10, color: 'var(--red-600)', fontSize: 14,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Analyze Button */}
      <div style={{ marginTop: 28, textAlign: 'center' }}>
        <button
          onClick={onAnalyze}
          disabled={images.length === 0 || processing}
          style={{
            background: images.length === 0 || processing
              ? 'var(--slate-300)'
              : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            color: 'white', border: 'none',
            padding: '14px 40px', borderRadius: 12,
            fontSize: 16, fontWeight: 700,
            cursor: images.length === 0 || processing ? 'not-allowed' : 'pointer',
            boxShadow: images.length === 0 || processing ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
            transition: 'all 0.2s', letterSpacing: '0.3px',
          }}
        >
          {processing ? 'Processing video...' : 'Run AI Analysis →'}
        </button>
        {images.length === 0 && !processing && (
          <p style={{ color: 'var(--slate-400)', fontSize: 13, marginTop: 8 }}>
            Upload at least one photo or video to begin
          </p>
        )}
      </div>

      {/* Trust signals */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 32,
        marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--slate-200)',
      }}>
        {[
          { icon: '🎥', label: 'Video support' },
          { icon: '🤖', label: 'Claude AI powered' },
          { icon: '📋', label: 'PDF export' },
        ].map(({ icon, label }) => (
          <div key={label} style={{ textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
