export function Loader() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Loading">
      <div className="loader-bar">
        <div className="loader-ball" />
      </div>
    </div>
  );
}