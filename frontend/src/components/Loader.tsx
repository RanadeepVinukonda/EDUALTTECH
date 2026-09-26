export function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm" role="status" aria-label="Loading">
      <div className="loader-bar">
        <div className="loader-ball" />
      </div>
    </div>
  );
}